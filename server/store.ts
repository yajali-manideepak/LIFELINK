import fs from 'node:fs';
import path from 'node:path';
import {
  AuditLog,
  BloodInventory,
  BloodRequest,
  DonationEvent,
  Donor,
  DonorNotification,
  Hospital,
  BloodCentre,
  Reservation,
  RequestInventorySearchResult,
  User,
} from '../src/types/lifelink';
import {
  SEED_AUDIT_LOGS,
  SEED_BLOOD_CENTRES,
  SEED_DONATION_EVENTS,
  SEED_DONORS,
  SEED_HOSPITALS,
  SEED_INITIAL_REQUEST,
  SEED_INVENTORY,
  SEED_NOTIFICATIONS,
  SEED_USERS,
  computeDynamicSeedTimes,
} from '../src/data/mockData';
import { nowIso, uid } from './ids';
import {
  isTerminalRequestState,
  nextStatusAfterUnitsChange,
} from '../src/services/coordinationEngine';

export interface LifeLinkState {
  users: User[];
  hospitals: Hospital[];
  bloodCentres: BloodCentre[];
  inventory: BloodInventory[];
  donors: Donor[];
  requests: BloodRequest[];
  donorNotifications: DonorNotification[];
  donationEvents: DonationEvent[];
  auditLogs: AuditLog[];
  searchResults: RequestInventorySearchResult[];
  reservations: Reservation[];
}

/**
 * LifeLink server store (§32 concurrency accounting).
 *
 * Mutations are applied synchronously in-memory under a single-threaded Node
 * critical section, then flushed asynchronously to a JSON snapshot. Availability
 * is always derived as units - reserved_units and can never go negative.
 */
export class LifeLinkStore {
  private state: LifeLinkState;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly dataFile: string;

  constructor(dataFile: string) {
    this.dataFile = dataFile;
    this.state = this.loadOrSeed();
  }

  // ---------------------------------------------------------------- loading

  private loadOrSeed(): LifeLinkState {
    try {
      if (fs.existsSync(this.dataFile)) {
        const raw = fs.readFileSync(this.dataFile, 'utf8');
        const parsed = JSON.parse(raw) as LifeLinkState;
        if (
          parsed &&
          Array.isArray(parsed.inventory) &&
          Array.isArray(parsed.requests) &&
          Array.isArray(parsed.donors)
        ) {
          if (!Array.isArray(parsed.reservations)) parsed.reservations = [];
          if (!Array.isArray(parsed.searchResults)) parsed.searchResults = [];
          return parsed;
        }
      }
    } catch {
      // Corrupt or unreadable snapshot: fall through to a fresh seed.
    }

    const seeded = seedState();
    this.persist(seeded);
    return seeded;
  }

  private persist(state: LifeLinkState) {
    try {
      fs.mkdirSync(path.dirname(this.dataFile), { recursive: true });
      fs.writeFileSync(this.dataFile, JSON.stringify(state, null, 2));
    } catch (err) {
      // Persistence failures must never take down coordination; keep serving
      // from memory (§44 offline resilience on the server side).
      console.error('[lifelink-store] persist failed:', err);
    }
  }

  private schedulePersist() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.persist(this.state);
    }, 50);
  }

  // ------------------------------------------------------------------ reads

  getState(): LifeLinkState {
    return this.state;
  }

  resetToSeed(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.state = seedState();
    this.persist(this.state);
  }

  // ------------------------------------------------------------- audit core

  appendAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const full: AuditLog = {
      ...entry,
      id: uid('aud'),
      timestamp: nowIso(),
    };
    this.state.auditLogs.unshift(full);
    // Append-only per §38: the API never exposes update/delete on audit logs.
    this.schedulePersist();
    return full;
  }

  // --------------------------------------------------------- request writes

  addRequest(request: BloodRequest): void {
    this.state.requests.unshift(request);
    this.schedulePersist();
  }

  updateRequest(id: string, patch: Partial<BloodRequest>): BloodRequest | undefined {
    const request = this.state.requests.find(r => r.id === id);
    if (!request) return undefined;
    // Terminal states are frozen: further transitions require the defined
    // administrative correction workflow, never silent overwrites (§5).
    if (isTerminalRequestState(request.status)) return request;
    Object.assign(request, patch, {
      units_fulfilled: Math.min(
        Math.max(0, patch.units_fulfilled ?? request.units_fulfilled),
        request.units_required,
      ),
      updated_at: nowIso(),
    });
    this.schedulePersist();
    return request;
  }

  getRequest(id: string): BloodRequest | undefined {
    return this.state.requests.find(r => r.id === id);
  }

  // ------------------------------------------------------- reservation accounting

  /**
   * Atomically soft-lock units for a reservation (§31/§32). Creates the
   * reservation record in the same critical section, so a later decline /
   * cancel / expiry releases exactly what this reservation locked.
   */
  createReservation(
    request: BloodRequest,
    inventoryId: string,
    units: number,
    actorName: string,
  ): { ok: true; reservation: Reservation } | { ok: false; reason: 'NOT_FOUND' | 'INSUFFICIENT_UNITS' } {
    const item = this.state.inventory.find(i => i.id === inventoryId);
    if (!item) return { ok: false, reason: 'NOT_FOUND' };
    const available = item.units - item.reserved_units;
    if (available < units) return { ok: false, reason: 'INSUFFICIENT_UNITS' };

    item.reserved_units += units;
    item.version += 1;
    item.last_updated = nowIso();
    item.updated_at = item.last_updated;

    const reservation: Reservation = {
      id: uid('res'),
      request_id: request.id,
      inventory_id: inventoryId,
      units,
      status: 'RESERVED',
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    this.state.reservations.unshift(reservation);
    this.schedulePersist();

    this.appendAudit({
      actor_id: 'hospital',
      actor_name: actorName,
      actor_role: 'HOSPITAL_STAFF',
      entity_type: 'INVENTORY',
      entity_id: inventoryId,
      action: 'RESERVATION_REQUESTED',
      previous_state: 'AVAILABLE',
      new_state: 'RESERVED',
      metadata: {
        request_id: request.id,
        units_reserved: units,
        remaining_available: item.units - item.reserved_units,
        inventory_version: item.version,
        soft_lock_active: true,
      },
    });

    return { ok: true, reservation };
  }

  /** Release a reservation's soft-lock back to the available pool (§31). */
  releaseReservationById(reservationId: string, finalStatus: Reservation['status']): boolean {
    const reservation = this.state.reservations.find(r => r.id === reservationId);
    if (!reservation) return false;
    if (
      reservation.status === 'RESERVATION_DECLINED' ||
      reservation.status === 'RESERVATION_CANCELLED' ||
      reservation.status === 'RESERVATION_EXPIRED' ||
      reservation.status === 'FULFILLED'
    ) {
      return false; // already terminal; never double-release (§31)
    }
    const item = this.state.inventory.find(i => i.id === reservation.inventory_id);
    if (item) {
      item.reserved_units = Math.max(0, item.reserved_units - reservation.units);
      item.version += 1;
      item.last_updated = nowIso();
      item.updated_at = item.last_updated;
    }
    reservation.status = finalStatus;
    reservation.updated_at = nowIso();
    this.schedulePersist();
    return true;
  }

  /**
   * Fulfil a reservation (§31 fulfilment accounting): atomically decrement
   * both `units` and `reserved_units`, record the movement, and advance the
   * request's fulfilment counters and lifecycle status.
   */
  fulfilReservation(
    reservationId: string,
    actorName: string,
  ): { ok: true } | { ok: false; reason: 'NOT_FOUND' | 'ALREADY_TERMINAL' | 'INSUFFICIENT_RESERVED_OR_UNITS' } {
    const reservation = this.state.reservations.find(r => r.id === reservationId);
    if (!reservation) return { ok: false, reason: 'NOT_FOUND' };
    if (reservation.status !== 'RESERVED') return { ok: false, reason: 'ALREADY_TERMINAL' };

    const item = this.state.inventory.find(i => i.id === reservation.inventory_id);
    if (!item || item.reserved_units < reservation.units || item.units < reservation.units) {
      return { ok: false, reason: 'INSUFFICIENT_RESERVED_OR_UNITS' };
    }

    // Atomic inventory decrement (§31)
    item.units -= reservation.units;
    item.reserved_units -= reservation.units;
    item.version += 1;
    item.last_updated = nowIso();
    item.updated_at = item.last_updated;

    reservation.status = 'FULFILLED';
    reservation.updated_at = nowIso();

    const request = this.state.requests.find(r => r.id === reservation.request_id);
    let newStatus = request?.status;
    if (request) {
      const totalFulfilled = request.units_fulfilled + reservation.units;
      newStatus = nextStatusAfterUnitsChange(request.status, totalFulfilled, request.units_required);
      this.updateRequest(request.id, {
        units_fulfilled: totalFulfilled,
        inventory_reserved_units: Math.max(0, request.inventory_reserved_units - reservation.units),
        shortage_units: Math.max(0, request.units_required - totalFulfilled),
        status: newStatus,
      });
    }

    this.appendAudit({
      actor_id: 'blood_centre',
      actor_name: actorName,
      actor_role: 'BLOOD_CENTRE_STAFF',
      entity_type: 'INVENTORY',
      entity_id: item.id,
      action: 'RESERVATION_FULFILLED',
      previous_state: 'RESERVED',
      new_state: 'FULFILLED',
      metadata: {
        request_id: reservation.request_id,
        units_issued: reservation.units,
        request_status: newStatus,
      },
    });

    this.schedulePersist();
    return { ok: true };
  }

  /** Fulfil directly by units against any reserved stock on a request. */
  fulfilUnitsForRequest(
    requestId: string,
    units: number,
    actorName: string,
  ): { ok: boolean; message: string } {
    const request = this.state.requests.find(r => r.id === requestId);
    if (!request) return { ok: false, message: 'Request not found.' };
    if (isTerminalRequestState(request.status)) {
      return { ok: false, message: 'Request is in a terminal state.' };
    }

    const activeReservations = this.state.reservations.filter(
      r => r.request_id === requestId && r.status === 'RESERVED',
    );
    let remaining = units;
    for (const reservation of activeReservations) {
      if (remaining <= 0) break;
      const take = Math.min(reservation.units, remaining);
      if (take === reservation.units) {
        const result = this.fulfilReservation(reservation.id, actorName);
        if (!result.ok) continue;
      } else {
        // Partial fulfilment of a reservation: decrement proportionally.
        const item = this.state.inventory.find(i => i.id === reservation.inventory_id);
        if (!item || item.units < take || item.reserved_units < take) continue;
        item.units -= take;
        item.reserved_units -= take;
        item.version += 1;
        item.last_updated = nowIso();
        reservation.units -= take;
        reservation.updated_at = nowIso();
        const totalFulfilled = request.units_fulfilled + take;
        const newStatus = nextStatusAfterUnitsChange(request.status, totalFulfilled, request.units_required);
        this.updateRequest(request.id, {
          units_fulfilled: totalFulfilled,
          inventory_reserved_units: Math.max(0, request.inventory_reserved_units - take),
          shortage_units: Math.max(0, request.units_required - totalFulfilled),
          status: newStatus,
        });
        this.appendAudit({
          actor_id: 'blood_centre',
          actor_name: actorName,
          actor_role: 'BLOOD_CENTRE_STAFF',
          entity_type: 'INVENTORY',
          entity_id: item.id,
          action: 'RESERVATION_PARTIALLY_FULFILLED',
          previous_state: 'RESERVED',
          new_state: 'PARTIALLY_FULFILLED',
          metadata: { request_id: requestId, units_issued: take },
        });
      }
      remaining -= take;
    }

    if (remaining === units) {
      return { ok: false, message: 'No reserved units available to fulfil for this request.' };
    }
    const fulfilledTotal = units - remaining;
    this.schedulePersist();
    return {
      ok: true,
      message: `Fulfilment of ${fulfilledTotal} unit(s) recorded against request ${requestId}.`,
    };
  }

  // ----------------------------------------------------------- inventory writes

  getInventory(id: string): BloodInventory | undefined {
    return this.state.inventory.find(i => i.id === id);
  }

  addInventoryItem(item: BloodInventory): void {
    this.state.inventory.unshift(item);
    this.schedulePersist();
  }

  updateInventoryItem(id: string, patch: Partial<BloodInventory>): BloodInventory | undefined {
    const item = this.state.inventory.find(i => i.id === id);
    if (!item) return undefined;
    Object.assign(item, patch, {
      version: item.version + 1,
      last_updated: nowIso(),
      updated_at: nowIso(),
    });
    this.schedulePersist();
    return item;
  }

  /** Release all soft-locks held against a request (cancellation/expiry, §30). */
  releaseAllReservationsForRequest(requestId: string, finalStatus: Reservation['status']): number {
    let released = 0;
    const affected = this.state.reservations.filter(
      r => r.request_id === requestId && r.status === 'RESERVED',
    );
    for (const reservation of affected) {
      if (this.releaseReservationById(reservation.id, finalStatus)) released += reservation.units;
    }
    return released;
  }

  // ------------------------------------------------------------- donor writes

  updateDonor(id: string, patch: Partial<Donor>): Donor | undefined {
    const donor = this.state.donors.find(d => d.id === id);
    if (!donor) return undefined;
    Object.assign(donor, patch, { updated_at: nowIso() });
    this.schedulePersist();
    return donor;
  }

  // -------------------------------------------------- notification writes

  addDonorNotifications(notifications: DonorNotification[]): void {
    this.state.donorNotifications.unshift(...notifications);
    this.schedulePersist();
  }

  updateDonorNotification(id: string, patch: Partial<DonorNotification>): DonorNotification | undefined {
    const notification = this.state.donorNotifications.find(x => x.id === id);
    if (!notification) return undefined;
    Object.assign(notification, patch, { updated_at: nowIso() });
    this.schedulePersist();
    return notification;
  }

  // ------------------------------------------------------ donation writes

  addDonationEvent(event: DonationEvent): void {
    this.state.donationEvents.unshift(event);
    this.schedulePersist();
  }

  updateDonationEvent(id: string, patch: Partial<DonationEvent>): DonationEvent | undefined {
    const event = this.state.donationEvents.find(x => x.id === id);
    if (!event) return undefined;
    Object.assign(event, patch, { updated_at: nowIso() });
    this.schedulePersist();
    return event;
  }

  // --------------------------------------------------- search audit writes

  addSearchResults(records: RequestInventorySearchResult[]): void {
    this.state.searchResults.unshift(...records);
    this.schedulePersist();
  }

  /** Compact the append-only search snapshot to keep the JSON file bounded. */
  pruneSearchResults(keep = 500): void {
    if (this.state.searchResults.length > keep) {
      this.state.searchResults = this.state.searchResults.slice(0, keep);
      this.schedulePersist();
    }
  }
}

/**
 * Fresh seed. Dynamic seed timestamps (inventory freshness, demo request
 * recency) are recomputed on every cold start so freshness tiers (§14) behave.
 */
export function seedState(): LifeLinkState {
  const t = computeDynamicSeedTimes();
  return {
    users: SEED_USERS,
    hospitals: SEED_HOSPITALS,
    bloodCentres: SEED_BLOOD_CENTRES(t),
    inventory: SEED_INVENTORY(t),
    donors: SEED_DONORS,
    requests: [SEED_INITIAL_REQUEST(t)],
    donorNotifications: SEED_NOTIFICATIONS(t),
    donationEvents: SEED_DONATION_EVENTS(t),
    auditLogs: SEED_AUDIT_LOGS(t),
    searchResults: [],
    reservations: [],
  };
}

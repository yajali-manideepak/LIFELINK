// ============================================================
// LifeLink In-Memory Store — Simulates PostgreSQL with
// transactional semantics, atomic reservations, and audit trail
// ============================================================

import type {
  Organization, User, HospitalProfile, BloodBankProfile,
  InventoryBatch, InventoryMovement, BloodRequest, BloodBankResponse,
  InventoryReservation, RequestStatusHistory, Notification, AuditEvent,
  IntegrationSource, BloodGroup, BloodComponent,
  RequestStatus, ReservationStatus, ResponseStatus, MovementType,
} from '../src/types/lifelink';
import { VALID_TRANSITIONS } from '../src/types/lifelink';
import {
  DEMO_ORGS, DEMO_USERS, DEMO_HOSPITAL_PROFILES, DEMO_BB_PROFILES,
  DEMO_INVENTORY, DEMO_REQUESTS, DEMO_RESPONSES, DEMO_RESERVATIONS,
  DEMO_NOTIFICATIONS, DEMO_INTEGRATIONS,
} from '../src/data/demoData';

// Unique ID generator
let _seq = 1;
export function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${(_seq++).toString(36)}`;
}

export function generateRequestRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'LL-';
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export function generateTrackingCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3600000).toISOString();
}

export function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

// ============================================================
// Store class — single source of truth
// ============================================================

export class LifeLinkStore {
  organizations: Map<string, Organization> = new Map();
  users: Map<string, User> = new Map();
  hospitalProfiles: Map<string, HospitalProfile> = new Map();
  bloodBankProfiles: Map<string, BloodBankProfile> = new Map();
  inventoryBatches: Map<string, InventoryBatch> = new Map();
  inventoryMovements: InventoryMovement[] = [];
  bloodRequests: Map<string, BloodRequest> = new Map();
  bloodBankResponses: Map<string, BloodBankResponse> = new Map();
  inventoryReservations: Map<string, InventoryReservation> = new Map();
  requestStatusHistory: RequestStatusHistory[] = [];
  notifications: Notification[] = [];
  auditEvents: AuditEvent[] = [];
  integrationSources: Map<string, IntegrationSource> = new Map();

// Concurrency lock for reservations
  private reservationLocks: Set<string> = new Set();

  constructor() {
    this.seed();
  }

  seed(): void {
    for (const org of DEMO_ORGS) this.organizations.set(org.id, { ...org });
    for (const u of DEMO_USERS) this.users.set(u.id, { ...u });
    for (const hp of DEMO_HOSPITAL_PROFILES) this.hospitalProfiles.set(hp.organizationId, { ...hp });
    for (const bp of DEMO_BB_PROFILES) this.bloodBankProfiles.set(bp.organizationId, { ...bp });
    for (const inv of DEMO_INVENTORY) this.inventoryBatches.set(inv.id, { ...inv });
    for (const req of DEMO_REQUESTS) this.bloodRequests.set(req.id, { ...req });
    for (const resp of DEMO_RESPONSES) this.bloodBankResponses.set(resp.id, { ...resp });
    for (const res of DEMO_RESERVATIONS) this.inventoryReservations.set(res.id, { ...res });
    this.notifications = [...DEMO_NOTIFICATIONS];
    for (const src of DEMO_INTEGRATIONS) this.integrationSources.set(src.id, { ...src });
  }

  // ---- Audit ----
  audit(actorId: string, action: string, resourceType: string, resourceId: string, detail: Record<string, unknown> = {}, actorOrgId?: string): void {
    this.auditEvents.push({
      id: uid('aud'),
      actorId,
      actorOrganizationId: actorOrgId,
      action,
      resourceType,
      resourceId,
      detail,
      performedAt: nowIso(),
    });
  }

  // ---- Notifications ----
  notify(n: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): void {
    this.notifications.unshift({
      ...n,
      id: uid('notif'),
      isRead: false,
      createdAt: nowIso(),
    });
  }

  // ---- Request creation & distribution ----
  createRequest(params: {
    hospitalId: string;
    requestedBy: string;
    department: string;
    clinicianContact: string;
    bloodComponent: BloodComponent;
    bloodGroup?: BloodGroup;
    quantityUnits: number;
    urgency: UrgencyLevel;
    requiredBy: string;
    collectionLocation: string;
    additionalRequirements?: string;
  }): { ok: boolean; request?: BloodRequest; error?: string } {
    const org = this.organizations.get(params.hospitalId);
    if (!org) return { ok: false, error: 'Organization not found.' };
    if (org.status !== 'VERIFIED') return { ok: false, error: 'Organization is not verified. Cannot distribute requests.' };

    const reqId = uid('req');
    const req: BloodRequest = {
      id: reqId,
      referenceNumber: generateRequestRef(),
      hospitalId: params.hospitalId,
      requestedBy: params.requestedBy,
      patientIdentifierHash: uid('phash'),
      department: params.department,
      clinicianContact: params.clinicianContact,
      bloodComponent: params.bloodComponent,
      bloodGroup: params.bloodGroup,
      quantityUnits: params.quantityUnits,
      urgency: params.urgency,
      requiredBy: params.requiredBy,
      collectionLocation: params.collectionLocation,
      additionalRequirements: params.additionalRequirements,
      status: 'SUBMITTED',
      trackingCode: generateTrackingCode(),
      isDemo: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      expiresAt: hoursFromNow(24),
    };

    this.bloodRequests.set(reqId, req);
    this.requestStatusHistory.push({
      id: uid('hist'),
      requestId: req.id,
      previousStatus: null,
      newStatus: 'SUBMITTED',
      changedBy: params.requestedBy,
      changedAt: nowIso(),
    });

    // Auto distribute to verified blood banks
    this.distributeRequest(reqId, params.requestedBy);

    this.audit(params.requestedBy, 'REQUEST_CREATED', 'blood_request', req.id, { referenceNumber: req.referenceNumber });
    return { ok: true, request: req };
  }

  distributeRequest(requestId: string, actorId: string): void {
    const req = this.bloodRequests.get(requestId);
    if (!req) return;
    const hospital = this.organizations.get(req.hospitalId);

    req.status = 'DISTRIBUTED';
    req.distributedAt = nowIso();
    req.updatedAt = nowIso();

    this.requestStatusHistory.push({
      id: uid('hist'),
      requestId,
      previousStatus: 'SUBMITTED',
      newStatus: 'DISTRIBUTED',
      changedBy: actorId,
      changedAt: nowIso(),
    });

    const verifiedBBs = Array.from(this.organizations.values()).filter(o => o.type === 'BLOOD_BANK' && o.status === 'VERIFIED');
    for (const bb of verifiedBBs) {
      this.notify({
        recipientOrgId: bb.id,
        type: 'NEW_REQUEST',
        title: 'Emergency Blood Request',
        message: `${req.urgency}: ${hospital?.name || req.hospitalId} requested ${req.quantityUnits} units ${req.bloodGroup || ''} ${req.bloodComponent}.`,
        relatedRequestId: requestId,
      });
    }
  }

  respondToRequest(params: {
    requestId: string;
    bloodBankId: string;
    respondedBy: string;
    responseStatus: ResponseStatus;
    confirmedUnits: number;
    notes: string;
    collectionArrangement?: string;
    estimatedReadyTime?: string;
  }): { ok: boolean; response?: BloodBankResponse; error?: string } {
    const req = this.bloodRequests.get(params.requestId);
    if (!req) return { ok: false, error: 'Request not found.' };
    if (['CANCELLED', 'EXPIRED', 'FULFILLED'].includes(req.status)) {
      return { ok: false, error: `Cannot respond to a ${req.status} request.` };
    }

    const respId = uid('resp');
    const response: BloodBankResponse = {
      id: respId,
      requestId: params.requestId,
      bloodBankId: params.bloodBankId,
      respondedBy: params.respondedBy,
      responseStatus: params.responseStatus,
      confirmedUnits: params.confirmedUnits,
      notes: params.notes,
      collectionArrangement: params.collectionArrangement,
      estimatedReadyTime: params.estimatedReadyTime,
      respondedAt: nowIso(),
      updatedAt: nowIso(),
    };

    this.bloodBankResponses.set(respId, response);

    if (['CONFIRMED_AVAILABLE', 'PARTIAL_AVAILABLE'].includes(params.responseStatus)) {
      const allPos = Array.from(this.bloodBankResponses.values()).filter(
        r => r.requestId === params.requestId && ['CONFIRMED_AVAILABLE', 'PARTIAL_AVAILABLE'].includes(r.responseStatus)
      );
      const totalConfirmed = allPos.reduce((sum, r) => sum + r.confirmedUnits, 0);
      if (totalConfirmed >= req.quantityUnits) {
        req.status = 'AVAILABILITY_CONFIRMED';
      } else {
        req.status = 'PARTIALLY_MATCHED';
      }
      req.updatedAt = nowIso();
    }

    this.notify({
      recipientOrgId: req.hospitalId,
      type: 'NEW_RESPONSE',
      title: 'Blood Bank Response Received',
      message: `${this.organizations.get(params.bloodBankId)?.name} responded to ${req.referenceNumber}.`,
      relatedRequestId: params.requestId,
    });

    this.audit(params.respondedBy, 'RESPONSE_SUBMITTED', 'blood_bank_response', respId, {
      requestId: params.requestId, status: params.responseStatus,
    });

    return { ok: true, response };
  }

  // ---- Request status transition ----
  transitionRequest(requestId: string, newStatus: RequestStatus, changedBy: string, reason?: string): { ok: boolean; error?: string } {
    const req = this.bloodRequests.get(requestId);
    if (!req) return { ok: false, error: 'Request not found.' };

    const validNext: RequestStatus[] = VALID_TRANSITIONS[req.status] ?? [];

    if (!validNext.includes(newStatus)) {
      return { ok: false, error: `Invalid transition: ${req.status} → ${newStatus}` };
    }

    const previousStatus = req.status;
    req.status = newStatus;
    req.updatedAt = nowIso();

    if (newStatus === 'FULFILLED') req.fulfilledAt = nowIso();
    if (newStatus === 'CANCELLED') req.cancelledAt = nowIso();

    this.requestStatusHistory.push({
      id: uid('hist'),
      requestId,
      previousStatus,
      newStatus,
      changedBy,
      changedAt: nowIso(),
      reason,
    });

    this.audit(changedBy, 'REQUEST_STATUS_CHANGED', 'blood_request', requestId, { previousStatus, newStatus, reason });

    return { ok: true };
  }

  // ---- Atomic reservation (concurrency-safe) ----
  reserveUnits(params: {
    requestId: string;
    bloodBankId: string;
    inventoryBatchId: string;
    units: number;
    reservedBy: string;
  }): { ok: boolean; reservationId?: string; error?: string } {
    const lockKey = params.inventoryBatchId;
    if (this.reservationLocks.has(lockKey)) {
      return { ok: false, error: 'Inventory batch is currently being updated. Please retry.' };
    }

    this.reservationLocks.add(lockKey);
    try {
      // Verify request is in a state that allows reservation
      const req = this.bloodRequests.get(params.requestId);
      if (!req) return { ok: false, error: 'Request not found.' };
      if (['CANCELLED', 'EXPIRED', 'FULFILLED'].includes(req.status)) {
        return { ok: false, error: `Cannot reserve for a ${req.status} request.` };
      }

      const batch = this.inventoryBatches.get(params.inventoryBatchId);
      if (!batch) return { ok: false, error: 'Inventory batch not found.' };
      if (batch.bloodBankId !== params.bloodBankId) {
        return { ok: false, error: 'Inventory batch does not belong to this blood bank.' };
      }

      const unreservedAvailable = batch.availableUnits - batch.reservedUnits;
      if (params.units > unreservedAvailable) {
        return { ok: false, error: `Insufficient available units. Requested: ${params.units}, Available (unreserved): ${unreservedAvailable}.` };
      }

      // Atomically update
      batch.reservedUnits += params.units;
      batch.lastUpdatedAt = nowIso();

      const reservationId = uid('res');
      this.inventoryReservations.set(reservationId, {
        id: reservationId,
        requestId: params.requestId,
        bloodBankId: params.bloodBankId,
        inventoryBatchId: params.inventoryBatchId,
        reservedUnits: params.units,
        reservedBy: params.reservedBy,
        status: 'ACTIVE',
        createdAt: nowIso(),
        expiresAt: hoursFromNow(4), // 4-hour reservation window
      });

      this.inventoryMovements.push({
        id: uid('mov'),
        inventoryBatchId: params.inventoryBatchId,
        bloodBankId: params.bloodBankId,
        movementType: 'RESERVED',
        units: params.units,
        relatedRequestId: params.requestId,
        relatedReservationId: reservationId,
        performedBy: params.reservedBy,
        performedAt: nowIso(),
      });

      this.audit(params.reservedBy, 'RESERVATION_CREATED', 'inventory_reservation', reservationId, {
        requestId: params.requestId, units: params.units, batchId: params.inventoryBatchId,
      });

      return { ok: true, reservationId };
    } finally {
      this.reservationLocks.delete(lockKey);
    }
  }

  // ---- Release reservation ----
  releaseReservation(reservationId: string, releasedBy: string, reason: string): { ok: boolean; error?: string } {
    const res = this.inventoryReservations.get(reservationId);
    if (!res) return { ok: false, error: 'Reservation not found.' };
    if (res.status !== 'ACTIVE') return { ok: false, error: `Reservation is already ${res.status}.` };

    const batch = this.inventoryBatches.get(res.inventoryBatchId);
    if (!batch) return { ok: false, error: 'Inventory batch not found.' };

    const lockKey = res.inventoryBatchId;
    if (this.reservationLocks.has(lockKey)) {
      return { ok: false, error: 'Inventory batch is currently being updated. Please retry.' };
    }
    this.reservationLocks.add(lockKey);
    try {
      res.status = 'RELEASED';
      res.releasedAt = nowIso();
      res.releasedBy = releasedBy;
      res.releaseReason = reason;

      batch.reservedUnits = Math.max(0, batch.reservedUnits - res.reservedUnits);
      batch.lastUpdatedAt = nowIso();

      this.inventoryMovements.push({
        id: uid('mov'),
        inventoryBatchId: res.inventoryBatchId,
        bloodBankId: res.bloodBankId,
        movementType: 'RESERVATION_RELEASED',
        units: res.reservedUnits,
        relatedRequestId: res.requestId,
        relatedReservationId: reservationId,
        performedBy: releasedBy,
        performedAt: nowIso(),
        notes: reason,
      });

      this.audit(releasedBy, 'RESERVATION_RELEASED', 'inventory_reservation', reservationId, { reason });
      return { ok: true };
    } finally {
      this.reservationLocks.delete(lockKey);
    }
  }

  // ---- Update inventory (manual) ----
  updateInventory(params: {
    batchId: string;
    bloodBankId: string;
    updatedBy: string;
    availableUnits: number;
    notes?: string;
  }): { ok: boolean; error?: string } {
    const batch = this.inventoryBatches.get(params.batchId);
    if (!batch) return { ok: false, error: 'Inventory batch not found.' };
    if (batch.bloodBankId !== params.bloodBankId) return { ok: false, error: 'Unauthorized.' };
    if (params.availableUnits < 0) return { ok: false, error: 'Available units cannot be negative.' };

    const prev = batch.availableUnits;
    const delta = params.availableUnits - prev;
    batch.availableUnits = params.availableUnits;
    batch.lastUpdatedAt = nowIso();
    batch.lastVerifiedAt = nowIso();
    batch.verificationStatus = 'RECENTLY_VERIFIED';
    batch.lastUpdatedBy = params.updatedBy;

    this.inventoryMovements.push({
      id: uid('mov'),
      inventoryBatchId: params.batchId,
      bloodBankId: params.bloodBankId,
      movementType: delta >= 0 ? 'STOCK_IN' : 'STOCK_OUT',
      units: Math.abs(delta),
      performedBy: params.updatedBy,
      performedAt: nowIso(),
      notes: params.notes,
    });

    this.audit(params.updatedBy, 'INVENTORY_STATUS_CHANGED', 'inventory_batch', params.batchId, {
      previousUnits: prev, newUnits: params.availableUnits, delta, notes: params.notes,
    });

    return { ok: true };
  }

  // ---- Getters ----
  getRequestsForHospital(hospitalId: string): BloodRequest[] {
    return Array.from(this.bloodRequests.values()).filter(r => r.hospitalId === hospitalId);
  }

  getRequestsForBloodBank(bloodBankId: string): BloodRequest[] {
    const distributed: RequestStatus[] = [
      'DISTRIBUTED', 'AWAITING_RESPONSES', 'PARTIALLY_MATCHED',
      'AVAILABILITY_CONFIRMED', 'RESERVATION_PENDING', 'RESERVED',
      'PREPARATION_IN_PROGRESS', 'PARTIALLY_FULFILLED', 'FULFILLED',
    ];
    return Array.from(this.bloodRequests.values()).filter(r => distributed.includes(r.status));
  }

  getResponsesForRequest(requestId: string): BloodBankResponse[] {
    return Array.from(this.bloodBankResponses.values()).filter(r => r.requestId === requestId);
  }

  getInventoryForBloodBank(bbId: string): InventoryBatch[] {
    return Array.from(this.inventoryBatches.values()).filter(b => b.bloodBankId === bbId);
  }

  getNotificationsForUser(userId: string): Notification[] {
    return this.notifications.filter(n => n.recipientUserId === userId || !n.recipientUserId);
  }

  getNotificationsForOrg(orgId: string): Notification[] {
    return this.notifications.filter(n => n.recipientOrgId === orgId);
  }

  searchRequests(trackingCode: string): BloodRequest | undefined {
    return Array.from(this.bloodRequests.values()).find(r => r.trackingCode === trackingCode);
  }

  // ---- Freshness check ----
  checkInventoryFreshness(): void {
    const now = Date.now();
    const STALE_HOURS = 24;
    for (const batch of this.inventoryBatches.values()) {
      if (!batch.lastVerifiedAt) {
        batch.verificationStatus = 'UNVERIFIED';
        continue;
      }
      const ageHours = (now - new Date(batch.lastVerifiedAt).getTime()) / 3600000;
      if (ageHours > STALE_HOURS) {
        batch.verificationStatus = 'STALE';
      } else if (ageHours > 4) {
        batch.verificationStatus = 'UNVERIFIED';
      } else {
        batch.verificationStatus = 'RECENTLY_VERIFIED';
      }
    }
  }
}

// Singleton
export const store = new LifeLinkStore();

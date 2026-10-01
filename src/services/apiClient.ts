/**
 * LifeLink client API.
 *
 * All dashboard actions go through this module. Actions POST to the LifeLink
 * coordination API; when the network is unreachable (offline failure mode,
 * §44) callers transparently fall back to a local, read-only simulation so
 * the app remains usable and the emergency hotline flow still works.
 */
import { useSyncExternalStore } from 'react';
import type {
  AuditLog,
  BloodCentre,
  BloodInventory,
  BloodRequest,
  DonationEvent,
  Donor,
  DonorNotification,
  Hospital,
  RequestInventorySearchResult,
  User,
} from '../types/lifelink';
import {
  SEED_USERS,
  SEED_DONORS,
  SEED_HOSPITALS,
  computeDynamicSeedTimes,
  buildSeedBloodCentres,
  buildSeedInventory,
  buildSeedRequest,
  buildSeedNotifications,
  buildSeedDonationEvents,
  buildSeedAuditLogs,
} from '../data/mockData';

export interface LifeLinkSnapshot {
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
}

export interface ActionResult {
  ok: boolean;
  message?: string;
  error?: string;
  requestId?: string;
}

let snapshot: LifeLinkSnapshot | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

export function setSnapshot(next: LifeLinkSnapshot | null) {
  snapshot = next;
  emit();
}

export function getSnapshot(): LifeLinkSnapshot | null {
  return snapshot;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Build the local (offline) seed snapshot — same world the server boots with. */
export function localSeedSnapshot(): LifeLinkSnapshot {
  const t = computeDynamicSeedTimes();
  return {
    users: SEED_USERS,
    hospitals: SEED_HOSPITALS,
    bloodCentres: buildSeedBloodCentres(t),
    inventory: buildSeedInventory(t),
    donors: SEED_DONORS,
    requests: [buildSeedRequest(t)],
    donorNotifications: buildSeedNotifications(t),
    donationEvents: buildSeedDonationEvents(t),
    auditLogs: buildSeedAuditLogs(t),
    searchResults: [],
  };
}

// ---------------------------------------------------------------------------
// Local fallback mutations (best-effort, in-memory only)
// ---------------------------------------------------------------------------

export function applyLocalAction(action: string, payload: Record<string, unknown>): ActionResult {
  if (!snapshot) snapshot = localSeedSnapshot();
  const s = snapshot;
  const now = new Date().toISOString();

  switch (action) {
    case 'createEmergencyRequest': {
      const id = `LL-LOCAL-${String(s.requests.length + 1).padStart(4, '0')}`;
      const req: BloodRequest = {
        id,
        hospital_id: 'hosp_lifelink_gen',
        hospital_name: 'LifeLink General Hospital',
        component_type: payload.component_type as BloodRequest['component_type'],
        blood_group: payload.blood_group as BloodRequest['blood_group'],
        units_required: Number(payload.units_required),
        urgency: payload.urgency as BloodRequest['urgency'],
        status: 'CREATED',
        created_at: now,
        required_by: String(payload.required_by ?? ''),
        expires_at: new Date(Date.now() + 6 * 3600_000).toISOString(),
        department: String(payload.hospital_department ?? ''),
        request_reason: String(payload.reason_category ?? ''),
        contact_person: String(payload.contact_person ?? ''),
        contact_number: String(payload.contact_phone ?? ''),
        units_fulfilled: 0,
        inventory_found_units: 0,
        inventory_reserved_units: 0,
        shortage_units: Number(payload.units_required),
        donor_mobilisation_active: false,
        notified_donors_count: 0,
        accepted_donors_count: 0,
        arrived_donors_count: 0,
        completed_donations_count: 0,
      };
      s.requests = [req, ...s.requests];
      s.auditLogs = [
        {
          id: `aud_local_${Date.now()}`,
          actor_id: 'local',
          actor_name: 'Local Offline Mode',
          actor_role: 'SYSTEM',
          entity_type: 'REQUEST',
          entity_id: id,
          action: 'OFFLINE_REQUEST_QUEUED',
          timestamp: now,
          new_state: 'CREATED',
          metadata: { note: 'Queued locally; will require reconciliation when connectivity returns.' },
        },
        ...s.auditLogs,
      ];
      return { ok: true, requestId: id, message: 'Request queued locally (offline mode).' };
    }
    default:
      return { ok: false, error: 'This action is unavailable while offline. Use the emergency phone hotline (§44).' };
  }
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

async function post(action: string, payload: Record<string, unknown>): Promise<ActionResult> {
  try {
    const res = await fetch('/api/lifelink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = (await res.json()) as ActionResult & { state?: LifeLinkSnapshot };
    if (data.state) setSnapshot(data.state);
    return { ok: data.ok, message: data.message, error: data.error, requestId: data.requestId };
  } catch {
    return applyLocalAction(action, payload);
  }
}

export async function fetchState(): Promise<LifeLinkSnapshot | null> {
  try {
    const res = await fetch('/api/lifelink');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as LifeLinkSnapshot;
    setSnapshot(data);
    return data;
  } catch {
    if (!snapshot) setSnapshot(localSeedSnapshot());
    return snapshot;
  }
}

export const lifelinkApi = {
  refresh: fetchState,

  createEmergencyRequest: (payload: Record<string, unknown>) => post('createEmergencyRequest', payload),

  cancelRequest: (requestId: string, reason: string) => post('cancelRequest', { requestId, reason }),

  reserveInventory: (inventoryId: string, requestId: string, units: number) =>
    post('reserveInventory', { inventoryId, requestId, units }),

  toggleDonorAvailability: (donorId: string) => post('toggleDonorAvailability', { donorId }),

  respondToDonorRequest: (notificationId: string, response: 'ACCEPT' | 'DECLINE', expectedArrivalMins?: number) =>
    post('respondToDonorRequest', { notificationId, response, expectedArrivalMins }),

  confirmDonorArrival: (donorId: string, bloodCentreId: string, requestId: string) =>
    post('confirmDonorArrival', { donorId, bloodCentreId, requestId }),

  recordDonorScreening: (
    donorId: string,
    bloodCentreId: string,
    requestId: string,
    outcome: 'PASSED' | 'DEFERRED' | 'REJECTED',
    reason?: string,
    vitals?: string,
  ) => post('recordDonorScreening', { donorId, bloodCentreId, requestId, outcome, reason, vitals }),

  recordDonationCollection: (
    donorId: string,
    bloodCentreId: string,
    requestId: string,
    volumeMl: number,
    donationType: 'WHOLE_BLOOD' | 'APHERESIS_PLATELETS' | 'PLASMA',
  ) => post('recordDonationCollectionByDonor', { donorId, bloodCentreId, requestId, volumeMl, donationType }),

  processTestingAndInventory: (
    donationEventId: string,
    testResult: 'CLEARED' | 'REACTIVE',
    componentCreated: string,
    unitsCreated: number,
    donorBloodGroup?: string,
  ) => post('processTestingAndInventory', { donationEventId, testResult, componentCreated, unitsCreated, donorBloodGroup }),

  updateInventoryStatus: (inventoryId: string, status: string, notes?: string) =>
    post('updateInventoryStatus', { inventoryId, status, notes }),

  fulfilEmergencyUnits: (requestId: string, units: number) =>
    post('fulfilEmergencyUnits', { requestId, units }),

  runSimulationStep: (step: number) => post('runSimulationStep', { step }),

  resetToSeed: () => post('resetToSeed', {}),
};

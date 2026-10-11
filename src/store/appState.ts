// ============================================================
// LifeLink App Store — React context-friendly state management
// using localStorage persistence + in-memory state
// ============================================================

import type {
  Organization, User, HospitalProfile, BloodBankProfile,
  InventoryBatch, InventoryMovement, BloodRequest, BloodBankResponse,
  InventoryReservation, RequestStatusHistory, Notification, AuditEvent,
  IntegrationSource, RequestStatus, ResponseStatus, BloodComponent,
  BloodGroup, MovementType, UrgencyLevel,
} from '../types/lifelink';

import {
  DEMO_ORGS, DEMO_USERS, DEMO_HOSPITAL_PROFILES, DEMO_BB_PROFILES,
  DEMO_INVENTORY, DEMO_REQUESTS, DEMO_RESPONSES, DEMO_RESERVATIONS,
  DEMO_NOTIFICATIONS, DEMO_INTEGRATIONS,
} from '../data/demoData';

let _seq = Date.now();
export function uid(prefix: string): string {
  return `${prefix}_${(_seq++).toString(36)}`;
}

export function generateRequestRef(orgName: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'LL-';
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export function generateTrackingCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function nowIso(): string { return new Date().toISOString(); }
export function hoursFromNow(h: number): string { return new Date(Date.now() + h * 3600000).toISOString(); }
export function pastHours(h: number): string { return new Date(Date.now() - h * 3600000).toISOString(); }

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', hour12: true
  });
}

// ============================================================
// AppState — singleton state object (browser-side)
// ============================================================

class AppState {
  organizations: Organization[];
  users: User[];
  hospitalProfiles: HospitalProfile[];
  bloodBankProfiles: BloodBankProfile[];
  inventoryBatches: InventoryBatch[];
  inventoryMovements: InventoryMovement[];
  bloodRequests: BloodRequest[];
  bloodBankResponses: BloodBankResponse[];
  inventoryReservations: InventoryReservation[];
  requestStatusHistory: RequestStatusHistory[];
  notifications: Notification[];
  auditEvents: AuditEvent[];
  integrationSources: IntegrationSource[];

  private reservationLocks: Set<string> = new Set();

  constructor() {
    this.organizations = [...DEMO_ORGS];
    this.users = [...DEMO_USERS];
    this.hospitalProfiles = [...DEMO_HOSPITAL_PROFILES];
    this.bloodBankProfiles = [...DEMO_BB_PROFILES];
    this.inventoryBatches = [...DEMO_INVENTORY];
    this.inventoryMovements = [];
    this.bloodRequests = [...DEMO_REQUESTS];
    this.bloodBankResponses = [...DEMO_RESPONSES];
    this.inventoryReservations = [...DEMO_RESERVATIONS];
    this.requestStatusHistory = [];
    this.notifications = [...DEMO_NOTIFICATIONS];
    this.auditEvents = [];
    this.integrationSources = [...DEMO_INTEGRATIONS];

    // Populate initial status histories
    for (const req of this.bloodRequests) {
      this.requestStatusHistory.push({
        id: uid('hist'),
        requestId: req.id,
        previousStatus: null,
        newStatus: 'SUBMITTED',
        changedBy: req.requestedBy,
        changedAt: req.createdAt,
      });
    }
  }

  // ---- Auth helpers ----
  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getOrgById(id: string): Organization | undefined {
    return this.organizations.find(o => o.id === id);
  }

  getInventoryForBloodBank(bloodBankId: string): InventoryBatch[] {
    return this.inventoryBatches.filter(b => b.bloodBankId === bloodBankId);
  }

  getRequestsForBloodBank(bloodBankId: string): BloodRequest[] {
    const bb = this.getOrgById(bloodBankId);
    if (!bb) return this.bloodRequests;
    return this.bloodRequests.filter(r => {
      const hosp = this.getOrgById(r.hospitalId);
      return hosp?.district === bb.district;
    });
  }

  getRequestsForHospital(hospitalId: string): BloodRequest[] {
    return this.bloodRequests.filter(r => r.hospitalId === hospitalId);
  }

  getResponsesForRequest(requestId: string): BloodBankResponse[] {
    return this.bloodBankResponses.filter(r => r.requestId === requestId);
  }

  // ---- Audit ----
  audit(actorId: string, action: string, resourceType: string, resourceId: string, detail: Record<string, unknown> = {}): void {
    this.auditEvents.unshift({
      id: uid('aud'),
      actorId,
      actorOrganizationId: this.getUserById(actorId)?.organizationId,
      action,
      resourceType,
      resourceId,
      detail,
      performedAt: nowIso(),
    });
  }

  // ---- Notify ----
  notify(n: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): void {
    this.notifications.unshift({
      ...n,
      id: uid('notif'),
      isRead: false,
      createdAt: nowIso(),
    });
  }

  // ---- Request creation ----
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
    const org = this.getOrgById(params.hospitalId);
    if (!org) return { ok: false, error: 'Organization not found.' };
    if (org.status !== 'VERIFIED') return { ok: false, error: 'Organization is not verified. Cannot distribute requests.' };

    const req: BloodRequest = {
      id: uid('req'),
      referenceNumber: generateRequestRef(org.name),
      hospitalId: params.hospitalId,
      requestedBy: params.requestedBy,
      patientIdentifierHash: uid('phash'), // placeholder; in production: SHA-256 of internal ID
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

    this.bloodRequests.push(req);
    this.requestStatusHistory.push({
      id: uid('hist'),
      requestId: req.id,
      previousStatus: null,
      newStatus: 'SUBMITTED',
      changedBy: params.requestedBy,
      changedAt: nowIso(),
    });

    // Auto-distribute to verified blood banks in same/neighboring districts
    this.distributeRequest(req.id, params.requestedBy);

    this.audit(params.requestedBy, 'REQUEST_CREATED', 'blood_request', req.id, { referenceNumber: req.referenceNumber });
    return { ok: true, request: req };
  }

  // ---- Distribute ----
  distributeRequest(requestId: string, actorId: string): void {
    const req = this.bloodRequests.find(r => r.id === requestId);
    if (!req) return;
    const hospital = this.getOrgById(req.hospitalId);

    // Transition to DISTRIBUTED → AWAITING_RESPONSES
    req.status = 'AWAITING_RESPONSES';
    req.distributedAt = nowIso();
    req.updatedAt = nowIso();
    this.requestStatusHistory.push({
      id: uid('hist'),
      requestId,
      previousStatus: 'SUBMITTED',
      newStatus: 'AWAITING_RESPONSES',
      changedBy: actorId,
      changedAt: nowIso(),
    });

    // Notify blood banks
    const verifiedBBs = this.organizations.filter(o => o.type === 'BLOOD_BANK' && o.status === 'VERIFIED');
    for (const bb of verifiedBBs) {
      this.notify({
        recipientOrgId: bb.id,
        type: 'NEW_REQUEST',
        title: 'New Blood Request',
        message: `${req.urgency}: ${hospital?.name || req.hospitalId} requires ${req.quantityUnits} units ${req.bloodGroup || ''} ${req.bloodComponent}.`,
        relatedRequestId: requestId,
      });
    }
  }

  // ---- Status transition ----
  transitionRequest(requestId: string, newStatus: RequestStatus, actorId: string, reason?: string): { ok: boolean; error?: string } {
    const req = this.bloodRequests.find(r => r.id === requestId);
    if (!req) return { ok: false, error: 'Request not found.' };

    const validNext: Record<RequestStatus, RequestStatus[]> = {
      DRAFT: ['SUBMITTED', 'CANCELLED'],
      SUBMITTED: ['VERIFIED', 'AWAITING_RESPONSES', 'CANCELLED'],
      VERIFIED: ['DISTRIBUTED', 'AWAITING_RESPONSES', 'CANCELLED'],
      DISTRIBUTED: ['AWAITING_RESPONSES', 'CANCELLED'],
      AWAITING_RESPONSES: ['PARTIALLY_MATCHED', 'AVAILABILITY_CONFIRMED', 'EXPIRED', 'CANCELLED', 'ESCALATED'],
      PARTIALLY_MATCHED: ['AVAILABILITY_CONFIRMED', 'RESERVATION_PENDING', 'EXPIRED', 'CANCELLED', 'ESCALATED'],
      AVAILABILITY_CONFIRMED: ['RESERVATION_PENDING', 'CANCELLED'],
      RESERVATION_PENDING: ['RESERVED', 'CANCELLED'],
      RESERVED: ['PREPARATION_IN_PROGRESS', 'CANCELLED'],
      PREPARATION_IN_PROGRESS: ['PARTIALLY_FULFILLED', 'FULFILLED'],
      PARTIALLY_FULFILLED: ['FULFILLED', 'CANCELLED', 'ESCALATED'],
      FULFILLED: [],
      CANCELLED: [],
      EXPIRED: ['ESCALATED'],
      ESCALATED: ['CANCELLED'],
    };

    const allowed = validNext[req.status] ?? [];
    if (!allowed.includes(newStatus)) {
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
      changedBy: actorId,
      changedAt: nowIso(),
      reason,
    });

    this.audit(actorId, 'REQUEST_STATUS_CHANGED', 'blood_request', requestId, { previousStatus, newStatus, reason });
    return { ok: true };
  }

  // ---- Blood bank respond ----
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
    const req = this.bloodRequests.find(r => r.id === params.requestId);
    if (!req) return { ok: false, error: 'Request not found.' };
    if (['CANCELLED', 'EXPIRED', 'FULFILLED'].includes(req.status)) {
      return { ok: false, error: `Cannot respond to a ${req.status} request.` };
    }

    // Check for existing response from same BB
    const existing = this.bloodBankResponses.find(r => r.requestId === params.requestId && r.bloodBankId === params.bloodBankId);
    if (existing) {
      // Update existing response
      Object.assign(existing, { ...params, updatedAt: nowIso() });
      return { ok: true, response: existing };
    }

    const response: BloodBankResponse = {
      id: uid('resp'),
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

    this.bloodBankResponses.push(response);

    // Update request status
    const positive: ResponseStatus[] = ['CONFIRMED_AVAILABLE', 'PARTIAL_AVAILABLE'];
    if (positive.includes(params.responseStatus)) {
      const allPos = this.bloodBankResponses.filter(r => r.requestId === params.requestId && positive.includes(r.responseStatus));
      const totalConfirmed = allPos.reduce((sum, r) => sum + r.confirmedUnits, 0);
      if (totalConfirmed >= req.quantityUnits) {
        if (req.status === 'AWAITING_RESPONSES' || req.status === 'PARTIALLY_MATCHED') {
          req.status = 'AVAILABILITY_CONFIRMED';
          req.updatedAt = nowIso();
        }
      } else if (req.status === 'AWAITING_RESPONSES') {
        req.status = 'PARTIALLY_MATCHED';
        req.updatedAt = nowIso();
      }
    }

    // Notify hospital
    this.notify({
      recipientOrgId: req.hospitalId,
      type: 'NEW_RESPONSE',
      title: 'Blood Bank Response Received',
      message: `${this.getOrgById(params.bloodBankId)?.name} responded to ${req.referenceNumber}: ${params.responseStatus.replace('_', ' ')}.`,
      relatedRequestId: params.requestId,
    });

    this.audit(params.respondedBy, 'RESPONSE_SUBMITTED', 'blood_bank_response', response.id, {
      requestId: params.requestId, status: params.responseStatus,
    });

    return { ok: true, response };
  }

  // ---- Atomic reservation ----
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
      const req = this.bloodRequests.find(r => r.id === params.requestId);
      if (!req) return { ok: false, error: 'Request not found.' };
      if (['CANCELLED', 'EXPIRED', 'FULFILLED'].includes(req.status)) {
        return { ok: false, error: `Cannot reserve for a ${req.status} request.` };
      }

      const batch = this.inventoryBatches.find(b => b.id === params.inventoryBatchId);
      if (!batch) return { ok: false, error: 'Inventory batch not found.' };
      if (batch.bloodBankId !== params.bloodBankId) {
        return { ok: false, error: 'Inventory does not belong to this blood bank.' };
      }

      const unreserved = batch.availableUnits - batch.reservedUnits;
      if (params.units > unreserved) {
        return { ok: false, error: `Insufficient available units. Requested: ${params.units}, Unreserved available: ${unreserved}.` };
      }

      batch.reservedUnits += params.units;
      batch.lastUpdatedAt = nowIso();

      const reservationId = uid('res');
      this.inventoryReservations.push({
        id: reservationId,
        requestId: params.requestId,
        bloodBankId: params.bloodBankId,
        inventoryBatchId: params.inventoryBatchId,
        reservedUnits: params.units,
        reservedBy: params.reservedBy,
        status: 'ACTIVE',
        createdAt: nowIso(),
        expiresAt: hoursFromNow(4),
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

      // Update request status
      if (['AVAILABILITY_CONFIRMED', 'RESERVATION_PENDING'].includes(req.status)) {
        req.status = 'RESERVED';
        req.updatedAt = nowIso();
      }

      this.notify({
        recipientOrgId: req.hospitalId,
        type: 'RESERVATION_CREATED',
        title: 'Units Reserved',
        message: `${params.units} units reserved for request ${req.referenceNumber}.`,
        relatedRequestId: params.requestId,
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
    const res = this.inventoryReservations.find(r => r.id === reservationId);
    if (!res) return { ok: false, error: 'Reservation not found.' };
    if (res.status !== 'ACTIVE') return { ok: false, error: `Reservation is already ${res.status}.` };

    const batch = this.inventoryBatches.find(b => b.id === res.inventoryBatchId);
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

  // ---- Update inventory ----
  updateInventoryBatch(params: {
    batchId: string;
    bloodBankId: string;
    updatedBy: string;
    availableUnits: number;
    notes?: string;
  }): { ok: boolean; error?: string } {
    const batch = this.inventoryBatches.find(b => b.id === params.batchId);
    if (!batch) return { ok: false, error: 'Batch not found.' };
    if (batch.bloodBankId !== params.bloodBankId) return { ok: false, error: 'Unauthorized.' };
    if (params.availableUnits < 0) return { ok: false, error: 'Units cannot be negative.' };
    if (params.availableUnits < batch.reservedUnits) {
      return { ok: false, error: `Cannot set available to ${params.availableUnits}: ${batch.reservedUnits} units already reserved.` };
    }

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
      previousUnits: prev, newUnits: params.availableUnits, delta,
    });

    return { ok: true };
  }

  // ---- Add inventory batch ----
  addInventoryBatch(params: {
    bloodBankId: string;
    addedBy: string;
    bloodComponent: BloodComponent;
    bloodGroup: BloodGroup;
    availableUnits: number;
    notes?: string;
  }): { ok: boolean; batch?: InventoryBatch; error?: string } {
    if (params.availableUnits < 0) return { ok: false, error: 'Units cannot be negative.' };

    const batch: InventoryBatch = {
      id: uid('inv'),
      bloodBankId: params.bloodBankId,
      bloodComponent: params.bloodComponent,
      bloodGroup: params.bloodGroup,
      availableUnits: params.availableUnits,
      reservedUnits: 0,
      quarantinedUnits: 0,
      expiredUnits: 0,
      discardedUnits: 0,
      source: 'MANUAL_ENTRY',
      verificationStatus: 'RECENTLY_VERIFIED',
      lastVerifiedAt: nowIso(),
      lastUpdatedAt: nowIso(),
      lastUpdatedBy: params.addedBy,
      isDemo: true,
      notes: params.notes,
    };

    this.inventoryBatches.push(batch);
    this.inventoryMovements.push({
      id: uid('mov'),
      inventoryBatchId: batch.id,
      bloodBankId: params.bloodBankId,
      movementType: 'STOCK_IN',
      units: params.availableUnits,
      performedBy: params.addedBy,
      performedAt: nowIso(),
      notes: params.notes,
    });

    this.audit(params.addedBy, 'INVENTORY_STATUS_CHANGED', 'inventory_batch', batch.id, {
      action: 'BATCH_CREATED', units: params.availableUnits,
    });

    return { ok: true, batch };
  }

  // ---- Organization management ----
  verifyOrganization(orgId: string, verifiedBy: string, status: 'VERIFIED' | 'REJECTED', reason?: string): { ok: boolean; error?: string } {
    const org = this.organizations.find(o => o.id === orgId);
    if (!org) return { ok: false, error: 'Organization not found.' };

    org.status = status;
    org.updatedAt = nowIso();
    if (status === 'VERIFIED') {
      org.verifiedAt = nowIso();
      org.verifiedBy = verifiedBy;
    }

    this.notify({
      recipientOrgId: orgId,
      type: 'ORG_VERIFICATION_DECISION',
      title: `Organization ${status === 'VERIFIED' ? 'Verified' : 'Rejected'}`,
      message: status === 'VERIFIED'
        ? 'Your organization has been verified and approved on LifeLink.'
        : `Your organization registration was rejected. ${reason || 'Please contact support.'}`,
      relatedOrgId: orgId,
    });

    this.audit(verifiedBy, `ORG_${status}`, 'organization', orgId, { reason });
    return { ok: true };
  }

  markNotificationRead(notifId: string): void {
    const n = this.notifications.find(n => n.id === notifId);
    if (n) n.isRead = true;
  }

  markAllRead(orgId: string): void {
    this.notifications.filter(n => n.recipientOrgId === orgId).forEach(n => n.isRead = true);
  }

  // ---- Public search ----
  searchInventory(params: {
    state?: string;
    district?: string;
    bloodComponent?: BloodComponent;
    bloodGroup?: BloodGroup;
    minUnits?: number;
  }): Array<{ batch: InventoryBatch; org: Organization }> {
    return this.inventoryBatches
      .filter(b => {
        if (params.bloodComponent && b.bloodComponent !== params.bloodComponent) return false;
        if (params.bloodGroup && b.bloodGroup !== params.bloodGroup) return false;
        if (params.minUnits && (b.availableUnits - b.reservedUnits) < params.minUnits) return false;
        if (b.availableUnits === 0) return false;

        const org = this.organizations.find(o => o.id === b.bloodBankId);
        if (!org || org.status !== 'VERIFIED') return false;
        if (params.state && org.state !== params.state) return false;
        if (params.district && org.district !== params.district) return false;
        return true;
      })
      .map(b => ({
        batch: b,
        org: this.organizations.find(o => o.id === b.bloodBankId)!,
      }))
      .sort((a, b) => {
        // Sort: recently verified first, then by available
        const aTime = a.batch.lastVerifiedAt ? new Date(a.batch.lastVerifiedAt).getTime() : 0;
        const bTime = b.batch.lastVerifiedAt ? new Date(b.batch.lastVerifiedAt).getTime() : 0;
        return bTime - aTime;
      });
  }

  trackRequest(trackingCode: string): BloodRequest | undefined {
    return this.bloodRequests.find(r => r.trackingCode === trackingCode);
  }

  getPublicOrgsByDistrict(district?: string): Organization[] {
    return this.organizations.filter(o =>
      o.type === 'BLOOD_BANK' &&
      o.status === 'VERIFIED' &&
      (!district || o.district === district)
    );
  }
}

// Browser-side singleton
export const appState = new AppState();

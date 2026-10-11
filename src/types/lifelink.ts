// ============================================================
// LifeLink Core Types
// ============================================================

export type UserRole = 'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'HOSPITAL_STAFF' | 'BLOOD_BANK_ADMIN' | 'BLOOD_BANK_STAFF' | 'DONOR' | 'PUBLIC';

export type OrgType = 'HOSPITAL' | 'BLOOD_BANK';

export type OrgStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_EMAIL_VERIFICATION';

export type BloodComponent = 'PACKED_RED_CELLS' | 'WHOLE_BLOOD' | 'PLATELETS' | 'FRESH_FROZEN_PLASMA' | 'CRYOPRECIPITATE' | 'GRANULOCYTES';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type UrgencyLevel = 'CRITICAL' | 'URGENT' | 'ROUTINE';

export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'DISTRIBUTED'
  | 'AWAITING_RESPONSES'
  | 'PARTIALLY_MATCHED'
  | 'AVAILABILITY_CONFIRMED'
  | 'RESERVATION_PENDING'
  | 'RESERVED'
  | 'PREPARATION_IN_PROGRESS'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'ESCALATED';

export type ResponseStatus =
  | 'CONFIRMED_AVAILABLE'
  | 'PARTIAL_AVAILABLE'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'REQUIRES_COORDINATION'
  | 'UNABLE_TO_FULFILL'
  | 'NEEDS_CLARIFICATION';

export type InventorySource = 'MANUAL_ENTRY' | 'APPROVED_INTEGRATION' | 'DEMO_DATA';

export type InventoryVerificationStatus = 'UNVERIFIED' | 'RECENTLY_VERIFIED' | 'STALE' | 'UNAVAILABLE';

export type MovementType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'RESERVED'
  | 'RESERVATION_RELEASED'
  | 'QUARANTINED'
  | 'EXPIRED'
  | 'DISCARDED'
  | 'ISSUED'
  | 'TRANSFERRED'
  | 'ADJUSTMENT';

export type ReservationStatus = 'ACTIVE' | 'RELEASED' | 'EXPIRED' | 'CONVERTED_TO_ISSUE';

export type NotificationType =
  | 'NEW_REQUEST'
  | 'NEW_RESPONSE'
  | 'AVAILABILITY_CONFIRMED'
  | 'RESERVATION_CREATED'
  | 'RESERVATION_RELEASED'
  | 'RESERVATION_EXPIRED'
  | 'REQUEST_STATUS_CHANGED'
  | 'STOCK_STALE'
  | 'LOW_STOCK'
  | 'EXPIRY_ALERT'
  | 'INTEGRATION_FAILURE'
  | 'ORG_VERIFICATION_DECISION';

// ---- Entities ----

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  status: OrgStatus;
  state: string;
  district: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  licenseNumber: string;
  registrationNumber: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  status: UserStatus;
  isDemo: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface HospitalProfile {
  organizationId: string;
  bedCapacity: number;
  bloodBankOnsite: boolean;
  transfusionServiceContact: string;
  emergencyContact: string;
}

export interface BloodBankProfile {
  organizationId: string;
  licenseExpiryDate: string;
  operatingHours: string;
  emergencyContact: string;
  serviceDistricts: string[];
  supportsDelivery: boolean;
  deliveryRadiusKm: number;
}

export interface InventoryBatch {
  id: string;
  bloodBankId: string;
  bloodComponent: BloodComponent;
  bloodGroup: BloodGroup;
  availableUnits: number;
  reservedUnits: number;
  quarantinedUnits: number;
  expiredUnits: number;
  discardedUnits: number;
  source: InventorySource;
  verificationStatus: InventoryVerificationStatus;
  lastVerifiedAt?: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  isDemo: boolean;
  expiryDate?: string;
  notes?: string;
}

export interface InventoryMovement {
  id: string;
  inventoryBatchId: string;
  bloodBankId: string;
  movementType: MovementType;
  units: number;
  relatedRequestId?: string;
  relatedReservationId?: string;
  performedBy: string;
  performedAt: string;
  notes?: string;
}

export interface BloodRequest {
  id: string;
  referenceNumber: string;
  hospitalId: string;
  requestedBy: string;
  patientIdentifierHash: string; // SHA-256 of internal ID — never exposed publicly
  department: string;
  clinicianContact: string;
  bloodComponent: BloodComponent;
  bloodGroup?: BloodGroup;
  rhRequired?: boolean;
  quantityUnits: number;
  urgency: UrgencyLevel;
  requiredBy: string;
  collectionLocation: string;
  additionalRequirements?: string;
  status: RequestStatus;
  trackingCode: string; // 6-digit code for family lookup
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  distributedAt?: string;
  fulfilledAt?: string;
  cancelledAt?: string;
  expiresAt: string;
}

export interface BloodBankResponse {
  id: string;
  requestId: string;
  bloodBankId: string;
  respondedBy: string;
  responseStatus: ResponseStatus;
  confirmedUnits: number;
  notes: string;
  collectionArrangement?: string;
  estimatedReadyTime?: string;
  respondedAt: string;
  updatedAt: string;
}

export interface InventoryReservation {
  id: string;
  requestId: string;
  bloodBankId: string;
  inventoryBatchId: string;
  reservedUnits: number;
  reservedBy: string;
  status: ReservationStatus;
  createdAt: string;
  expiresAt: string;
  releasedAt?: string;
  releasedBy?: string;
  releaseReason?: string;
  convertedToIssueAt?: string;
}

export interface RequestStatusHistory {
  id: string;
  requestId: string;
  previousStatus: RequestStatus | null;
  newStatus: RequestStatus;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

export interface Notification {
  id: string;
  recipientUserId?: string;
  recipientOrgId?: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedRequestId?: string;
  relatedOrgId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorOrganizationId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  detail: Record<string, unknown>;
  performedAt: string;
  ipAddress?: string;
}

export interface IntegrationSource {
  id: string;
  name: string;
  type: 'ERAKTKOSH' | 'STATE_API' | 'HOSPITAL_LIS' | 'DEMO';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING_AUTHORIZATION';
  lastSyncAt?: string;
  lastErrorAt?: string;
  lastError?: string;
  configuration: Record<string, string>;
  isAuthorized: boolean;
  authorizationNote: string;
}

// ---- UI / Context types ----

export interface AuthUser extends User {
  organization?: Organization;
}

export type AppView =
  | 'HOME'
  | 'SEARCH'
  | 'DIRECTORY'
  | 'BLOOD_BANK_DETAIL'
  | 'TRACK_REQUEST'
  | 'DONOR_REGISTER'
  | 'ABOUT'
  | 'SAFETY_INFO'
  | 'PRIVACY'
  | 'CONTACT'
  | 'SIGN_IN'
  | 'REGISTER_ORG'
  | 'PENDING_VERIFICATION'
  | 'HOSPITAL_DASHBOARD'
  | 'HOSPITAL_NEW_REQUEST'
  | 'HOSPITAL_REQUESTS'
  | 'HOSPITAL_REQUEST_DETAIL'
  | 'HOSPITAL_RESPONSES'
  | 'HOSPITAL_NOTIFICATIONS'
  | 'HOSPITAL_REPORTS'
  | 'HOSPITAL_SETTINGS'
  | 'BB_DASHBOARD'
  | 'BB_INVENTORY'
  | 'BB_UPDATE_STOCK'
  | 'BB_REQUESTS'
  | 'BB_REQUEST_DETAIL'
  | 'BB_RESERVATIONS'
  | 'BB_NOTIFICATIONS'
  | 'BB_REPORTS'
  | 'BB_SETTINGS'
  | 'DONOR_DASHBOARD'
  | 'DONOR_PROFILE'
  | 'DONOR_CONSENT'
  | 'ADMIN_DASHBOARD'
  | 'ADMIN_ORG_VERIFICATION'
  | 'ADMIN_USERS'
  | 'ADMIN_REQUESTS'
  | 'ADMIN_INVENTORY_QUALITY'
  | 'ADMIN_INTEGRATIONS'
  | 'ADMIN_AUDIT_LOG'
  | 'ADMIN_REPORTS'
  | 'ADMIN_SETTINGS';

// Helpers
export const BLOOD_COMPONENT_LABELS: Record<BloodComponent, string> = {
  PACKED_RED_CELLS: 'Packed Red Cells (PRBC)',
  WHOLE_BLOOD: 'Whole Blood',
  PLATELETS: 'Platelets',
  FRESH_FROZEN_PLASMA: 'Fresh Frozen Plasma (FFP)',
  CRYOPRECIPITATE: 'Cryoprecipitate',
  GRANULOCYTES: 'Granulocytes',
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  CRITICAL: 'Critical — Immediate',
  URGENT: 'Urgent — Within hours',
  ROUTINE: 'Routine — Planned',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  VERIFIED: 'Verified',
  DISTRIBUTED: 'Distributed',
  AWAITING_RESPONSES: 'Awaiting Responses',
  PARTIALLY_MATCHED: 'Partially Matched',
  AVAILABILITY_CONFIRMED: 'Availability Confirmed',
  RESERVATION_PENDING: 'Reservation Pending',
  RESERVED: 'Reserved',
  PREPARATION_IN_PROGRESS: 'Preparation in Progress',
  PARTIALLY_FULFILLED: 'Partially Fulfilled',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  ESCALATED: 'Escalated / Unresolved',
};

export const RESPONSE_STATUS_LABELS: Record<ResponseStatus, string> = {
  CONFIRMED_AVAILABLE: 'Confirmed Available',
  PARTIAL_AVAILABLE: 'Partial Availability',
  TEMPORARILY_UNAVAILABLE: 'Temporarily Unavailable',
  REQUIRES_COORDINATION: 'Requires Coordination',
  UNABLE_TO_FULFILL: 'Unable to Fulfill',
  NEEDS_CLARIFICATION: 'Needs Clarification',
};

// Valid request state transitions
export const VALID_TRANSITIONS: Partial<Record<RequestStatus, RequestStatus[]>> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['VERIFIED', 'CANCELLED'],
  VERIFIED: ['DISTRIBUTED', 'CANCELLED'],
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

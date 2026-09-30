// LifeLink Data Model & State Machine Types (Strictly adhering to LifeLink Product Specification v3)

export type UserRole = 'HOSPITAL_STAFF' | 'DONOR' | 'BLOOD_CENTRE_STAFF' | 'PLATFORM_ADMIN';

export type HospitalStaffSubRole = 'REQUESTER' | 'COORDINATOR' | 'HOSPITAL_ADMIN';

export type DonorAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export type DonorMedicalEligibilityStatus = 
  | 'UNKNOWN' 
  | 'ELIGIBILITY_REVIEW_REQUIRED' 
  | 'CENTRE_CONFIRMED_ELIGIBLE' 
  | 'CENTRE_DEFERRED' 
  | 'CENTRE_REJECTED'
  // Backward compatibility aliases
  | 'ELIGIBLE' 
  | 'TEMPORARILY_DEFERRED' 
  | 'PERMANENTLY_DEFERRED';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type BloodComponentType = 
  | 'Packed Red Blood Cells'
  | 'Platelets'
  | 'Fresh Frozen Plasma'
  | 'Cryoprecipitate'
  | 'Whole Blood';

export type UrgencyLevel = 'CRITICAL' | 'URGENT' | 'PLANNED';

export type RequestStatus =
  | 'CREATED'
  | 'VALIDATING'
  | 'INVENTORY_SEARCH'
  | 'INVENTORY_FOUND'
  | 'INVENTORY_SHORTAGE'
  | 'DONOR_MOBILISATION'
  | 'DONORS_NOTIFIED'
  | 'DONOR_ACCEPTED'
  | 'DONOR_ARRIVED'
  | 'SCREENING_PENDING'
  | 'DONATION_COMPLETED'
  | 'TESTING_PENDING'
  | 'PROCESSING_PENDING'
  | 'INVENTORY_UPDATED'
  | 'RESERVED'
  | 'READY_FOR_FULFILMENT'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'CLOSED_OTHER_REASON'
  // v3 Formal Terminal State Names (§27, §35)
  | 'FULFILMENT_CONFIRMED_BY_CENTRE'
  | 'CANCELLED_BY_HOSPITAL';

export type DonorNotificationStatus = 
  | 'PENDING'
  | 'SENT'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'NO_RESPONSE'
  | 'ARRIVED_AT_CENTRE'
  | 'NO_SHOW';

export type NotificationChannel = 'IN_APP' | 'PUSH' | 'SMS' | 'WHATSAPP';
export type DeliveryStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export type PreScreeningStatus = 
  | 'SCREENING_PENDING'
  | 'SCREENING_PASSED'
  | 'SCREENING_DEFERRED'
  | 'SCREENING_REJECTED';

export type TestingStatus = 
  | 'TESTING_PENDING'
  | 'CLEARED_FOR_NEXT_STAGE'
  | 'REACTIVE_OR_NOT_USABLE';

export type ProcessingStatus = 
  | 'PROCESSING_PENDING'
  | 'PROCESSED';

export type InventoryUnitStatus = 
  | 'AVAILABLE'
  | 'RESERVED'
  | 'QUARANTINED'
  | 'ISSUED'
  | 'EXPIRED';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'VERIFIED';

export type InventoryFreshnessStatus = 'FRESH' | 'STALE' | 'UNCONFIRMED';

export interface User {
  id: string;
  name: string;
  phone: string;
  phone_verified: boolean;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at?: string;
}

export interface PlatformAdmin {
  id: string;
  user_id: string;
  permission_level: 'STANDARD' | 'SUPER';
  created_at: string;
  created_by?: string | null;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  verification_status: VerificationStatus;
  verified_at?: string | null;
  verified_by?: string | null;
  verification_reason?: string | null;
  created_at: string;
  updated_at?: string;
  contact_phone: string;
  district: string;
}

export interface HospitalStaff {
  id: string;
  hospital_id: string;
  user_id: string;
  name: string;
  designation: string;
  role: HospitalStaffSubRole;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at?: string;
}

export interface BloodCentre {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  verification_status: VerificationStatus;
  verified_at?: string | null;
  verified_by?: string | null;
  verification_reason?: string | null;
  licence_reference?: string;
  operational_status: 'ACTIVE' | 'LIMITED' | 'INACTIVE';
  contact_phone: string;
  license_number: string;
  district: string;
  last_inventory_sync: string; // ISO string
  created_at?: string;
  updated_at?: string;
}

export interface BloodCentreStaff {
  id: string;
  blood_centre_id: string;
  user_id: string;
  role: string;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at?: string;
}

export interface Donor {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  blood_group: BloodGroup;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  approximate_latitude: number;
  approximate_longitude: number;
  approximate_distance_km: number;
  availability: boolean;
  last_donation_date: string | null;
  account_status: DonorAccountStatus;
  eligibility_status: DonorMedicalEligibilityStatus;
  preferred_blood_centre_id: string | null;
  donations_count: number;
  created_at: string;
  updated_at?: string;
}

export interface BloodInventory {
  id: string;
  blood_centre_id: string;
  blood_centre_name: string;
  component_type: BloodComponentType;
  blood_group: BloodGroup;
  units: number;
  reserved_units: number; // Invariant: 0 <= reserved_units <= units. Available = units - reserved_units
  version: number; // Optimistic concurrency token (§32)
  collection_date: string;
  expiry_date: string;
  storage_condition: string;
  screening_status: 'TESTED_CLEARED' | 'PENDING_CLEARANCE';
  inventory_status: InventoryUnitStatus;
  availability_status?: 'AVAILABLE' | 'UNAVAILABLE';
  release_status?: 'RELEASED' | 'QUARANTINED' | 'PENDING';
  last_updated: string; // ISO string
  updated_at?: string;
}

export interface BloodRequest {
  id: string; // e.g. LL-2026-000184
  hospital_id: string;
  hospital_name: string;
  component_type: BloodComponentType;
  blood_group: BloodGroup;
  units_required: number;
  urgency: UrgencyLevel;
  status: RequestStatus;
  created_at: string;
  updated_at?: string;
  required_by: string; // Clinical urgency indicator
  expires_at: string; // Automated LifeLink coordination expiry time (§35)
  department: string; // Hospital department (§9, §45)
  hospital_department?: string; // alias
  request_reason: string; // Category or reason (§9, §45)
  reason_category?: string; // alias
  contact_person: string; // Staff member (§9, §45)
  contact_number: string; // Direct phone (§9, §45)
  contact_phone?: string; // alias
  operational_notes?: string; // Non-sensitive coordination notes (§9, §45)
  clinical_notes?: string; // alias
  units_fulfilled: number; // integer, default 0 (§33, §45)
  
  // Dynamic coordination tracking
  inventory_found_units: number;
  inventory_reserved_units: number;
  shortage_units: number;
  donor_mobilisation_active: boolean;
  notified_donors_count: number;
  accepted_donors_count: number;
  arrived_donors_count: number;
  completed_donations_count: number;
  
  // Closure metadata
  closure_reason?: string;
  closed_by?: string;
  closed_at?: string;
}

export interface DonorNotification {
  id: string;
  request_id: string;
  donor_id: string;
  donor_name: string;
  blood_group: BloodGroup;
  distance_km: number;
  tier: 1 | 2 | 3 | 4; // 1: 0-5km, 2: 5-10km, 3: 10-20km, 4: 20km+
  notification_status: DonorNotificationStatus;
  delivery_status: DeliveryStatus; // Aggregate across channels (§40, §45)
  response_status?: string;
  sent_at: string;
  responded_at?: string;
  blood_centre_id: string;
  blood_centre_name: string;
  selected_blood_centre_id?: string | null; // Selected centre confirmed by donor (§20, §45)
  expected_arrival_time?: string | null; // Expected arrival time estimate (§20, §45)
  created_at?: string;
  updated_at?: string;
}

export interface NotificationDelivery {
  id: string;
  notification_id: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  sent_at: string | null;
  delivered_at?: string | null;
  failure_reason?: string | null;
}

export interface RequestMatch {
  id: string;
  request_id: string;
  donor_id: string;
  approximate_distance: number;
  match_status: string;
  created_at: string;
  updated_at?: string;
}

export interface RequestInventorySearchResult {
  id: string;
  request_id: string;
  inventory_id: string;
  blood_centre_id: string;
  units_found: number;
  distance_km: number;
  freshness_status: InventoryFreshnessStatus;
  search_timestamp: string;
}

export interface Reservation {
  id: string;
  request_id: string;
  inventory_id: string;
  units: number;
  status: 
    | 'RESERVATION_REQUESTED'
    | 'RESERVED'
    | 'RESERVATION_DECLINED'
    | 'RESERVATION_CANCELLED'
    | 'RESERVATION_EXPIRED'
    | 'FULFILLED';
  centre_confirmation?: boolean;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface SystemConfig {
  id: string;
  config_key: string;
  config_value: string;
  description: string;
  updated_by: string;
  updated_at: string;
}

export interface DonationEvent {
  id: string;
  donor_id: string;
  donor_name: string;
  blood_centre_id: string;
  blood_centre_name: string;
  request_id: string;
  collection_date: string;
  donation_type: 'WHOLE_BLOOD' | 'APHERESIS_PLATELETS' | 'PLASMA';
  volume_ml: number;
  screening_status: PreScreeningStatus;
  assessment_status?: string;
  deferral_reason?: string;
  testing_status: TestingStatus;
  processing_status: ProcessingStatus;
  release_status?: string;
  component_created?: BloodComponentType;
  component_units?: number;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryMovement {
  id: string;
  inventory_id: string;
  action: 'ADDED' | 'RESERVED' | 'RELEASED' | 'ISSUED' | 'EXPIRED' | 'DISCARDED';
  units: number;
  performed_by: string;
  timestamp: string;
  notes?: string;
  reference_type?: string;
  reference_id?: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string; // Stored denormalised (§39, §45)
  actor_sub_role?: string | null; // Stored denormalised (§10, §39, §45)
  organisation_type?: string | null; // (§39, §45)
  organisation_id?: string | null; // (§39, §45)
  entity_type: 'REQUEST' | 'INVENTORY' | 'DONOR' | 'DONATION' | 'SYSTEM' | string;
  entity_id: string;
  action: string;
  timestamp: string;
  previous_state?: string;
  new_state?: string;
  metadata?: Record<string, any>;
}

export interface SystemAnalytics {
  avg_request_to_inventory_sec: number;
  avg_request_to_first_notification_sec: number;
  avg_request_to_donor_accept_sec: number;
  avg_request_to_donor_arrival_min: number;
  avg_request_to_fulfilment_min: number;
  pct_fulfilled_from_inventory: number;
  pct_requiring_donor_mobilisation: number;
  donor_response_rate_pct: number;
  donor_no_show_rate_pct: number;
  inventory_freshness_index_pct: number;
  total_requests: number;
  active_requests: number;
  fulfilled_requests: number;
}

// LifeLink Data Model & State Machine Types (Strictly adhering to Product Specification Section 43 & Section 31)

export type UserRole = 'HOSPITAL_STAFF' | 'DONOR' | 'BLOOD_CENTRE_STAFF';

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
  | 'EXPIRED';

export type DonorNotificationStatus = 
  | 'PENDING'
  | 'SENT'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'NO_RESPONSE'
  | 'ARRIVED_AT_CENTRE'
  | 'NO_SHOW';

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

export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  phone: string;
  phone_verified: boolean;
  role: UserRole;
  created_at: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  verification_status: VerificationStatus;
  created_at: string;
  contact_phone: string;
  district: string;
}

export interface HospitalStaff {
  id: string;
  hospital_id: string;
  user_id: string;
  name: string;
  designation: string;
  verification_status: VerificationStatus;
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
  eligibility_status: 'ELIGIBLE' | 'TEMPORARILY_DEFERRED' | 'PERMANENTLY_DEFERRED';
  preferred_blood_centre_id: string;
  donations_count: number;
  created_at: string;
}

export interface BloodCentre {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  verification_status: VerificationStatus;
  operational_status: 'ACTIVE' | 'LIMITED' | 'INACTIVE';
  contact_phone: string;
  license_number: string;
  district: string;
  last_inventory_sync: string; // ISO string
}

export interface BloodInventory {
  id: string;
  blood_centre_id: string;
  blood_centre_name: string;
  component_type: BloodComponentType;
  blood_group: BloodGroup;
  units: number;
  reserved_units: number;
  collection_date: string;
  expiry_date: string;
  storage_condition: string;
  screening_status: 'TESTED_CLEARED' | 'PENDING_CLEARANCE';
  inventory_status: InventoryUnitStatus;
  last_updated: string; // ISO string
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
  required_by: string;
  hospital_department: string;
  reason_category: string;
  contact_person: string;
  contact_phone: string;
  clinical_notes?: string;
  // Dynamic coordination tracking
  inventory_found_units: number;
  inventory_reserved_units: number;
  units_fulfilled: number;
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
  sent_at: string;
  responded_at?: string;
  blood_centre_id: string;
  blood_centre_name: string;
  expected_arrival_time?: string;
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
  deferral_reason?: string;
  testing_status: TestingStatus;
  processing_status: ProcessingStatus;
  component_created?: BloodComponentType;
  component_units?: number;
  completed_at?: string;
}

export interface InventoryMovement {
  id: string;
  inventory_id: string;
  action: 'ADDED' | 'RESERVED' | 'RELEASED' | 'ISSUED' | 'EXPIRED' | 'DISCARDED';
  units: number;
  performed_by: string;
  timestamp: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole | 'SYSTEM';
  entity_type: 'REQUEST' | 'INVENTORY' | 'DONOR' | 'DONATION' | 'SYSTEM';
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

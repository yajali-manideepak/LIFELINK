import {
  Hospital,
  BloodCentre,
  Donor,
  BloodInventory,
  BloodRequest,
  AuditLog,
  User,
  SystemConfig,
  PlatformAdmin,
  DonorNotification,
  DonationEvent,
} from '../types/lifelink';

export const DEMO_NOTICE =
  'DEMO DATA — NOT REAL MEDICAL INVENTORY. For simulation and workflow demonstration only.';

/**
 * Dynamic seed timestamps.
 *
 * Freshness tiers (§14), coordination expiry (§35) and demo-request recency are
 * computed relative to "now" so the seeded world is always internally
 * consistent — on the server at every cold start, and in the client fallback.
 */
export interface SeedTimes {
  now: number;
  /** 3 minutes ago — Narasaraopet sync + O+ PRBC inventory (FRESH). */
  naraSync: string;
  /** 7 minutes ago — Guntur sync + Guntur O+ PRBC (FRESH). */
  gunturSync: string;
  /** 12 minutes ago. */
  naraApos: string;
  /** 8 minutes ago. */
  naraPlatelets: string;
  /** 15 minutes ago. */
  naraFfp: string;
  /** 50 minutes ago — deliberately STALE (> 30 min threshold). */
  gunturONeg: string;
  /** 5 minutes ago. */
  gunturPlatelets: string;
  /** 42 minutes ago — canonical demo request created. */
  requestCreated: string;
}

export function computeDynamicSeedTimes(): SeedTimes {
  const now = Date.now();
  const m = (mins: number) => new Date(now - mins * 60_000).toISOString();
  return {
    now,
    naraSync: m(3),
    gunturSync: m(7),
    naraApos: m(12),
    naraPlatelets: m(8),
    naraFfp: m(15),
    gunturONeg: m(50),
    gunturPlatelets: m(5),
    requestCreated: m(42),
  };
}

// Active Users for fast switching (Section 4 & 4a)
export const SEED_USERS: User[] = [
  {
    id: 'usr_hosp_1',
    name: 'Dr. Anita Desai (Emergency Chief)',
    phone: '+91 98450 11223',
    phone_verified: true,
    role: 'HOSPITAL_STAFF',
    created_at: '2026-01-15T08:00:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'usr_donor_ravi',
    name: 'DEMO_Ravi Kumar',
    phone: '+91 98765 43210',
    phone_verified: true,
    role: 'DONOR',
    created_at: '2026-02-10T10:30:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'usr_donor_priya',
    name: 'DEMO_Priya Sharma',
    phone: '+91 98112 34567',
    phone_verified: true,
    role: 'DONOR',
    created_at: '2026-02-18T14:20:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'usr_bc_nara',
    name: 'M. K. Rao (Blood Bank Medical Officer)',
    phone: '+91 94401 23456',
    phone_verified: true,
    role: 'BLOOD_CENTRE_STAFF',
    created_at: '2026-01-05T09:00:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'usr_bc_guntur',
    name: 'Dr. Suresh Varma (Quality Manager)',
    phone: '+91 94402 34567',
    phone_verified: true,
    role: 'BLOOD_CENTRE_STAFF',
    created_at: '2026-01-08T11:00:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'usr_admin_1',
    name: 'S. K. Verma (Platform Administrator)',
    phone: '+91 99000 11222',
    phone_verified: true,
    role: 'PLATFORM_ADMIN',
    created_at: '2026-01-01T00:00:00Z',
    status: 'ACTIVE',
  },
];

/** Backward-compatible alias. */
export const MOCK_USERS = SEED_USERS;

export const MOCK_PLATFORM_ADMINS: PlatformAdmin[] = [
  {
    id: 'adm_001',
    user_id: 'usr_admin_1',
    permission_level: 'SUPER',
    created_at: '2026-01-01T00:00:00Z',
    created_by: null,
  },
];

export const MOCK_SYSTEM_CONFIG: SystemConfig[] = [
  {
    id: 'cfg_01',
    config_key: 'DONOR_NOTIFICATION_TIMEOUT_MINUTES',
    config_value: '7',
    description: 'Period before unanswered donor notification transitions to NO_RESPONSE',
    updated_by: 'adm_001',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cfg_02',
    config_key: 'DUPLICATE_REQUEST_WINDOW_MINUTES',
    config_value: '30',
    description: 'Window to flag identical hospital blood requests as potential duplicates',
    updated_by: 'adm_001',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cfg_03',
    config_key: 'INVENTORY_FRESHNESS_THRESHOLD_MINUTES',
    config_value: '30',
    description: 'Threshold after which blood inventory is flagged as STALE',
    updated_by: 'adm_001',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cfg_04',
    config_key: 'DONOR_RENOTIFICATION_QUIET_PERIOD_MINUTES',
    config_value: '60',
    description: 'Minimum quiet period before a donor may be re-notified for the same request',
    updated_by: 'adm_001',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cfg_05',
    config_key: 'MOBILISATION_TIER_1_RADIUS_KM',
    config_value: '5',
    description: 'Tier 1 donor mobilisation radius in kilometers',
    updated_by: 'adm_001',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cfg_06',
    config_key: 'MOBILISATION_TIER_2_RADIUS_KM',
    config_value: '10',
    description: 'Tier 2 donor mobilisation radius in kilometers',
    updated_by: 'adm_001',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'cfg_07',
    config_key: 'MOBILISATION_TIER_3_RADIUS_KM',
    config_value: '20',
    description: 'Tier 3 donor mobilisation radius in kilometers',
    updated_by: 'adm_001',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

// Demo Hospitals
export const SEED_HOSPITALS: Hospital[] = [
  {
    id: 'hosp_lifelink_gen',
    name: 'LifeLink General Hospital',
    address: 'Palnadu Road, Narasaraopet, Andhra Pradesh 522601',
    latitude: 16.2361,
    longitude: 80.0519,
    verification_status: 'VERIFIED',
    created_at: '2026-01-01T00:00:00Z',
    contact_phone: '+91 8647 222333',
    district: 'Palnadu',
  },
  {
    id: 'hosp_apollo_reach',
    name: 'District Care Emergency Centre',
    address: 'Main Highway Bypass, Guntur, Andhra Pradesh 522002',
    latitude: 16.3067,
    longitude: 80.4365,
    verification_status: 'VERIFIED',
    created_at: '2026-01-05T00:00:00Z',
    contact_phone: '+91 863 2345678',
    district: 'Guntur',
  },
];

/** Backward-compatible alias. */
export const MOCK_HOSPITALS = SEED_HOSPITALS;

// Demo Blood Centres (Medical Authorities)
export function buildSeedBloodCentres(t: SeedTimes): BloodCentre[] {
  return [
    {
      id: 'bc_narasaraopet',
      name: 'Narasaraopet Blood Centre',
      address: 'Govt Hospital Road, Narasaraopet, Palnadu 522601',
      latitude: 16.2385,
      longitude: 80.0552,
      verification_status: 'VERIFIED',
      operational_status: 'ACTIVE',
      contact_phone: '+91 8647 224455',
      license_number: 'AP/PAL/BB/2024/09',
      district: 'Palnadu',
      last_inventory_sync: t.naraSync,
    },
    {
      id: 'bc_guntur',
      name: 'Guntur Blood Centre',
      address: 'Kothapet, Guntur, Andhra Pradesh 522001',
      latitude: 16.3012,
      longitude: 80.441,
      verification_status: 'VERIFIED',
      operational_status: 'ACTIVE',
      contact_phone: '+91 863 2233445',
      license_number: 'AP/GTR/BB/2023/14',
      district: 'Guntur',
      last_inventory_sync: t.gunturSync,
    },
  ];
}

/** Backward-compatible alias (static timestamps). */
export const MOCK_BLOOD_CENTRES = buildSeedBloodCentres(computeDynamicSeedTimes());

// Synthetic Blood Inventory (§45)
export function buildSeedInventory(t: SeedTimes): BloodInventory[] {
  return [
    // Narasaraopet Blood Centre (BC A)
    {
      id: 'inv_nara_prbc_o_pos_1',
      blood_centre_id: 'bc_narasaraopet',
      blood_centre_name: 'Narasaraopet Blood Centre',
      component_type: 'Packed Red Blood Cells',
      blood_group: 'O+',
      units: 2,
      reserved_units: 0,
      version: 1,
      collection_date: '2026-09-18T10:00:00Z',
      expiry_date: '2026-10-30T10:00:00Z',
      storage_condition: '2°C to 6°C (Refrigerated Blood Bank Refrigerator)',
      screening_status: 'TESTED_CLEARED',
      inventory_status: 'AVAILABLE',
      last_updated: t.naraSync,
    },
    {
      id: 'inv_nara_prbc_a_pos_1',
      blood_centre_id: 'bc_narasaraopet',
      blood_centre_name: 'Narasaraopet Blood Centre',
      component_type: 'Packed Red Blood Cells',
      blood_group: 'A+',
      units: 4,
      reserved_units: 0,
      version: 1,
      collection_date: '2026-09-20T08:30:00Z',
      expiry_date: '2026-11-01T08:30:00Z',
      storage_condition: '2°C to 6°C',
      screening_status: 'TESTED_CLEARED',
      inventory_status: 'AVAILABLE',
      last_updated: t.naraApos,
    },
    {
      id: 'inv_nara_plt_b_pos_1',
      blood_centre_id: 'bc_narasaraopet',
      blood_centre_name: 'Narasaraopet Blood Centre',
      component_type: 'Platelets',
      blood_group: 'B+',
      units: 3,
      reserved_units: 0,
      version: 1,
      collection_date: '2026-09-23T11:00:00Z',
      expiry_date: '2026-09-28T11:00:00Z',
      storage_condition: '20°C to 24°C with continuous flat-bed agitation',
      screening_status: 'TESTED_CLEARED',
      inventory_status: 'AVAILABLE',
      last_updated: t.naraPlatelets,
    },
    {
      id: 'inv_nara_ffp_o_pos_1',
      blood_centre_id: 'bc_narasaraopet',
      blood_centre_name: 'Narasaraopet Blood Centre',
      component_type: 'Fresh Frozen Plasma',
      blood_group: 'O+',
      units: 5,
      reserved_units: 0,
      version: 1,
      collection_date: '2026-08-15T09:00:00Z',
      expiry_date: '2027-08-15T09:00:00Z',
      storage_condition: '-30°C or colder (Ultra-low Deep Freezer)',
      screening_status: 'TESTED_CLEARED',
      inventory_status: 'AVAILABLE',
      last_updated: t.naraFfp,
    },

    // Guntur Blood Centre (BC B)
    {
      id: 'inv_gun_prbc_o_pos_1',
      blood_centre_id: 'bc_guntur',
      blood_centre_name: 'Guntur Blood Centre',
      component_type: 'Packed Red Blood Cells',
      blood_group: 'O+',
      units: 1,
      reserved_units: 0,
      version: 1,
      collection_date: '2026-09-19T14:00:00Z',
      expiry_date: '2026-10-31T14:00:00Z',
      storage_condition: '2°C to 6°C',
      screening_status: 'TESTED_CLEARED',
      inventory_status: 'AVAILABLE',
      last_updated: t.gunturSync,
    },
    {
      id: 'inv_gun_prbc_o_neg_1',
      blood_centre_id: 'bc_guntur',
      blood_centre_name: 'Guntur Blood Centre',
      component_type: 'Packed Red Blood Cells',
      blood_group: 'O-',
      units: 1,
      reserved_units: 0,
      version: 1,
      collection_date: '2026-09-21T16:00:00Z',
      expiry_date: '2026-11-02T16:00:00Z',
      storage_condition: '2°C to 6°C',
      screening_status: 'TESTED_CLEARED',
      inventory_status: 'AVAILABLE',
      last_updated: t.gunturONeg, // Stale > 30 mins
    },
    {
      id: 'inv_gun_plt_o_pos_1',
      blood_centre_id: 'bc_guntur',
      blood_centre_name: 'Guntur Blood Centre',
      component_type: 'Platelets',
      blood_group: 'O+',
      units: 2,
      reserved_units: 0,
      version: 1,
      collection_date: '2026-09-24T09:00:00Z',
      expiry_date: '2026-09-29T09:00:00Z',
      storage_condition: '20°C to 24°C agitated',
      screening_status: 'TESTED_CLEARED',
      inventory_status: 'AVAILABLE',
      last_updated: t.gunturPlatelets,
    },
  ];
}

/** Backward-compatible alias (static timestamps). */
export const MOCK_INITIAL_INVENTORY = buildSeedInventory(computeDynamicSeedTimes());

// 25+ Synthetic Registered Voluntary Donors (§45)
export const SEED_DONORS: Donor[] = [
  // Tier 1 (0-5 km)
  {
    id: 'dn_01_ravi',
    user_id: 'usr_donor_ravi',
    name: 'DEMO_Ravi Kumar',
    phone: '+91 98765 •••••',
    blood_group: 'O+',
    gender: 'MALE',
    approximate_latitude: 16.241,
    approximate_longitude: 80.058,
    approximate_distance_km: 2.3,
    availability: true,
    last_donation_date: '2026-05-10',
    account_status: 'ACTIVE',
    eligibility_status: 'CENTRE_CONFIRMED_ELIGIBLE',
    preferred_blood_centre_id: 'bc_narasaraopet',
    donations_count: 4,
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'dn_02_priya',
    user_id: 'usr_donor_priya',
    name: 'DEMO_Priya Sharma',
    phone: '+91 98112 •••••',
    blood_group: 'O+',
    gender: 'FEMALE',
    approximate_latitude: 16.245,
    approximate_longitude: 80.062,
    approximate_distance_km: 3.4,
    availability: true,
    last_donation_date: '2026-04-12',
    account_status: 'ACTIVE',
    eligibility_status: 'CENTRE_CONFIRMED_ELIGIBLE',
    preferred_blood_centre_id: 'bc_narasaraopet',
    donations_count: 2,
    created_at: '2026-01-12T11:00:00Z',
  },
  {
    id: 'dn_03_karthik',
    user_id: 'usr_donor_karthik',
    name: 'DEMO_Karthik Reddy',
    phone: '+91 94901 •••••',
    blood_group: 'O+',
    gender: 'MALE',
    approximate_latitude: 16.23,
    approximate_longitude: 80.045,
    approximate_distance_km: 4.1,
    availability: true,
    last_donation_date: '2026-06-01',
    account_status: 'ACTIVE',
    eligibility_status: 'CENTRE_CONFIRMED_ELIGIBLE',
    preferred_blood_centre_id: 'bc_narasaraopet',
    donations_count: 6,
    created_at: '2026-01-14T09:30:00Z',
  },
  {
    id: 'dn_04_deepa',
    user_id: 'usr_donor_deepa',
    name: 'DEMO_Deepa V.',
    phone: '+91 97003 •••••',
    blood_group: 'A+',
    gender: 'FEMALE',
    approximate_latitude: 16.239,
    approximate_longitude: 80.049,
    approximate_distance_km: 1.8,
    availability: true,
    last_donation_date: '2026-03-20',
    account_status: 'ACTIVE',
    eligibility_status: 'CENTRE_CONFIRMED_ELIGIBLE',
    preferred_blood_centre_id: 'bc_narasaraopet',
    donations_count: 1,
    created_at: '2026-02-01T14:15:00Z',
  },
  {
    id: 'dn_05_venkat',
    user_id: 'usr_donor_venkat',
    name: 'DEMO_Venkat Subbaiah',
    phone: '+91 99887 •••••',
    blood_group: 'O+',
    gender: 'MALE',
    approximate_latitude: 16.248,
    approximate_longitude: 80.069,
    approximate_distance_km: 4.8,
    availability: true,
    last_donation_date: '2026-05-25',
    account_status: 'ACTIVE',
    eligibility_status: 'CENTRE_CONFIRMED_ELIGIBLE',
    preferred_blood_centre_id: 'bc_narasaraopet',
    donations_count: 3,
    created_at: '2026-02-05T16:00:00Z',
  },

  // Tier 2 (5-10 km)
  {
    id: 'dn_06_srinivas',
    user_id: 'usr_donor_srini',
    name: 'DEMO_Srinivas G.',
    phone: '+91 91234 •••••',
    blood_group: 'O+',
    gender: 'MALE',
    approximate_latitude: 16.265,
    approximate_longitude: 80.11,
    approximate_distance_km: 6.8,
    availability: true,
    last_donation_date: '2026-02-14',
    account_status: 'ACTIVE',
    eligibility_status: 'CENTRE_CONFIRMED_ELIGIBLE',
    preferred_blood_centre_id: 'bc_narasaraopet',
    donations_count: 5,
    created_at: '2026-01-20T10:45:00Z',
  },
  {
    id: 'dn_07_ananya',
    user_id: 'usr_donor_ananya',
    name: 'DEMO_Ananya Roy',
    phone: '+91 99445 •••••',
    blood_group: 'O+',
    gender: 'FEMALE',
    approximate_latitude: 16.271,
    approximate_longitude: 80.125,
    approximate_distance_km: 8.5,
    availability: true,
    last_donation_date: '2026-01-05',
    account_status: 'ACTIVE',
    eligibility_status: 'CENTRE_CONFIRMED_ELIGIBLE',
    preferred_blood_centre_id: 'bc_narasaraopet',
    donations_count: 2,
    created_at: '2026-01-25T12:00:00Z',
  },
  {
    id: 'dn_08_manoj',
    user_id: 'usr_donor_manoj',
    name: 'DEMO_Manoj Krishna',
    phone: '+91 98855 •••••',
    blood_group: 'B+',
    gender: 'MALE',
    approximate_latitude: 16.278,
    approximate_longitude: 80.135,
    approximate_distance_km: 9.2,
    availability: true,
    last_donation_date: '2026-06-15',
    account_status: 'ACTIVE',
    eligibility_status: 'CENTRE_CONFIRMED_ELIGIBLE',
    preferred_blood_centre_id: 'bc_narasaraopet',
    donations_count: 4,
    created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 'dn_09_lakshmi',
    user_id: 'usr_donor_lakshmi',
    name: 'DEMO_Lakshmi Narayana',
    phone: '+91 97766 •••••',
    blood_group: 'O+',
    gender: 'FEMALE',
    approximate_latitude: 16.282,
    approximate_longitude: 80.14,
    approximate_distance_km: 9.7,
    availability: false,
    last_donation_date: '2026-03-10',
    account_status: 'ACTIVE',
    eligibility_status: 'CENTRE_CONFIRMED_ELIGIBLE',
    preferred_blood_centre_id: 'bc_narasaraopet',
    donations_count: 1,
    created_at: '2026-02-03T17:30:00Z',
  },

  // Tier 3 (10-20 km)
  {
    id: 'dn_10_naresh',
    user_id: 'usr_donor_naresh',
    name: 'DEMO_Naresh Chowdary',
    phone: '+91 96655 •••••',
    blood_group: 'O+',
    gender: 'MALE',
    approximate_latitude: 16.295,
    approximate_longitude: 80.2,
    approximate_distance_km: 14.5,
    availability: true,
    last_donation_date: '2026-05-18',
    account_status: 'ACTIVE',
    eligibility_status: 'CENTRE_CONFIRMED_ELIGIBLE',
    preferred_blood_centre_id: 'bc_guntur',
    donations_count: 8,
    created_at: '2026-01-11T13:20:00Z',
  },
  {
    id: 'dn_11_swathi',
    user_id: 'usr_donor_swathi',
    name: 'DEMO_Swathi P.',
    phone: '+91 95544 •••••',
    blood_group: 'O+',
    gender: 'FEMALE',
    approximate_latitude: 16.301,
    approximate_longitude: 80.25,
    approximate_distance_km: 18.2,
    availability: true,
    last_donation_date: '2026-04-20',
    account_status: 'ACTIVE',
    eligibility_status: 'CENTRE_CONFIRMED_ELIGIBLE',
    preferred_blood_centre_id: 'bc_guntur',
    donations_count: 3,
    created_at: '2026-01-18T15:10:00Z',
  },
  {
    id: 'dn_12_ramesh',
    user_id: 'usr_donor_ramesh',
    name: 'DEMO_Ramesh Babu',
    phone: '+91 94433 •••••',
    blood_group: 'AB+',
    gender: 'MALE',
    approximate_latitude: 16.298,
    approximate_longitude: 80.22,
    approximate_distance_km: 16.0,
    availability: true,
    last_donation_date: '2026-05-02',
    account_status: 'ACTIVE',
    eligibility_status: 'CENTRE_CONFIRMED_ELIGIBLE',
    preferred_blood_centre_id: 'bc_guntur',
    donations_count: 7,
    created_at: '2026-01-22T11:00:00Z',
  },

  // Tier 4 (20+ km)
  {
    id: 'dn_13_prasad',
    user_id: 'usr_donor_prasad',
    name: 'DEMO_Prasad V.',
    phone: '+91 93322 •••••',
    blood_group: 'O+',
    gender: 'MALE',
    approximate_latitude: 16.315,
    approximate_longitude: 80.41,
    approximate_distance_km: 26.5,
    availability: true,
    last_donation_date: '2026-03-30',
    account_status: 'ACTIVE',
    eligibility_status: 'CENTRE_CONFIRMED_ELIGIBLE',
    preferred_blood_centre_id: 'bc_guntur',
    donations_count: 5,
    created_at: '2026-02-12T09:00:00Z',
  },
  {
    id: 'dn_14_kavitha',
    user_id: 'usr_donor_kavitha',
    name: 'DEMO_Kavitha R.',
    phone: '+91 92211 •••••',
    blood_group: 'O+',
    gender: 'FEMALE',
    approximate_latitude: 16.32,
    approximate_longitude: 80.43,
    approximate_distance_km: 28.1,
    availability: true,
    last_donation_date: '2026-02-18',
    account_status: 'ACTIVE',
    eligibility_status: 'CENTRE_CONFIRMED_ELIGIBLE',
    preferred_blood_centre_id: 'bc_guntur',
    donations_count: 2,
    created_at: '2026-02-15T10:00:00Z',
  },
];

/** Backward-compatible alias. */
export const MOCK_DONORS = SEED_DONORS;

// Initial canonical demo request representing Section 59 with full v3 fields (§9, §33, §35, §45)
export function buildSeedRequest(t: SeedTimes): BloodRequest {
  const requiredBy = new Date(t.now + 2 * 60 * 60 * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return {
    id: 'LL-2026-000184',
    hospital_id: 'hosp_lifelink_gen',
    hospital_name: 'LifeLink General Hospital',
    component_type: 'Packed Red Blood Cells',
    blood_group: 'O+',
    units_required: 5,
    urgency: 'CRITICAL',
    status: 'INVENTORY_SHORTAGE',
    created_at: t.requestCreated,
    required_by: requiredBy,
    expires_at: new Date(t.now + 6 * 60 * 60 * 1000).toISOString(),
    department: 'Trauma ICU (Bed 04)',
    hospital_department: 'Trauma ICU (Bed 04)',
    request_reason: 'Mass Casualty / Acute Trauma Haemorrhage',
    reason_category: 'Mass Casualty / Acute Trauma Haemorrhage',
    contact_person: 'Dr. Anita Desai (Emergency Chief)',
    contact_number: '+91 8647 222333',
    contact_phone: '+91 8647 222333',
    operational_notes:
      'Patient stabilized post-accident, active capillary bleed. Cross-match specimen sent to blood centre.',
    clinical_notes:
      'Patient stabilized post-accident, active capillary bleed. Cross-match specimen sent to blood centre.',
    units_fulfilled: 2,
    inventory_found_units: 3,
    inventory_reserved_units: 2,
    shortage_units: 2,
    donor_mobilisation_active: true,
    notified_donors_count: 12,
    accepted_donors_count: 2,
    arrived_donors_count: 1,
    completed_donations_count: 0,
  };
}

/** Backward-compatible alias (static timestamps). */
export const INITIAL_DEMO_REQUEST = buildSeedRequest(computeDynamicSeedTimes());

// Initial donor notifications for the demo request
export function buildSeedNotifications(t: SeedTimes): DonorNotification[] {
  const sentAt = new Date(t.now - 40 * 60_000).toISOString();
  return [
    {
      id: 'notif_001',
      request_id: 'LL-2026-000184',
      donor_id: 'dn_01_ravi',
      donor_name: 'DEMO_Ravi Kumar',
      blood_group: 'O+',
      distance_km: 2.3,
      tier: 1,
      notification_status: 'ARRIVED_AT_CENTRE',
      delivery_status: 'DELIVERED',
      sent_at: sentAt,
      responded_at: new Date(t.now - 36 * 60_000).toISOString(),
      blood_centre_id: 'bc_narasaraopet',
      blood_centre_name: 'Narasaraopet Blood Centre',
      selected_blood_centre_id: 'bc_narasaraopet',
      expected_arrival_time: '15 mins',
    },
    {
      id: 'notif_002',
      request_id: 'LL-2026-000184',
      donor_id: 'dn_02_priya',
      donor_name: 'DEMO_Priya Sharma',
      blood_group: 'O+',
      distance_km: 3.4,
      tier: 1,
      notification_status: 'ACCEPTED',
      delivery_status: 'DELIVERED',
      sent_at: sentAt,
      responded_at: new Date(t.now - 34 * 60_000).toISOString(),
      blood_centre_id: 'bc_narasaraopet',
      blood_centre_name: 'Narasaraopet Blood Centre',
      selected_blood_centre_id: 'bc_narasaraopet',
      expected_arrival_time: '25 mins',
    },
    {
      id: 'notif_003',
      request_id: 'LL-2026-000184',
      donor_id: 'dn_03_karthik',
      donor_name: 'DEMO_Karthik Reddy',
      blood_group: 'O+',
      distance_km: 4.1,
      tier: 1,
      notification_status: 'SENT',
      delivery_status: 'SENT',
      sent_at: sentAt,
      blood_centre_id: 'bc_narasaraopet',
      blood_centre_name: 'Narasaraopet Blood Centre',
      selected_blood_centre_id: null,
      expected_arrival_time: null,
    },
  ];
}

export function buildSeedDonationEvents(t: SeedTimes): DonationEvent[] {
  return [
    {
      id: 'don_evt_001',
      donor_id: 'dn_01_ravi',
      donor_name: 'Ravi Kumar',
      blood_centre_id: 'bc_narasaraopet',
      blood_centre_name: 'Narasaraopet Blood Centre',
      request_id: 'LL-2026-000184',
      collection_date: new Date(t.now - 15 * 60_000).toISOString(),
      donation_type: 'WHOLE_BLOOD',
      volume_ml: 450,
      screening_status: 'SCREENING_PASSED',
      testing_status: 'TESTING_PENDING',
      processing_status: 'PROCESSING_PENDING',
    },
  ];
}

// Initial audit trail events (§39, §45)
export function buildSeedAuditLogs(t: SeedTimes): AuditLog[] {
  return [
    {
      id: 'aud_001',
      actor_id: 'usr_hosp_1',
      actor_name: 'Dr. Anita Desai',
      actor_role: 'HOSPITAL_STAFF (REQUESTER)',
      entity_type: 'REQUEST',
      entity_id: 'LL-2026-000184',
      action: 'CREATED_EMERGENCY_REQUEST',
      timestamp: t.requestCreated,
      new_state: 'CREATED',
      metadata: { units_required: 5, blood_group: 'O+', component: 'Packed Red Blood Cells' },
    },
    {
      id: 'aud_002',
      actor_id: 'system',
      actor_name: 'LifeLink Core Engine',
      actor_role: 'SYSTEM',
      entity_type: 'REQUEST',
      entity_id: 'LL-2026-000184',
      action: 'INVENTORY_SEARCH_COMPLETED',
      timestamp: new Date(t.now - 41 * 60_000).toISOString(),
      previous_state: 'VALIDATING',
      new_state: 'INVENTORY_SHORTAGE',
      metadata: {
        required: 5,
        found_in_centres: 3,
        shortage: 2,
        centres: ['Narasaraopet Blood Centre (2)', 'Guntur Blood Centre (1)'],
      },
    },
    {
      id: 'aud_003',
      actor_id: 'system',
      actor_name: 'LifeLink Escalation Engine',
      actor_role: 'SYSTEM',
      entity_type: 'REQUEST',
      entity_id: 'LL-2026-000184',
      action: 'DONOR_MOBILISATION_TIER_1_ACTIVATED',
      timestamp: new Date(t.now - 40 * 60_000).toISOString(),
      previous_state: 'INVENTORY_SHORTAGE',
      new_state: 'DONORS_NOTIFIED',
      metadata: { tier: '1 (0-5 km)', donors_notified: 5, eligible_registered: 5 },
    },
    {
      id: 'aud_004',
      actor_id: 'usr_donor_ravi',
      actor_name: 'DEMO_Ravi Kumar (Donor)',
      actor_role: 'DONOR',
      entity_type: 'DONOR',
      entity_id: 'dn_01_ravi',
      action: 'DONOR_ACCEPTED_MOBILISATION',
      timestamp: new Date(t.now - 36 * 60_000).toISOString(),
      previous_state: 'NOTIFIED',
      new_state: 'DONOR_ACCEPTED',
      metadata: {
        request_id: 'LL-2026-000184',
        selected_centre: 'Narasaraopet Blood Centre',
        eta: '15 mins',
      },
    },
    {
      id: 'aud_005',
      actor_id: 'usr_donor_priya',
      actor_name: 'DEMO_Priya Sharma (Donor)',
      actor_role: 'DONOR',
      entity_type: 'DONOR',
      entity_id: 'dn_02_priya',
      action: 'DONOR_ACCEPTED_MOBILISATION',
      timestamp: new Date(t.now - 34 * 60_000).toISOString(),
      previous_state: 'NOTIFIED',
      new_state: 'DONOR_ACCEPTED',
      metadata: {
        request_id: 'LL-2026-000184',
        selected_centre: 'Narasaraopet Blood Centre',
        eta: '25 mins',
      },
    },
    {
      id: 'aud_006',
      actor_id: 'usr_bc_nara',
      actor_name: 'M. K. Rao',
      actor_role: 'BLOOD_CENTRE_STAFF',
      entity_type: 'DONOR',
      entity_id: 'dn_01_ravi',
      action: 'CONFIRMED_DONOR_ARRIVAL_AT_CENTRE',
      timestamp: new Date(t.now - 18 * 60_000).toISOString(),
      previous_state: 'DONOR_ACCEPTED',
      new_state: 'ARRIVED_AT_CENTRE',
      metadata: { request_id: 'LL-2026-000184', blood_centre: 'Narasaraopet Blood Centre' },
    },
  ];
}

/** Backward-compatible alias (static timestamps). */
export const INITIAL_AUDIT_LOGS = buildSeedAuditLogs(computeDynamicSeedTimes());

// ---- Short aliases used by the server-side seed --------------------------
export const SEED_BLOOD_CENTRES = buildSeedBloodCentres;
export const SEED_INVENTORY = buildSeedInventory;
export const SEED_INITIAL_REQUEST = buildSeedRequest;
export const SEED_NOTIFICATIONS = buildSeedNotifications;
export const SEED_DONATION_EVENTS = buildSeedDonationEvents;
export const SEED_AUDIT_LOGS = buildSeedAuditLogs;

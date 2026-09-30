import {
  BloodGroup,
  BloodComponentType,
  BloodInventory,
  BloodCentre,
  Donor,
  BloodRequest,
  RequestInventorySearchResult
} from '../types/lifelink';

export interface InventoryMatchResult {
  inventoryItem: BloodInventory;
  bloodCentre: BloodCentre | undefined;
  availableUnits: number;
  distanceKm: number;
  isStale: boolean;
  minutesSinceUpdate: number;
}

export interface InventorySearchResult {
  matches: InventoryMatchResult[];
  auditRecords: RequestInventorySearchResult[];
  totalAvailableUnits: number;
  shortageUnits: number;
  potentialFulfilledUnits: number;
  isSufficient: boolean;
  hasStaleInventoryWarning: boolean;
}

// Configurable thresholds stored in system_config (§45)
export const INVENTORY_FRESHNESS_THRESHOLD_MINUTES = 30;
export const INVENTORY_STALE_THRESHOLD_MINUTES = INVENTORY_FRESHNESS_THRESHOLD_MINUTES;
export const DUPLICATE_REQUEST_WINDOW_MINUTES = 30;
export const DONOR_NOTIFICATION_TIMEOUT_MINUTES = 7;
export const DONOR_RENOTIFICATION_QUIET_PERIOD_MINUTES = 60;

// Configurable donation interval rules (e-RaktKosh / Indian guidelines: male 90 days, female 120 days)
export const ELIGIBILITY_INTERVALS_DAYS = {
  MALE: 90,
  FEMALE: 120,
  OTHER: 90
};

/**
 * Inventory-First Search Engine
 * Adheres to Section 7, 8 & 12: Search verified blood centre inventory, detect staleness,
 * calculate available vs required, identify exact shortages, and generate audit records.
 */
export function searchInventory(
  bloodGroup: BloodGroup,
  componentType: BloodComponentType,
  unitsRequired: number,
  allInventory: BloodInventory[],
  allCentres: BloodCentre[],
  requestId?: string
): InventorySearchResult {
  const now = Date.now();
  const searchTimestamp = new Date().toISOString();
  const centreMap = new Map(allCentres.map(c => [c.id, c]));

  // Approximate distance lookup (based on hospital coordinates)
  const centreDistances: Record<string, number> = {
    bc_narasaraopet: 4.8,
    bc_guntur: 9.2,
  };

  const matches: InventoryMatchResult[] = [];
  const auditRecords: RequestInventorySearchResult[] = [];
  let totalAvailableUnits = 0;
  let hasStaleInventoryWarning = false;

  for (const item of allInventory) {
    if (
      item.blood_group === bloodGroup &&
      item.component_type === componentType &&
      item.inventory_status === 'AVAILABLE' &&
      item.screening_status === 'TESTED_CLEARED'
    ) {
      const centre = centreMap.get(item.blood_centre_id);
      const availableUnits = Math.max(0, item.units - item.reserved_units);
      
      const lastUpdatedMs = new Date(item.last_updated).getTime();
      const minutesSinceUpdate = Math.max(0, Math.floor((now - lastUpdatedMs) / (60 * 1000)));
      const isStale = minutesSinceUpdate >= INVENTORY_FRESHNESS_THRESHOLD_MINUTES;
      const distanceKm = centreDistances[item.blood_centre_id] || 10.0;

      if (isStale) {
        hasStaleInventoryWarning = true;
      }

      // Create audit log record for this search entry (§12, §45)
      auditRecords.push({
        id: 'srch_' + Math.random().toString(36).substring(2, 9),
        request_id: requestId || 'unassigned',
        inventory_id: item.id,
        blood_centre_id: item.blood_centre_id,
        units_found: availableUnits,
        distance_km: distanceKm,
        freshness_status: isStale ? 'STALE' : 'FRESH',
        search_timestamp: searchTimestamp
      });

      if (availableUnits > 0) {
        totalAvailableUnits += availableUnits;
        matches.push({
          inventoryItem: item,
          bloodCentre: centre,
          availableUnits,
          distanceKm,
          isStale,
          minutesSinceUpdate
        });
      }
    }
  }

  // Sort by distance (closest blood centre first)
  matches.sort((a, b) => a.distanceKm - b.distanceKm);

  const potentialFulfilledUnits = Math.min(unitsRequired, totalAvailableUnits);
  const shortageUnits = Math.max(0, unitsRequired - totalAvailableUnits);
  const isSufficient = shortageUnits === 0;

  return {
    matches,
    auditRecords,
    totalAvailableUnits,
    shortageUnits,
    potentialFulfilledUnits,
    isSufficient,
    hasStaleInventoryWarning
  };
}

/**
 * Donor Matching Engine (Section 12 & 13)
 * Primary filters: Blood group, availability, account_status = 'ACTIVE',
 * medical eligibility status (must not be deferred or rejected).
 * Radii tiers:
 * Tier 1: 0-5 km
 * Tier 2: 5-10 km
 * Tier 3: 10-20 km
 * Tier 4: 20+ km
 */
export function matchDonorsByTiers(
  bloodGroup: BloodGroup,
  donors: Donor[],
  targetTier: 1 | 2 | 3 | 4 = 1
): { tierDonors: Donor[]; allTiers: Record<1 | 2 | 3 | 4, Donor[]> } {
  const eligibleDonors = donors.filter(d => {
    const groupMatches = d.blood_group === bloodGroup;
    const isAvailable = d.availability;
    const isAccountActive = d.account_status === 'ACTIVE';
    // Must not be deferred or rejected
    const isNotMedicallyDeferred = 
      d.eligibility_status !== 'CENTRE_DEFERRED' && 
      d.eligibility_status !== 'CENTRE_REJECTED' &&
      d.eligibility_status !== 'TEMPORARILY_DEFERRED' &&
      d.eligibility_status !== 'PERMANENTLY_DEFERRED';

    return groupMatches && isAvailable && isAccountActive && isNotMedicallyDeferred;
  });

  const tiers: Record<1 | 2 | 3 | 4, Donor[]> = {
    1: [],
    2: [],
    3: [],
    4: []
  };

  for (const donor of eligibleDonors) {
    const dist = donor.approximate_distance_km;
    if (dist <= 5) {
      tiers[1].push(donor);
    } else if (dist <= 10) {
      tiers[2].push(donor);
    } else if (dist <= 20) {
      tiers[3].push(donor);
    } else {
      tiers[4].push(donor);
    }
  }

  return {
    tierDonors: tiers[targetTier],
    allTiers: tiers
  };
}

/**
 * Duplicate Request Detection (§11)
 * A request is flagged as a potential duplicate if the same hospital has an active
 * request (status not in a terminal state) for the same blood_group and component_type
 * submitted within the last DUPLICATE_REQUEST_WINDOW_MINUTES (default: 30).
 */
export function checkDuplicateRequest(
  hospitalId: string,
  bloodGroup: BloodGroup,
  componentType: BloodComponentType,
  existingRequests: BloodRequest[],
  windowMinutes: number = DUPLICATE_REQUEST_WINDOW_MINUTES
): { isDuplicate: boolean; existingRequest?: BloodRequest } {
  const windowMs = windowMinutes * 60 * 1000;
  const cutoffTime = Date.now() - windowMs;

  const found = existingRequests.find(r => 
    r.hospital_id === hospitalId &&
    r.blood_group === bloodGroup &&
    r.component_type === componentType &&
    r.status !== 'FULFILLED' &&
    r.status !== 'CANCELLED' &&
    r.status !== 'EXPIRED' &&
    r.status !== 'CLOSED_OTHER_REASON' &&
    new Date(r.created_at).getTime() > cutoffTime
  );

  return {
    isDuplicate: !!found,
    existingRequest: found
  };
}

/**
 * Check donor interval eligibility (§18)
 * Dynamic calculation based on gender/rules, clearly stating blood centre makes final decision.
 */
export function getDonorEligibilityAdvisory(donor: Donor): {
  isIntervalEligible: boolean;
  daysSinceLastDonation: number | null;
  requiredIntervalDays: number;
  message: string;
} {
  const interval = donor.gender === 'FEMALE' ? ELIGIBILITY_INTERVALS_DAYS.FEMALE : ELIGIBILITY_INTERVALS_DAYS.MALE;

  if (!donor.last_donation_date) {
    return {
      isIntervalEligible: true,
      daysSinceLastDonation: null,
      requiredIntervalDays: interval,
      message: 'First-time voluntary donor. Medical pre-screening and eligibility confirmation required at blood centre.'
    };
  }

  const lastDate = new Date(donor.last_donation_date).getTime();
  const diffDays = Math.floor((Date.now() - lastDate) / (1000 * 60 * 60 * 24));
  const isIntervalEligible = diffDays >= interval;

  return {
    isIntervalEligible,
    daysSinceLastDonation: diffDays,
    requiredIntervalDays: interval,
    message: isIntervalEligible
      ? `Interval advisory passed (${diffDays} days since last donation). Medical suitability will be confirmed by blood centre staff.`
      : `Interval advisory: ${diffDays}/${interval} days completed. Blood centre staff will review donation eligibility.`
  };
}

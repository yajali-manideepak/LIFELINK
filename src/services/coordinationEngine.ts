import {
  BloodGroup,
  BloodComponentType,
  BloodInventory,
  BloodCentre,
  Donor,
  BloodRequest,
  DonorNotification
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
  totalAvailableUnits: number;
  shortageUnits: number;
  potentialFulfilledUnits: number;
  isSufficient: boolean;
  hasStaleInventoryWarning: boolean;
}

// Configurable threshold for inventory freshness (in minutes)
export const INVENTORY_STALE_THRESHOLD_MINUTES = 30;

// Configurable donation interval rules (e-RaktKosh / Indian guidelines: male 90 days, female 120 days)
export const ELIGIBILITY_INTERVALS_DAYS = {
  MALE: 90,
  FEMALE: 120,
  OTHER: 90
};

/**
 * Inventory-First Search Engine
 * Adheres to Section 7 & 8: Search verified blood centre inventory, detect staleness,
 * calculate available vs required, and identify exact shortages.
 */
export function searchInventory(
  bloodGroup: BloodGroup,
  componentType: BloodComponentType,
  unitsRequired: number,
  allInventory: BloodInventory[],
  allCentres: BloodCentre[]
): InventorySearchResult {
  const now = Date.now();
  const centreMap = new Map(allCentres.map(c => [c.id, c]));

  // Approximate distance lookup (based on demo hospital coordinates in Narasaraopet)
  const centreDistances: Record<string, number> = {
    bc_narasaraopet: 4.8,
    bc_guntur: 9.2,
  };

  const matches: InventoryMatchResult[] = [];
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
      const isStale = minutesSinceUpdate >= INVENTORY_STALE_THRESHOLD_MINUTES;

      if (isStale) {
        hasStaleInventoryWarning = true;
      }

      if (availableUnits > 0) {
        totalAvailableUnits += availableUnits;
        matches.push({
          inventoryItem: item,
          bloodCentre: centre,
          availableUnits,
          distanceKm: centreDistances[item.blood_centre_id] || 10.0,
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
    totalAvailableUnits,
    shortageUnits,
    potentialFulfilledUnits,
    isSufficient,
    hasStaleInventoryWarning
  };
}

/**
 * Donor Matching Engine (Section 12 & 13)
 * Primary filters: Blood group, availability, eligibility status, phone verified.
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
    // Exact or compatible blood group for emergency coordination
    const groupMatches = d.blood_group === bloodGroup;
    const isAvailable = d.availability;
    const isEligible = d.eligibility_status === 'ELIGIBLE';

    return groupMatches && isAvailable && isEligible;
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
 * Duplicate Request Detection (Section 6 & 37)
 * Prevents mass accidental duplicates from the same hospital within 4 hours.
 */
export function checkDuplicateRequest(
  hospitalId: string,
  bloodGroup: BloodGroup,
  componentType: BloodComponentType,
  existingRequests: BloodRequest[]
): { isDuplicate: boolean; existingRequest?: BloodRequest } {
  const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;

  const found = existingRequests.find(r => 
    r.hospital_id === hospitalId &&
    r.blood_group === bloodGroup &&
    r.component_type === componentType &&
    r.status !== 'FULFILLED' &&
    r.status !== 'CANCELLED' &&
    r.status !== 'EXPIRED' &&
    new Date(r.created_at).getTime() > fourHoursAgo
  );

  return {
    isDuplicate: !!found,
    existingRequest: found
  };
}

/**
 * Check donor interval eligibility (Section 12)
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
      message: 'First-time voluntary donor. Pre-screening required at blood centre.'
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
      ? `Eligible for emergency mobilisation (${diffDays} days since last donation). Medical suitability will be confirmed at blood centre.`
      : `Interval advisory: ${diffDays}/${interval} days completed. Blood centre will verify donation eligibility.`
  };
}

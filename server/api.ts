import {
  BloodComponentType,
  BloodGroup,
  BloodInventory,
  BloodRequest,
  DonationEvent,
  DonorNotification,
  InventoryUnitStatus,
  UrgencyLevel,
} from '../src/types/lifelink';
import {
  checkDuplicateRequest,
  isTerminalRequestState,
  matchDonorsByTiers,
  searchInventory,
} from '../src/services/coordinationEngine';
import { LifeLinkStore } from './store';
import { generateRequestId, nowIso, uid } from './ids';

export interface ApiResult {
  ok: boolean;
  message?: string;
  error?: string;
  requestId?: string;
  /** §11 duplicate detection: warning only, never a block. */
  duplicateWarning?: boolean;
  state?: unknown;
}

const DEFAULT_CENTRE_ID = 'bc_narasaraopet';

/** Default mobilisation destination: nearest verified, active centre. */
function defaultCentreName(store: LifeLinkStore): { id: string; name: string } {
  const centre = store.getState().bloodCentres.find(
    b => b.id === DEFAULT_CENTRE_ID && b.operational_status === 'ACTIVE',
  ) || store.getState().bloodCentres.find(b => b.operational_status === 'ACTIVE');
  return { id: centre?.id ?? DEFAULT_CENTRE_ID, name: centre?.name ?? 'Authorised Blood Centre' };
}

function snapshot(store: LifeLinkStore) {
  return store.getState();
}

// --------------------------------------------------------------------------
// Hospital: create emergency request (§6, §7, §11)
// --------------------------------------------------------------------------

export function createEmergencyRequest(
  store: LifeLinkStore,
  payload: {
    blood_group: BloodGroup;
    component_type: BloodComponentType;
    units_required: number;
    urgency: UrgencyLevel;
    hospital_department: string;
    reason_category: string;
    contact_person: string;
    contact_phone: string;
    clinical_notes?: string;
    required_by: string;
  },
): ApiResult {
  // Validation guardrails (§6)
  if (!payload.units_required || payload.units_required <= 0 || payload.units_required > 20) {
    return { ok: false, error: 'Units required must be between 1 and 20 (single-order safety limit).' };
  }
  if (!payload.contact_phone || payload.contact_phone.trim().length < 8) {
    return { ok: false, error: 'A valid emergency contact phone is required.' };
  }

  const state = store.getState();
  const dupCheck = checkDuplicateRequest(
    'hosp_lifelink_gen',
    payload.blood_group,
    payload.component_type,
    state.requests,
  );

  const requestId = generateRequestId(state.requests.length);

  // Inventory-first search (§7) — audit snapshot rows (§12)
  const searchRes = searchInventory(
    payload.blood_group,
    payload.component_type,
    payload.units_required,
    state.inventory,
    state.bloodCentres,
    requestId,
  );
  store.addSearchResults(searchRes.auditRecords);
  store.pruneSearchResults();

  const initialStatus = searchRes.isSufficient
    ? 'INVENTORY_FOUND'
    : searchRes.totalAvailableUnits > 0
      ? 'INVENTORY_SHORTAGE'
      : 'DONOR_MOBILISATION';

  const request: BloodRequest = {
    id: requestId,
    hospital_id: 'hosp_lifelink_gen',
    hospital_name: 'LifeLink General Hospital',
    component_type: payload.component_type,
    blood_group: payload.blood_group,
    units_required: payload.units_required,
    urgency: payload.urgency,
    status: initialStatus,
    created_at: nowIso(),
    required_by: payload.required_by,
    expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    department: payload.hospital_department,
    hospital_department: payload.hospital_department,
    request_reason: payload.reason_category,
    reason_category: payload.reason_category,
    contact_person: payload.contact_person,
    contact_number: payload.contact_phone,
    contact_phone: payload.contact_phone,
    operational_notes: payload.clinical_notes,
    clinical_notes: payload.clinical_notes,
    inventory_found_units: searchRes.totalAvailableUnits,
    inventory_reserved_units: 0,
    units_fulfilled: 0,
    shortage_units: searchRes.shortageUnits,
    donor_mobilisation_active: searchRes.shortageUnits > 0,
    notified_donors_count: 0,
    accepted_donors_count: 0,
    arrived_donors_count: 0,
    completed_donations_count: 0,
  };
  store.addRequest(request);

  store.appendAudit({
    actor_id: 'usr_hosp_1',
    actor_name: payload.contact_person || 'Hospital Staff',
    actor_role: 'HOSPITAL_STAFF',
    entity_type: 'REQUEST',
    entity_id: requestId,
    action: 'CREATE_EMERGENCY_REQUEST',
    new_state: 'CREATED',
    metadata: {
      blood_group: payload.blood_group,
      component: payload.component_type,
      units: payload.units_required,
      department: payload.hospital_department,
      urgency: payload.urgency,
    },
  });

  store.appendAudit({
    actor_id: 'system',
    actor_name: 'LifeLink Coordination Engine',
    actor_role: 'SYSTEM',
    entity_type: 'REQUEST',
    entity_id: requestId,
    action: 'INVENTORY_SEARCH_COMPLETED',
    previous_state: 'VALIDATING',
    new_state: initialStatus,
    metadata: {
      total_found: searchRes.totalAvailableUnits,
      shortage: searchRes.shortageUnits,
      matching_centres: searchRes.matches.length,
      stale_inventory_warning: searchRes.hasStaleInventoryWarning,
    },
  });

  // Shortage decision workflow (§11): mobilise donors automatically
  if (searchRes.shortageUnits > 0) {
    triggerDonorMobilisation(store, requestId, payload.blood_group, 1);
  }

  return {
    ok: true,
    requestId,
    duplicateWarning: dupCheck.isDuplicate,
    message: dupCheck.isDuplicate
      ? `Request ${requestId} created. Note: a similar active request exists for this component and blood group (${searchRes.totalAvailableUnits} verified units located, shortage ${searchRes.shortageUnits}).`
      : `Request ${requestId} created. ${searchRes.totalAvailableUnits} verified units located, shortage ${searchRes.shortageUnits}.`,
    state: snapshot(store),
  };
}

// --------------------------------------------------------------------------
// Donor mobilisation engine (§13, §15)
// --------------------------------------------------------------------------

export function triggerDonorMobilisation(
  store: LifeLinkStore,
  requestId: string,
  bloodGroup: BloodGroup,
  tier: 1 | 2 | 3 | 4,
): number {
  const state = store.getState();

  // Escalation tier progression (§43): dispatch the closest tier first; if a
  // tier yields no candidates, escalate outward through the radius tiers.
  const tierLabel = (t: 1 | 2 | 3 | 4) =>
    t === 1 ? '0-5km' : t === 2 ? '5-10km' : t === 3 ? '10-20km' : '20+km';

  let selectedDonors: import('../src/types/lifelink').Donor[] = [];
  let dispatchedTier: 1 | 2 | 3 | 4 = tier;
  for (let t = tier as number; t <= 4 && selectedDonors.length === 0; t++) {
    const matched = matchDonorsByTiers(bloodGroup, state.donors, t as 1 | 2 | 3 | 4);
    selectedDonors = matched.tierDonors.slice(0, 5); // controlled escalation batch
    if (selectedDonors.length > 0) dispatchedTier = t as 1 | 2 | 3 | 4;
  }
  if (selectedDonors.length === 0) return 0;

  const centre = defaultCentreName(store);
  const notifications: DonorNotification[] = selectedDonors.map(d => ({
    id: uid('notif'),
    request_id: requestId,
    donor_id: d.id,
    donor_name: d.name,
    blood_group: d.blood_group,
    distance_km: d.approximate_distance_km,
    tier: dispatchedTier,
    notification_status: 'SENT',
    delivery_status: 'SENT',
    sent_at: nowIso(),
    blood_centre_id: centre.id,
    blood_centre_name: centre.name,
    selected_blood_centre_id: null,
    expected_arrival_time: null,
  }));
  store.addDonorNotifications(notifications);

  const request = store.getRequest(requestId);
  if (request) {
    store.updateRequest(requestId, {
      donor_mobilisation_active: true,
      notified_donors_count: request.notified_donors_count + selectedDonors.length,
      status: request.status === 'INVENTORY_SHORTAGE' ? 'DONORS_NOTIFIED' : request.status,
    });
  }

  store.appendAudit({
    actor_id: 'system',
    actor_name: 'LifeLink Mobilisation Engine',
    actor_role: 'SYSTEM',
    entity_type: 'REQUEST',
    entity_id: requestId,
    action: `DONOR_MOBILISATION_TIER_${dispatchedTier}_DISPATCHED`,
    new_state: 'DONORS_NOTIFIED',
    metadata: {
      donors_notified: selectedDonors.length,
      tier: `${dispatchedTier} (${tierLabel(dispatchedTier)})`,
      requested_tier: `${tier} (${tierLabel(tier)})`,
      escalated: dispatchedTier !== tier,
    },
  });

  return selectedDonors.length;
}

// --------------------------------------------------------------------------
// Hospital: cancel request (§30)
// --------------------------------------------------------------------------

export function cancelRequest(
  store: LifeLinkStore,
  requestId: string,
  reason: string,
  actorName = 'Hospital Coordinator',
): ApiResult {
  const request = store.getRequest(requestId);
  if (!request) return { ok: false, error: 'Request not found.' };
  if (isTerminalRequestState(request.status)) {
    return { ok: false, error: 'Request is already in a terminal state.' };
  }

  store.updateRequest(requestId, {
    status: 'CANCELLED_BY_HOSPITAL',
    closure_reason: reason,
    closed_by: actorName,
    closed_at: nowIso(),
    donor_mobilisation_active: false,
  });

  // Release all unissued soft-locks atomically (§30)
  const released = store.releaseAllReservationsForRequest(requestId, 'RESERVATION_CANCELLED');

  store.appendAudit({
    actor_id: 'hospital',
    actor_name: actorName,
    actor_role: 'HOSPITAL_STAFF',
    entity_type: 'REQUEST',
    entity_id: requestId,
    action: 'REQUEST_CANCELLED_BY_HOSPITAL',
    previous_state: request.status,
    new_state: 'CANCELLED_BY_HOSPITAL',
    metadata: { reason, closed_by: actorName, soft_locks_released_units: released },
  });

  return { ok: true, message: `Emergency request ${requestId} was cancelled.`, state: snapshot(store) };
}

// --------------------------------------------------------------------------
// Hospital: reserve inventory (§31, §32)
// --------------------------------------------------------------------------

export function reserveInventory(
  store: LifeLinkStore,
  inventoryId: string,
  requestId: string,
  units: number,
  actorName = 'Hospital Coordinator',
): ApiResult {
  const request = store.getRequest(requestId);
  if (!request) return { ok: false, error: 'Request not found.' };
  // §5: no new reservation may be created against a terminal request.
  if (isTerminalRequestState(request.status)) {
    return { ok: false, error: 'Request is in a terminal state; reservations are closed (§5).' };
  }
  if (request.units_required - request.units_fulfilled - request.inventory_reserved_units < units) {
    return {
      ok: false,
      error: `Only ${Math.max(0, request.units_required - request.units_fulfilled - request.inventory_reserved_units)} more unit(s) still needed for this request.`,
    };
  }

  const result = store.createReservation(request, inventoryId, units, actorName);
  if (!result.ok) {
    const message =
      result.reason === 'INSUFFICIENT_UNITS'
        ? 'Concurrency guard: insufficient unreserved units. Reservation rejected (INSUFFICIENT_UNITS).'
        : 'Inventory record not found.';
    return { ok: false, error: message };
  }

  store.updateRequest(requestId, {
    inventory_reserved_units: request.inventory_reserved_units + units,
    status: 'RESERVED',
  });

  return { ok: true, message: `${units} unit(s) reserved.`, state: snapshot(store) };
}

// --------------------------------------------------------------------------
// Donor: availability toggle (§4.2)
// --------------------------------------------------------------------------

export function toggleDonorAvailability(
  store: LifeLinkStore,
  donorId: string,
): ApiResult {
  const donor = store.getState().donors.find(d => d.id === donorId);
  if (!donor) return { ok: false, error: 'Donor not found.' };
  const updated = !donor.availability;
  store.updateDonor(donorId, { availability: updated });

  store.appendAudit({
    actor_id: donor.user_id,
    actor_name: donor.name,
    actor_role: 'DONOR',
    entity_type: 'DONOR',
    entity_id: donorId,
    action: 'DONOR_AVAILABILITY_TOGGLED',
    previous_state: donor.availability ? 'AVAILABLE' : 'OFFLINE',
    new_state: updated ? 'AVAILABLE' : 'OFFLINE',
  });

  return {
    ok: true,
    message: updated
      ? 'You are now marked Available for emergency requests.'
      : 'You are currently marked Unavailable.',
    state: snapshot(store),
  };
}

// --------------------------------------------------------------------------
// Donor: accept / decline mobilisation (§15)
// --------------------------------------------------------------------------

export function respondToDonorRequest(
  store: LifeLinkStore,
  notificationId: string,
  response: 'ACCEPT' | 'DECLINE',
  expectedArrivalMins = 20,
): ApiResult {
  const notification = store.getState().donorNotifications.find(n => n.id === notificationId);
  if (!notification) return { ok: false, error: 'Notification not found.' };

  if (response === 'ACCEPT') {
    store.updateDonorNotification(notificationId, {
      notification_status: 'ACCEPTED',
      responded_at: nowIso(),
      expected_arrival_time: `${expectedArrivalMins} mins`,
      selected_blood_centre_id: notification.blood_centre_id,
    });

    const request = store.getRequest(notification.request_id);
    if (request) {
      store.updateRequest(request.id, {
        accepted_donors_count: request.accepted_donors_count + 1,
        status: 'DONOR_ACCEPTED',
      });
    }

    store.appendAudit({
      actor_id: notification.donor_id,
      actor_name: notification.donor_name,
      actor_role: 'DONOR',
      entity_type: 'DONOR',
      entity_id: notification.donor_id,
      action: 'DONOR_ACCEPTED_MOBILISATION',
      previous_state: 'NOTIFIED',
      new_state: 'DONOR_ACCEPTED',
      metadata: {
        request_id: notification.request_id,
        centre: notification.blood_centre_name,
        eta: `${expectedArrivalMins} mins`,
      },
    });

    return {
      ok: true,
      message: `Willingness recorded. Please visit ${notification.blood_centre_name}. Medical screening will be conducted upon arrival.`,
      state: snapshot(store),
    };
  }

  store.updateDonorNotification(notificationId, {
    notification_status: 'DECLINED',
    responded_at: nowIso(),
  });

  store.appendAudit({
    actor_id: notification.donor_id,
    actor_name: notification.donor_name,
    actor_role: 'DONOR',
    entity_type: 'DONOR',
    entity_id: notification.donor_id,
    action: 'DONOR_DECLINED_MOBILISATION',
    previous_state: 'NOTIFIED',
    new_state: 'DECLINED',
    metadata: { request_id: notification.request_id },
  });

  return {
    ok: true,
    message: 'Thank you for updating your availability. You will not be contacted again for this emergency.',
    state: snapshot(store),
  };
}

// --------------------------------------------------------------------------
// Blood centre: confirm donor arrival (§20)
// --------------------------------------------------------------------------

export function confirmDonorArrival(
  store: LifeLinkStore,
  donorId: string,
  bloodCentreId: string,
  requestId: string,
  actorName = 'Blood Centre Staff',
): ApiResult {
  const notifications = store.getState().donorNotifications.filter(
    n => n.donor_id === donorId && n.request_id === requestId && n.notification_status !== 'ARRIVED_AT_CENTRE',
  );
  for (const n of notifications) {
    store.updateDonorNotification(n.id, { notification_status: 'ARRIVED_AT_CENTRE' });
  }

  const request = store.getRequest(requestId);
  if (request) {
    store.updateRequest(requestId, {
      arrived_donors_count: request.arrived_donors_count + 1,
      status: 'SCREENING_PENDING',
    });
  }

  store.appendAudit({
    actor_id: 'blood_centre',
    actor_name: actorName,
    actor_role: 'BLOOD_CENTRE_STAFF',
    entity_type: 'DONOR',
    entity_id: donorId,
    action: 'CONFIRMED_DONOR_ARRIVAL_AT_CENTRE',
    previous_state: 'DONOR_ACCEPTED',
    new_state: 'ARRIVED_AT_CENTRE',
    metadata: { request_id: requestId, blood_centre_id: bloodCentreId },
  });

  return {
    ok: true,
    message: 'Donor arrival confirmed. Pre-donation medical screening initiated.',
    state: snapshot(store),
  };
}

// --------------------------------------------------------------------------
// Blood centre: pre-screening assessment (§19) — deferral reasons are
// confidential and never surface to hospital requesters.
// --------------------------------------------------------------------------

export function recordDonorScreening(
  store: LifeLinkStore,
  donorId: string,
  bloodCentreId: string,
  requestId: string,
  outcome: 'PASSED' | 'DEFERRED' | 'REJECTED',
  vitals?: string,
  reason?: string,
  actorName = 'Blood Centre Medical Officer',
): ApiResult {
  const donor = store.getState().donors.find(d => d.id === donorId);
  const donorName = donor?.name ?? 'Voluntary Donor';
  const centreName = store.getState().bloodCentres.find(b => b.id === bloodCentreId)?.name ?? 'Authorised Blood Centre';

  if (outcome === 'PASSED') {
    const event: DonationEvent = {
      id: uid('don'),
      donor_id: donorId,
      donor_name: donorName,
      blood_centre_id: bloodCentreId,
      blood_centre_name: centreName,
      request_id: requestId,
      collection_date: nowIso(),
      donation_type: 'WHOLE_BLOOD',
      volume_ml: 450,
      screening_status: 'SCREENING_PASSED',
      testing_status: 'TESTING_PENDING',
      processing_status: 'PROCESSING_PENDING',
    };
    store.addDonationEvent(event);

    store.updateRequest(requestId, { status: 'DONATION_COMPLETED' });

    store.appendAudit({
      actor_id: 'blood_centre',
      actor_name: actorName,
      actor_role: 'BLOOD_CENTRE_STAFF',
      entity_type: 'DONOR',
      entity_id: donorId,
      action: 'DONOR_SCREENING_PASSED',
      previous_state: 'SCREENING_PENDING',
      new_state: 'SCREENING_PASSED',
      metadata: { request_id: requestId, blood_centre_id: bloodCentreId, vitals },
    });

    return {
      ok: true,
      message: `${donorName} passed donor medical assessment. Proceeding to collection.`,
      state: snapshot(store),
    };
  }

  // Deferred / rejected: update donor medical status (centre authority only)
  store.updateDonor(donorId, {
    eligibility_status: outcome === 'DEFERRED' ? 'CENTRE_DEFERRED' : 'CENTRE_REJECTED',
  });

  // Hospital view stays generic: mobilisation continues (privacy rule §19)
  store.updateRequest(requestId, { status: 'DONOR_MOBILISATION' });

  store.appendAudit({
    actor_id: 'blood_centre',
    actor_name: actorName,
    actor_role: 'BLOOD_CENTRE_STAFF',
    entity_type: 'DONOR',
    entity_id: donorId,
    action: 'DONOR_SCREENING_DEFERRED',
    previous_state: 'SCREENING_PENDING',
    new_state: outcome === 'DEFERRED' ? 'SCREENING_DEFERRED' : 'SCREENING_REJECTED',
    metadata: {
      request_id: requestId,
      blood_centre_id: bloodCentreId,
      // Confidential: retained for centre audit only, never exposed to hospitals.
      deferral_reason: reason ?? 'Clinical assessment',
    },
  });

  return {
    ok: true,
    message: 'Donor assessed as not eligible. Privacy protected: hospital notified that mobilisation continues.',
    state: snapshot(store),
  };
}

// --------------------------------------------------------------------------
// Blood centre: record collection (§21)
// --------------------------------------------------------------------------

export function recordDonationCollection(
  store: LifeLinkStore,
  donationEventId: string,
  volumeMl: number,
  donationType: DonationEvent['donation_type'],
  actorName = 'Blood Centre Staff',
): ApiResult {
  const event = store.getState().donationEvents.find(e => e.id === donationEventId);
  if (!event) return { ok: false, error: 'Donation event not found.' };

  store.updateDonationEvent(donationEventId, {
    volume_ml: volumeMl,
    donation_type: donationType,
    completed_at: nowIso(),
    testing_status: 'TESTING_PENDING',
  });

  const request = store.getRequest(event.request_id);
  if (request) {
    store.updateRequest(request.id, {
      completed_donations_count: request.completed_donations_count + 1,
      status: 'TESTING_PENDING',
    });
  }

  store.appendAudit({
    actor_id: 'blood_centre',
    actor_name: actorName,
    actor_role: 'BLOOD_CENTRE_STAFF',
    entity_type: 'DONATION',
    entity_id: donationEventId,
    action: 'DONATION_COLLECTED',
    previous_state: 'IN_PROGRESS',
    new_state: 'TESTING_PENDING',
    metadata: { request_id: event.request_id, volume_ml: volumeMl, donation_type: donationType },
  });

  return {
    ok: true,
    message: `${volumeMl}ml collected. DGHS mandatory 5-infection testing & processing pending.`,
    state: snapshot(store),
  };
}

// --------------------------------------------------------------------------
// Blood centre: record collection by donor (§21)
// --------------------------------------------------------------------------

export function recordDonationCollectionByDonor(
  store: LifeLinkStore,
  donorId: string,
  bloodCentreId: string,
  requestId: string,
  volumeMl: number,
  donationType: DonationEvent['donation_type'],
  actorName = 'Blood Centre Staff',
): ApiResult {
  const events = store.getState().donationEvents;
  const existing = events.find(
    e => e.donor_id === donorId && e.request_id === requestId && e.testing_status === 'TESTING_PENDING',
  );

  let donationEventId: string;
  if (existing) {
    donationEventId = existing.id;
  } else {
    const donor = store.getState().donors.find(d => d.id === donorId);
    const centreName =
      store.getState().bloodCentres.find(b => b.id === bloodCentreId)?.name ?? 'Authorised Blood Centre';
    donationEventId = uid('don');
    store.addDonationEvent({
      id: donationEventId,
      donor_id: donorId,
      donor_name: donor?.name ?? 'Voluntary Donor',
      blood_centre_id: bloodCentreId,
      blood_centre_name: centreName,
      request_id: requestId,
      collection_date: nowIso(),
      donation_type: donationType,
      volume_ml: volumeMl,
      screening_status: 'SCREENING_PASSED',
      testing_status: 'TESTING_PENDING',
      processing_status: 'PROCESSING_PENDING',
    });
  }

  return recordDonationCollection(store, donationEventId, volumeMl, donationType, actorName);
}

// --------------------------------------------------------------------------
// Blood centre: TTI testing + component creation (§22–§26)
// --------------------------------------------------------------------------

const SHELF_LIFE_DAYS: Partial<Record<BloodComponentType, number>> = {
  Platelets: 5,
  'Fresh Frozen Plasma': 365,
  Cryoprecipitate: 365,
  'Packed Red Blood Cells': 42,
  'Whole Blood': 35,
};

function storageConditionFor(component: BloodComponentType): string {
  if (component === 'Platelets') return '20°C to 24°C with continuous flat-bed agitation';
  if (component === 'Fresh Frozen Plasma' || component === 'Cryoprecipitate') return '-30°C or colder (Ultra-low Deep Freezer)';
  return '2°C to 6°C (Refrigerated Blood Bank Refrigerator)';
}

export function processTestingAndInventory(
  store: LifeLinkStore,
  donationEventId: string,
  testResult: 'CLEARED' | 'REACTIVE',
  componentCreated: BloodComponentType,
  unitsCreated: number,
  donorBloodGroup: BloodGroup = 'O+',
  actorName = 'Blood Centre Quality Officer',
): ApiResult {
  const event = store.getState().donationEvents.find(e => e.id === donationEventId);
  if (!event) return { ok: false, error: 'Donation event not found.' };

  if (testResult === 'CLEARED') {
    const daysValid = SHELF_LIFE_DAYS[componentCreated] ?? 35;
    const newItem: BloodInventory = {
      id: uid('inv'),
      blood_centre_id: event.blood_centre_id,
      blood_centre_name: event.blood_centre_name,
      component_type: componentCreated,
      blood_group: donorBloodGroup,
      units: unitsCreated,
      reserved_units: 0,
      version: 1,
      collection_date: nowIso(),
      expiry_date: new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString(),
      storage_condition: storageConditionFor(componentCreated),
      screening_status: 'TESTED_CLEARED',
      inventory_status: 'AVAILABLE',
      last_updated: nowIso(),
    };
    store.addInventoryItem(newItem);

    store.updateDonationEvent(donationEventId, {
      testing_status: 'CLEARED_FOR_NEXT_STAGE',
      processing_status: 'PROCESSED',
      component_created: componentCreated,
      component_units: unitsCreated,
      release_status: 'RELEASED',
    });

    const request = store.getRequest(event.request_id);
    if (request) {
      store.updateRequest(request.id, {
        inventory_found_units: request.inventory_found_units + unitsCreated,
        shortage_units: Math.max(0, request.shortage_units - unitsCreated),
        status: 'INVENTORY_UPDATED',
      });
    }

    store.appendAudit({
      actor_id: 'blood_centre',
      actor_name: actorName,
      actor_role: 'BLOOD_CENTRE_STAFF',
      entity_type: 'INVENTORY',
      entity_id: newItem.id,
      action: 'TESTING_CLEARED_INVENTORY_CREATED',
      previous_state: 'TESTING',
      new_state: 'AVAILABLE',
      metadata: {
        donation_event_id: donationEventId,
        component: componentCreated,
        units: unitsCreated,
        shelf_life_days: daysValid,
        dghs_screening: 'Non-reactive for HIV, HBV, HCV, Syphilis, Malaria',
      },
    });

    return {
      ok: true,
      message: `${unitsCreated} unit(s) of ${componentCreated} cleared and added to authoritative stock.`,
      state: snapshot(store),
    };
  }

  // Reactive: quarantine protocol (§23)
  store.updateDonationEvent(donationEventId, {
    testing_status: 'REACTIVE_OR_NOT_USABLE',
    release_status: 'QUARANTINED',
  });

  store.appendAudit({
    actor_id: 'blood_centre',
    actor_name: actorName,
    actor_role: 'BLOOD_CENTRE_STAFF',
    entity_type: 'DONATION',
    entity_id: donationEventId,
    action: 'TESTING_NOT_USABLE_UNIT_QUARANTINED',
    previous_state: 'TESTING',
    new_state: 'REACTIVE_OR_NOT_USABLE',
    metadata: { reason: 'Unit quarantined per bio-safety protocols' },
  });

  return {
    ok: true,
    message: 'Screening test reactive. Unit cannot be issued per DGHS standards.',
    state: snapshot(store),
  };
}

// --------------------------------------------------------------------------
// Blood centre: inventory status changes (§26, §27)
// --------------------------------------------------------------------------

export function updateInventoryStatus(
  store: LifeLinkStore,
  inventoryId: string,
  status: InventoryUnitStatus,
  notes?: string,
  actorName = 'Blood Centre Staff',
): ApiResult {
  const item = store.getInventory(inventoryId);
  if (!item) return { ok: false, error: 'Inventory record not found.' };

  store.updateInventoryItem(inventoryId, { inventory_status: status });

  store.appendAudit({
    actor_id: 'blood_centre',
    actor_name: actorName,
    actor_role: 'BLOOD_CENTRE_STAFF',
    entity_type: 'INVENTORY',
    entity_id: inventoryId,
    action: 'INVENTORY_STATUS_CHANGED',
    previous_state: item.inventory_status,
    new_state: status,
    metadata: { notes },
  });

  return { ok: true, message: `Unit status set to ${status}.`, state: snapshot(store) };
}

// --------------------------------------------------------------------------
// Blood centre: fulfil emergency units (§28, §31, §33)
// --------------------------------------------------------------------------

export function fulfilEmergencyUnits(
  store: LifeLinkStore,
  requestId: string,
  units: number,
  actorName = 'Blood Centre Staff',
): ApiResult {
  const result = store.fulfilUnitsForRequest(requestId, units, actorName);
  if (!result.ok) return { ok: false, error: result.message };
  return { ok: true, message: result.message, state: snapshot(store) };
}

// --------------------------------------------------------------------------
// Guided simulation (Section 59) — server-driven steps
// --------------------------------------------------------------------------

export function runSimulationStep(store: LifeLinkStore, step: number): ApiResult {
  const REQUEST_ID = 'LL-2026-000184';
  const request = store.getRequest(REQUEST_ID);
  if (!request) return { ok: false, error: 'Demo request not found.' };

  const patch = (p: Partial<BloodRequest>) => store.updateRequest(REQUEST_ID, p);
  const audit = (action: string, entityType: 'REQUEST' | 'INVENTORY' | 'DONOR' | 'DONATION' | 'SYSTEM',
                 entityId: string, newState: string, metadata?: Record<string, unknown>,
                 actorName = 'LifeLink Coordination Engine') =>
    store.appendAudit({
      actor_id: 'system',
      actor_name: actorName,
      actor_role: 'SYSTEM',
      entity_type: entityType,
      entity_id: entityId,
      action,
      new_state: newState,
      metadata,
    });

  switch (step) {
    case 0:
      patch({
        status: 'CREATED', units_fulfilled: 0, inventory_reserved_units: 0,
        inventory_found_units: 0, shortage_units: 5, donor_mobilisation_active: false,
      });
      audit('SCENARIO_STEP_0_REQUEST_CREATED', 'REQUEST', REQUEST_ID, 'CREATED');
      break;
    case 1:
      patch({ status: 'INVENTORY_SHORTAGE', inventory_found_units: 3, shortage_units: 2, donor_mobilisation_active: false });
      audit('SCENARIO_STEP_1_INVENTORY_CHECKED', 'REQUEST', REQUEST_ID, 'INVENTORY_SHORTAGE', { available: 3, shortage: 2 });
      break;
    case 2:
      patch({ status: 'DONORS_NOTIFIED', donor_mobilisation_active: true, notified_donors_count: 5 });
      audit('SCENARIO_STEP_2_DONORS_NOTIFIED', 'REQUEST', REQUEST_ID, 'DONORS_NOTIFIED', { tier: '1 (0-5 km)', donors_notified: 5 });
      break;
    case 3: {
      for (const n of store.getState().donorNotifications) {
        if (n.donor_id === 'dn_01_ravi' || n.donor_id === 'dn_02_priya') {
          store.updateDonorNotification(n.id, { notification_status: 'ACCEPTED', responded_at: nowIso() });
        }
      }
      patch({ status: 'DONOR_ACCEPTED', accepted_donors_count: 2 });
      audit('SCENARIO_STEP_3_DONOR_ACCEPTED', 'REQUEST', REQUEST_ID, 'DONOR_ACCEPTED', { accepted_donors: ['Ravi Kumar', 'Priya Sharma'] });
      break;
    }
    case 4: {
      for (const n of store.getState().donorNotifications) {
        if (n.donor_id === 'dn_01_ravi') store.updateDonorNotification(n.id, { notification_status: 'ARRIVED_AT_CENTRE' });
      }
      patch({ status: 'DONOR_ARRIVED', arrived_donors_count: 1 });
      audit('SCENARIO_STEP_4_DONOR_ARRIVED', 'REQUEST', REQUEST_ID, 'DONOR_ARRIVED', { donor: 'Ravi Kumar', centre: 'Narasaraopet Blood Centre' });
      break;
    }
    case 5:
      patch({ status: 'SCREENING_PENDING' });
      audit('SCENARIO_STEP_5_SCREENING_PASSED', 'DONOR', 'dn_01_ravi', 'SCREENING_PASSED', { vitals: 'Hb 14.1 g/dL, BP 122/82, Weight 70 kg' }, 'Blood Centre Medical Officer');
      break;
    case 6:
      patch({ status: 'DONATION_COMPLETED', completed_donations_count: 1 });
      audit('SCENARIO_STEP_6_DONATION_COLLECTED', 'DONATION', 'dn_01_ravi', 'DONATION_COMPLETED', { volume: '450 ml Whole Blood' });
      break;
    case 7:
      patch({ status: 'TESTING_PENDING' });
      audit('SCENARIO_STEP_7_TESTING_CLEARED', 'DONATION', 'don_evt_001', 'PROCESSED', { testing: 'All 5 DGHS markers non-reactive', component: 'Packed Red Blood Cells (PRBC)' });
      break;
    case 8:
      patch({ status: 'INVENTORY_UPDATED', inventory_found_units: 4, shortage_units: 1 });
      audit('SCENARIO_STEP_8_INVENTORY_UPDATED', 'INVENTORY', 'inv_new_sim', 'AVAILABLE', { new_unit: 'O+ PRBC (1 unit, 42-day shelf life at 2-6°C)' });
      break;
    case 9:
      patch({
        status: 'FULFILMENT_CONFIRMED_BY_CENTRE', units_fulfilled: 5,
        inventory_reserved_units: 5, shortage_units: 0,
      });
      audit('SCENARIO_STEP_9_REQUEST_FULFILLED', 'REQUEST', REQUEST_ID, 'FULFILMENT_CONFIRMED_BY_CENTRE', { total_coordinated: '5 units O+ PRBC delivered to LifeLink General Hospital' });
      break;
    default:
      return { ok: false, error: `Unknown simulation step ${step}.` };
  }

  return { ok: true, message: `Simulation step ${step} applied.`, state: snapshot(store) };
}

// --------------------------------------------------------------------------
// Reset to seed
// --------------------------------------------------------------------------

export function resetToSeed(store: LifeLinkStore): ApiResult {
  store.resetToSeed();
  return { ok: true, message: 'Demo state reset to seed.', state: snapshot(store) };
}

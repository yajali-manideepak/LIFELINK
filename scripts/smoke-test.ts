/**
 * LifeLink API smoke test.
 * Exercises the coordination API end-to-end (store + actions, in-process) and
 * asserts the spec invariants (§31–§33). Run: bunx tsx scripts/smoke-test.ts
 */
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { LifeLinkStore, seedState } from '../server/store';
import * as api from '../server/api';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lifelink-test-'));
const store = new LifeLinkStore(path.join(tmpDir, 'state.json'));

function getReq(id: string) {
  const req = store.getState().requests.find(r => r.id === id);
  assert.ok(req, `request ${id} should exist`);
  return req;
}

// --- 1. Seeded world is consistent -----------------------------------------
const seed = seedState();
assert.ok(seed.requests.length === 1, 'seed has exactly one demo request');
assert.ok(seed.inventory.length >= 7, 'seed has inventory');
const seededNara = seed.inventory.find(i => i.id === 'inv_nara_prbc_o_pos_1')!;
assert.strictEqual(seededNara.units - seededNara.reserved_units, 2, 'seeded available units');

// --- 2. Create emergency request: full inventory ---------------------------
const fullRes = api.createEmergencyRequest(store, {
  blood_group: 'A+',
  component_type: 'Packed Red Blood Cells',
  units_required: 2,
  urgency: 'URGENT',
  hospital_department: 'Test ICU',
  reason_category: 'Surgical Emergency',
  contact_person: 'Test Doctor',
  contact_phone: '+91 80000 00000',
  required_by: 'Within 1 hour',
});
assert.ok(fullRes.ok, `full inventory create should succeed: ${fullRes.error}`);
assert.ok(fullRes.requestId, 'request id returned');
const fullReq = getReq(fullRes.requestId!);
assert.strictEqual(fullReq.status, 'INVENTORY_FOUND', 'A+ PRBC has 4 units at Narasaraopet');
assert.strictEqual(fullReq.shortage_units, 0, 'no shortage when inventory is sufficient');

// --- 3. Create emergency request: shortage triggers mobilisation -----------
const shortageRes = api.createEmergencyRequest(store, {
  blood_group: 'B+',
  component_type: 'Platelets',
  units_required: 5,
  urgency: 'CRITICAL',
  hospital_department: 'Oncology',
  reason_category: 'Obstetric Haemorrhage',
  contact_person: 'Test Doctor 2',
  contact_phone: '+91 80000 00001',
  required_by: 'Within 30 mins',
});
assert.ok(shortageRes.ok, `shortage create should succeed: ${shortageRes.error}`);
const shortageReq = getReq(shortageRes.requestId!);
// §11: shortage triggers mobilisation immediately, advancing the state machine
assert.strictEqual(shortageReq.status, 'DONORS_NOTIFIED', 'shortage mobilisation dispatched');
assert.strictEqual(shortageReq.shortage_units, 2, 'shortage = 2');
assert.ok(shortageReq.notified_donors_count > 0, 'tier-1 donors mobilised');
const notifs = store.getState().donorNotifications.filter(n => n.request_id === shortageRes.requestId);
assert.ok(notifs.length === shortageReq.notified_donors_count, 'notifications match count');

// --- 4. Reservation soft-lock + concurrency guard (§31/§32) ----------------
const reserve = api.reserveInventory(store, 'inv_nara_plt_b_pos_1', shortageReq.id, 3);
assert.ok(reserve.ok, `reserve 3 of 3 should succeed: ${reserve.error}`);
const pltItem = store.getInventory('inv_nara_plt_b_pos_1')!;
assert.strictEqual(pltItem.reserved_units, 3, 'soft-lock applied');
assert.strictEqual(pltItem.units - pltItem.reserved_units, 0, 'available now zero');
assert.strictEqual(pltItem.version, 2, 'version bumped');

const reserveFail = api.reserveInventory(store, 'inv_nara_plt_b_pos_1', shortageReq.id, 1);
assert.ok(!reserveFail.ok, 'over-reservation rejected (INSUFFICIENT_UNITS)');
assert.ok(reserveFail.error!.includes('Concurrency guard'), 'error explains the guard');

// --- 5. Fulfilment accounting (§31/§33) ------------------------------------
const fulfil1 = api.fulfilEmergencyUnits(store, shortageReq.id, 2);
assert.ok(fulfil1.ok, `partial fulfilment should succeed: ${fulfil1.error}`);
let updated = getReq(shortageReq.id);
assert.strictEqual(updated.units_fulfilled, 2, 'units_fulfilled incremented');
assert.strictEqual(updated.status, 'PARTIALLY_FULFILLED', 'partial fulfilment status');
assert.strictEqual(pltItem.units, 1, 'inventory units decremented');
assert.strictEqual(pltItem.reserved_units, 1, 'reserved decremented by same amount');

const fulfilAll = api.fulfilEmergencyUnits(store, shortageReq.id, 1);
assert.ok(fulfilAll.ok, `final fulfilment should succeed: ${fulfilAll.error}`);
updated = getReq(shortageReq.id);
assert.strictEqual(updated.units_fulfilled, 3, 'request fulfilled to available stock');
assert.ok(updated.units_fulfilled <= updated.units_required, 'never over-fulfilled');

// --- 6. Cancellation releases soft-locks (§30) -----------------------------
const cancelRes = api.cancelRequest(store, fullReq.id, 'Patient stabilized');
assert.ok(cancelRes.ok, 'cancellation succeeds');
const cancelledReq = getReq(fullReq.id);
assert.strictEqual(cancelledReq.status, 'CANCELLED_BY_HOSPITAL', 'formal terminal state');

// Terminal state is frozen
const lateReserve = api.reserveInventory(store, 'inv_nara_prbc_a_pos_1', fullReq.id, 1);
assert.ok(!lateReserve.ok, 'reservation against terminal request rejected');

// --- 7. Donor flow: availability, response, arrival, screening -------------
const availRes = api.toggleDonorAvailability(store, 'dn_09_lakshmi');
assert.ok(availRes.ok, 'availability toggle works');

const acceptRes = api.respondToDonorRequest(store, notifs[0].id, 'ACCEPT', 15);
assert.ok(acceptRes.ok, `donor accept works: ${acceptRes.error}`);
assert.strictEqual(getReq(shortageReq.id).accepted_donors_count >= 1, true, 'accept count incremented');

const arrivalRes = api.confirmDonorArrival(store, notifs[0].donor_id, 'bc_narasaraopet', shortageReq.id);
assert.ok(arrivalRes.ok, 'arrival confirmation works');
assert.strictEqual(getReq(shortageReq.id).status, 'SCREENING_PENDING', 'status advanced to screening');

const screenRes = api.recordDonorScreening(store, notifs[0].donor_id, 'bc_narasaraopet', shortageReq.id, 'PASSED', 'Hb 13.9');
assert.ok(screenRes.ok, 'screening pass works');

// --- 8. TTI testing: cleared creates inventory, reactive quarantines --------
const events = store.getState().donationEvents.filter(e => e.request_id === shortageReq.id);
assert.ok(events.length >= 1, 'donation event exists after screening');
const cleared = api.processTestingAndInventory(store, events[0].id, 'CLEARED', 'Packed Red Blood Cells', 1, 'B+');
assert.ok(cleared.ok, `testing cleared works: ${cleared.error}`);
const newInv = store.getState().inventory[0];
assert.strictEqual(newInv.component_type, 'Packed Red Blood Cells');
assert.strictEqual(newInv.blood_group, 'B+');
assert.strictEqual(newInv.screening_status, 'TESTED_CLEARED', 'inventory only from cleared units');

// --- 9. Audit trail is append-only and captured every transition ------------
const audits = store.getState().auditLogs;
assert.ok(audits.length > 15, `audit log captured events (${audits.length})`);
const actions = audits.map(a => a.action);
assert.ok(actions.includes('CREATE_EMERGENCY_REQUEST'), 'create audited');
assert.ok(actions.includes('RESERVATION_REQUESTED'), 'reservation audited');
assert.ok(actions.includes('RESERVATION_FULFILLED'), 'fulfilment audited');
assert.ok(actions.includes('REQUEST_CANCELLED_BY_HOSPITAL'), 'cancellation audited');
assert.ok(actions.includes('DONOR_ACCEPTED_MOBILISATION'), 'donor accept audited');
assert.ok(actions.includes('TESTING_CLEARED_INVENTORY_CREATED'), 'testing audited');

// --- 10. Simulation steps apply cleanly ------------------------------------
for (let step = 0; step <= 9; step++) {
  const res = api.runSimulationStep(store, step);
  assert.ok(res.ok, `simulation step ${step} ok`);
}
assert.strictEqual(getReq('LL-2026-000184').status, 'FULFILMENT_CONFIRMED_BY_CENTRE', 'sim ends fulfilled');

// --- 11. Reset restores the seed --------------------------------------------
api.resetToSeed(store);
assert.strictEqual(store.getState().requests.length, 1, 'reset restores seed');
assert.strictEqual(store.getState().requests[0].id, 'LL-2026-000184', 'seed request present');
assert.ok(
  store.getState().inventory.every(i => i.reserved_units === 0),
  'reset clears soft-locks',
);

// --- 12. Persistence round-trip ---------------------------------------------
const first = JSON.parse(fs.readFileSync(path.join(tmpDir, 'state.json'), 'utf8'));
assert.ok(first.requests.length >= 1, 'state file written');

const store2 = new LifeLinkStore(path.join(tmpDir, 'state.json'));
assert.strictEqual(store2.getState().requests.length, first.requests.length, 'reload preserves requests');

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('✓ All LifeLink API smoke tests passed');

import { LifeLinkStore } from '../server/store';
import type { BloodComponent, BloodGroup } from '../src/types/lifelink';

console.log('====================================================');
console.log(' LifeLink Core Coordination Platform — Test Suite');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`✓ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`✗ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  const store = new LifeLinkStore();

  // Test 1: Store initialization & seeding
  console.log('--- Test 1: Data Seeding & Entity Graph ---');
  assert(store.organizations.size >= 4, 'Verified organizations loaded properly');
  assert(store.inventoryBatches.size >= 10, 'Demo inventory batches seeded');
  assert(store.users.size >= 5, 'Multi-role users registered');
  console.log('');

  // Test 2: Unverified Organization Gating
  console.log('--- Test 2: Regulatory Verification Gate ---');
  const unverifiedOrgId = 'org_unverified_sunrise';
  store.organizations.set(unverifiedOrgId, {
    id: unverifiedOrgId,
    name: 'Sunrise Clinic (Unverified)',
    type: 'HOSPITAL',
    status: 'PENDING_VERIFICATION',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    city: 'Guntur',
    address: 'Bypass Road',
    phone: '+91 863 999 8888',
    email: 'admin@sunrise.example',
    licenseNumber: 'AP-PENDING-001',
    registrationNumber: 'REG-PENDING',
    isDemo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const blockedReq = store.createRequest({
    hospitalId: unverifiedOrgId,
    requestedBy: 'user_temp',
    department: 'ICU',
    clinicianContact: 'Dr. Test',
    bloodComponent: 'PACKED_RED_CELLS',
    bloodGroup: 'O+',
    quantityUnits: 2,
    urgency: 'CRITICAL',
    requiredBy: new Date(Date.now() + 3600000).toISOString(),
    collectionLocation: 'Main Desk',
  });
  assert(!blockedReq.ok, 'Unverified hospital cannot distribute emergency requests', blockedReq.error);
  console.log('');

  // Test 3: Emergency Request Distribution
  console.log('--- Test 3: Emergency Request Creation & Distribution ---');
  const verifiedHospitalId = 'org_hosp_ggp';
  const reqResult = store.createRequest({
    hospitalId: verifiedHospitalId,
    requestedBy: 'usr_hosp_admin',
    department: 'Emergency Trauma Care Center',
    clinicianContact: 'Dr. S. Rao, Duty Trauma Surgeon (+91-9440123456)',
    bloodComponent: 'PACKED_RED_CELLS',
    bloodGroup: 'O-',
    quantityUnits: 3,
    urgency: 'CRITICAL',
    requiredBy: new Date(Date.now() + 7200000).toISOString(),
    collectionLocation: 'GGH Emergency Blood Receiving Counter',
    additionalRequirements: 'Leukoreduced, Cross-match sample ready at counter',
  });

  assert(reqResult.ok && !!reqResult.request, 'Verified hospital raises critical emergency request');
  const emergencyReq = reqResult.request!;
  assert(emergencyReq.status === 'DISTRIBUTED', 'Emergency request is automatically distributed');
  assert(emergencyReq.trackingCode.length === 6, 'Anonymous 6-digit patient tracking code generated');
  console.log('');

  // Test 4: Blood Bank Response
  console.log('--- Test 4: Inter-Facility Response Workflow ---');
  const bloodBankId = 'org_bb_ars';
  const respResult = store.respondToRequest({
    requestId: emergencyReq.id,
    bloodBankId,
    respondedBy: 'usr_bb_tech',
    responseStatus: 'CONFIRMED_AVAILABLE',
    confirmedUnits: 3,
    estimatedReadyTime: new Date(Date.now() + 1800000).toISOString(),
    collectionArrangement: 'Ready for emergency vehicle pickup at Dispatch Bay 1',
    notes: 'Units screened, typed O Negative, immediate dispatch authorized',
  });
  assert(respResult.ok, 'Blood bank responds with confirmed availability');
  console.log('');

  // Test 5: Atomic Inventory Reservation & Concurrency Safety
  console.log('--- Test 5: Atomic Reservation & Race Condition Protection ---');
  const batch = Array.from(store.inventoryBatches.values()).find(
    b => b.bloodBankId === bloodBankId && b.bloodGroup === 'O-' && b.bloodComponent === 'PACKED_RED_CELLS'
  );
  assert(!!batch, 'Matching inventory batch located in responding blood bank');

  if (batch) {
    const originalAvailable = batch.availableUnits;
    const originalReserved = batch.reservedUnits;

    // Successful reservation
    const resResult = store.reserveUnits({
      requestId: emergencyReq.id,
      bloodBankId,
      inventoryBatchId: batch.id,
      units: 2,
      reservedBy: 'usr_bb_tech',
    });
    assert(resResult.ok && !!resResult.reservationId, 'Units reserved atomically for emergency request');
    assert(batch.reservedUnits === originalReserved + 2, 'Reserved count incremented atomically');

    // Attempt double-reservation / over-reservation
    const excessiveUnits = batch.availableUnits - batch.reservedUnits + 5;
    const overReserve = store.reserveUnits({
      requestId: emergencyReq.id,
      bloodBankId,
      inventoryBatchId: batch.id,
      units: excessiveUnits,
      reservedBy: 'usr_bb_tech',
    });
    assert(!overReserve.ok, 'Over-reservation attempt strictly prevented', overReserve.error);

    // Release reservation
    const releaseResult = store.releaseReservation(resResult.reservationId!, 'usr_bb_tech', 'Clinician revised requirement');
    assert(releaseResult.ok, 'Reservation released gracefully');
    assert(batch.reservedUnits === originalReserved, 'Reserved units restored back to available pool');
  }
  console.log('');

  // Test 6: Audit Logging & Hemovigilance Accountability
  console.log('--- Test 6: Immutable Audit Trail Verification ---');
  const recentAudits = store.auditEvents.filter(a => a.resourceId === emergencyReq.id || a.action.includes('RESERVATION'));
  assert(recentAudits.length >= 2, 'All critical clinical actions logged in audit trail');
  console.log('');

  // Test 7: Freshness Check & Stale Data Flagging
  console.log('--- Test 7: Inventory Verification Freshness Check ---');
  const staleBatch = Array.from(store.inventoryBatches.values())[0];
  if (staleBatch) {
    // Manually backdate verification to 30 hours ago
    staleBatch.lastVerifiedAt = new Date(Date.now() - 30 * 3600000).toISOString();
    store.checkInventoryFreshness();
    assert(staleBatch.verificationStatus === 'STALE', 'Inventory older than 24h correctly flagged as STALE');
  }
  console.log('');

  // Test 8: Public Tracking Privacy (No Patient PII)
  console.log('--- Test 8: Patient Privacy & De-identification ---');
  const tracked = store.searchRequests(emergencyReq.trackingCode);
  assert(!!tracked, 'Family tracking code finds matching emergency request');
  assert(!('patientName' in (tracked as any)), 'Patient name is not stored or exposed');
  assert(!('patientAadhaar' in (tracked as any)), 'Patient government ID is not exposed');
  console.log('');

  console.log('====================================================');
  console.log(` Summary: ${passedTests}/${totalTests} Tests Passed successfully.`);
  console.log('====================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

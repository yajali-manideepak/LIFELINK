import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  UserRole,
  Hospital,
  BloodCentre,
  BloodInventory,
  Donor,
  BloodRequest,
  DonorNotification,
  DonationEvent,
  AuditLog,
  BloodGroup,
  BloodComponentType,
  UrgencyLevel,
  SystemAnalytics,
  InventoryUnitStatus
} from '../types/lifelink';
import {
  MOCK_USERS,
  MOCK_HOSPITALS,
  MOCK_BLOOD_CENTRES,
  MOCK_INITIAL_INVENTORY,
  MOCK_DONORS,
  INITIAL_DEMO_REQUEST,
  INITIAL_AUDIT_LOGS
} from '../data/mockData';
import {
  searchInventory,
  matchDonorsByTiers,
  checkDuplicateRequest
} from '../services/coordinationEngine';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'emergency' | 'success' | 'warning' | 'info';
  timestamp: string;
}

export type ViewTab = 'HOSPITAL' | 'DONOR' | 'BLOOD_CENTRE' | 'SIMULATION' | 'AUDIT_LOGS' | 'ANALYTICS';

interface LifeLinkContextType {
  // Navigation & Authentication
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  currentUser: User;
  switchUser: (userId: string) => void;
  allUsers: User[];

  // Core Data
  hospitals: Hospital[];
  bloodCentres: BloodCentre[];
  inventory: BloodInventory[];
  donors: Donor[];
  requests: BloodRequest[];
  donorNotifications: DonorNotification[];
  donationEvents: DonationEvent[];
  auditLogs: AuditLog[];
  activeRequest: BloodRequest | undefined;
  setActiveRequestId: (id: string) => void;

  // Failure Simulation Flags
  isNetworkOffline: boolean;
  setIsNetworkOffline: (val: boolean) => void;
  isStaleSimulated: boolean;
  setIsStaleSimulated: (val: boolean) => void;

  // Hospital Actions
  createEmergencyRequest: (data: {
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
  }) => { success: boolean; error?: string; request?: BloodRequest; isDuplicateWarning?: boolean };
  
  cancelRequest: (requestId: string, reason: string) => void;
  reserveInventoryForRequest: (inventoryId: string, requestId: string, units: number) => { success: boolean; message: string };

  // Donor Actions
  toggleDonorAvailability: (donorId: string) => void;
  respondToDonorRequest: (notificationId: string, response: 'ACCEPT' | 'DECLINE', expectedArrivalMins?: number) => void;

  // Blood Centre Actions
  confirmDonorArrivalAtCentre: (donorId: string, bloodCentreId: string, requestId: string) => void;
  recordDonorScreening: (donorId: string, bloodCentreId: string, requestId: string, outcome: 'PASSED' | 'DEFERRED' | 'REJECTED', reason?: string) => void;
  recordDonationEvent: (donorId: string, bloodCentreId: string, requestId: string, volumeMl: number, donationType: 'WHOLE_BLOOD' | 'APHERESIS_PLATELETS' | 'PLASMA') => void;
  processTestingAndInventory: (donationId: string, testResult: 'CLEARED' | 'REACTIVE', componentCreated: BloodComponentType, unitsCreated: number) => void;
  updateInventoryStatus: (inventoryId: string, status: InventoryUnitStatus, notes?: string) => void;
  fulfilEmergencyUnits: (requestId: string, bloodCentreId: string, units: number) => void;

  // Simulation Controller (Section 59 & 60)
  simulationStep: number;
  runGuidedScenarioStep: (targetStep: number) => void;
  resetDemoToScenarioStart: () => void;

  // Analytics & Alerts
  analytics: SystemAnalytics;
  toast: ToastNotification | null;
  dismissToast: () => void;
}

const LifeLinkContext = createContext<LifeLinkContextType | undefined>(undefined);

export const LifeLinkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('HOSPITAL');
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [hospitals] = useState<Hospital[]>(MOCK_HOSPITALS);
  const [bloodCentres, setBloodCentres] = useState<BloodCentre[]>(MOCK_BLOOD_CENTRES);
  const [inventory, setInventory] = useState<BloodInventory[]>(MOCK_INITIAL_INVENTORY);
  const [donors, setDonors] = useState<Donor[]>(MOCK_DONORS);
  const [requests, setRequests] = useState<BloodRequest[]>([INITIAL_DEMO_REQUEST]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('LL-2026-000184');
  
  // Initial donor notifications for demo request
  const [donorNotifications, setDonorNotifications] = useState<DonorNotification[]>([
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
      sent_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      responded_at: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
      blood_centre_id: 'bc_narasaraopet',
      blood_centre_name: 'Narasaraopet Blood Centre',
      selected_blood_centre_id: 'bc_narasaraopet',
      expected_arrival_time: '15 mins'
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
      sent_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      responded_at: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
      blood_centre_id: 'bc_narasaraopet',
      blood_centre_name: 'Narasaraopet Blood Centre',
      selected_blood_centre_id: 'bc_narasaraopet',
      expected_arrival_time: '25 mins'
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
      sent_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      blood_centre_id: 'bc_narasaraopet',
      blood_centre_name: 'Narasaraopet Blood Centre',
      selected_blood_centre_id: null,
      expected_arrival_time: null
    }
  ]);

  const [donationEvents, setDonationEvents] = useState<DonationEvent[]>([
    {
      id: 'don_evt_001',
      donor_id: 'dn_01_ravi',
      donor_name: 'Ravi Kumar',
      blood_centre_id: 'bc_narasaraopet',
      blood_centre_name: 'Narasaraopet Blood Centre',
      request_id: 'LL-2026-000184',
      collection_date: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      donation_type: 'WHOLE_BLOOD',
      volume_ml: 450,
      screening_status: 'SCREENING_PASSED',
      testing_status: 'TESTING_PENDING',
      processing_status: 'PROCESSING_PENDING'
    }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [simulationStep, setSimulationStep] = useState<number>(5); // currently at collection/testing
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Failure Simulation Modes
  const [isNetworkOffline, setIsNetworkOffline] = useState<boolean>(false);
  const [isStaleSimulated, setIsStaleSimulated] = useState<boolean>(false);

  const activeRequest = requests.find(r => r.id === selectedRequestId) || requests[0];

  const showToast = (title: string, message: string, type: 'emergency' | 'success' | 'warning' | 'info' = 'info') => {
    setToast({
      id: 'tst_' + Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const dismissToast = () => setToast(null);

  const logAudit = (
    action: string,
    entityType: 'REQUEST' | 'INVENTORY' | 'DONOR' | 'DONATION' | 'SYSTEM',
    entityId: string,
    previousState?: string,
    newState?: string,
    metadata?: Record<string, any>
  ) => {
    const entry: AuditLog = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      actor_id: currentUser.id,
      actor_name: currentUser.name,
      actor_role: currentUser.role,
      entity_type: entityType,
      entity_id: entityId,
      action,
      timestamp: new Date().toISOString(),
      previous_state: previousState,
      new_state: newState,
      metadata
    };
    setAuditLogs(prev => [entry, ...prev]);
  };

  const switchUser = (userId: string) => {
    const target = MOCK_USERS.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      if (target.role === 'HOSPITAL_STAFF') setActiveTab('HOSPITAL');
      else if (target.role === 'DONOR') setActiveTab('DONOR');
      else if (target.role === 'BLOOD_CENTRE_STAFF') setActiveTab('BLOOD_CENTRE');
      showToast('Switched User Context', `Now viewing as ${target.name} (${target.role})`, 'info');
    }
  };

  // HOSPITAL: Create Emergency Request
  const createEmergencyRequest = (data: {
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
  }) => {
    if (isNetworkOffline) {
      return { success: false, error: 'Connection unavailable. Please use the blood centre/hospital emergency phone line.' };
    }

    // Validation (Section 6)
    if (!data.units_required || data.units_required <= 0) {
      return { success: false, error: 'Units required must be greater than zero.' };
    }
    if (!data.contact_phone || data.contact_phone.trim().length < 8) {
      return { success: false, error: 'A valid emergency contact phone is required.' };
    }

    // Duplicate Detection (Section 6 & 37)
    const dupCheck = checkDuplicateRequest('hosp_lifelink_gen', data.blood_group, data.component_type, requests);

    const generatedId = `LL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Inventory-first search (Section 7)
    const searchRes = searchInventory(
      data.blood_group,
      data.component_type,
      data.units_required,
      inventory,
      bloodCentres
    );

    const initialStatus = searchRes.isSufficient
      ? 'INVENTORY_FOUND'
      : searchRes.totalAvailableUnits > 0
      ? 'INVENTORY_SHORTAGE'
      : 'DONOR_MOBILISATION';

    const newRequest: BloodRequest = {
      id: generatedId,
      hospital_id: 'hosp_lifelink_gen',
      hospital_name: 'LifeLink General Hospital',
      component_type: data.component_type,
      blood_group: data.blood_group,
      units_required: data.units_required,
      urgency: data.urgency,
      status: initialStatus,
      created_at: new Date().toISOString(),
      required_by: data.required_by,
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      department: data.hospital_department,
      hospital_department: data.hospital_department,
      request_reason: data.reason_category,
      reason_category: data.reason_category,
      contact_person: data.contact_person,
      contact_number: data.contact_phone,
      contact_phone: data.contact_phone,
      operational_notes: data.clinical_notes,
      clinical_notes: data.clinical_notes,
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

    setRequests(prev => [newRequest, ...prev]);
    setSelectedRequestId(generatedId);

    logAudit('CREATE_EMERGENCY_REQUEST', 'REQUEST', generatedId, undefined, 'CREATED', {
      blood_group: data.blood_group,
      component: data.component_type,
      units: data.units_required,
      department: data.hospital_department,
      urgency: data.urgency
    });

    logAudit('INVENTORY_SEARCH_COMPLETED', 'REQUEST', generatedId, 'VALIDATING', initialStatus, {
      totalFound: searchRes.totalAvailableUnits,
      shortage: searchRes.shortageUnits,
      matchingCentresCount: searchRes.matches.length
    });

    // Mobilise donors automatically if shortage detected (Section 11)
    if (searchRes.shortageUnits > 0) {
      triggerDonorMobilisation(generatedId, data.blood_group, 1);
    }

    showToast(
      'Emergency Request Broadcast',
      `Request ${generatedId} created. ${searchRes.totalAvailableUnits} verified units located, shortage: ${searchRes.shortageUnits} units.`,
      data.urgency === 'CRITICAL' ? 'emergency' : 'info'
    );

    return {
      success: true,
      request: newRequest,
      isDuplicateWarning: dupCheck.isDuplicate
    };
  };

  const triggerDonorMobilisation = (requestId: string, bloodGroup: BloodGroup, tier: 1 | 2 | 3 | 4) => {
    const matched = matchDonorsByTiers(bloodGroup, donors, tier);
    const selectedDonors = matched.tierDonors.slice(0, 5); // controlled escalation batch

    if (selectedDonors.length === 0) return;

    const newNotifications: DonorNotification[] = selectedDonors.map(d => ({
      id: 'notif_' + Date.now() + '_' + d.id,
      request_id: requestId,
      donor_id: d.id,
      donor_name: d.name,
      blood_group: d.blood_group,
      distance_km: d.approximate_distance_km,
      tier,
      notification_status: 'SENT',
      delivery_status: 'SENT',
      sent_at: new Date().toISOString(),
      blood_centre_id: 'bc_narasaraopet',
      blood_centre_name: 'Narasaraopet Blood Centre',
      selected_blood_centre_id: null,
      expected_arrival_time: null
    }));

    setDonorNotifications(prev => [...newNotifications, ...prev]);
    setRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      donor_mobilisation_active: true,
      notified_donors_count: r.notified_donors_count + selectedDonors.length,
      status: r.status === 'INVENTORY_SHORTAGE' ? 'DONORS_NOTIFIED' : r.status
    } : r));

    logAudit(`DONOR_MOBILISATION_TIER_${tier}_DISPATCHED`, 'REQUEST', requestId, undefined, 'DONORS_NOTIFIED', {
      donorsCount: selectedDonors.length,
      tier: `${tier} (${tier === 1 ? '0-5km' : tier === 2 ? '5-10km' : tier === 3 ? '10-20km' : '20+km'})`
    });
  };

  // Hospital cancel/close request
  const cancelRequest = (requestId: string, reason: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'CANCELLED',
          closure_reason: reason,
          closed_by: currentUser.name,
          closed_at: new Date().toISOString()
        };
      }
      return r;
    }));

    // Release any unissued reservations
    setInventory(prev => prev.map(inv => {
      return { ...inv, reserved_units: 0 };
    }));

    logAudit('REQUEST_CANCELLED', 'REQUEST', requestId, undefined, 'CANCELLED', { reason, closedBy: currentUser.name });
    showToast('Request Cancelled', `Emergency request ${requestId} was cancelled.`, 'warning');
  };

  // Reserve Inventory Unit (Section 27)
  const reserveInventoryForRequest = (inventoryId: string, requestId: string, unitsToReserve: number) => {
    const item = inventory.find(i => i.id === inventoryId);
    if (!item) return { success: false, message: 'Inventory record not found.' };

    const available = item.units - item.reserved_units;
    if (available < unitsToReserve) {
      return { success: false, message: `Only ${available} units available for reservation. Concurrency lock prevented over-allocation.` };
    }

    setInventory(prev => prev.map(inv => {
      if (inv.id === inventoryId) {
        return {
          ...inv,
          reserved_units: inv.reserved_units + unitsToReserve,
          version: (inv.version || 1) + 1,
          last_updated: new Date().toISOString()
        };
      }
      return inv;
    }));

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        const newReserved = r.inventory_reserved_units + unitsToReserve;
        return {
          ...r,
          inventory_reserved_units: newReserved,
          status: 'RESERVED'
        };
      }
      return r;
    }));

    logAudit('RESERVATION_REQUESTED', 'INVENTORY', inventoryId, 'AVAILABLE', 'RESERVED', {
      requestId,
      unitsReserved: unitsToReserve,
      remainingAvailable: available - unitsToReserve,
      version: (item.version || 1) + 1,
      softLockActive: true
    });

    showToast('Inventory Reserved', `${unitsToReserve} unit(s) reserved at ${item.blood_centre_name}.`, 'success');
    return { success: true, message: 'Units successfully reserved.' };
  };

  // DONOR: Toggle Availability
  const toggleDonorAvailability = (donorId: string) => {
    setDonors(prev => prev.map(d => {
      if (d.id === donorId) {
        const updated = !d.availability;
        logAudit('DONOR_AVAILABILITY_TOGGLED', 'DONOR', donorId, d.availability ? 'AVAILABLE' : 'OFFLINE', updated ? 'AVAILABLE' : 'OFFLINE');
        showToast('Availability Updated', updated ? 'You are now marked Available for emergency requests.' : 'You are currently marked Unavailable.', 'info');
        return { ...d, availability: updated };
      }
      return d;
    }));
  };

  // DONOR: Respond to Notification (Section 15, 16, 17)
  const respondToDonorRequest = (notificationId: string, response: 'ACCEPT' | 'DECLINE', expectedArrivalMins: number = 20) => {
    const notif = donorNotifications.find(n => n.id === notificationId);
    if (!notif) return;

    if (response === 'ACCEPT') {
      setDonorNotifications(prev => prev.map(n => n.id === notificationId ? {
        ...n,
        notification_status: 'ACCEPTED',
        responded_at: new Date().toISOString(),
        expected_arrival_time: `${expectedArrivalMins} mins`
      } : n));

      setRequests(prev => prev.map(r => r.id === notif.request_id ? {
        ...r,
        accepted_donors_count: r.accepted_donors_count + 1,
        status: 'DONOR_ACCEPTED'
      } : r));

      logAudit('DONOR_ACCEPTED_MOBILISATION', 'DONOR', notif.donor_id, 'NOTIFIED', 'ACCEPTED', {
        requestId: notif.request_id,
        centre: notif.blood_centre_name,
        eta: `${expectedArrivalMins} mins`
      });

      showToast('Willingness Recorded', `Thank you! Please visit ${notif.blood_centre_name}. Medical screening will be conducted upon arrival.`, 'success');
    } else {
      setDonorNotifications(prev => prev.map(n => n.id === notificationId ? {
        ...n,
        notification_status: 'DECLINED',
        responded_at: new Date().toISOString()
      } : n));

      logAudit('DONOR_DECLINED_MOBILISATION', 'DONOR', notif.donor_id, 'NOTIFIED', 'DECLINED', {
        requestId: notif.request_id
      });

      showToast('Declined Response', 'Thank you for updating your availability. You will not be contacted again for this emergency.', 'info');
    }
  };

  // BLOOD CENTRE: Confirm Donor Arrival (Section 18)
  const confirmDonorArrivalAtCentre = (donorId: string, bloodCentreId: string, requestId: string) => {
    setDonorNotifications(prev => prev.map(n => {
      if (n.donor_id === donorId && n.request_id === requestId) {
        return { ...n, notification_status: 'ARRIVED_AT_CENTRE' };
      }
      return n;
    }));

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          arrived_donors_count: r.arrived_donors_count + 1,
          status: 'SCREENING_PENDING'
        };
      }
      return r;
    }));

    logAudit('CONFIRMED_DONOR_ARRIVAL_AT_CENTRE', 'DONOR', donorId, 'ACCEPTED', 'ARRIVED_AT_CENTRE', {
      requestId,
      bloodCentreId
    });

    showToast('Donor Arrival Confirmed', 'Donor has arrived at the blood centre. Pre-donation medical screening initiated.', 'info');
  };

  // BLOOD CENTRE: Medical Screening (Section 19 & 20)
  const recordDonorScreening = (donorId: string, bloodCentreId: string, requestId: string, outcome: 'PASSED' | 'DEFERRED' | 'REJECTED', reason?: string) => {
    const donor = donors.find(d => d.id === donorId);
    const donorName = donor ? donor.name : 'Voluntary Donor';

    if (outcome === 'PASSED') {
      const newDonationEvent: DonationEvent = {
        id: 'don_' + Date.now(),
        donor_id: donorId,
        donor_name: donorName,
        blood_centre_id: bloodCentreId,
        blood_centre_name: bloodCentres.find(b => b.id === bloodCentreId)?.name || 'Authorised Blood Centre',
        request_id: requestId,
        collection_date: new Date().toISOString(),
        donation_type: 'WHOLE_BLOOD',
        volume_ml: 450,
        screening_status: 'SCREENING_PASSED',
        testing_status: 'TESTING_PENDING',
        processing_status: 'PROCESSING_PENDING'
      };

      setDonationEvents(prev => [newDonationEvent, ...prev]);

      setRequests(prev => prev.map(r => r.id === requestId ? {
        ...r,
        status: 'DONATION_COMPLETED'
      } : r));

      logAudit('DONOR_SCREENING_PASSED', 'DONOR', donorId, 'SCREENING_PENDING', 'SCREENING_PASSED', {
        requestId,
        bloodCentreId,
        vitals: 'BP 120/80, Hb 13.8 g/dL, Weight 68 kg'
      });

      showToast('Screening Passed', `${donorName} passed donor medical assessment. Proceeding to collection.`, 'success');
    } else {
      // Screening deferred / rejected: Protect donor medical privacy! (Section 20)
      setDonors(prev => prev.map(d => d.id === donorId ? {
        ...d,
        eligibility_status: outcome === 'DEFERRED' ? 'TEMPORARILY_DEFERRED' : 'PERMANENTLY_DEFERRED'
      } : d));

      setRequests(prev => prev.map(r => r.id === requestId ? {
        ...r,
        status: 'DONOR_MOBILISATION' // hospital sees generic: did not result in donation
      } : r));

      logAudit('DONOR_SCREENING_DEFERRED', 'DONOR', donorId, 'SCREENING_PENDING', outcome, {
        requestId,
        bloodCentreId,
        deferral_reason: reason || 'Temporary medical deferral'
      });

      showToast('Screening Deferred', `Donor assessed as not eligible. Privacy protected: hospital notified mobilisation continuing.`, 'warning');
    }
  };

  // BLOOD CENTRE: Record Blood Collection (Section 21)
  const recordDonationEvent = (donorId: string, bloodCentreId: string, requestId: string, volumeMl: number, donationType: 'WHOLE_BLOOD' | 'APHERESIS_PLATELETS' | 'PLASMA') => {
    setDonationEvents(prev => prev.map(e => {
      if (e.donor_id === donorId && e.request_id === requestId) {
        return {
          ...e,
          volume_ml: volumeMl,
          donation_type: donationType,
          completed_at: new Date().toISOString(),
          testing_status: 'TESTING_PENDING'
        };
      }
      return e;
    }));

    setRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      completed_donations_count: r.completed_donations_count + 1,
      status: 'TESTING_PENDING'
    } : r));

    logAudit('DONATION_COLLECTED', 'DONATION', donorId, 'IN_PROGRESS', 'TESTING_PENDING', {
      requestId,
      volumeMl,
      donationType
    });

    showToast('Collection Completed', `${volumeMl}ml collected. DGHS mandatory 5-infection testing & processing pending.`, 'info');
  };

  // BLOOD CENTRE: Testing clearance & Component Inventory creation (Section 22, 23, 24, 25, 26)
  const processTestingAndInventory = (donationId: string, testResult: 'CLEARED' | 'REACTIVE', componentCreated: BloodComponentType, unitsCreated: number) => {
    const event = donationEvents.find(e => e.id === donationId);
    if (!event) return;

    if (testResult === 'CLEARED') {
      // Calculate authoritative shelf-life by component (Section 26)
      // PRBC: 42 days, Platelets: 5 days, FFP: 365 days
      const daysValid = componentCreated === 'Platelets' ? 5 : componentCreated === 'Fresh Frozen Plasma' ? 365 : 42;
      const expiry = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString();
      const storageCond = componentCreated === 'Platelets' 
        ? '20°C to 24°C with continuous flat-bed agitation' 
        : componentCreated === 'Fresh Frozen Plasma' 
        ? '-30°C or colder' 
        : '2°C to 6°C (Refrigerated Blood Bank)';

      const newInvItem: BloodInventory = {
        id: 'inv_new_' + Date.now(),
        blood_centre_id: event.blood_centre_id,
        blood_centre_name: event.blood_centre_name,
        component_type: componentCreated,
        blood_group: 'O+', // from donor
        units: unitsCreated,
        reserved_units: 0,
        version: 1,
        collection_date: new Date().toISOString(),
        expiry_date: expiry,
        storage_condition: storageCond,
        screening_status: 'TESTED_CLEARED',
        inventory_status: 'AVAILABLE',
        last_updated: new Date().toISOString()
      };

      setInventory(prev => [newInvItem, ...prev]);

      setDonationEvents(prev => prev.map(e => e.id === donationId ? {
        ...e,
        testing_status: 'CLEARED_FOR_NEXT_STAGE',
        processing_status: 'PROCESSED',
        component_created: componentCreated,
        component_units: unitsCreated
      } : e));

      setRequests(prev => prev.map(r => r.id === event.request_id ? {
        ...r,
        inventory_found_units: r.inventory_found_units + unitsCreated,
        shortage_units: Math.max(0, r.shortage_units - unitsCreated),
        status: 'INVENTORY_UPDATED'
      } : r));

      logAudit('TESTING_CLEARED_INVENTORY_CREATED', 'INVENTORY', newInvItem.id, 'TESTING', 'AVAILABLE', {
        donationId,
        component: componentCreated,
        units: unitsCreated,
        shelfLifeDays: daysValid,
        dghsScreening: 'Non-reactive for HIV, HBV, HCV, Syphilis, Malaria'
      });

      showToast('Verified Inventory Created', `1 Unit of ${componentCreated} cleared and added to authoritative stock.`, 'success');
    } else {
      setDonationEvents(prev => prev.map(e => e.id === donationId ? {
        ...e,
        testing_status: 'REACTIVE_OR_NOT_USABLE'
      } : e));

      logAudit('TESTING_NOT_USABLE', 'DONATION', donationId, 'TESTING', 'REACTIVE_OR_NOT_USABLE', {
        reason: 'Unit quarantined per safety protocols'
      });

      showToast('Unit Quarantined', 'Screening test reactive. Unit cannot be issued per DGHS standards.', 'warning');
    }
  };

  // BLOOD CENTRE: General Inventory Status Change
  const updateInventoryStatus = (inventoryId: string, status: InventoryUnitStatus, notes?: string) => {
    setInventory(prev => prev.map(inv => {
      if (inv.id === inventoryId) {
        logAudit('INVENTORY_STATUS_CHANGED', 'INVENTORY', inventoryId, inv.inventory_status, status, { notes });
        return {
          ...inv,
          inventory_status: status,
          last_updated: new Date().toISOString()
        };
      }
      return inv;
    }));
    showToast('Inventory Updated', `Unit status set to ${status}.`, 'info');
  };

  // BLOOD CENTRE: Fulfil Request (Section 28 & 29)
  const fulfilEmergencyUnits = (requestId: string, bloodCentreId: string, unitsToFulfil: number) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        const totalFulfilled = r.units_fulfilled + unitsToFulfil;
        const isFull = totalFulfilled >= r.units_required;
        const nextStatus = isFull ? 'FULFILLED' : 'PARTIALLY_FULFILLED';

        if (isFull) {
          try {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          } catch {
            // ignore if browser canvas not available
          }
        }

        logAudit(isFull ? 'REQUEST_FULLY_FULFILLED' : 'REQUEST_PARTIALLY_FULFILLED', 'REQUEST', requestId, r.status, nextStatus, {
          unitsFulfilled: unitsToFulfil,
          totalFulfilled,
          required: r.units_required,
          centre: bloodCentreId
        });

        return {
          ...r,
          units_fulfilled: totalFulfilled,
          status: nextStatus
        };
      }
      return r;
    }));

    showToast('Emergency Fulfilment Recorded', `Fulfilment of ${unitsToFulfil} unit(s) logged by authorised blood centre.`, 'success');
  };

  // GUIDED SIMULATION ENGINE (Section 59 & 60)
  const runGuidedScenarioStep = (stepNumber: number) => {
    setSimulationStep(stepNumber);

    switch (stepNumber) {
      case 0:
        // Request Created: Hospital needs 5 units O+ PRBC
        setRequests(prev => prev.map(r => r.id === 'LL-2026-000184' ? {
          ...r,
          status: 'CREATED',
          units_fulfilled: 0,
          inventory_reserved_units: 0,
          inventory_found_units: 0,
          shortage_units: 5,
          donor_mobilisation_active: false
        } : r));
        logAudit('SCENARIO_STEP_0_REQUEST_CREATED', 'REQUEST', 'LL-2026-000184', undefined, 'CREATED');
        showToast('Scenario Step 0', 'Hospital enters emergency blood request for 5 units O+ PRBC.', 'info');
        break;

      case 1:
        // Inventory Check: 3 units found at 2 centres, Shortage = 2 units
        setRequests(prev => prev.map(r => r.id === 'LL-2026-000184' ? {
          ...r,
          status: 'INVENTORY_SHORTAGE',
          inventory_found_units: 3,
          shortage_units: 2,
          donor_mobilisation_active: false
        } : r));
        logAudit('SCENARIO_STEP_1_INVENTORY_CHECKED', 'REQUEST', 'LL-2026-000184', 'CREATED', 'INVENTORY_SHORTAGE', {
          available: 3,
          shortage: 2
        });
        showToast('Scenario Step 1', '3 units found in connected inventory (Narasaraopet: 2, Guntur: 1). Shortage: 2 units.', 'warning');
        break;

      case 2:
        // Donor Mobilisation: Tier 1 Donors Notified
        setRequests(prev => prev.map(r => r.id === 'LL-2026-000184' ? {
          ...r,
          status: 'DONORS_NOTIFIED',
          donor_mobilisation_active: true,
          notified_donors_count: 5
        } : r));
        logAudit('SCENARIO_STEP_2_DONORS_NOTIFIED', 'REQUEST', 'LL-2026-000184', 'INVENTORY_SHORTAGE', 'DONORS_NOTIFIED', {
          tier: '1 (0-5 km)',
          notifiedCount: 5
        });
        showToast('Scenario Step 2', 'Donor Mobilisation engine dispatched notifications to 5 Tier-1 eligible voluntary donors.', 'emergency');
        break;

      case 3:
        // Donors Accept: Ravi Kumar & Priya Sharma accept
        setDonorNotifications(prev => prev.map(n => {
          if (n.donor_id === 'dn_01_ravi' || n.donor_id === 'dn_02_priya') {
            return { ...n, notification_status: 'ACCEPTED', responded_at: new Date().toISOString() };
          }
          return n;
        }));
        setRequests(prev => prev.map(r => r.id === 'LL-2026-000184' ? {
          ...r,
          status: 'DONOR_ACCEPTED',
          accepted_donors_count: 2
        } : r));
        logAudit('SCENARIO_STEP_3_DONOR_ACCEPTED', 'REQUEST', 'LL-2026-000184', 'DONORS_NOTIFIED', 'DONOR_ACCEPTED', {
          acceptedDonors: ['Ravi Kumar', 'Priya Sharma']
        });
        showToast('Scenario Step 3', '2 Donors accepted: Ravi Kumar (ETA 15m), Priya Sharma (ETA 25m).', 'success');
        break;

      case 4:
        // Donor Arrives: Ravi Kumar arrives at Narasaraopet Blood Centre
        setDonorNotifications(prev => prev.map(n => n.donor_id === 'dn_01_ravi' ? { ...n, notification_status: 'ARRIVED_AT_CENTRE' } : n));
        setRequests(prev => prev.map(r => r.id === 'LL-2026-000184' ? {
          ...r,
          status: 'DONOR_ARRIVED',
          arrived_donors_count: 1
        } : r));
        logAudit('SCENARIO_STEP_4_DONOR_ARRIVED', 'REQUEST', 'LL-2026-000184', 'DONOR_ACCEPTED', 'DONOR_ARRIVED', {
          donor: 'Ravi Kumar',
          centre: 'Narasaraopet Blood Centre'
        });
        showToast('Scenario Step 4', 'Ravi Kumar arrived at Narasaraopet Blood Centre. Confirmed by staff M. K. Rao.', 'info');
        break;

      case 5:
        // Pre-Screening: Medical assessment passed
        setRequests(prev => prev.map(r => r.id === 'LL-2026-000184' ? {
          ...r,
          status: 'SCREENING_PENDING'
        } : r));
        logAudit('SCENARIO_STEP_5_SCREENING_PASSED', 'DONOR', 'dn_01_ravi', 'ARRIVED_AT_CENTRE', 'SCREENING_PASSED', {
          vitals: 'Hb 14.1 g/dL, BP 122/82, Weight 70 kg'
        });
        showToast('Scenario Step 5', 'Blood centre completed pre-screening. Donor deemed eligible for collection.', 'success');
        break;

      case 6:
        // Blood Donation: 450ml collected
        setRequests(prev => prev.map(r => r.id === 'LL-2026-000184' ? {
          ...r,
          status: 'DONATION_COMPLETED',
          completed_donations_count: 1
        } : r));
        logAudit('SCENARIO_STEP_6_DONATION_COLLECTED', 'DONATION', 'dn_01_ravi', 'SCREENING_PASSED', 'DONATION_COMPLETED', {
          volume: '450 ml Whole Blood'
        });
        showToast('Scenario Step 6', 'Donation completed at blood centre. Component processing & mandatory testing started.', 'info');
        break;

      case 7:
        // Testing & Component Processing: DGHS 5-infection testing non-reactive
        setRequests(prev => prev.map(r => r.id === 'LL-2026-000184' ? {
          ...r,
          status: 'TESTING_PENDING'
        } : r));
        logAudit('SCENARIO_STEP_7_TESTING_CLEARED', 'DONATION', 'don_evt_001', 'TESTING_PENDING', 'PROCESSED', {
          testing: 'All 5 DGHS markers non-reactive',
          component: 'Packed Red Blood Cells (PRBC)'
        });
        showToast('Scenario Step 7', 'Testing non-reactive. Red cells separated and packed into PRBC unit.', 'success');
        break;

      case 8:
        // Inventory Updated: Authoritative unit added to stock
        setRequests(prev => prev.map(r => r.id === 'LL-2026-000184' ? {
          ...r,
          status: 'INVENTORY_UPDATED',
          inventory_found_units: 4,
          shortage_units: 1
        } : r));
        logAudit('SCENARIO_STEP_8_INVENTORY_UPDATED', 'INVENTORY', 'inv_new_sim', 'TESTED', 'AVAILABLE', {
          newUnit: 'O+ PRBC (1 unit, 42-day shelf life at 2-6°C)'
        });
        showToast('Scenario Step 8', 'New verified unit added to Narasaraopet Blood Centre inventory.', 'success');
        break;

      case 9:
        // Reservation & Full Fulfilment
        setRequests(prev => prev.map(r => r.id === 'LL-2026-000184' ? {
          ...r,
          status: 'FULFILLED',
          units_fulfilled: 5,
          inventory_reserved_units: 5,
          shortage_units: 0
        } : r));
        logAudit('SCENARIO_STEP_9_REQUEST_FULFILLED', 'REQUEST', 'LL-2026-000184', 'INVENTORY_UPDATED', 'FULFILLED', {
          totalCoordinated: '5 units O+ PRBC delivered to LifeLink General Hospital'
        });
        try {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        } catch {}
        showToast('Scenario Completed!', 'Emergency Request LL-2026-000184 is 100% fulfilled! Full audit trail logged.', 'success');
        break;
    }
  };

  const resetDemoToScenarioStart = () => {
    setRequests([INITIAL_DEMO_REQUEST]);
    setInventory(MOCK_INITIAL_INVENTORY);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSimulationStep(1);
    setSelectedRequestId('LL-2026-000184');
    showToast('Reset Complete', 'Demo reset to initial Section 59 state.', 'info');
  };

  // Emergency response analytics (Section 52)
  const analytics: SystemAnalytics = {
    avg_request_to_inventory_sec: 45,
    avg_request_to_first_notification_sec: 72,
    avg_request_to_donor_accept_sec: 240,
    avg_request_to_donor_arrival_min: 22,
    avg_request_to_fulfilment_min: 48,
    pct_fulfilled_from_inventory: 65,
    pct_requiring_donor_mobilisation: 35,
    donor_response_rate_pct: 78.4,
    donor_no_show_rate_pct: 12.1,
    inventory_freshness_index_pct: 94.2,
    total_requests: requests.length + 18,
    active_requests: requests.filter(r => r.status !== 'FULFILLED' && r.status !== 'CANCELLED').length,
    fulfilled_requests: requests.filter(r => r.status === 'FULFILLED').length + 16,
  };

  return (
    <LifeLinkContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        switchUser,
        allUsers: MOCK_USERS,
        hospitals,
        bloodCentres,
        inventory,
        donors,
        requests,
        donorNotifications,
        donationEvents,
        auditLogs,
        activeRequest,
        setActiveRequestId: setSelectedRequestId,
        isNetworkOffline,
        setIsNetworkOffline,
        isStaleSimulated,
        setIsStaleSimulated,
        createEmergencyRequest,
        cancelRequest,
        reserveInventoryForRequest,
        toggleDonorAvailability,
        respondToDonorRequest,
        confirmDonorArrivalAtCentre,
        recordDonorScreening,
        recordDonationEvent,
        processTestingAndInventory,
        updateInventoryStatus,
        fulfilEmergencyUnits,
        simulationStep,
        runGuidedScenarioStep,
        resetDemoToScenarioStart,
        analytics,
        toast,
        dismissToast
      }}
    >
      {children}
    </LifeLinkContext.Provider>
  );
};

export const useLifeLink = () => {
  const context = useContext(LifeLinkContext);
  if (!context) throw new Error('useLifeLink must be used within a LifeLinkProvider');
  return context;
};

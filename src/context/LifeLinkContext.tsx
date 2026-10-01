import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  BloodGroup,
  BloodComponentType,
  UrgencyLevel,
  InventoryUnitStatus,
  SystemAnalytics,
  BloodRequest,
} from '../types/lifelink';
import { SEED_USERS } from '../data/mockData';
import {
  getSnapshot,
  subscribe,
  fetchState,
  localSeedSnapshot,
  lifelinkApi,
  type LifeLinkSnapshot,
} from '../services/apiClient';
import { isTerminalRequestState } from '../services/coordinationEngine';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'emergency' | 'success' | 'warning' | 'info';
  timestamp: string;
}

export type ViewTab = 'HOSPITAL' | 'DONOR' | 'BLOOD_CENTRE' | 'SIMULATION' | 'AUDIT_LOGS' | 'ANALYTICS';

interface LifeLinkContextType {
  // Navigation
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  currentUser: User;
  switchUser: (userId: string) => void;
  allUsers: User[];

  // Core Data (server-backed, local seed fallback when offline)
  hospitals: LifeLinkSnapshot['hospitals'];
  bloodCentres: LifeLinkSnapshot['bloodCentres'];
  inventory: LifeLinkSnapshot['inventory'];
  donors: LifeLinkSnapshot['donors'];
  requests: LifeLinkSnapshot['requests'];
  donorNotifications: LifeLinkSnapshot['donorNotifications'];
  donationEvents: LifeLinkSnapshot['donationEvents'];
  auditLogs: LifeLinkSnapshot['auditLogs'];
  activeRequest: BloodRequest | undefined;
  setActiveRequestId: (id: string) => void;

  // Connectivity
  serverConnected: boolean;
  isNetworkOffline: boolean;
  setIsNetworkOffline: (val: boolean) => void;
  isStaleSimulated: boolean;
  setIsStaleSimulated: (val: boolean) => void;

  // Hospital Actions (async, server-backed)
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
  }) => Promise<{ success: boolean; error?: string; isDuplicateWarning?: boolean }>;
  cancelRequest: (requestId: string, reason: string) => Promise<void>;
  reserveInventoryForRequest: (inventoryId: string, requestId: string, units: number) => Promise<{ success: boolean; message: string }>;

  // Donor Actions
  toggleDonorAvailability: (donorId: string) => Promise<void>;
  respondToDonorRequest: (notificationId: string, response: 'ACCEPT' | 'DECLINE', expectedArrivalMins?: number) => Promise<void>;

  // Blood Centre Actions
  confirmDonorArrivalAtCentre: (donorId: string, bloodCentreId: string, requestId: string) => Promise<void>;
  recordDonorScreening: (donorId: string, bloodCentreId: string, requestId: string, outcome: 'PASSED' | 'DEFERRED' | 'REJECTED', reason?: string, vitals?: string) => Promise<void>;
  recordDonationEvent: (donorId: string, bloodCentreId: string, requestId: string, volumeMl: number, donationType: 'WHOLE_BLOOD' | 'APHERESIS_PLATELETS' | 'PLASMA') => Promise<void>;
  processTestingAndInventory: (donationId: string, testResult: 'CLEARED' | 'REACTIVE', componentCreated: BloodComponentType, unitsCreated: number) => Promise<void>;
  updateInventoryStatus: (inventoryId: string, status: InventoryUnitStatus, notes?: string) => Promise<void>;
  fulfilEmergencyUnits: (requestId: string, bloodCentreId: string, units: number) => Promise<void>;

  // Simulation (Section 59 & 60)
  simulationStep: number;
  runGuidedScenarioStep: (targetStep: number) => void;
  resetDemoToScenarioStart: () => void;

  // Analytics & Alerts
  analytics: SystemAnalytics;
  toast: ToastNotification | null;
  dismissToast: () => void;
}

const LifeLinkContext = createContext<LifeLinkContextType | undefined>(undefined);

const SELECTED_REQUEST_KEY = 'lifelink.selectedRequestId';

export const LifeLinkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ---- Server-backed state -------------------------------------------------
  const [, forceVersion] = useState(0);
  useEffect(() => subscribe(() => forceVersion(v => v + 1)), []);

  const [activeTab, setActiveTab] = useState<ViewTab>('HOSPITAL');
  const [currentUserId, setCurrentUserId] = useState<string>(SEED_USERS[0].id);
  const [selectedRequestId, setSelectedRequestId] = useState<string>(() => {
    try {
      return localStorage.getItem(SELECTED_REQUEST_KEY) ?? 'LL-2026-000184';
    } catch {
      return 'LL-2026-000184';
    }
  });
  const [simulationStep, setSimulationStep] = useState<number>(5);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Failure simulation modes
  const [isNetworkOffline, setIsNetworkOffline] = useState<boolean>(false);
  const [isStaleSimulated, setIsStaleSimulated] = useState<boolean>(false);
  const [serverConnected, setServerConnected] = useState<boolean>(true);

  // Initial fetch + lightweight polling (near-real-time without websockets)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const snap = await fetchState();
      if (!cancelled) setServerConnected(!!snap);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const data: LifeLinkSnapshot = getSnapshot() ?? localSeedSnapshot();

  const users = data.users.length ? data.users : SEED_USERS;
  const currentUser = users.find(u => u.id === currentUserId) ?? users[0];

  const showToast = useCallback((title: string, message: string, type: ToastNotification['type'] = 'info') => {
    setToast({
      id: 'tst_' + Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // Auto-dismiss toasts after 6s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
      if (target.role === 'HOSPITAL_STAFF') setActiveTab('HOSPITAL');
      else if (target.role === 'DONOR') setActiveTab('DONOR');
      else if (target.role === 'BLOOD_CENTRE_STAFF') setActiveTab('BLOOD_CENTRE');
      showToast('Switched User Context', `Now viewing as ${target.name} (${target.role.replace(/_/g, ' ')})`, 'info');
    }
  };

  // ---- Actions -------------------------------------------------------------

  const createEmergencyRequest: LifeLinkContextType['createEmergencyRequest'] = async data => {
    if (isNetworkOffline) {
      showToast(
        'Offline Mode',
        'Request could not be broadcast. Please use the blood centre / hospital emergency hotline.',
        'warning',
      );
      return { success: false, error: 'Network unavailable. Use the emergency hotline (§44).' };
    }

    const res = await lifelinkApi.createEmergencyRequest({
      blood_group: data.blood_group,
      component_type: data.component_type,
      units_required: data.units_required,
      urgency: data.urgency,
      hospital_department: data.hospital_department,
      reason_category: data.reason_category,
      contact_person: data.contact_person,
      contact_phone: data.contact_phone,
      clinical_notes: data.clinical_notes,
      required_by: data.required_by,
    });

    if (res.ok && res.requestId) {
      setSelectedRequestId(res.requestId);
      try {
        localStorage.setItem(SELECTED_REQUEST_KEY, res.requestId);
      } catch {
        /* ignore */
      }
      showToast(
        'Emergency Request Broadcast',
        res.message ?? 'Request created.',
        data.urgency === 'CRITICAL' ? 'emergency' : 'info',
      );
      return { success: true, isDuplicateWarning: false };
    }

    showToast('Request Failed', res.error ?? 'The coordination service rejected the request.', 'warning');
    return { success: false, error: res.error };
  };

  const cancelRequest = async (requestId: string, reason: string) => {
    if (isNetworkOffline) {
      showToast('Offline', 'Cancellation requires connectivity. Use the emergency hotline.', 'warning');
      return;
    }
    const res = await lifelinkApi.cancelRequest(requestId, reason);
    showToast(res.ok ? 'Request Cancelled' : 'Action Failed', res.message ?? res.error ?? '', 'warning');
  };

  const reserveInventoryForRequest = async (inventoryId: string, requestId: string, units: number) => {
    if (isNetworkOffline) {
      return { success: false, message: 'Reservations require connectivity. Use the emergency phone hotline (§44).' };
    }
    const res = await lifelinkApi.reserveInventory(inventoryId, requestId, units);
    showToast(
      res.ok ? 'Inventory Reserved' : 'Reservation Rejected',
      res.message ?? res.error ?? '',
      res.ok ? 'success' : 'warning',
    );
    return { success: res.ok, message: res.message ?? res.error ?? '' };
  };

  const toggleDonorAvailability = async (donorId: string) => {
    const res = await lifelinkApi.toggleDonorAvailability(donorId);
    showToast('Availability Updated', res.message ?? res.error ?? '', res.ok ? 'info' : 'warning');
  };

  const respondToDonorRequest = async (
    notificationId: string,
    response: 'ACCEPT' | 'DECLINE',
    expectedArrivalMins = 20,
  ) => {
    const res = await lifelinkApi.respondToDonorRequest(notificationId, response, expectedArrivalMins);
    showToast(
      response === 'ACCEPT' ? 'Willingness Recorded' : 'Declined Response',
      res.message ?? res.error ?? '',
      response === 'ACCEPT' ? 'success' : 'info',
    );
  };

  const confirmDonorArrivalAtCentre = async (donorId: string, bloodCentreId: string, requestId: string) => {
    const res = await lifelinkApi.confirmDonorArrival(donorId, bloodCentreId, requestId);
    showToast('Donor Arrival Confirmed', res.message ?? res.error ?? '', res.ok ? 'info' : 'warning');
  };

  const recordDonorScreening = async (
    donorId: string,
    bloodCentreId: string,
    requestId: string,
    outcome: 'PASSED' | 'DEFERRED' | 'REJECTED',
    reason?: string,
    vitals?: string,
  ) => {
    const res = await lifelinkApi.recordDonorScreening(donorId, bloodCentreId, requestId, outcome, reason, vitals);
    showToast(
      outcome === 'PASSED' ? 'Screening Passed' : 'Screening Deferred',
      res.message ?? res.error ?? '',
      outcome === 'PASSED' ? 'success' : 'warning',
    );
  };

  const recordDonationEvent = async (
    donorId: string,
    bloodCentreId: string,
    requestId: string,
    volumeMl: number,
    donationType: 'WHOLE_BLOOD' | 'APHERESIS_PLATELETS' | 'PLASMA',
  ) => {
    const res = await lifelinkApi.recordDonationCollection(donorId, bloodCentreId, requestId, volumeMl, donationType);
    showToast('Collection Completed', res.message ?? res.error ?? '', res.ok ? 'info' : 'warning');
  };

  const processTestingAndInventory = async (
    donationId: string,
    testResult: 'CLEARED' | 'REACTIVE',
    componentCreated: BloodComponentType,
    unitsCreated: number,
  ) => {
    const event = data.donationEvents.find(e => e.id === donationId);
    const donorGroup = data.donors.find(d => d.id === event?.donor_id)?.blood_group ?? 'O+';
    const res = await lifelinkApi.processTestingAndInventory(donationId, testResult, componentCreated, unitsCreated, donorGroup);
    showToast(
      testResult === 'CLEARED' ? 'Verified Inventory Created' : 'Unit Quarantined',
      res.message ?? res.error ?? '',
      testResult === 'CLEARED' ? 'success' : 'warning',
    );
  };

  const updateInventoryStatus = async (inventoryId: string, status: InventoryUnitStatus, notes?: string) => {
    const res = await lifelinkApi.updateInventoryStatus(inventoryId, status, notes);
    showToast('Inventory Updated', res.message ?? res.error ?? '', res.ok ? 'info' : 'warning');
  };

  const fulfilEmergencyUnits = async (requestId: string, _bloodCentreId: string, units: number) => {
    const res = await lifelinkApi.fulfilEmergencyUnits(requestId, units);
    if (res.ok) {
      const snapshotNow = getSnapshot();
      const request = snapshotNow?.requests.find(r => r.id === requestId);
      if (request && request.units_fulfilled >= request.units_required) {
        try {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        } catch {
          /* ignore */
        }
      }
    }
    showToast('Emergency Fulfilment Recorded', res.message ?? res.error ?? '', res.ok ? 'success' : 'warning');
  };

  // ---- Simulation ----------------------------------------------------------

  const runGuidedScenarioStep = (step: number) => {
    setSimulationStep(step);
    lifelinkApi.runSimulationStep(step).then(res => {
      if (!res.ok) showToast('Simulation Error', res.error ?? 'Step failed', 'warning');
    });
  };

  const resetDemoToScenarioStart = () => {
    setSimulationStep(1);
    setSelectedRequestId('LL-2026-000184');
    try {
      localStorage.setItem(SELECTED_REQUEST_KEY, 'LL-2026-000184');
    } catch {
      /* ignore */
    }
    lifelinkApi.resetToSeed().then(() => {
      showToast('Reset Complete', 'Demo reset to the seeded Section 59 state.', 'info');
    });
  };

  // ---- Derived analytics ----------------------------------------------------

  const analytics = useMemo<SystemAnalytics>(() => computeAnalytics(data), [data]);

  // ---- Context value ---------------------------------------------------------

  const activeRequest = data.requests.find(r => r.id === selectedRequestId) || data.requests[0];

  const setActiveRequestId = (id: string) => {
    setSelectedRequestId(id);
    try {
      localStorage.setItem(SELECTED_REQUEST_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const value: LifeLinkContextType = {
    activeTab,
    setActiveTab,
    currentUser,
    switchUser,
    allUsers: users,
    hospitals: data.hospitals,
    bloodCentres: data.bloodCentres,
    inventory: data.inventory,
    donors: data.donors,
    requests: data.requests,
    donorNotifications: data.donorNotifications,
    donationEvents: data.donationEvents,
    auditLogs: data.auditLogs,
    activeRequest,
    setActiveRequestId,
    serverConnected,
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
    dismissToast,
  };

  return <LifeLinkContext.Provider value={value}>{children}</LifeLinkContext.Provider>;
};

export const useLifeLink = () => {
  const context = useContext(LifeLinkContext);
  if (!context) throw new Error('useLifeLink must be used within a LifeLinkProvider');
  return context;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeAnalytics(data: LifeLinkSnapshot): SystemAnalytics {
  const requests = data.requests;
  return {
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
    active_requests: requests.filter(r => !isTerminalRequestState(r.status)).length,
    fulfilled_requests: requests.filter(r => r.units_fulfilled >= r.units_required && r.units_required > 0).length + 16,
  };
}

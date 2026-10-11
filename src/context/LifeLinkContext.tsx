import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { AuthUser, AppView, BloodComponent, BloodGroup, UrgencyLevel, RequestStatus, ResponseStatus } from '../types/lifelink';
import { appState, nowIso } from '../store/appState';
import { DEMO_USERS } from '../data/demoData';

// Demo password map: email → password
const DEMO_PASSWORDS: Record<string, string> = {
  'superadmin@lifelink.health': 'Admin@Demo1',
  'transfusion@gghguntur.ap.nic.in': 'Hospital@Demo1',
  'medical@nsphosp.ap.nic.in': 'Hospital@Demo2',
  'admin@sunrisehospital.example.com': 'Pending@Demo1',
  'technicist@arbc.ap.gov.in': 'BloodBank@Demo1',
  'staff@redcrossguntur.org': 'BloodBank@Demo2',
  'bloodbank@palnadudbc.ap.gov.in': 'BloodBank@Demo3',
  'donor@example.com': 'Donor@Demo1',
};

interface LifeLinkContextType {
  currentUser: AuthUser | null;
  view: AppView;
  selectedOrgId: string | null;
  selectedRequestId: string | null;
  toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;

  // Navigation
  navigate: (view: AppView, meta?: { orgId?: string; requestId?: string }) => void;

  // Auth
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;

  // Data accessors (trigger re-render)
  refresh: () => void;

  // Actions
  createRequest: (params: {
    department: string;
    clinicianContact: string;
    bloodComponent: BloodComponent;
    bloodGroup?: BloodGroup;
    quantityUnits: number;
    urgency: UrgencyLevel;
    requiredBy: string;
    collectionLocation: string;
    additionalRequirements?: string;
  }) => { ok: boolean; error?: string; trackingCode?: string };

  respondToRequest: (params: {
    requestId: string;
    responseStatus: ResponseStatus;
    confirmedUnits: number;
    notes: string;
    collectionArrangement?: string;
    estimatedReadyTime?: string;
  }) => { ok: boolean; error?: string };

  reserveUnits: (params: {
    requestId: string;
    inventoryBatchId: string;
    units: number;
  }) => { ok: boolean; error?: string };

  releaseReservation: (reservationId: string, reason: string) => { ok: boolean; error?: string };

  updateInventory: (params: {
    batchId: string;
    availableUnits: number;
    notes?: string;
  }) => { ok: boolean; error?: string };

  addInventoryBatch: (params: {
    bloodComponent: BloodComponent;
    bloodGroup: BloodGroup;
    availableUnits: number;
    notes?: string;
  }) => { ok: boolean; error?: string };

  transitionRequest: (requestId: string, newStatus: RequestStatus, reason?: string) => { ok: boolean; error?: string };
  verifyOrganization: (orgId: string, status: 'VERIFIED' | 'REJECTED', reason?: string) => { ok: boolean; error?: string };
  markNotificationRead: (notifId: string) => void;
  markAllRead: () => void;

  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const LifeLinkContext = createContext<LifeLinkContextType | null>(null);

export function LifeLinkProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<AppView>('HOME');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [, forceUpdate] = useState(0);

  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const navigate = useCallback((v: AppView, meta?: { orgId?: string; requestId?: string }) => {
    setView(v);
    if (meta?.orgId !== undefined) setSelectedOrgId(meta.orgId);
    if (meta?.requestId !== undefined) setSelectedRequestId(meta.requestId);
  }, []);

  const signIn = useCallback((email: string, password: string): { ok: boolean; error?: string } => {
    const expectedPassword = DEMO_PASSWORDS[email.toLowerCase()];
    if (!expectedPassword) return { ok: false, error: 'No account found with this email address.' };
    if (password !== expectedPassword) return { ok: false, error: 'Incorrect password.' };

    const user = appState.getUserByEmail(email);
    if (!user) return { ok: false, error: 'Account not found.' };
    if (user.status === 'SUSPENDED') return { ok: false, error: 'Account is suspended. Contact support.' };

    const org = user.organizationId ? appState.getOrgById(user.organizationId) : undefined;
    const authUser: AuthUser = { ...user, organization: org, lastLoginAt: nowIso() };
    setCurrentUser(authUser);

    // Navigate to appropriate dashboard
    const dashMap: Record<string, AppView> = {
      SUPER_ADMIN: 'ADMIN_DASHBOARD',
      HOSPITAL_ADMIN: 'HOSPITAL_DASHBOARD',
      HOSPITAL_STAFF: 'HOSPITAL_DASHBOARD',
      BLOOD_BANK_ADMIN: 'BB_DASHBOARD',
      BLOOD_BANK_STAFF: 'BB_DASHBOARD',
      DONOR: 'DONOR_DASHBOARD',
    };
    navigate(dashMap[user.role] || 'HOME');
    appState.audit(user.id, 'USER_LOGIN', 'user', user.id, { email });
    return { ok: true };
  }, [navigate]);

  const signOut = useCallback(() => {
    if (currentUser) appState.audit(currentUser.id, 'USER_LOGOUT', 'user', currentUser.id, {});
    setCurrentUser(null);
    navigate('HOME');
  }, [currentUser, navigate]);

  const createRequest = useCallback((params: any): { ok: boolean; error?: string; trackingCode?: string } => {
    if (!currentUser?.organizationId) return { ok: false, error: 'Not authenticated.' };
    if (!['HOSPITAL_ADMIN', 'HOSPITAL_STAFF'].includes(currentUser.role)) return { ok: false, error: 'Unauthorized.' };

    const result = appState.createRequest({
      hospitalId: currentUser.organizationId,
      requestedBy: currentUser.id,
      ...params,
    });
    if (result.ok) {
      refresh();
      showToast(`Blood request created. Tracking code: ${result.request?.trackingCode}`, 'success');
    }
    return { ok: result.ok, error: result.error, trackingCode: result.request?.trackingCode };
  }, [currentUser, refresh, showToast]);

  const respondToRequest = useCallback((params: any): { ok: boolean; error?: string } => {
    if (!currentUser?.organizationId) return { ok: false, error: 'Not authenticated.' };
    if (!['BLOOD_BANK_ADMIN', 'BLOOD_BANK_STAFF'].includes(currentUser.role)) return { ok: false, error: 'Unauthorized.' };

    const result = appState.respondToRequest({
      bloodBankId: currentUser.organizationId,
      respondedBy: currentUser.id,
      ...params,
    });
    if (result.ok) { refresh(); showToast('Response submitted.', 'success'); }
    return { ok: result.ok, error: result.error };
  }, [currentUser, refresh, showToast]);

  const reserveUnits = useCallback((params: any): { ok: boolean; error?: string } => {
    if (!currentUser?.organizationId) return { ok: false, error: 'Not authenticated.' };
    if (!['BLOOD_BANK_ADMIN', 'BLOOD_BANK_STAFF'].includes(currentUser.role)) return { ok: false, error: 'Unauthorized.' };

    const result = appState.reserveUnits({
      bloodBankId: currentUser.organizationId,
      reservedBy: currentUser.id,
      ...params,
    });
    if (result.ok) { refresh(); showToast('Units reserved successfully.', 'success'); }
    return { ok: result.ok, error: result.error };
  }, [currentUser, refresh, showToast]);

  const releaseReservation = useCallback((reservationId: string, reason: string): { ok: boolean; error?: string } => {
    if (!currentUser) return { ok: false, error: 'Not authenticated.' };
    const result = appState.releaseReservation(reservationId, currentUser.id, reason);
    if (result.ok) { refresh(); showToast('Reservation released.', 'info'); }
    return result;
  }, [currentUser, refresh, showToast]);

  const updateInventory = useCallback((params: any): { ok: boolean; error?: string } => {
    if (!currentUser?.organizationId) return { ok: false, error: 'Not authenticated.' };
    if (!['BLOOD_BANK_ADMIN', 'BLOOD_BANK_STAFF'].includes(currentUser.role)) return { ok: false, error: 'Unauthorized.' };
    const result = appState.updateInventoryBatch({
      bloodBankId: currentUser.organizationId,
      updatedBy: currentUser.id,
      ...params,
    });
    if (result.ok) { refresh(); showToast('Inventory updated.', 'success'); }
    return result;
  }, [currentUser, refresh, showToast]);

  const addInventoryBatch = useCallback((params: any): { ok: boolean; error?: string } => {
    if (!currentUser?.organizationId) return { ok: false, error: 'Not authenticated.' };
    if (!['BLOOD_BANK_ADMIN', 'BLOOD_BANK_STAFF'].includes(currentUser.role)) return { ok: false, error: 'Unauthorized.' };
    const result = appState.addInventoryBatch({
      bloodBankId: currentUser.organizationId,
      addedBy: currentUser.id,
      ...params,
    });
    if (result.ok) { refresh(); showToast('Inventory batch added.', 'success'); }
    return { ok: result.ok, error: result.error };
  }, [currentUser, refresh, showToast]);

  const transitionRequest = useCallback((requestId: string, newStatus: RequestStatus, reason?: string): { ok: boolean; error?: string } => {
    if (!currentUser) return { ok: false, error: 'Not authenticated.' };
    const result = appState.transitionRequest(requestId, newStatus, currentUser.id, reason);
    if (result.ok) { refresh(); showToast(`Request status updated to ${newStatus}.`, 'success'); }
    return result;
  }, [currentUser, refresh, showToast]);

  const verifyOrganization = useCallback((orgId: string, status: 'VERIFIED' | 'REJECTED', reason?: string): { ok: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return { ok: false, error: 'Unauthorized.' };
    const result = appState.verifyOrganization(orgId, currentUser.id, status, reason);
    if (result.ok) { refresh(); showToast(`Organization ${status.toLowerCase()}.`, 'success'); }
    return result;
  }, [currentUser, refresh, showToast]);

  const markNotificationRead = useCallback((notifId: string) => {
    appState.markNotificationRead(notifId);
    refresh();
  }, [refresh]);

  const markAllRead = useCallback(() => {
    if (currentUser?.organizationId) appState.markAllRead(currentUser.organizationId);
    refresh();
  }, [currentUser, refresh]);

  return (
    <LifeLinkContext.Provider value={{
      currentUser, view, selectedOrgId, selectedRequestId, toast,
      navigate, signIn, signOut, refresh,
      createRequest, respondToRequest, reserveUnits, releaseReservation,
      updateInventory, addInventoryBatch, transitionRequest, verifyOrganization,
      markNotificationRead, markAllRead, showToast,
    }}>
      {children}
    </LifeLinkContext.Provider>
  );
}

export function useLifeLink(): LifeLinkContextType {
  const ctx = useContext(LifeLinkContext);
  if (!ctx) throw new Error('useLifeLink must be used inside LifeLinkProvider');
  return ctx;
}

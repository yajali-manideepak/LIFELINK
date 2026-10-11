import React, { useState } from 'react';
import {
  LayoutDashboard, Building2, Users, List, Package, Plug,
  BookOpen, BarChart2, Settings, CheckCircle, XCircle, AlertTriangle, Shield
} from 'lucide-react';
import { useLifeLink } from '../../context/LifeLinkContext';
import { SidebarLayout, PageHeader } from '../../components/layout/SidebarLayout';
import { StatusBadge, UrgencyBadge, EmptyState } from '../../components/shared/ui';
import { appState, formatRelativeTime, formatDateTime } from '../../store/appState';
import { BLOOD_COMPONENT_LABELS } from '../../types/lifelink';

function useAdminNav() {
  const items = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Overview', view: 'ADMIN_DASHBOARD' as const },
    { icon: <Building2 className="w-4 h-4" />, label: 'Organization Verification', view: 'ADMIN_ORG_VERIFICATION' as const },
    { icon: <Users className="w-4 h-4" />, label: 'User Management', view: 'ADMIN_USERS' as const },
    { icon: <List className="w-4 h-4" />, label: 'All Requests', view: 'ADMIN_REQUESTS' as const },
    { icon: <Package className="w-4 h-4" />, label: 'Inventory Quality', view: 'ADMIN_INVENTORY_QUALITY' as const },
    { icon: <Plug className="w-4 h-4" />, label: 'Integrations', view: 'ADMIN_INTEGRATIONS' as const },
    { icon: <BookOpen className="w-4 h-4" />, label: 'Audit Log', view: 'ADMIN_AUDIT_LOG' as const },
    { icon: <BarChart2 className="w-4 h-4" />, label: 'Reports', view: 'ADMIN_REPORTS' as const },
    { icon: <Settings className="w-4 h-4" />, label: 'Platform Settings', view: 'ADMIN_SETTINGS' as const },
  ];
  return items;
}

export function AdminDashboardPage() {
  const { currentUser } = useLifeLink();
  const items = useAdminNav();

  const orgs = appState.organizations;
  const users = appState.users;
  const requests = appState.bloodRequests;
  const inventory = appState.inventoryBatches;

  const pendingOrgs = orgs.filter(o => o.status === 'PENDING_VERIFICATION').length;
  const verifiedHospitals = orgs.filter(o => o.type === 'HOSPITAL' && o.status === 'VERIFIED').length;
  const verifiedBBs = orgs.filter(o => o.type === 'BLOOD_BANK' && o.status === 'VERIFIED').length;
  const activeRequests = requests.filter(r => !['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(r.status)).length;
  const unresolved = requests.filter(r => ['ESCALATED', 'EXPIRED'].includes(r.status)).length;
  const staleInventory = inventory.filter(b => b.verificationStatus === 'STALE').length;

  return (
    <SidebarLayout title="Admin Portal" subtitle="Platform Administration" items={items}>
      <div className="p-6">
        <PageHeader title="Platform Overview" description="LifeLink Administration Dashboard — DEMO DATA" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Verified Hospitals', value: verifiedHospitals, color: 'text-teal-700' },
            { label: 'Verified Blood Banks', value: verifiedBBs, color: 'text-teal-700' },
            { label: 'Pending Verification', value: pendingOrgs, color: pendingOrgs > 0 ? 'text-amber-700' : 'text-slate-600' },
            { label: 'Active Requests', value: activeRequests, color: 'text-blue-700' },
            { label: 'Unresolved / Escalated', value: unresolved, color: unresolved > 0 ? 'text-red-700' : 'text-emerald-700' },
            { label: 'Stale Inventory Records', value: staleInventory, color: staleInventory > 0 ? 'text-amber-700' : 'text-emerald-700' },
            { label: 'Total Users', value: users.length, color: 'text-slate-700' },
            { label: 'Total Organizations', value: orgs.length, color: 'text-slate-700' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value text-2xl ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {pendingOrgs > 0 && (
          <div className="alert-warning rounded-xl mb-4 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span><strong>{pendingOrgs} organization(s)</strong> are awaiting verification. Review them in the Organization Verification section.</span>
          </div>
        )}

        {/* Recent audit events */}
        <div className="card">
          <div className="card-header"><h2 className="font-semibold text-slate-900">Recent Audit Events</h2></div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Action</th><th>Resource</th><th>Actor</th><th>Time</th></tr></thead>
              <tbody>
                {appState.auditEvents.slice(0, 12).map(e => (
                  <tr key={e.id}>
                    <td><span className="badge-blue text-xs">{e.action.replace(/_/g, ' ')}</span></td>
                    <td className="text-xs font-medium text-slate-700">{e.resourceType} / <span className="font-mono text-slate-500">{e.resourceId.slice(0, 16)}</span></td>
                    <td className="text-xs text-slate-500">{e.actorId}</td>
                    <td className="text-xs text-slate-400">{formatRelativeTime(e.performedAt)}</td>
                  </tr>
                ))}
                {appState.auditEvents.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-6 text-slate-400">No audit events yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export function AdminOrgVerificationPage() {
  const { verifyOrganization } = useLifeLink();
  const items = useAdminNav();
  const [filter, setFilter] = useState('PENDING_VERIFICATION');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState('');

  const orgs = appState.organizations.filter(o =>
    filter === 'ALL' ? true : o.status === filter
  );

  const handleVerify = (orgId: string) => {
    if (!confirm('Approve this organization?')) return;
    verifyOrganization(orgId, 'VERIFIED');
  };

  const handleReject = (orgId: string) => {
    verifyOrganization(orgId, 'REJECTED', rejectReason);
    setRejectTarget('');
    setRejectReason('');
  };

  return (
    <SidebarLayout title="Admin Portal" subtitle="Platform Administration" items={items}>
      <div className="p-6">
        <PageHeader title="Organization Verification" description="Review and verify hospitals and blood banks." />
        <div className="flex gap-2 mb-4 flex-wrap">
          {['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'ALL'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === s ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {orgs.length === 0 ? (
            <div className="card p-8 text-center text-slate-500">No organizations with this status.</div>
          ) : orgs.map(org => (
            <div key={org.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-slate-900">{org.name}</h3>
                    <span className={`badge ${org.type === 'HOSPITAL' ? 'badge-blue' : 'badge-red'}`}>{org.type}</span>
                    <StatusBadge status={org.status} />
                    {org.isDemo && <span className="badge-orange text-[10px]">DEMO</span>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 mt-2">
                    <div><span className="text-slate-400">District:</span> {org.district}</div>
                    <div><span className="text-slate-400">Phone:</span> {org.phone}</div>
                    <div><span className="text-slate-400">Email:</span> {org.email}</div>
                    <div><span className="text-slate-400">Licence:</span> {org.licenseNumber || '—'}</div>
                    <div><span className="text-slate-400">Reg. No:</span> {org.registrationNumber || '—'}</div>
                    <div><span className="text-slate-400">Registered:</span> {formatRelativeTime(org.createdAt)}</div>
                  </div>
                  {org.verifiedAt && (
                    <div className="mt-1 text-xs text-emerald-600">✓ Verified {formatRelativeTime(org.verifiedAt)}</div>
                  )}
                </div>
                {org.status === 'PENDING_VERIFICATION' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleVerify(org.id)} className="btn-primary text-sm py-1.5 px-3">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => setRejectTarget(org.id)} className="btn-danger text-sm py-1.5 px-3">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
                {org.status === 'VERIFIED' && (
                  <button onClick={() => verifyOrganization(org.id, 'REJECTED', 'Suspended by administrator')} className="btn-secondary text-sm py-1.5">Suspend</button>
                )}
              </div>
              {rejectTarget === org.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                  <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="form-input flex-1" placeholder="Rejection reason (required)" />
                  <button onClick={() => handleReject(org.id)} disabled={!rejectReason} className="btn-danger">Confirm Reject</button>
                  <button onClick={() => setRejectTarget('')} className="btn-secondary">Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
}

export function AdminUsersPage() {
  const items = useAdminNav();
  const users = appState.users;

  return (
    <SidebarLayout title="Admin Portal" subtitle="Platform Administration" items={items}>
      <div className="p-6">
        <PageHeader title="User Management" />
        <div className="card table-wrapper">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Organization</th><th>Status</th><th>Last Login</th></tr></thead>
            <tbody>
              {users.map(u => {
                const org = u.organizationId ? appState.getOrgById(u.organizationId) : undefined;
                return (
                  <tr key={u.id}>
                    <td className="font-medium text-sm">{u.name}</td>
                    <td className="text-xs text-slate-600">{u.email}</td>
                    <td><span className="badge-blue text-xs">{u.role.replace(/_/g, ' ')}</span></td>
                    <td className="text-xs text-slate-500">{org?.name || '—'}</td>
                    <td><StatusBadge status={u.status} /></td>
                    <td className="text-xs text-slate-400">{u.lastLoginAt ? formatRelativeTime(u.lastLoginAt) : 'Never'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </SidebarLayout>
  );
}

export function AdminRequestsPage() {
  const { navigate } = useLifeLink();
  const items = useAdminNav();
  const [filter, setFilter] = useState('ACTIVE');
  const requests = appState.bloodRequests;

  const filtered = filter === 'ACTIVE'
    ? requests.filter(r => !['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(r.status))
    : filter === 'ALL' ? requests
    : requests.filter(r => r.status === filter);

  return (
    <SidebarLayout title="Admin Portal" subtitle="Platform Administration" items={items}>
      <div className="p-6">
        <PageHeader title="All Blood Requests" />
        <div className="flex gap-2 mb-4 flex-wrap">
          {['ACTIVE', 'ALL', 'FULFILLED', 'ESCALATED', 'EXPIRED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${filter === s ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="card table-wrapper">
          <table className="table">
            <thead><tr><th>Reference</th><th>Hospital</th><th>Component</th><th>Urgency</th><th>Status</th><th>Tracking</th><th>Created</th></tr></thead>
            <tbody>
              {filtered.map(r => {
                const hosp = appState.getOrgById(r.hospitalId);
                return (
                  <tr key={r.id}>
                    <td className="font-mono text-xs font-semibold">{r.referenceNumber}</td>
                    <td className="text-sm">{hosp?.name}</td>
                    <td className="text-xs">
                      <div>{BLOOD_COMPONENT_LABELS[r.bloodComponent]}</div>
                      {r.bloodGroup && <div className="text-red-600 font-bold">{r.bloodGroup}</div>}
                    </td>
                    <td><UrgencyBadge urgency={r.urgency} /></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="font-mono font-bold text-teal-700">{r.trackingCode}</td>
                    <td className="text-xs text-slate-400">{formatRelativeTime(r.createdAt)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-6 text-slate-400">No requests found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </SidebarLayout>
  );
}

export function AdminInventoryQualityPage() {
  const items = useAdminNav();
  const inventory = appState.inventoryBatches;
  const stale = inventory.filter(b => b.verificationStatus === 'STALE');

  return (
    <SidebarLayout title="Admin Portal" subtitle="Platform Administration" items={items}>
      <div className="p-6">
        <PageHeader title="Inventory Quality" description="Monitor inventory freshness and verification status across all blood banks." />
        {stale.length > 0 && (
          <div className="alert-warning rounded-xl mb-4 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span><strong>{stale.length} batch(es)</strong> have stale data. Contact the respective blood banks to update their inventory.</span>
          </div>
        )}
        <div className="card table-wrapper">
          <table className="table">
            <thead><tr><th>Blood Bank</th><th>Component</th><th>Group</th><th>Available</th><th>Reserved</th><th>Verification</th><th>Last Verified</th><th>Source</th></tr></thead>
            <tbody>
              {inventory.map(b => {
                const org = appState.getOrgById(b.bloodBankId);
                return (
                  <tr key={b.id} className={b.verificationStatus === 'STALE' ? 'bg-amber-50' : ''}>
                    <td className="text-xs font-medium">{org?.name}</td>
                    <td className="text-xs">{BLOOD_COMPONENT_LABELS[b.bloodComponent]}</td>
                    <td className="font-bold text-red-600">{b.bloodGroup}</td>
                    <td className={`font-bold ${(b.availableUnits - b.reservedUnits) === 0 ? 'text-red-600' : 'text-emerald-700'}`}>{b.availableUnits}</td>
                    <td>{b.reservedUnits}</td>
                    <td><StatusBadge status={b.verificationStatus} /></td>
                    <td className="text-xs">{b.lastVerifiedAt ? formatRelativeTime(b.lastVerifiedAt) : 'Never'}</td>
                    <td className="text-xs text-slate-400">{b.source.replace(/_/g, ' ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </SidebarLayout>
  );
}

export function AdminIntegrationsPage() {
  const items = useAdminNav();

  return (
    <SidebarLayout title="Admin Portal" subtitle="Platform Administration" items={items}>
      <div className="p-6">
        <PageHeader title="Integration Management" />
        <div className="alert-warning rounded-xl mb-6 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div>
            <strong>Important:</strong> Live integrations with external systems (e.g. e-RaktKosh) require written authorization, valid API credentials, and a signed data-sharing agreement.
            No live integration is currently active. All data shown is demonstration data.
          </div>
        </div>
        <div className="space-y-4">
          {appState.integrationSources.map(src => (
            <div key={src.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-slate-900">{src.name}</h3>
                    <StatusBadge status={src.status} />
                    {!src.isAuthorized && <span className="badge-red">Not Authorized</span>}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{src.authorizationNote}</p>
                  {src.lastSyncAt && <p className="text-xs text-slate-400">Last sync: {formatRelativeTime(src.lastSyncAt)}</p>}
                  {src.lastError && <p className="text-xs text-red-600">Error: {src.lastError}</p>}
                </div>
                <div className="shrink-0">
                  {src.type === 'ERAKTKOSH' && (
                    <a href="https://eraktkosh.mohfw.gov.in" target="_blank" rel="noopener noreferrer"
                      className="btn-secondary text-xs py-1.5">Visit e-RaktKosh</a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
}

export function AdminAuditLogPage() {
  const items = useAdminNav();
  const events = appState.auditEvents;

  return (
    <SidebarLayout title="Admin Portal" subtitle="Platform Administration" items={items}>
      <div className="p-6">
        <PageHeader title="Audit Log" description="Append-only record of all significant platform actions." />
        <div className="card table-wrapper">
          <table className="table">
            <thead><tr><th>Time</th><th>Action</th><th>Resource</th><th>Actor</th><th>Detail</th></tr></thead>
            <tbody>
              {events.map(e => (
                <tr key={e.id}>
                  <td className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(e.performedAt)}</td>
                  <td><span className="badge-blue text-xs">{e.action.replace(/_/g, ' ')}</span></td>
                  <td className="text-xs">
                    <div className="font-medium text-slate-700">{e.resourceType}</div>
                    <div className="font-mono text-slate-400">{e.resourceId.slice(0, 20)}</div>
                  </td>
                  <td className="text-xs text-slate-600 font-mono">{e.actorId}</td>
                  <td className="text-xs text-slate-500 max-w-xs truncate">{JSON.stringify(e.detail)}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">No audit events recorded yet. Events will appear as you use the platform.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SidebarLayout>
  );
}

export function AdminSettingsPage() {
  const items = useAdminNav();
  return (
    <SidebarLayout title="Admin Portal" subtitle="Platform Administration" items={items}>
      <div className="p-6 max-w-xl">
        <PageHeader title="Platform Settings" />
        <div className="card card-body space-y-4">
          <div>
            <label className="form-label">Platform Name</label>
            <input value="LifeLink" className="form-input" disabled />
          </div>
          <div>
            <label className="form-label">Demo Mode</label>
            <div className="mt-1 flex items-center gap-2">
              <div className="w-10 h-5 bg-amber-500 rounded-full" />
              <span className="text-sm font-medium text-amber-700">Demonstration Mode Active</span>
            </div>
          </div>
          <div>
            <label className="form-label">Inventory Freshness Threshold</label>
            <select className="form-select" disabled><option>24 hours (default)</option></select>
          </div>
          <div>
            <label className="form-label">Reservation Expiry</label>
            <select className="form-select" disabled><option>4 hours (default)</option></select>
          </div>
          <div className="alert-info rounded-lg text-sm">Platform settings are managed by the super administrator and require a security review before modification in production.</div>
        </div>
      </div>
    </SidebarLayout>
  );
}

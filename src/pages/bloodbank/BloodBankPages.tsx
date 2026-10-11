import React, { useState } from 'react';
import {
  LayoutDashboard, Package, List, BookOpen, Bell, BarChart2,
  Settings, Plus, CheckCircle, AlertTriangle, Clock, Droplets, X
} from 'lucide-react';
import { useLifeLink } from '../../context/LifeLinkContext';
import { SidebarLayout, PageHeader } from '../../components/layout/SidebarLayout';
import { StatusBadge, UrgencyBadge, EmptyState, Modal } from '../../components/shared/ui';
import { appState, formatRelativeTime, formatDateTime } from '../../store/appState';
import type { BloodComponent, BloodGroup, ResponseStatus } from '../../types/lifelink';
import { BLOOD_COMPONENT_LABELS, RESPONSE_STATUS_LABELS } from '../../types/lifelink';

function useBBNav() {
  const { currentUser } = useLifeLink();
  const orgId = currentUser?.organizationId || '';
  const unread = appState.notifications.filter(n => n.recipientOrgId === orgId && !n.isRead).length;
  const pendingRequests = appState.getRequestsForBloodBank(orgId).length;

  const items = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Overview', view: 'BB_DASHBOARD' as const },
    { icon: <Package className="w-4 h-4" />, label: 'Inventory', view: 'BB_INVENTORY' as const },
    { icon: <Plus className="w-4 h-4" />, label: 'Update Stock', view: 'BB_UPDATE_STOCK' as const },
    { icon: <List className="w-4 h-4" />, label: 'Incoming Requests', view: 'BB_REQUESTS' as const, badge: pendingRequests },
    { icon: <BookOpen className="w-4 h-4" />, label: 'Reservations', view: 'BB_RESERVATIONS' as const },
    { icon: <Bell className="w-4 h-4" />, label: 'Notifications', view: 'BB_NOTIFICATIONS' as const, badge: unread },
    { icon: <BarChart2 className="w-4 h-4" />, label: 'Reports', view: 'BB_REPORTS' as const },
    { icon: <Settings className="w-4 h-4" />, label: 'Settings', view: 'BB_SETTINGS' as const },
  ];
  return { items, orgId };
}

export function BloodBankDashboardPage() {
  const { currentUser, navigate } = useLifeLink();
  const { items, orgId } = useBBNav();
  const org = appState.getOrgById(orgId);
  const inventory = appState.getInventoryForBloodBank(orgId);
  const requests = appState.getRequestsForBloodBank(orgId);
  const reservations = appState.inventoryReservations.filter(r => r.bloodBankId === orgId && r.status === 'ACTIVE');

  const totalAvailable = inventory.reduce((sum, b) => sum + Math.max(0, b.availableUnits - b.reservedUnits), 0);
  const totalReserved = inventory.reduce((sum, b) => sum + b.reservedUnits, 0);
  const staleCount = inventory.filter(b => b.verificationStatus === 'STALE').length;
  const pendingRequests = requests.filter(r => ['AWAITING_RESPONSES', 'DISTRIBUTED'].includes(r.status)).length;

  return (
    <SidebarLayout title="Blood Bank Portal" subtitle={org?.name} items={items}>
      <div className="p-6">
        <PageHeader
          title={`Welcome, ${currentUser?.name.split(' ').slice(0, 2).join(' ')}`}
          description={`${org?.name || 'Blood Bank'} — Inventory & Request Management`}
          actions={<button onClick={() => navigate('BB_UPDATE_STOCK')} className="btn-primary"><Plus className="w-4 h-4" /> Update Stock</button>}
        />

        {staleCount > 0 && (
          <div className="alert-warning rounded-xl mb-4 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span><strong>{staleCount} inventory record(s)</strong> are stale and need re-verification. Please update your stock information.</span>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Available Units', value: totalAvailable, color: 'text-teal-700', icon: <Droplets className="w-5 h-5 text-teal-500" /> },
            { label: 'Reserved Units', value: totalReserved, color: 'text-amber-700', icon: <BookOpen className="w-5 h-5 text-amber-500" /> },
            { label: 'Pending Requests', value: pendingRequests, color: 'text-blue-700', icon: <List className="w-5 h-5 text-blue-500" /> },
            { label: 'Stale Records', value: staleCount, color: staleCount > 0 ? 'text-red-700' : 'text-emerald-700', icon: <AlertTriangle className="w-5 h-5 text-red-400" /> },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs font-medium text-slate-500">{s.label}</span></div>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Inventory summary */}
        <div className="card mb-4">
          <div className="card-header flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">Inventory Overview</h2>
            <button onClick={() => navigate('BB_INVENTORY')} className="text-sm text-teal-600 hover:underline">View all →</button>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Component</th><th>Group</th><th>Available</th><th>Reserved</th><th>Status</th><th>Last Verified</th></tr></thead>
              <tbody>
                {inventory.slice(0, 6).map(b => (
                  <tr key={b.id}>
                    <td className="text-xs font-medium">{BLOOD_COMPONENT_LABELS[b.bloodComponent]}</td>
                    <td className="font-bold text-red-600">{b.bloodGroup}</td>
                    <td className={`font-bold ${(b.availableUnits - b.reservedUnits) > 0 ? 'text-emerald-700' : 'text-red-600'}`}>{Math.max(0, b.availableUnits - b.reservedUnits)}</td>
                    <td className="text-amber-700 font-medium">{b.reservedUnits}</td>
                    <td><StatusBadge status={b.verificationStatus} /></td>
                    <td className="text-xs text-slate-400">{b.lastVerifiedAt ? formatRelativeTime(b.lastVerifiedAt) : 'Never'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending requests */}
        {pendingRequests > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> {pendingRequests} Request(s) Require Response
              </h2>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Reference</th><th>Hospital</th><th>Component</th><th>Urgency</th><th>Required By</th><th></th></tr></thead>
                <tbody>
                  {requests.filter(r => ['AWAITING_RESPONSES', 'DISTRIBUTED'].includes(r.status)).map(r => {
                    const hosp = appState.getOrgById(r.hospitalId);
                    return (
                      <tr key={r.id}>
                        <td className="font-mono text-xs font-semibold">{r.referenceNumber}</td>
                        <td className="text-sm">{hosp?.name}</td>
                        <td className="text-xs"><div>{BLOOD_COMPONENT_LABELS[r.bloodComponent]}</div>{r.bloodGroup && <div className="text-red-600 font-bold">{r.bloodGroup}</div>}</td>
                        <td><UrgencyBadge urgency={r.urgency} /></td>
                        <td className="text-xs">{formatDateTime(r.requiredBy)}</td>
                        <td><button onClick={() => navigate('BB_REQUEST_DETAIL', { requestId: r.id })} className="text-xs text-teal-600 hover:underline">Respond</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

export function BloodBankInventoryPage() {
  const { navigate } = useLifeLink();
  const { items, orgId } = useBBNav();
  const org = appState.getOrgById(orgId);
  const inventory = appState.getInventoryForBloodBank(orgId);
  const [filter, setFilter] = useState('ALL');

  const filtered = filter === 'ALL' ? inventory : inventory.filter(b => b.verificationStatus === filter);

  return (
    <SidebarLayout title="Blood Bank Portal" subtitle={org?.name} items={items}>
      <div className="p-6">
        <PageHeader
          title="Inventory"
          actions={<button onClick={() => navigate('BB_UPDATE_STOCK')} className="btn-primary"><Plus className="w-4 h-4" /> Add / Update Stock</button>}
        />

        <div className="alert-warning rounded-xl mb-4 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>All inventory shown is DEMO DATA. Only authorized staff may confirm, update, or release blood inventory. Each change is recorded in the audit log.</span>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {['ALL', 'RECENTLY_VERIFIED', 'UNVERIFIED', 'STALE'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === s ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="card table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Component</th><th>Group</th><th>Available</th><th>Reserved</th>
                <th>Quarantined</th><th>Source</th><th>Verification</th><th>Last Verified</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className={b.verificationStatus === 'STALE' ? 'bg-amber-50' : ''}>
                  <td className="text-xs font-medium">{BLOOD_COMPONENT_LABELS[b.bloodComponent]}</td>
                  <td className="font-bold text-red-600 text-lg">{b.bloodGroup}</td>
                  <td className={`font-bold ${(b.availableUnits - b.reservedUnits) === 0 ? 'text-red-600' : 'text-emerald-700'}`}>{Math.max(0, b.availableUnits - b.reservedUnits)}</td>
                  <td className="text-amber-700 font-medium">{b.reservedUnits}</td>
                  <td className="text-slate-500">{b.quarantinedUnits}</td>
                  <td><span className="badge-gray text-[10px]">{b.source.replace(/_/g, ' ')}</span></td>
                  <td><StatusBadge status={b.verificationStatus} /></td>
                  <td className="text-xs text-slate-400">{b.lastVerifiedAt ? formatRelativeTime(b.lastVerifiedAt) : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SidebarLayout>
  );
}

const BLOOD_GROUPS_LIST: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS_LIST: BloodComponent[] = ['PACKED_RED_CELLS', 'WHOLE_BLOOD', 'PLATELETS', 'FRESH_FROZEN_PLASMA', 'CRYOPRECIPITATE', 'GRANULOCYTES'];

export function BloodBankUpdateStockPage() {
  const { updateInventory, addInventoryBatch } = useLifeLink();
  const { items, orgId } = useBBNav();
  const org = appState.getOrgById(orgId);
  const inventory = appState.getInventoryForBloodBank(orgId);

  const [updateForm, setUpdateForm] = useState<{ batchId: string; units: string; notes: string } | null>(null);
  const [addForm, setAddForm] = useState({ component: '' as BloodComponent | '', group: '' as BloodGroup | '', units: '1', notes: '' });
  const [error, setError] = useState('');

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateForm) return;
    const r = updateInventory({ batchId: updateForm.batchId, availableUnits: parseInt(updateForm.units), notes: updateForm.notes });
    if (r.ok) setUpdateForm(null);
    else setError(r.error || 'Update failed.');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.component || !addForm.group) { setError('Select component and blood group.'); return; }
    const r = addInventoryBatch({ bloodComponent: addForm.component, bloodGroup: addForm.group, availableUnits: parseInt(addForm.units), notes: addForm.notes });
    if (r.ok) setAddForm({ component: '', group: '', units: '1', notes: '' });
    else setError(r.error || 'Failed.');
  };

  return (
    <SidebarLayout title="Blood Bank Portal" subtitle={org?.name} items={items}>
      <div className="p-6 max-w-3xl">
        <PageHeader title="Update Stock" description="Add new inventory or update existing batch quantities. All changes are recorded in the audit log." />

        {error && <div className="alert-error rounded-xl mb-4 text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">Dismiss</button></div>}

        {/* Add new batch */}
        <div className="card mb-6">
          <div className="card-header"><h2 className="font-semibold text-slate-900">Add New Inventory Batch</h2></div>
          <div className="card-body">
            <form onSubmit={handleAdd} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="form-label">Component *</label>
                <select value={addForm.component} onChange={e => setAddForm(p => ({ ...p, component: e.target.value as BloodComponent }))} className="form-select" required>
                  <option value="">Select</option>
                  {COMPONENTS_LIST.map(c => <option key={c} value={c}>{BLOOD_COMPONENT_LABELS[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Blood Group *</label>
                <select value={addForm.group} onChange={e => setAddForm(p => ({ ...p, group: e.target.value as BloodGroup }))} className="form-select" required>
                  <option value="">Select</option>
                  {BLOOD_GROUPS_LIST.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Units *</label>
                <input type="number" min="0" value={addForm.units} onChange={e => setAddForm(p => ({ ...p, units: e.target.value }))} className="form-input" required />
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full justify-center">Add Batch</button>
              </div>
              <div className="col-span-2 sm:col-span-4">
                <label className="form-label">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                <input value={addForm.notes} onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))} className="form-input" placeholder="Source, donation camp, etc." />
              </div>
            </form>
          </div>
        </div>

        {/* Update existing */}
        <div className="card">
          <div className="card-header"><h2 className="font-semibold text-slate-900">Update Existing Batches</h2></div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Component</th><th>Group</th><th>Current Available</th><th>Reserved</th><th>Verification</th><th></th></tr></thead>
              <tbody>
                {inventory.map(b => (
                  <React.Fragment key={b.id}>
                    <tr className={b.verificationStatus === 'STALE' ? 'bg-amber-50' : ''}>
                      <td className="text-xs">{BLOOD_COMPONENT_LABELS[b.bloodComponent]}</td>
                      <td className="font-bold text-red-600">{b.bloodGroup}</td>
                      <td className={`font-bold ${(b.availableUnits - b.reservedUnits) === 0 ? 'text-red-600' : 'text-emerald-700'}`}>{b.availableUnits}</td>
                      <td>{b.reservedUnits}</td>
                      <td><StatusBadge status={b.verificationStatus} /></td>
                      <td>
                        <button onClick={() => setUpdateForm({ batchId: b.id, units: String(b.availableUnits), notes: '' })} className="text-xs text-teal-600 hover:underline">Update</button>
                      </td>
                    </tr>
                    {updateForm?.batchId === b.id && (
                      <tr>
                        <td colSpan={6} className="bg-teal-50 px-4 py-3">
                          <form onSubmit={handleUpdate} className="flex gap-3 items-end">
                            <div>
                              <label className="form-label text-xs">New Available Units</label>
                              <input type="number" min="0" value={updateForm.units} onChange={e => setUpdateForm(p => p ? { ...p, units: e.target.value } : null)} className="form-input w-24" required />
                            </div>
                            <div className="flex-1">
                              <label className="form-label text-xs">Notes</label>
                              <input value={updateForm.notes} onChange={e => setUpdateForm(p => p ? { ...p, notes: e.target.value } : null)} className="form-input" placeholder="Reason for update" />
                            </div>
                            <button type="submit" className="btn-primary py-2 px-3 text-sm">Save</button>
                            <button type="button" onClick={() => setUpdateForm(null)} className="btn-secondary py-2 px-3 text-sm">Cancel</button>
                          </form>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export function BloodBankRequestsPage() {
  const { navigate } = useLifeLink();
  const { items, orgId } = useBBNav();
  const org = appState.getOrgById(orgId);
  const requests = appState.getRequestsForBloodBank(orgId);
  const [filter, setFilter] = useState('PENDING');

  const filtered = filter === 'PENDING'
    ? requests.filter(r => ['AWAITING_RESPONSES', 'DISTRIBUTED', 'PARTIALLY_MATCHED'].includes(r.status))
    : filter === 'ALL' ? requests
    : requests.filter(r => r.status === filter);

  return (
    <SidebarLayout title="Blood Bank Portal" subtitle={org?.name} items={items}>
      <div className="p-6">
        <PageHeader title="Incoming Requests" description="Blood requests distributed to your blood bank from verified hospitals." />
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { key: 'PENDING', label: 'Needs Response' },
            { key: 'ALL', label: 'All' },
            { key: 'FULFILLED', label: 'Fulfilled' },
            { key: 'CANCELLED', label: 'Cancelled' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === f.key ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="card">
          {filtered.length === 0 ? (
            <div className="p-8"><EmptyState icon={<List className="w-10 h-10" />} title="No requests to display" /></div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Reference</th><th>Hospital</th><th>Component</th><th>Qty</th><th>Urgency</th><th>Status</th><th>Required By</th><th></th></tr></thead>
                <tbody>
                  {filtered.map(r => {
                    const hosp = appState.getOrgById(r.hospitalId);
                    const myResponse = appState.bloodBankResponses.find(resp => resp.requestId === r.id && resp.bloodBankId === orgId);
                    return (
                      <tr key={r.id}>
                        <td className="font-mono text-xs font-semibold">{r.referenceNumber}</td>
                        <td className="text-sm">{hosp?.name}</td>
                        <td className="text-xs">
                          <div className="font-medium">{BLOOD_COMPONENT_LABELS[r.bloodComponent]}</div>
                          {r.bloodGroup && <div className="text-red-600 font-bold">{r.bloodGroup}</div>}
                        </td>
                        <td className="font-semibold">{r.quantityUnits}</td>
                        <td><UrgencyBadge urgency={r.urgency} /></td>
                        <td>
                          <StatusBadge status={r.status} />
                          {myResponse && <div className="mt-1"><StatusBadge status={myResponse.responseStatus} /></div>}
                        </td>
                        <td className="text-xs">{formatDateTime(r.requiredBy)}</td>
                        <td><button onClick={() => navigate('BB_REQUEST_DETAIL', { requestId: r.id })} className="text-xs text-teal-600 hover:underline">{myResponse ? 'View' : 'Respond'}</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

export function BloodBankRequestDetailPage() {
  const { selectedRequestId, navigate, respondToRequest, reserveUnits } = useLifeLink();
  const { items, orgId } = useBBNav();
  const org = appState.getOrgById(orgId);
  const request = appState.bloodRequests.find(r => r.id === selectedRequestId);
  const myResponse = request ? appState.bloodBankResponses.find(r => r.requestId === request.id && r.bloodBankId === orgId) : undefined;
  const inventory = appState.getInventoryForBloodBank(orgId);

  const [responseForm, setResponseForm] = useState({
    responseStatus: 'CONFIRMED_AVAILABLE' as ResponseStatus,
    confirmedUnits: request?.quantityUnits?.toString() || '1',
    notes: '',
    collectionArrangement: '',
  });
  const [reserveForm, setReserveForm] = useState({ batchId: '', units: '1' });
  const [error, setError] = useState('');

  if (!request) {
    return (
      <SidebarLayout title="Blood Bank Portal" subtitle={org?.name} items={items}>
        <div className="p-6"><EmptyState title="Request not found" action={<button onClick={() => navigate('BB_REQUESTS')} className="btn-secondary">Back</button>} /></div>
      </SidebarLayout>
    );
  }

  const hosp = appState.getOrgById(request.hospitalId);

  const handleRespond = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const r = respondToRequest({
      requestId: request.id,
      responseStatus: responseForm.responseStatus,
      confirmedUnits: parseInt(responseForm.confirmedUnits),
      notes: responseForm.notes,
      collectionArrangement: responseForm.collectionArrangement || undefined,
    });
    if (!r.ok) setError(r.error || 'Response failed.');
  };

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!reserveForm.batchId) { setError('Select an inventory batch.'); return; }
    const r = reserveUnits({ requestId: request.id, inventoryBatchId: reserveForm.batchId, units: parseInt(reserveForm.units) });
    if (!r.ok) setError(r.error || 'Reservation failed.');
  };

  const matchingInventory = inventory.filter(b =>
    (!request.bloodGroup || b.bloodGroup === request.bloodGroup) &&
    b.bloodComponent === request.bloodComponent &&
    (b.availableUnits - b.reservedUnits) > 0
  );

  return (
    <SidebarLayout title="Blood Bank Portal" subtitle={org?.name} items={items}>
      <div className="p-6 max-w-3xl">
        <button onClick={() => navigate('BB_REQUESTS')} className="text-sm text-slate-500 hover:text-slate-700 mb-4">← Back to Requests</button>

        <div className="flex items-start gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{request.referenceNumber}</h1>
            <div className="flex gap-2 mt-1"><UrgencyBadge urgency={request.urgency} /><StatusBadge status={request.status} /></div>
          </div>
        </div>

        {error && <div className="alert-error rounded-xl mb-4 text-sm">{error}<button onClick={() => setError('')} className="ml-2 underline">×</button></div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Request details */}
          <div className="card p-4">
            <h3 className="font-semibold text-sm mb-3">Request Details</h3>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Hospital</dt><dd className="font-medium text-right">{hosp?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Department</dt><dd className="font-medium">{request.department}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Component</dt><dd className="font-medium">{BLOOD_COMPONENT_LABELS[request.bloodComponent]}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Blood Group</dt><dd className="font-bold text-red-600">{request.bloodGroup || 'Not specified'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Quantity</dt><dd className="font-bold">{request.quantityUnits} units</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Required By</dt><dd className="text-right">{formatDateTime(request.requiredBy)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Location</dt><dd className="text-right">{request.collectionLocation}</dd></div>
              {request.additionalRequirements && (
                <div className="flex justify-between"><dt className="text-slate-500">Requirements</dt><dd className="text-right text-xs">{request.additionalRequirements}</dd></div>
              )}
            </dl>
          </div>

          {/* Matching inventory */}
          <div className="card p-4">
            <h3 className="font-semibold text-sm mb-3">Your Matching Inventory</h3>
            {matchingInventory.length === 0 ? (
              <p className="text-sm text-slate-500">No matching inventory available for this request.</p>
            ) : (
              <div className="space-y-2">
                {matchingInventory.map(b => (
                  <div key={b.id} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0 text-sm">
                    <div>
                      <span className="font-bold text-red-600">{b.bloodGroup}</span>
                      <span className="text-slate-500 text-xs ml-2">({b.verificationStatus.replace(/_/g, ' ')})</span>
                    </div>
                    <div>
                      <span className="font-bold text-emerald-700">{b.availableUnits - b.reservedUnits} available</span>
                      {b.reservedUnits > 0 && <span className="text-xs text-amber-600 ml-1">({b.reservedUnits} reserved)</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My response */}
        {myResponse ? (
          <div className="card mb-4 p-4 bg-teal-50 border-teal-200">
            <h3 className="font-semibold text-sm mb-2">Your Response</h3>
            <div className="flex items-center gap-2 mb-2"><StatusBadge status={myResponse.responseStatus} /><span className="text-sm font-medium">{myResponse.confirmedUnits} units confirmed</span></div>
            <p className="text-sm text-slate-600">{myResponse.notes}</p>
            {myResponse.collectionArrangement && <p className="text-xs text-teal-700 mt-1"><strong>Collection:</strong> {myResponse.collectionArrangement}</p>}
          </div>
        ) : !['CANCELLED', 'EXPIRED', 'FULFILLED'].includes(request.status) ? (
          <div className="card mb-4">
            <div className="card-header"><h3 className="font-semibold">Submit Response</h3></div>
            <div className="card-body">
              <form onSubmit={handleRespond} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Response *</label>
                    <select value={responseForm.responseStatus} onChange={e => setResponseForm(p => ({ ...p, responseStatus: e.target.value as ResponseStatus }))} className="form-select">
                      {(Object.entries(RESPONSE_STATUS_LABELS) as [ResponseStatus, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Confirmed Units</label>
                    <input type="number" min="0" value={responseForm.confirmedUnits} onChange={e => setResponseForm(p => ({ ...p, confirmedUnits: e.target.value }))} className="form-input" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Notes *</label>
                  <textarea rows={2} value={responseForm.notes} onChange={e => setResponseForm(p => ({ ...p, notes: e.target.value }))} className="form-input resize-none" required placeholder="Availability details, collection instructions, etc." />
                </div>
                <div>
                  <label className="form-label">Collection Arrangement</label>
                  <input value={responseForm.collectionArrangement} onChange={e => setResponseForm(p => ({ ...p, collectionArrangement: e.target.value }))} className="form-input" placeholder="e.g. Counter collection at Gate 2" />
                </div>
                <button type="submit" className="btn-primary">Submit Response</button>
              </form>
            </div>
          </div>
        ) : null}

        {/* Reserve units */}
        {myResponse && ['CONFIRMED_AVAILABLE', 'PARTIAL_AVAILABLE'].includes(myResponse.responseStatus) && !['CANCELLED', 'EXPIRED', 'FULFILLED'].includes(request.status) && (
          <div className="card">
            <div className="card-header"><h3 className="font-semibold">Reserve Units</h3></div>
            <div className="card-body">
              <div className="alert-warning rounded-lg mb-4 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Reserving units will update your available inventory atomically. Ensure units are physically available and screened before reserving.
              </div>
              <form onSubmit={handleReserve} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="form-label">Inventory Batch</label>
                  <select value={reserveForm.batchId} onChange={e => setReserveForm(p => ({ ...p, batchId: e.target.value }))} className="form-select" required>
                    <option value="">Select batch</option>
                    {matchingInventory.map(b => (
                      <option key={b.id} value={b.id}>{b.bloodGroup} — {b.availableUnits - b.reservedUnits} available</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Units</label>
                  <input type="number" min="1" value={reserveForm.units} onChange={e => setReserveForm(p => ({ ...p, units: e.target.value }))} className="form-input w-20" />
                </div>
                <button type="submit" className="btn-primary py-2">Reserve</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

export function BloodBankReservationsPage() {
  const { releaseReservation } = useLifeLink();
  const { items, orgId } = useBBNav();
  const org = appState.getOrgById(orgId);
  const reservations = appState.inventoryReservations.filter(r => r.bloodBankId === orgId);

  return (
    <SidebarLayout title="Blood Bank Portal" subtitle={org?.name} items={items}>
      <div className="p-6">
        <PageHeader title="Reservations" />
        <div className="card table-wrapper">
          <table className="table">
            <thead><tr><th>Reservation ID</th><th>Request</th><th>Units</th><th>Status</th><th>Expires</th><th>Reserved By</th><th></th></tr></thead>
            <tbody>
              {reservations.map(r => {
                const req = appState.bloodRequests.find(q => q.id === r.requestId);
                return (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.id.slice(0, 12)}…</td>
                    <td className="font-mono text-xs font-semibold">{req?.referenceNumber || r.requestId}</td>
                    <td className="font-bold text-teal-700">{r.reservedUnits}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="text-xs">{formatDateTime(r.expiresAt)}</td>
                    <td className="text-xs text-slate-500">{r.reservedBy}</td>
                    <td>
                      {r.status === 'ACTIVE' && (
                        <button
                          onClick={() => { if (confirm('Release this reservation?')) releaseReservation(r.id, 'Released by blood bank staff'); }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Release
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {reservations.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">No reservations found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SidebarLayout>
  );
}

export function BloodBankNotificationsPage() {
  const { markNotificationRead, markAllRead } = useLifeLink();
  const { items, orgId } = useBBNav();
  const org = appState.getOrgById(orgId);
  const notifications = appState.notifications.filter(n => n.recipientOrgId === orgId);

  return (
    <SidebarLayout title="Blood Bank Portal" subtitle={org?.name} items={items}>
      <div className="p-6">
        <PageHeader title="Notifications" actions={<button onClick={() => markAllRead()} className="btn-secondary text-sm">Mark all read</button>} />
        <div className="card card-body space-y-3">
          {notifications.length === 0 ? <EmptyState icon={<Bell className="w-10 h-10" />} title="No notifications" /> :
            notifications.map(n => (
              <div key={n.id} onClick={() => markNotificationRead(n.id)}
                className={`flex gap-3 p-3 rounded-lg cursor-pointer ${n.isRead ? 'bg-slate-50' : 'bg-teal-50 border border-teal-100'}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-slate-300' : 'bg-teal-500'}`} />
                <div className="flex-1">
                  <div className="flex justify-between gap-2">
                    <p className={`text-sm font-medium ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                    <span className="text-xs text-slate-400 shrink-0">{formatRelativeTime(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </SidebarLayout>
  );
}

export function BloodBankReportsPage() {
  const { items, orgId } = useBBNav();
  const org = appState.getOrgById(orgId);
  const inventory = appState.getInventoryForBloodBank(orgId);
  const reservations = appState.inventoryReservations.filter(r => r.bloodBankId === orgId);
  const movements = appState.inventoryMovements.filter(m => m.bloodBankId === orgId);

  return (
    <SidebarLayout title="Blood Bank Portal" subtitle={org?.name} items={items}>
      <div className="p-6">
        <PageHeader title="Reports" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Inventory Batches', value: inventory.length },
            { label: 'Total Reservations', value: reservations.length },
            { label: 'Stock Movements', value: movements.length },
            { label: 'Active Reservations', value: reservations.filter(r => r.status === 'ACTIVE').length },
          ].map(s => (
            <div key={s.label} className="stat-card"><div className="stat-label">{s.label}</div><div className="stat-value text-2xl">{s.value}</div></div>
          ))}
        </div>
        <div className="card">
          <div className="card-header"><h2 className="font-semibold">Recent Stock Movements</h2></div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Movement</th><th>Units</th><th>Related Request</th><th>Performed By</th><th>Time</th></tr></thead>
              <tbody>
                {movements.slice(-10).reverse().map(m => (
                  <tr key={m.id}>
                    <td><span className="badge-gray text-xs">{m.movementType.replace(/_/g, ' ')}</span></td>
                    <td className="font-bold">{m.units}</td>
                    <td className="font-mono text-xs">{m.relatedRequestId || '—'}</td>
                    <td className="text-xs text-slate-500">{m.performedBy}</td>
                    <td className="text-xs text-slate-400">{formatRelativeTime(m.performedAt)}</td>
                  </tr>
                ))}
                {movements.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-slate-400">No movements recorded.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export function BloodBankSettingsPage() {
  const { items, orgId } = useBBNav();
  const org = appState.getOrgById(orgId);
  const profile = appState.bloodBankProfiles.find(p => p.organizationId === orgId);

  return (
    <SidebarLayout title="Blood Bank Portal" subtitle={org?.name} items={items}>
      <div className="p-6 max-w-xl">
        <PageHeader title="Organization Settings" />
        {org && (
          <div className="card">
            <div className="card-body space-y-4">
              <div><label className="form-label">Organization Name</label><input value={org.name} className="form-input" disabled /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="form-label">Licence Number</label><input value={org.licenseNumber} className="form-input" disabled /></div>
                <div><label className="form-label">Status</label><div className="mt-1"><StatusBadge status={org.status} /></div></div>
              </div>
              {profile && (
                <>
                  <div><label className="form-label">Operating Hours</label><input value={profile.operatingHours} className="form-input" disabled /></div>
                  <div><label className="form-label">Emergency Contact</label><input value={profile.emergencyContact} className="form-input" disabled /></div>
                  <div><label className="form-label">Licence Expiry</label><input value={profile.licenseExpiryDate} className="form-input" disabled /></div>
                </>
              )}
              <div className="alert-info rounded-lg text-sm">To update organization or licence details, contact the platform administrator.</div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

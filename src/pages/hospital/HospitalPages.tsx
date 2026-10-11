import React, { useState } from 'react';
import {
  LayoutDashboard, Plus, List, Bell, BarChart2, Settings,
  Activity, Clock, CheckCircle, AlertTriangle, XCircle,
  ChevronRight, Droplets, MapPin, Phone
} from 'lucide-react';
import { useLifeLink } from '../../context/LifeLinkContext';
import { SidebarLayout, PageHeader } from '../../components/layout/SidebarLayout';
import { StatusBadge, UrgencyBadge, EmptyState, Modal } from '../../components/shared/ui';
import { appState, formatRelativeTime, formatDateTime } from '../../store/appState';
import type { BloodComponent, BloodGroup, UrgencyLevel, RequestStatus } from '../../types/lifelink';
import { BLOOD_COMPONENT_LABELS, URGENCY_LABELS } from '../../types/lifelink';

function useHospitalNav() {
  const { navigate, currentUser } = useLifeLink();
  const orgId = currentUser?.organizationId || '';
  const unread = appState.notifications.filter(n => n.recipientOrgId === orgId && !n.isRead).length;

  const items = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Overview', view: 'HOSPITAL_DASHBOARD' as const },
    { icon: <Plus className="w-4 h-4" />, label: 'New Blood Request', view: 'HOSPITAL_NEW_REQUEST' as const },
    { icon: <List className="w-4 h-4" />, label: 'My Requests', view: 'HOSPITAL_REQUESTS' as const },
    { icon: <Activity className="w-4 h-4" />, label: 'Blood Bank Responses', view: 'HOSPITAL_RESPONSES' as const },
    { icon: <Bell className="w-4 h-4" />, label: 'Notifications', view: 'HOSPITAL_NOTIFICATIONS' as const, badge: unread },
    { icon: <BarChart2 className="w-4 h-4" />, label: 'Reports', view: 'HOSPITAL_REPORTS' as const },
    { icon: <Settings className="w-4 h-4" />, label: 'Settings', view: 'HOSPITAL_SETTINGS' as const },
  ];
  return { items, orgId };
}

export function HospitalDashboardPage() {
  const { currentUser, navigate } = useLifeLink();
  const { items, orgId } = useHospitalNav();
  const org = appState.getOrgById(orgId);
  const requests = appState.getRequestsForHospital(orgId);

  const stats = {
    active: requests.filter(r => !['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(r.status)).length,
    fulfilled: requests.filter(r => r.status === 'FULFILLED').length,
    critical: requests.filter(r => r.urgency === 'CRITICAL' && !['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(r.status)).length,
    awaitingResponse: requests.filter(r => r.status === 'AWAITING_RESPONSES').length,
  };

  return (
    <SidebarLayout title="Hospital Portal" subtitle={org?.name} items={items}>
      <div className="p-6">
        {org?.status !== 'VERIFIED' && (
          <div className="alert-warning rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <strong>Verification Pending</strong>
              <p className="text-xs mt-0.5">Your organization is awaiting administrator verification. Blood requests cannot be distributed until your account is verified.</p>
            </div>
          </div>
        )}

        <PageHeader
          title={`Welcome, ${currentUser?.name.split(' ').slice(0, 2).join(' ')}`}
          description={`${org?.name || 'Hospital'} — Blood Coordination Portal`}
          actions={
            <button onClick={() => navigate('HOSPITAL_NEW_REQUEST')} className="btn-primary">
              <Plus className="w-4 h-4" /> New Request
            </button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Requests', value: stats.active, color: 'text-teal-700', bg: 'bg-teal-50', icon: <Activity className="w-5 h-5 text-teal-600" /> },
            { label: 'Critical', value: stats.critical, color: 'text-red-700', bg: 'bg-red-50', icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
            { label: 'Awaiting Responses', value: stats.awaitingResponse, color: 'text-amber-700', bg: 'bg-amber-50', icon: <Clock className="w-5 h-5 text-amber-500" /> },
            { label: 'Fulfilled', value: stats.fulfilled, color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> },
          ].map(s => (
            <div key={s.label} className={`card p-4 ${s.bg}`}>
              <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs font-medium text-slate-500">{s.label}</span></div>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Recent requests */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Requests</h2>
            <button onClick={() => navigate('HOSPITAL_REQUESTS')} className="text-sm text-teal-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            {requests.length === 0 ? (
              <div className="p-8 text-center">
                <EmptyState
                  icon={<Droplets className="w-12 h-12" />}
                  title="No requests yet"
                  description="Create your first blood request to get started."
                  action={<button onClick={() => navigate('HOSPITAL_NEW_REQUEST')} className="btn-primary">Create Request</button>}
                />
              </div>
            ) : (
              <table className="table">
                <thead><tr><th>Reference</th><th>Component</th><th>Urgency</th><th>Status</th><th>Required By</th><th>Updated</th><th></th></tr></thead>
                <tbody>
                  {requests.slice(0, 8).map(r => (
                    <tr key={r.id}>
                      <td className="font-mono text-xs font-semibold text-slate-700">{r.referenceNumber}</td>
                      <td>
                        <div className="text-xs font-medium">{BLOOD_COMPONENT_LABELS[r.bloodComponent]}</div>
                        {r.bloodGroup && <div className="text-[11px] text-red-600 font-bold">{r.bloodGroup}</div>}
                      </td>
                      <td><UrgencyBadge urgency={r.urgency} /></td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="text-xs">{formatDateTime(r.requiredBy)}</td>
                      <td className="text-xs text-slate-400">{formatRelativeTime(r.updatedAt)}</td>
                      <td>
                        <button onClick={() => navigate('HOSPITAL_REQUEST_DETAIL', { requestId: r.id })} className="text-xs text-teal-600 hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS: BloodComponent[] = ['PACKED_RED_CELLS', 'WHOLE_BLOOD', 'PLATELETS', 'FRESH_FROZEN_PLASMA', 'CRYOPRECIPITATE', 'GRANULOCYTES'];

export function HospitalNewRequestPage() {
  const { createRequest, navigate, currentUser } = useLifeLink();
  const { items, orgId } = useHospitalNav();
  const org = appState.getOrgById(orgId);

  const [form, setForm] = useState({
    department: '',
    clinicianContact: '',
    bloodComponent: '' as BloodComponent | '',
    bloodGroup: '' as BloodGroup | '',
    quantityUnits: '1',
    urgency: 'URGENT' as UrgencyLevel,
    requiredBy: '',
    collectionLocation: '',
    additionalRequirements: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState('');

  const f = (k: string) => ({
    value: form[k as keyof typeof form] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.bloodComponent) { setError('Please select a blood component.'); return; }
    if (parseInt(form.quantityUnits) < 1) { setError('Quantity must be at least 1.'); return; }
    if (!form.requiredBy) { setError('Please specify the required-by time.'); return; }

    setSubmitting(true);
    const result = createRequest({
      department: form.department,
      clinicianContact: form.clinicianContact,
      bloodComponent: form.bloodComponent,
      bloodGroup: form.bloodGroup || undefined,
      quantityUnits: parseInt(form.quantityUnits),
      urgency: form.urgency,
      requiredBy: form.requiredBy,
      collectionLocation: form.collectionLocation,
      additionalRequirements: form.additionalRequirements || undefined,
    });
    setSubmitting(false);

    if (result.ok) {
      setSuccess(result.trackingCode || '');
    } else {
      setError(result.error || 'Failed to create request.');
    }
  };

  if (success) {
    return (
      <SidebarLayout title="Hospital Portal" subtitle={org?.name} items={items}>
        <div className="p-6 max-w-lg">
          <div className="card p-8 text-center">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Request Created & Distributed</h2>
            <p className="text-sm text-slate-500 mb-4">
              Your blood request has been submitted and distributed to participating blood banks in the network.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-slate-500 mb-1">Patient / Family Tracking Code</p>
              <p className="text-4xl font-mono font-bold text-teal-700 tracking-widest">{success}</p>
              <p className="text-xs text-slate-400 mt-1">Share this code with the patient's family to track status.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('HOSPITAL_REQUESTS')} className="btn-primary flex-1 justify-center">View All Requests</button>
              <button onClick={() => { setSuccess(null); setForm({ department: '', clinicianContact: '', bloodComponent: '', bloodGroup: '', quantityUnits: '1', urgency: 'URGENT', requiredBy: '', collectionLocation: '', additionalRequirements: '' }); }} className="btn-secondary">New Request</button>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Hospital Portal" subtitle={org?.name} items={items}>
      <div className="p-6 max-w-2xl">
        <PageHeader title="New Blood Request" description="Complete all required fields to create and distribute a blood request." />

        {org?.status !== 'VERIFIED' && (
          <div className="alert-error rounded-xl mb-6 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Your organization is not verified. Requests cannot be distributed to blood banks until verification is complete.</span>
          </div>
        )}

        <div className="alert-warning rounded-xl mb-6 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div>
            <strong>Clinical Responsibility Reminder:</strong> Only create requests for blood components authorized by the treating clinician.
            ABO/Rh group must be established by the clinical team. This platform does not prescribe blood groups or guarantee compatibility.
            Compatibility assessment and transfusion decisions remain the responsibility of qualified clinical personnel.
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="form-label">Requesting Department *</label><input required {...f('department')} className="form-input" placeholder="e.g. Surgical ICU" /></div>
                <div><label className="form-label">Authorised Clinician / Contact *</label><input required {...f('clinicianContact')} className="form-input" placeholder="e.g. Dr. Name, Ext. 2050" /></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Blood Component *</label>
                  <select required {...f('bloodComponent')} className="form-select">
                    <option value="">Select component</option>
                    {COMPONENTS.map(c => <option key={c} value={c}>{BLOOD_COMPONENT_LABELS[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">ABO/RhD Group <span className="text-slate-400 font-normal">(if established by clinical team)</span></label>
                  <select {...f('bloodGroup')} className="form-select">
                    <option value="">Not specified / To be determined</option>
                    {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Quantity (units) *</label>
                  <input required type="number" min="1" max="50" {...f('quantityUnits')} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Urgency *</label>
                  <select {...f('urgency')} className="form-select">
                    <option value="CRITICAL">Critical — Immediate</option>
                    <option value="URGENT">Urgent — Within hours</option>
                    <option value="ROUTINE">Routine — Planned</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Required By *</label>
                  <input required type="datetime-local" {...f('requiredBy')} className="form-input" min={new Date().toISOString().slice(0, 16)} />
                </div>
              </div>

              <div>
                <label className="form-label">Collection / Delivery Location *</label>
                <input required {...f('collectionLocation')} className="form-input" placeholder="e.g. Blood Bank Counter, Ward B" />
              </div>

              <div>
                <label className="form-label">Additional Requirements <span className="text-slate-400 font-normal">(clinical communication only, access-controlled)</span></label>
                <textarea rows={2} {...f('additionalRequirements')} className="form-input resize-none" placeholder="Irradiated, CMV-negative, leukodepleted, etc. — authorized clinical communication only" />
              </div>

              {error && <div className="alert-error rounded-lg text-sm">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting || org?.status !== 'VERIFIED'} className="btn-primary flex-1 justify-center py-2.5">
                  {submitting ? 'Creating...' : 'Create & Distribute Request'}
                </button>
                <button type="button" onClick={() => navigate('HOSPITAL_DASHBOARD')} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export function HospitalRequestsPage() {
  const { navigate, transitionRequest } = useLifeLink();
  const { items, orgId } = useHospitalNav();
  const org = appState.getOrgById(orgId);
  const [filter, setFilter] = useState('ALL');
  const requests = appState.getRequestsForHospital(orgId);

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);

  return (
    <SidebarLayout title="Hospital Portal" subtitle={org?.name} items={items}>
      <div className="p-6">
        <PageHeader
          title="Blood Requests"
          actions={<button onClick={() => navigate('HOSPITAL_NEW_REQUEST')} className="btn-primary"><Plus className="w-4 h-4" /> New Request</button>}
        />
        <div className="flex gap-2 mb-4 flex-wrap">
          {['ALL', 'AWAITING_RESPONSES', 'RESERVED', 'FULFILLED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === s ? 'bg-teal-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div className="card">
          {filtered.length === 0 ? (
            <div className="p-8"><EmptyState icon={<List className="w-10 h-10" />} title="No requests found" /></div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Reference</th><th>Component</th><th>Qty</th><th>Urgency</th><th>Status</th><th>Required By</th><th>Tracking</th><th></th></tr></thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td className="font-mono text-xs font-semibold">{r.referenceNumber}</td>
                      <td className="text-xs">
                        <div className="font-medium">{BLOOD_COMPONENT_LABELS[r.bloodComponent]}</div>
                        {r.bloodGroup && <div className="text-red-600 font-bold">{r.bloodGroup}</div>}
                      </td>
                      <td className="font-semibold">{r.quantityUnits}</td>
                      <td><UrgencyBadge urgency={r.urgency} /></td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="text-xs">{formatDateTime(r.requiredBy)}</td>
                      <td className="font-mono text-sm text-teal-700 font-bold">{r.trackingCode}</td>
                      <td className="flex gap-2">
                        <button onClick={() => navigate('HOSPITAL_REQUEST_DETAIL', { requestId: r.id })} className="text-xs text-teal-600 hover:underline">View</button>
                        {!['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(r.status) && (
                          <button onClick={() => { if (confirm('Cancel this request?')) transitionRequest(r.id, 'CANCELLED', 'Cancelled by hospital'); }} className="text-xs text-red-500 hover:underline">Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

export function HospitalRequestDetailPage() {
  const { selectedRequestId, navigate, transitionRequest } = useLifeLink();
  const { items, orgId } = useHospitalNav();
  const org = appState.getOrgById(orgId);
  const request = appState.bloodRequests.find(r => r.id === selectedRequestId);
  const responses = request ? appState.getResponsesForRequest(request.id) : [];
  const history = request ? appState.requestStatusHistory.filter(h => h.requestId === request.id) : [];

  if (!request) {
    return (
      <SidebarLayout title="Hospital Portal" subtitle={org?.name} items={items}>
        <div className="p-6"><EmptyState title="Request not found" description="The selected request could not be found." action={<button onClick={() => navigate('HOSPITAL_REQUESTS')} className="btn-secondary">Back to Requests</button>} /></div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Hospital Portal" subtitle={org?.name} items={items}>
      <div className="p-6 max-w-3xl">
        <button onClick={() => navigate('HOSPITAL_REQUESTS')} className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1">
          ← Back to Requests
        </button>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{request.referenceNumber}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <UrgencyBadge urgency={request.urgency} />
              <StatusBadge status={request.status} />
              <span className="text-xs text-slate-400 font-mono">Tracking: {request.trackingCode}</span>
            </div>
          </div>
          {!['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(request.status) && (
            <div className="flex gap-2">
              {request.status === 'PREPARATION_IN_PROGRESS' && (
                <button onClick={() => transitionRequest(request.id, 'FULFILLED', 'Fulfilled by hospital')} className="btn-primary text-sm">Mark Fulfilled</button>
              )}
              <button onClick={() => { if (confirm('Cancel this request?')) transitionRequest(request.id, 'CANCELLED', 'Cancelled by hospital'); }} className="btn-danger text-sm">Cancel</button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="card p-4">
            <h3 className="font-semibold text-sm text-slate-700 mb-3">Request Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Component</dt><dd className="font-medium">{BLOOD_COMPONENT_LABELS[request.bloodComponent]}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Blood Group</dt><dd className="font-bold text-red-600">{request.bloodGroup || 'Not specified'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Quantity</dt><dd className="font-medium">{request.quantityUnits} units</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Department</dt><dd className="font-medium">{request.department}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Clinician</dt><dd className="font-medium text-right">{request.clinicianContact}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Required By</dt><dd className="font-medium">{formatDateTime(request.requiredBy)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Location</dt><dd className="font-medium text-right">{request.collectionLocation}</dd></div>
            </dl>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-sm text-slate-700 mb-3">Status Timeline</h3>
            <div className="space-y-2.5">
              {history.map((h, i) => (
                <div key={h.id} className="flex gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === history.length - 1 ? 'bg-teal-500' : 'bg-slate-200'}`} />
                  <div>
                    <StatusBadge status={h.newStatus} />
                    <span className="text-xs text-slate-400 ml-1">{formatRelativeTime(h.changedAt)}</span>
                    {h.reason && <p className="text-xs text-slate-500 mt-0.5">{h.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Blood bank responses */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-slate-900">Blood Bank Responses ({responses.length})</h2>
          </div>
          <div className="card-body">
            {responses.length === 0 ? (
              <EmptyState icon={<Clock className="w-8 h-8" />} title="Awaiting responses from blood banks" />
            ) : (
              <div className="space-y-3">
                {responses.map(resp => {
                  const bb = appState.getOrgById(resp.bloodBankId);
                  return (
                    <div key={resp.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">{bb?.name}</h4>
                          <div className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="w-3 h-3" />{bb?.city}, {bb?.district}</div>
                        </div>
                        <StatusBadge status={resp.responseStatus} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div><span className="text-slate-500">Confirmed Units:</span> <span className="font-bold text-teal-700">{resp.confirmedUnits}</span></div>
                        {resp.estimatedReadyTime && <div><span className="text-slate-500">Ready Time:</span> <span className="font-medium">{formatDateTime(resp.estimatedReadyTime)}</span></div>}
                      </div>
                      {resp.notes && <p className="text-xs text-slate-600 bg-slate-50 rounded p-2">{resp.notes}</p>}
                      {resp.collectionArrangement && <p className="text-xs text-teal-700 mt-1"><strong>Collection:</strong> {resp.collectionArrangement}</p>}
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                        <Phone className="w-3 h-3" />{bb?.phone}
                        <span className="ml-2">· Responded {formatRelativeTime(resp.respondedAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export function HospitalNotificationsPage() {
  const { currentUser, markNotificationRead, markAllRead } = useLifeLink();
  const { items, orgId } = useHospitalNav();
  const org = appState.getOrgById(orgId);
  const notifications = appState.notifications.filter(n => n.recipientOrgId === orgId);

  return (
    <SidebarLayout title="Hospital Portal" subtitle={org?.name} items={items}>
      <div className="p-6">
        <PageHeader
          title="Notifications"
          actions={<button onClick={() => markAllRead()} className="btn-secondary text-sm">Mark all read</button>}
        />
        <div className="card">
          <div className="card-body space-y-3">
            {notifications.length === 0 ? (
              <EmptyState icon={<Bell className="w-10 h-10" />} title="No notifications" />
            ) : notifications.map(n => (
              <div key={n.id} onClick={() => markNotificationRead(n.id)}
                className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${n.isRead ? 'bg-slate-50' : 'bg-teal-50 border border-teal-100'}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-slate-300' : 'bg-teal-500'}`} />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                    <span className="text-xs text-slate-400 shrink-0">{formatRelativeTime(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export function HospitalResponsesPage() {
  const { navigate } = useLifeLink();
  const { items, orgId } = useHospitalNav();
  const org = appState.getOrgById(orgId);
  const requests = appState.getRequestsForHospital(orgId);
  const allResponses = requests.flatMap(r => {
    const resps = appState.getResponsesForRequest(r.id);
    return resps.map(resp => ({ ...resp, request: r }));
  });

  return (
    <SidebarLayout title="Hospital Portal" subtitle={org?.name} items={items}>
      <div className="p-6">
        <PageHeader title="Blood Bank Responses" description="Responses received from participating blood banks for your requests." />
        <div className="card">
          {allResponses.length === 0 ? (
            <div className="p-8"><EmptyState icon={<Activity className="w-10 h-10" />} title="No responses yet" description="Responses will appear here once blood banks reply to your requests." /></div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Request</th><th>Blood Bank</th><th>Response</th><th>Units Confirmed</th><th>Responded</th><th></th></tr></thead>
                <tbody>
                  {allResponses.map(r => {
                    const bb = appState.getOrgById(r.bloodBankId);
                    return (
                      <tr key={r.id}>
                        <td className="font-mono text-xs font-semibold">{r.request.referenceNumber}</td>
                        <td className="text-sm">{bb?.name}</td>
                        <td><StatusBadge status={r.responseStatus} /></td>
                        <td className="font-bold text-teal-700">{r.confirmedUnits}</td>
                        <td className="text-xs text-slate-400">{formatRelativeTime(r.respondedAt)}</td>
                        <td><button onClick={() => navigate('HOSPITAL_REQUEST_DETAIL', { requestId: r.requestId })} className="text-xs text-teal-600 hover:underline">View Request</button></td>
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

export function HospitalReportsPage() {
  const { items, orgId } = useHospitalNav();
  const org = appState.getOrgById(orgId);
  const requests = appState.getRequestsForHospital(orgId);
  const fulfilled = requests.filter(r => r.status === 'FULFILLED');
  const cancelled = requests.filter(r => r.status === 'CANCELLED');

  return (
    <SidebarLayout title="Hospital Portal" subtitle={org?.name} items={items}>
      <div className="p-6">
        <PageHeader title="Reports" description="Summary of blood request activity for your organization." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Requests', value: requests.length },
            { label: 'Fulfilled', value: fulfilled.length },
            { label: 'Cancelled', value: cancelled.length },
            { label: 'Fulfillment Rate', value: requests.length > 0 ? `${Math.round(fulfilled.length / requests.length * 100)}%` : 'N/A' },
          ].map(s => (
            <div key={s.label} className="stat-card"><div className="stat-label">{s.label}</div><div className="stat-value text-2xl">{s.value}</div></div>
          ))}
        </div>
        <div className="alert-info rounded-xl">
          <span>Detailed analytics including response-time metrics and fulfillment trends will be available after sufficient operational data has been collected.</span>
        </div>
      </div>
    </SidebarLayout>
  );
}

export function HospitalSettingsPage() {
  const { items, orgId } = useHospitalNav();
  const org = appState.getOrgById(orgId);

  return (
    <SidebarLayout title="Hospital Portal" subtitle={org?.name} items={items}>
      <div className="p-6 max-w-xl">
        <PageHeader title="Organization Settings" />
        {org && (
          <div className="card">
            <div className="card-body space-y-4">
              <div><label className="form-label">Organization Name</label><input value={org.name} className="form-input" disabled /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="form-label">District</label><input value={org.district} className="form-input" disabled /></div>
                <div><label className="form-label">Status</label><div className="mt-1"><StatusBadge status={org.status} /></div></div>
              </div>
              <div><label className="form-label">Licence Number</label><input value={org.licenseNumber} className="form-input" disabled /></div>
              <div><label className="form-label">Phone</label><input value={org.phone} className="form-input" disabled /></div>
              <div><label className="form-label">Email</label><input value={org.email} className="form-input" disabled /></div>
              <div className="alert-info rounded-lg text-sm">To update organization details or licence information, contact the platform administrator.</div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

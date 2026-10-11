import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, MapPin, Phone, Heart } from 'lucide-react';
import { appState, formatRelativeTime, formatDateTime } from '../../store/appState';
import { StatusBadge, UrgencyBadge } from '../../components/shared/ui';
import { BLOOD_COMPONENT_LABELS, REQUEST_STATUS_LABELS } from '../../types/lifelink';

export function TrackRequestPage() {
  const [code, setCode] = useState('');
  const [searched, setSearched] = useState(false);
  const [request, setRequest] = useState(appState.bloodRequests[0] ? undefined : undefined);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = appState.trackRequest(code.trim());
    setRequest(found);
    setSearched(true);
  };

  const history = request
    ? appState.requestStatusHistory.filter(h => h.requestId === request.id).sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime())
    : [];

  const getPublicStatusMessage = (status: string) => {
    const messages: Record<string, { msg: string; color: string }> = {
      SUBMITTED: { msg: 'Your request has been submitted and is being processed.', color: 'text-blue-700' },
      AWAITING_RESPONSES: { msg: 'The request has been sent to participating blood banks. Awaiting responses.', color: 'text-amber-700' },
      PARTIALLY_MATCHED: { msg: 'Some blood banks have responded with partial availability. Coordination is in progress.', color: 'text-orange-700' },
      AVAILABILITY_CONFIRMED: { msg: 'Sufficient availability has been confirmed by a participating blood bank.', color: 'text-teal-700' },
      RESERVED: { msg: 'Required units have been reserved. The hospital is coordinating collection.', color: 'text-teal-700' },
      PREPARATION_IN_PROGRESS: { msg: 'Units are being prepared for issue. Collection / delivery in progress.', color: 'text-teal-700' },
      PARTIALLY_FULFILLED: { msg: 'Part of the required quantity has been fulfilled. Coordination continues.', color: 'text-orange-700' },
      FULFILLED: { msg: 'The blood requirement has been fulfilled. Contact the treating hospital for more information.', color: 'text-emerald-700' },
      CANCELLED: { msg: 'This request has been cancelled. Please contact the treating hospital.', color: 'text-slate-600' },
      EXPIRED: { msg: 'This request has expired. Please contact the treating hospital immediately.', color: 'text-red-700' },
      ESCALATED: { msg: 'This request has been escalated due to an unresolved emergency. Contact the hospital and call 108.', color: 'text-red-700' },
    };
    return messages[status] || { msg: REQUEST_STATUS_LABELS[status as keyof typeof REQUEST_STATUS_LABELS] || status, color: 'text-slate-700' };
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Activity className="w-6 h-6 text-teal-600" /> Track Blood Request
        </h1>
        <p className="text-sm text-slate-500">Enter the 6-digit tracking code provided to the patient or family.</p>
      </div>

      {/* Search form */}
      <div className="card mb-6">
        <div className="card-body">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              placeholder="Enter 6-digit tracking code (e.g. 384726)"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="form-input flex-1 font-mono text-lg tracking-widest"
              maxLength={6}
            />
            <button type="submit" className="btn-primary px-6">Track</button>
          </form>
          <p className="text-xs text-slate-400 mt-2">
            Demo codes: <button onClick={() => setCode('384726')} className="text-teal-600 underline">384726</button>,{' '}
            <button onClick={() => setCode('591847')} className="text-teal-600 underline">591847</button>,{' '}
            <button onClick={() => setCode('736412')} className="text-teal-600 underline">736412</button>
          </p>
        </div>
      </div>

      {/* Result */}
      {searched && !request && (
        <div className="card p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">Request not found</h3>
          <p className="text-sm text-slate-500">The tracking code you entered does not match any request. Please check the code and try again, or contact the treating hospital.</p>
          <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
            <strong>Emergency?</strong> Call <a href="tel:108" className="underline font-bold">108</a> or your hospital emergency line immediately.
          </div>
        </div>
      )}

      {request && (
        <div className="space-y-4">
          {/* Status card */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-mono">{request.referenceNumber}</p>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">Request Status</h2>
              </div>
              <div className="flex items-center gap-2">
                <UrgencyBadge urgency={request.urgency} />
                <StatusBadge status={request.status} />
              </div>
            </div>
            <div className="card-body">
              {request.isDemo && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 mb-4 font-medium">
                  ⚠ DEMO DATA — This is fictional demonstration data, not a real blood request.
                </div>
              )}
              <div className={`text-sm font-medium mb-4 ${getPublicStatusMessage(request.status).color}`}>
                {getPublicStatusMessage(request.status).msg}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block">Component</span>
                  <span className="font-medium">{BLOOD_COMPONENT_LABELS[request.bloodComponent]}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Quantity</span>
                  <span className="font-medium">{request.quantityUnits} units</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Required By</span>
                  <span className="font-medium">{formatDateTime(request.requiredBy)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Submitted</span>
                  <span className="font-medium">{formatRelativeTime(request.createdAt)}</span>
                </div>
              </div>
              {/* NOTE: Patient identity is NEVER shown publicly */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                <strong>Privacy note:</strong> Patient name, medical record, and confidential clinical information are not displayed here. Contact the treating hospital for clinical updates.
              </div>
            </div>
          </div>

          {/* Timeline */}
          {history.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-slate-900">Status Timeline</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  {history.map((h, i) => (
                    <div key={h.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-0.5 ${i === history.length - 1 ? 'bg-teal-500' : 'bg-slate-300'}`} />
                        {i < history.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={h.newStatus} />
                          <span className="text-xs text-slate-400">{formatRelativeTime(h.changedAt)}</span>
                        </div>
                        {h.reason && <p className="text-xs text-slate-500 mt-1">{h.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Emergency guidance */}
          {['ESCALATED', 'EXPIRED', 'CANCELLED'].includes(request.status) && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="w-5 h-5 inline mr-2" />
              <strong>Important:</strong> Contact the treating hospital's emergency department immediately. If this is a life-threatening emergency, call <strong>108</strong> without delay.
            </div>
          )}

          <div className="card p-4 text-sm text-slate-600">
            <p className="font-medium mb-1">Need more information?</p>
            <p>Contact the treating hospital directly. For blood-related emergencies in Andhra Pradesh, call <strong>104</strong> (Blood on Wheels) or <strong>108</strong> (Emergency Services).</p>
          </div>
        </div>
      )}
    </div>
  );
}

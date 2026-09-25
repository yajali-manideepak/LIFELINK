import React, { useState } from 'react';
import { useLifeLink } from '../context/LifeLinkContext';
import {
  BloodGroup,
  BloodComponentType,
  UrgencyLevel,
  BloodRequest
} from '../types/lifelink';
import { searchInventory, INVENTORY_STALE_THRESHOLD_MINUTES } from '../services/coordinationEngine';
import {
  AlertTriangle,
  Building2,
  Clock,
  Droplet,
  Heart,
  PlusCircle,
  ShieldCheck,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  User,
  ArrowRight,
  RefreshCw,
  Lock
} from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const {
    requests,
    inventory,
    bloodCentres,
    createEmergencyRequest,
    cancelRequest,
    reserveInventoryForRequest,
    activeRequest,
    setActiveRequestId,
    isStaleSimulated,
    isNetworkOffline
  } = useLifeLink();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form state
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [componentType, setComponentType] = useState<BloodComponentType>('Packed Red Blood Cells');
  const [unitsRequired, setUnitsRequired] = useState<number>(3);
  const [urgency, setUrgency] = useState<UrgencyLevel>('CRITICAL');
  const [department, setDepartment] = useState('Emergency Trauma ICU');
  const [reasonCategory, setReasonCategory] = useState('Severe Trauma Haemorrhage');
  const [contactPerson, setContactPerson] = useState('Dr. Anita Desai');
  const [contactPhone, setContactPhone] = useState('+91 8647 222333');
  const [clinicalNotes, setClinicalNotes] = useState('Crossmatch specimen drawn. Stat requirement.');
  const [requiredByTime, setRequiredByTime] = useState('Within 45 mins');
  
  // Modal messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Cancellation modal state
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Requirement fulfilled from alternate verified source');

  const filteredRequests = requests.filter(req => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return req.status !== 'FULFILLED' && req.status !== 'CANCELLED';
    if (filterStatus === 'FULFILLED') return req.status === 'FULFILLED';
    if (filterStatus === 'CANCELLED') return req.status === 'CANCELLED';
    return req.status === filterStatus;
  });

  const handleOpenCreateModal = () => {
    setErrorMessage(null);
    setDuplicateWarning(null);
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = createEmergencyRequest({
      blood_group: bloodGroup,
      component_type: componentType,
      units_required: Number(unitsRequired),
      urgency,
      hospital_department: department,
      reason_category: reasonCategory,
      contact_person: contactPerson,
      contact_phone: contactPhone,
      clinical_notes: clinicalNotes,
      required_by: requiredByTime
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to create emergency request.');
      return;
    }

    if (result.isDuplicateWarning) {
      setDuplicateWarning('Notice: A similar active request exists for this component and blood group. The request was created with full audit traceability.');
    } else {
      setIsCreateModalOpen(false);
    }
  };

  // Perform live search for active selected request
  const currentReq = activeRequest || requests[0];
  const liveInventorySearchResults = currentReq ? searchInventory(
    currentReq.blood_group,
    currentReq.component_type,
    currentReq.units_required,
    inventory,
    bloodCentres
  ) : null;

  return (
    <div style={{ padding: '1.5rem 0' }}>
      <div className="container">
        {/* Hospital Header Banner */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(2, 132, 199, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={28} color="#38bdf8" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>LifeLink General Hospital</h2>
                  <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={14} /> Verified Hospital Org
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Palnadu District, Andhra Pradesh • Emergency Dispatch Unit • Reg ID: AP-HOSP-2024-0012
                </p>
              </div>
            </div>

            {/* Quick Action Button: CREATE EMERGENCY REQUEST */}
            <button
              onClick={handleOpenCreateModal}
              className="btn btn-emergency btn-lg"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 700 }}
            >
              <PlusCircle size={20} />
              <span>CREATE EMERGENCY REQUEST</span>
            </button>
          </div>
        </div>

        {/* Status Filters Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-surface)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
            {[
              { id: 'ALL', label: 'All Requests' },
              { id: 'ACTIVE', label: 'Active Coordination' },
              { id: 'FULFILLED', label: 'Fulfilled' },
              { id: 'CANCELLED', label: 'Closed / Cancelled' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`btn btn-sm ${filterStatus === f.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', fontSize: '0.8rem' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredRequests.length}</strong> emergency requests
          </div>
        </div>

        {/* Requests Grid and Active Detail */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Requests List Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredRequests.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>No requests match the selected filter.</p>
              </div>
            ) : (
              filteredRequests.map(req => {
                const isSelected = req.id === currentReq?.id;
                const isFulfilled = req.status === 'FULFILLED';
                const isCancelled = req.status === 'CANCELLED';

                return (
                  <div
                    key={req.id}
                    onClick={() => setActiveRequestId(req.id)}
                    className={`card ${isSelected ? 'card-emergency' : ''}`}
                    style={{
                      cursor: 'pointer',
                      borderLeft: isSelected ? '4px solid var(--color-emergency)' : '1px solid var(--border-subtle)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>
                          {req.id}
                        </span>
                        <span className={`badge ${
                          req.urgency === 'CRITICAL' ? 'badge-emergency' : req.urgency === 'URGENT' ? 'badge-warning' : 'badge-neutral'
                        }`} style={{ fontSize: '0.65rem' }}>
                          {req.urgency}
                        </span>
                      </div>

                      <span className={`badge ${
                        isFulfilled ? 'badge-success' : isCancelled ? 'badge-neutral' : 'badge-warning'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0' }}>
                      <div style={{
                        background: 'rgba(225, 29, 72, 0.2)',
                        color: '#fb7185',
                        fontWeight: 800,
                        fontSize: '1.25rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px'
                      }}>
                        {req.blood_group}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                          {req.component_type}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Required: <strong>{req.units_required} Units</strong> • Department: {req.hospital_department}
                        </div>
                      </div>
                    </div>

                    {/* Coordination metrics */}
                    <div style={{
                      background: 'var(--bg-surface)',
                      borderRadius: '6px',
                      padding: '0.45rem 0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      marginTop: '0.5rem'
                    }}>
                      <span style={{ color: '#38bdf8' }}>
                        ✓ {req.inventory_found_units} in inventory
                      </span>
                      <span style={{ color: req.shortage_units > 0 ? '#fbbf24' : 'var(--text-dim)' }}>
                        {req.shortage_units > 0 ? `⚡ Shortage: ${req.shortage_units} units` : 'No shortage'}
                      </span>
                      <span style={{ color: req.units_fulfilled > 0 ? '#34d399' : 'var(--text-dim)' }}>
                        {req.units_fulfilled} fulfilled
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Active Request Details & Inventory-First Coordination Column */}
          {currentReq ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Request Header Card */}
              <div className="card card-elevated">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{currentReq.id}</h3>
                      <span className="badge badge-emergency">{currentReq.urgency}</span>
                      <span className="badge badge-info">{currentReq.status.replace(/_/g, ' ')}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Department: {currentReq.hospital_department} • Reason: {currentReq.reason_category}
                    </p>
                  </div>

                  {currentReq.status !== 'FULFILLED' && currentReq.status !== 'CANCELLED' && (
                    <button
                      onClick={() => setCancellingRequestId(currentReq.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#fb7185', borderColor: 'rgba(225, 29, 72, 0.4)' }}
                    >
                      <XCircle size={14} />
                      <span>Close / Cancel Request</span>
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Coordination Fulfilment Status</span>
                    <span style={{ fontWeight: 700, color: currentReq.units_fulfilled >= currentReq.units_required ? '#34d399' : '#fbbf24' }}>
                      {currentReq.units_fulfilled} of {currentReq.units_required} Units Fulfilled ({Math.round((currentReq.units_fulfilled / currentReq.units_required) * 100)}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (currentReq.units_fulfilled / currentReq.units_required) * 100)}%`,
                      background: currentReq.units_fulfilled >= currentReq.units_required ? '#10b981' : 'linear-gradient(90deg, #f59e0b, #e11d48)'
                    }} />
                  </div>
                </div>

                {/* Clinical Notes & Contact Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Contact Person</span>
                    <strong>{currentReq.contact_person}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Contact Phone</span>
                    <strong>{currentReq.contact_phone}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Required-by Time</span>
                    <strong>{currentReq.required_by}</strong>
                  </div>
                </div>
              </div>

              {/* INVENTORY-FIRST SECTION (Sections 7, 8, 9, 10, 27) */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                      1. Verified Blood-Centre Inventory (Inventory-First Check)
                    </h3>
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                    DGHS / State Licensed Centres
                  </span>
                </div>

                {/* Stale inventory warning (Section 8) */}
                {(liveInventorySearchResults?.hasStaleInventoryWarning || isStaleSimulated) && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#fbbf24',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertTriangle size={18} />
                    <span>Inventory status at connected centre(s) may be outdated (&gt;30 mins). Confirmation with the blood centre is mandatory before assumption of availability.</span>
                  </div>
                )}

                {/* Inventory Table / Cards */}
                {liveInventorySearchResults && liveInventorySearchResults.matches.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {liveInventorySearchResults.matches.map(m => {
                      const isItemStale = m.isStale || isStaleSimulated;
                      return (
                        <div
                          key={m.inventoryItem.id}
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-focus)',
                            borderRadius: '8px',
                            padding: '0.85rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.75rem'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                                {m.bloodCentre?.name || m.inventoryItem.blood_centre_name}
                              </h4>
                              <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                                {m.distanceKm} km away
                              </span>
                              {isItemStale && (
                                <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                                  Stale ({m.minutesSinceUpdate}m ago)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              Available: <strong style={{ color: '#34d399' }}>{m.availableUnits} units</strong> of {m.inventoryItem.blood_group} {m.inventoryItem.component_type}
                              <span style={{ margin: '0 0.4rem' }}>•</span>
                              Storage: {m.inventoryItem.storage_condition}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              onClick={() => reserveInventoryForRequest(m.inventoryItem.id, currentReq.id, 1)}
                              disabled={m.availableUnits <= 0}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Lock size={13} />
                              <span>Reserve 1 Unit</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-surface)', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No verified stock currently available in connected blood centres for {currentReq.blood_group} {currentReq.component_type}.
                    </p>
                  </div>
                )}

                {/* Shortage Decision Banner (Section 9 & 11) */}
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: currentReq.shortage_units > 0 ? 'rgba(225, 29, 72, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  border: currentReq.shortage_units > 0 ? '1px solid rgba(225, 29, 72, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <strong>Inventory Decision: </strong>
                    <span>
                      {currentReq.inventory_found_units} units potentially fulfilled from existing inventory. Shortage: {currentReq.shortage_units} units.
                    </span>
                  </div>
                  {currentReq.shortage_units > 0 && (
                    <span className="badge badge-emergency">DONOR MOBILISATION ACTIVE</span>
                  )}
                </div>
              </div>

              {/* DONOR MOBILISATION SECTION (Section 11, 12, 13, 32) */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-emergency)' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                      2. Potential Voluntary Donor Mobilisation
                    </h3>
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                    Tier 1 (0–5 km) Controlled Escalation
                  </span>
                </div>

                {/* 4 Pillars Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Notified</span>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>
                      {currentReq.notified_donors_count}
                    </h4>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accepted (Willing)</span>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
                      {currentReq.accepted_donors_count}
                    </h4>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Arrived at Centre</span>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24' }}>
                      {currentReq.arrived_donors_count}
                    </h4>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Donation Completed</span>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e11d48' }}>
                      {currentReq.completed_donations_count}
                    </h4>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                  🔒 Note: Donor phone numbers & exact home coordinates are never exposed to preserve donor privacy.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* CREATE EMERGENCY REQUEST MODAL (Section 5) */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-emergency)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>New Emergency Blood Request</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {errorMessage && (
              <div style={{ background: 'rgba(225, 29, 72, 0.15)', border: '1px solid var(--color-emergency)', color: '#fb7185', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {errorMessage}
              </div>
            )}

            {duplicateWarning && (
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fbbf24', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {duplicateWarning}
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Blood Group Required *
                  </label>
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value as BloodGroup)} className="select">
                    {(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as BloodGroup[]).map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Blood Component Type *
                  </label>
                  <select value={componentType} onChange={(e) => setComponentType(e.target.value as BloodComponentType)} className="select">
                    <option value="Packed Red Blood Cells">Packed Red Blood Cells (PRBC)</option>
                    <option value="Platelets">Platelets (RDP / SDP)</option>
                    <option value="Fresh Frozen Plasma">Fresh Frozen Plasma (FFP)</option>
                    <option value="Cryoprecipitate">Cryoprecipitate</option>
                    <option value="Whole Blood">Whole Blood</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Units Required *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={unitsRequired}
                    onChange={(e) => setUnitsRequired(Number(e.target.value))}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Urgency Category *
                  </label>
                  <select value={urgency} onChange={(e) => setUrgency(e.target.value as UrgencyLevel)} className="select">
                    <option value="CRITICAL">CRITICAL (Immediate Life Threat)</option>
                    <option value="URGENT">URGENT (Required in 2-4 Hours)</option>
                    <option value="PLANNED">PLANNED (Operating Theatre Today)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Hospital Department *
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Required-by Time *
                  </label>
                  <input
                    type="text"
                    value={requiredByTime}
                    onChange={(e) => setRequiredByTime(e.target.value)}
                    className="input"
                    placeholder="e.g. Within 45 mins"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Emergency Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Clinical Indication / Reason Category
                </label>
                <input
                  type="text"
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Optional Clinical Notes
                </label>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="textarea"
                  rows={2}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-emergency"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span>Validate & Broadcast Emergency Request</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL / CLOSE REQUEST MODAL (Section 30) */}
      {cancellingRequestId && (
        <div className="modal-overlay" onClick={() => setCancellingRequestId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.5rem', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              Close / Cancel Emergency Request
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Closing request <strong>{cancellingRequestId}</strong> will release any unissued inventory reservations and halt active donor mobilisations.
            </p>

            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Closure Reason *
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="select"
              style={{ marginBottom: '1.25rem' }}
            >
              <option value="Requirement fulfilled from alternate verified source">Requirement fulfilled from alternate verified source</option>
              <option value="Patient stabilized / clinical decision revised">Patient stabilized / clinical decision revised</option>
              <option value="Patient transferred to specialized centre">Patient transferred to specialized centre</option>
              <option value="Duplicate or test entry">Duplicate or test entry</option>
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setCancellingRequestId(null)} className="btn btn-secondary btn-sm">
                Dismiss
              </button>
              <button
                onClick={() => {
                  cancelRequest(cancellingRequestId, cancelReason);
                  setCancellingRequestId(null);
                }}
                className="btn btn-emergency btn-sm"
              >
                Confirm Closure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

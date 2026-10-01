import React, { useState } from 'react';
import { useLifeLink } from '../context/LifeLinkContext';
import {
  BloodComponentType,
  BloodGroup,
  PreScreeningStatus,
  TestingStatus,
  InventoryUnitStatus
} from '../types/lifelink';
import {
  TestTubes,
  ShieldCheck,
  MapPin,
  Clock,
  UserCheck,
  HeartHandshake,
  Microscope,
  Package,
  Layers,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  PlusCircle,
  RefreshCw,
  Droplet,
  Flame,
  Truck
} from 'lucide-react';

export const BloodCentreDashboard: React.FC = () => {
  const {
    bloodCentres,
    inventory,
    donors,
    requests,
    donorNotifications,
    donationEvents,
    confirmDonorArrivalAtCentre,
    recordDonorScreening,
    recordDonationEvent,
    processTestingAndInventory,
    updateInventoryStatus,
    fulfilEmergencyUnits,
    currentUser
  } = useLifeLink();

  // Active blood centre: default to Narasaraopet Blood Centre (bc_narasaraopet)
  const [selectedCentreId, setSelectedCentreId] = useState<string>('bc_narasaraopet');
  const activeCentre = bloodCentres.find(b => b.id === selectedCentreId) || bloodCentres[0];

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'DONOR_PIPELINE' | 'INVENTORY' | 'FULFILMENT'>('DONOR_PIPELINE');

  // Modals state
  const [screeningModalDonor, setScreeningModalDonor] = useState<{ donorId: string; donorName: string; requestId: string } | null>(null);
  const [screeningVitals, setScreeningVitals] = useState({ hb: '14.0', bp: '120/80', weight: '68' });
  const [deferralReason, setDeferralReason] = useState('Low Hemoglobin (< 12.5 g/dL)');

  const [collectionModalDonor, setCollectionModalDonor] = useState<{ donorId: string; donorName: string; requestId: string } | null>(null);
  const [collectionVolume, setCollectionVolume] = useState<number>(450);
  const [collectionType, setCollectionType] = useState<'WHOLE_BLOOD' | 'APHERESIS_PLATELETS' | 'PLASMA'>('WHOLE_BLOOD');

  const [testingModalEvent, setTestingModalEvent] = useState<{ donationId: string; donorName: string } | null>(null);
  const [componentToCreate, setComponentToCreate] = useState<BloodComponentType>('Packed Red Blood Cells');

  // Filtered inventory for this centre
  const centreInventory = inventory.filter(i => i.blood_centre_id === activeCentre.id);

  // Notifications targeting this centre
  const incomingDonors = donorNotifications.filter(n => n.blood_centre_id === activeCentre.id);

  return (
    <div style={{ padding: '1.5rem 0' }}>
      <div className="container">
        {/* Blood Centre Medical Authority Header */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TestTubes size={30} color="#34d399" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>{activeCentre.name}</h2>
                  <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={14} /> Authorised Blood Centre
                  </span>
                  <span className="badge badge-neutral font-mono" style={{ fontSize: '0.7rem' }}>
                    Lic: {activeCentre.license_number}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.2rem' }}>
                  {activeCentre.address} • Operational Status: <strong style={{ color: '#34d399' }}>ACTIVE</strong>
                </p>
              </div>
            </div>

            {/* Centre Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Facility:</label>
              <select
                value={selectedCentreId}
                onChange={(e) => setSelectedCentreId(e.target.value)}
                className="select"
                style={{ width: 'auto', padding: '0.45rem 1rem', fontSize: '0.825rem' }}
              >
                {bloodCentres.map(bc => (
                  <option key={bc.id} value={bc.id}>{bc.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setActiveSubTab('DONOR_PIPELINE')}
            className={`btn ${activeSubTab === 'DONOR_PIPELINE' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem' }}
          >
            <UserCheck size={16} />
            <span>Incoming Donors & Screening ({incomingDonors.filter(d => d.notification_status !== 'DECLINED').length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('INVENTORY')}
            className={`btn ${activeSubTab === 'INVENTORY' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem' }}
          >
            <Layers size={16} />
            <span>Verified Component Inventory ({centreInventory.length} Batches)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('FULFILMENT')}
            className={`btn ${activeSubTab === 'FULFILMENT' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem' }}
          >
            <Truck size={16} />
            <span>Emergency Hospital Orders & Fulfilment</span>
          </button>
        </div>

        {/* 1. DONOR MEDICAL PIPELINE (Section 18, 19, 20, 21, 22, 23, 24) */}
        {activeSubTab === 'DONOR_PIPELINE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Medical Authority Guardrail Callout */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.825rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399' }}>
                <ShieldCheck size={18} />
                <span>
                  <strong>Sole Medical Authority:</strong> Pre-donation screening, DGHS 5-infection testing clearance, and component separation are strictly governed by blood-centre clinical protocols.
                </span>
              </div>
              <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                DGHS Standard
              </span>
            </div>

            {/* Pipeline Stages Grid */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                Active Donor Mobilisation Coordination Pipeline
              </h3>

              {incomingDonors.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>
                  No incoming donors currently assigned to this centre.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {incomingDonors.map(notif => {
                    const matchedEvent = donationEvents.find(e => e.donor_id === notif.donor_id && e.request_id === notif.request_id);

                    return (
                      <div
                        key={notif.id}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-focus)',
                          borderRadius: '8px',
                          padding: '1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '1rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: 'rgba(225, 29, 72, 0.15)',
                            color: '#fb7185',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem'
                          }}>
                            {notif.blood_group}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                                {notif.donor_name}
                              </h4>
                              <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Req: {notif.request_id}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              ETA: <strong>{notif.expected_arrival_time || 'Pending'}</strong> • Radial Distance: ~{notif.distance_km} km
                            </div>
                          </div>
                        </div>

                        {/* Workflow Action Buttons Based on Lifecycle State */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {notif.notification_status === 'ACCEPTED' && (
                            <button
                              onClick={() => void confirmDonorArrivalAtCentre(notif.donor_id, activeCentre.id, notif.request_id)}
                              className="btn btn-primary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <UserCheck size={14} />
                              <span>1. Confirm Physical Arrival</span>
                            </button>
                          )}

                          {notif.notification_status === 'ARRIVED_AT_CENTRE' && !matchedEvent && (
                            <button
                              onClick={() => setScreeningModalDonor({ donorId: notif.donor_id, donorName: notif.donor_name, requestId: notif.request_id })}
                              className="btn btn-warning btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#000', fontWeight: 700 }}
                            >
                              <HeartHandshake size={14} />
                              <span>2. Pre-Screening Assessment</span>
                            </button>
                          )}

                          {matchedEvent && matchedEvent.screening_status === 'SCREENING_PASSED' && !matchedEvent.completed_at && (
                            <button
                              onClick={() => setCollectionModalDonor({ donorId: notif.donor_id, donorName: notif.donor_name, requestId: notif.request_id })}
                              className="btn btn-emergency btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Droplet size={14} />
                              <span>3. Record Collection (450ml)</span>
                            </button>
                          )}

                          {matchedEvent && matchedEvent.testing_status === 'TESTING_PENDING' && (
                            <button
                              onClick={() => setTestingModalEvent({ donationId: matchedEvent.id, donorName: notif.donor_name })}
                              className="btn btn-success btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Microscope size={14} />
                              <span>4. Process DGHS Testing & Component</span>
                            </button>
                          )}

                          {matchedEvent && matchedEvent.testing_status === 'CLEARED_FOR_NEXT_STAGE' && (
                            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle size={13} /> Unit Prepared & Stocked
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. VERIFIED COMPONENT INVENTORY (Section 24, 25, 26, 27) */}
        {activeSubTab === 'INVENTORY' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Authoritative Component Inventory</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Component-specific storage & shelf-life tracking for {activeCentre.name}.
                  </p>
                </div>
                <span className="badge badge-info font-mono" style={{ fontSize: '0.7rem' }}>
                  Source of Truth
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-focus)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Component</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Group</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Total Units</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Reserved</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Available</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Storage Protocol</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Expiry Date</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centreInventory.map(item => {
                      const available = Math.max(0, item.units - item.reserved_units);
                      const isAvailable = item.inventory_status === 'AVAILABLE';

                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#fff' }}>
                            {item.component_type}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span className="badge badge-emergency" style={{ fontSize: '0.7rem' }}>
                              {item.blood_group}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>
                            {item.units}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#fbbf24', fontWeight: 600 }}>
                            {item.reserved_units}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#34d399', fontWeight: 800 }}>
                            {available}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.storage_condition}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(item.expiry_date).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span className={`badge ${isAvailable ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                              {item.inventory_status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                            <select
                              value={item.inventory_status}
                              onChange={(e) => { void updateInventoryStatus(item.id, e.target.value as InventoryUnitStatus); }}
                              className="select"
                              style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              <option value="AVAILABLE">Available</option>
                              <option value="RESERVED">Reserved</option>
                              <option value="QUARANTINED">Quarantined</option>
                              <option value="ISSUED">Issued</option>
                              <option value="EXPIRED">Expired</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. EMERGENCY ORDERS & FULFILMENT (Section 28 & 29) */}
        {activeSubTab === 'FULFILMENT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                Hospital Emergency Demand Fulfilment
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Authorised blood-centre staff confirms physical release of cross-matched blood units to hospital transport.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {requests.filter(r => r.status !== 'CANCELLED').map(req => {
                  const isFulfilled = req.units_fulfilled >= req.units_required;

                  return (
                    <div
                      key={req.id}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-focus)',
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="font-mono" style={{ fontWeight: 700, color: '#fff' }}>{req.id}</span>
                          <span className="badge badge-emergency">{req.blood_group}</span>
                          <span className="badge badge-neutral">{req.component_type}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                          Hospital: <strong>{req.hospital_name}</strong> • Department: {req.hospital_department} • Contact: {req.contact_person} ({req.contact_phone})
                        </div>
                        <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                          Fulfilment Status: <strong style={{ color: isFulfilled ? '#34d399' : '#fbbf24' }}>{req.units_fulfilled} of {req.units_required} Units Supplied</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {!isFulfilled ? (
                          <>
                            <button
                              onClick={() => void fulfilEmergencyUnits(req.id, activeCentre.id, 1)}
                              className="btn btn-secondary btn-sm"
                            >
                              Dispatch 1 Unit
                            </button>
                            <button
                              onClick={() => void fulfilEmergencyUnits(req.id, activeCentre.id, req.units_required - req.units_fulfilled)}
                              className="btn btn-success btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Truck size={14} />
                              <span>Fulfil Entire Remaining ({req.units_required - req.units_fulfilled} Units)</span>
                            </button>
                          </>
                        ) : (
                          <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem' }}>
                            <CheckCircle size={14} /> Fulfilment Completed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: PRE-SCREENING ASSESSMENT (Section 19 & 20) */}
      {screeningModalDonor && (
        <div className="modal-overlay" onClick={() => setScreeningModalDonor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              Donor Pre-Screening Assessment: {screeningModalDonor.donorName}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Authorised Medical Officer must evaluate medical history questionnaire, hemoglobin levels, and vital signs.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Hemoglobin (g/dL) *</label>
                <input
                  type="text"
                  value={screeningVitals.hb}
                  onChange={(e) => setScreeningVitals({ ...screeningVitals, hb: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Blood Pressure *</label>
                <input
                  type="text"
                  value={screeningVitals.bp}
                  onChange={(e) => setScreeningVitals({ ...screeningVitals, bp: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Weight (kg) *</label>
                <input
                  type="text"
                  value={screeningVitals.weight}
                  onChange={(e) => setScreeningVitals({ ...screeningVitals, weight: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div style={{ background: 'rgba(225, 29, 72, 0.08)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#fb7185', marginBottom: '1.25rem' }}>
              🔒 <strong>Medical Privacy Guardrail:</strong> If the donor is deferred or rejected, clinical reasons remain confidential at the blood centre. The hospital only receives a generic coordination update.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  void recordDonorScreening(screeningModalDonor.donorId, activeCentre.id, screeningModalDonor.requestId, 'DEFERRED', deferralReason);
                  setScreeningModalDonor(null);
                }}
                className="btn btn-secondary btn-sm"
                style={{ color: '#fb7185' }}
              >
                Medical Deferral
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setScreeningModalDonor(null)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void recordDonorScreening(screeningModalDonor.donorId, activeCentre.id, screeningModalDonor.requestId, 'PASSED');
                    setScreeningModalDonor(null);
                  }}
                  className="btn btn-success btn-sm"
                >
                  ✓ Approve for Collection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD DONATION COLLECTION (Section 21) */}
      {collectionModalDonor && (
        <div className="modal-overlay" onClick={() => setCollectionModalDonor(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              Record Phlebotomy Collection: {collectionModalDonor.donorName}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Confirm collection volume and assign pilot tubes for mandatory serological testing.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Collection Volume (ml)</label>
                <select
                  value={collectionVolume}
                  onChange={(e) => setCollectionVolume(Number(e.target.value))}
                  className="select"
                >
                  <option value={450}>450 ml (Standard Adult Whole Blood)</option>
                  <option value={350}>350 ml (Pediatric / Low Volume)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Donation Type</label>
                <select
                  value={collectionType}
                  onChange={(e) => setCollectionType(e.target.value as any)}
                  className="select"
                >
                  <option value="WHOLE_BLOOD">Whole Blood</option>
                  <option value="APHERESIS_PLATELETS">Apheresis Platelets (Single Donor)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setCollectionModalDonor(null)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={() => {
                  void recordDonationEvent(collectionModalDonor.donorId, activeCentre.id, collectionModalDonor.requestId, collectionVolume, collectionType);
                  setCollectionModalDonor(null);
                }}
                className="btn btn-emergency btn-sm"
              >
                Confirm Blood Collection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DGHS TESTING & COMPONENT PROCESSING (Section 22, 23, 24, 25) */}
      {testingModalEvent && (
        <div className="modal-overlay" onClick={() => setTestingModalEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              Mandatory Testing & Component Preparation
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              India DGHS Transfusion Mandate: Serological screening for 5 Transfusion-Transmissible Infections (HIV, HBV, HCV, Syphilis, Malaria).
            </p>

            <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '0.35rem' }}>DGHS 5-Marker Serology Panel:</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                {['HIV I & II', 'HBsAg (HBV)', 'HCV Ab', 'Syphilis (VDRL)', 'Malaria'].map(m => (
                  <div key={m} style={{ background: 'var(--bg-surface-elevated)', padding: '0.35rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m}</div>
                    <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.75rem' }}>Non-Reactive</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Component Prepared from Cleared Unit:
              </label>
              <select
                value={componentToCreate}
                onChange={(e) => setComponentToCreate(e.target.value as BloodComponentType)}
                className="select"
              >
                <option value="Packed Red Blood Cells">Packed Red Blood Cells (PRBC - 42 days at 2-6°C)</option>
                <option value="Platelets">Platelets (5 days shelf life at 20-24°C agitated)</option>
                <option value="Fresh Frozen Plasma">Fresh Frozen Plasma (FFP - 1 year frozen)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"                  onClick={() => {
                    void processTestingAndInventory(testingModalEvent.donationId, 'REACTIVE', componentToCreate, 1);
                    setTestingModalEvent(null);
                  }}
                className="btn btn-secondary btn-sm"
                style={{ color: '#fb7185' }}
              >
                Mark Reactive / Quarantine
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setTestingModalEvent(null)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void processTestingAndInventory(testingModalEvent.donationId, 'CLEARED', componentToCreate, 1);
                    setTestingModalEvent(null);
                  }}
                  className="btn btn-success btn-sm"
                >
                  ✓ Non-Reactive: Add Unit to Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

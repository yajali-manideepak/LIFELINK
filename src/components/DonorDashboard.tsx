import React, { useState } from 'react';
import { useLifeLink } from '../context/LifeLinkContext';
import { getDonorEligibilityAdvisory } from '../services/coordinationEngine';
import {
  Heart,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PhoneCall,
  Navigation,
  Calendar,
  Award,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';

export const DonorDashboard: React.FC = () => {
  const {
    currentUser,
    donors,
    donorNotifications,
    respondToDonorRequest,
    toggleDonorAvailability,
    bloodCentres,
    donationEvents
  } = useLifeLink();

  // Find donor matching current user, or fallback to Ravi Kumar (dn_01_ravi)
  const currentDonor = donors.find(d => d.user_id === currentUser.id) || donors[0];
  const eligibility = getDonorEligibilityAdvisory(currentDonor);

  const [etaMinutes, setEtaMinutes] = useState<number>(20);

  // Incoming notifications for this donor
  const myNotifications = donorNotifications.filter(n => n.donor_id === currentDonor.id);

  // Completed past donation events
  const myPastDonations = donationEvents.filter(e => e.donor_id === currentDonor.id);

  const preferredCentre = bloodCentres.find(b => b.id === currentDonor.preferred_blood_centre_id) || bloodCentres[0];

  return (
    <div style={{ padding: '1.5rem 0' }}>
      <div className="container">
        {/* Availability Toggle Hero Card */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e293b, #111827)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(225, 29, 72, 0.2)',
                border: '1px solid rgba(225, 29, 72, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Heart size={30} color="#fb7185" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>{currentDonor.name}</h2>
                  <span className="badge badge-emergency" style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                    {currentDonor.blood_group}
                  </span>
                  <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={13} /> Phone Verified
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.2rem' }}>
                  Registered Voluntary Donor • Approx. {currentDonor.approximate_distance_km} km from Narasaraopet Centre • {currentDonor.gender}
                </p>
              </div>
            </div>

            {/* Emergency Availability Toggle (Section 33) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'var(--bg-surface)', padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-lg)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Emergency Status</span>
                <strong style={{ fontSize: '0.85rem', color: currentDonor.availability ? '#34d399' : '#fb7185' }}>
                  {currentDonor.availability ? 'AVAILABLE FOR EMERGENCY DONATION' : 'UNAVAILABLE / OFF-DUTY'}
                </strong>
              </div>
              <button
                onClick={() => toggleDonorAvailability(currentDonor.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: currentDonor.availability ? '#10b981' : '#64748b'
                }}
                title="Toggle Emergency Availability"
              >
                {currentDonor.availability ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Layout: Emergency Request Feed + Profile Advisory */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Main Feed: Emergency Mobilisation Requests */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Emergency Blood Donation Requests</span>
              <span className="badge badge-emergency">{myNotifications.length}</span>
            </h3>

            {myNotifications.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>No Active Emergency Requests</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '420px', margin: '0.5rem auto 0' }}>
                  You are registered and available. If a nearby verified hospital faces an urgent shortage of {currentDonor.blood_group}, you will receive a priority notification here.
                </p>
              </div>
            ) : (
              myNotifications.map(notif => {
                const isAccepted = notif.notification_status === 'ACCEPTED' || notif.notification_status === 'ARRIVED_AT_CENTRE';
                const isDeclined = notif.notification_status === 'DECLINED';

                return (
                  <div
                    key={notif.id}
                    className={`card ${isAccepted ? 'card-elevated' : 'card-emergency'}`}
                    style={{
                      borderLeft: isAccepted ? '4px solid #10b981' : '4px solid var(--color-emergency)',
                      position: 'relative'
                    }}
                  >
                    {/* Alert Banner */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-emergency" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          🚨 EMERGENCY DONATION REQUEST
                        </span>
                        <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {notif.request_id}
                        </span>
                      </div>

                      <span className={`badge ${
                        isAccepted ? 'badge-success' : isDeclined ? 'badge-neutral' : 'badge-warning'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {notif.notification_status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
                      Urgent Need for {notif.blood_group} Blood
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      A nearby hospital emergency unit is experiencing a verified shortage. Your prompt voluntary participation can assist patient care.
                    </p>

                    {/* Details Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-dim)', display: 'block' }}>Target Blood Centre</span>
                        <strong style={{ color: '#38bdf8' }}>{notif.blood_centre_name}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-dim)', display: 'block' }}>Approximate Distance</span>
                        <strong>~{notif.distance_km} km away</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-dim)', display: 'block' }}>Dispatch Tier</span>
                        <strong>Tier {notif.tier} (0–5 km)</strong>
                      </div>
                    </div>

                    {/* CRITICAL MEDICAL GUARDRAIL NOTICE (Section 3 & 48) */}
                    <div style={{
                      background: 'rgba(2, 132, 199, 0.12)',
                      border: '1px solid rgba(2, 132, 199, 0.3)',
                      color: '#7dd3fc',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <Info size={16} color="#38bdf8" />
                      <span>
                        <strong>Medical Note:</strong> You may be eligible to donate for this emergency. Final eligibility and medical suitability will be determined by the blood centre upon arrival.
                      </span>
                    </div>

                    {/* Action States */}
                    {!isAccepted && !isDeclined ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated Arrival Time:</label>
                          <select
                            value={etaMinutes}
                            onChange={(e) => setEtaMinutes(Number(e.target.value))}
                            className="select"
                            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            <option value={15}>Arriving in 15 mins</option>
                            <option value={25}>Arriving in 25 mins</option>
                            <option value={40}>Arriving in 40 mins</option>
                            <option value={60}>Arriving in 1 hour</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => respondToDonorRequest(notif.id, 'ACCEPT', etaMinutes)}
                            className="btn btn-emergency"
                            style={{ flex: 1, fontWeight: 700 }}
                          >
                            I'M WILLING TO DONATE
                          </button>
                          <button
                            onClick={() => respondToDonorRequest(notif.id, 'DECLINE')}
                            className="btn btn-secondary"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ) : isAccepted ? (
                      /* Post-Acceptance Instructions & Navigation (Section 15) */
                      <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                          <CheckCircle2 size={18} />
                          <span>Thank you for responding! Please proceed to the blood centre:</span>
                        </div>

                        <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                          <p><strong>{notif.blood_centre_name}</strong></p>
                          <p style={{ color: 'var(--text-muted)' }}>Govt Hospital Road, Narasaraopet, Palnadu 522601</p>
                          <p style={{ color: 'var(--text-muted)' }}>Registered Arrival ETA: <strong>{notif.expected_arrival_time || '20 mins'}</strong></p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <a
                            href="tel:+918647224455"
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                          >
                            <PhoneCall size={14} /> Call Blood Centre
                          </a>
                          <button
                            onClick={() => alert(`Directions loaded: Proceed via Main Hospital Rd to ${notif.blood_centre_name} (~${notif.distance_km} km).`)}
                            className="btn btn-success btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Navigation size={14} /> Navigate to Blood Centre
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                        You declined this request. You will not receive further notifications for this incident.
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Side Column: Eligibility Advisory & Donor History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Eligibility Rule Advisory (Section 12) */}
            <div className="card">
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={16} color="#38bdf8" />
                <span>Donation Eligibility Advisory</span>
              </h4>

              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                {eligibility.message}
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                <span>Interval Rule: </span>
                <strong style={{ color: '#cbd5e1' }}>
                  {currentDonor.gender === 'FEMALE' ? '120 days (Female)' : '90 days (Male)'}
                </strong>
                <p style={{ marginTop: '0.35rem' }}>
                  * Configurable blood-centre standard. Final medical clearance is conducted on-site.
                </p>
              </div>
            </div>

            {/* Privacy Guarantee Card (Section 35 & 36) */}
            <div className="card" style={{ background: 'rgba(30, 41, 59, 0.7)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} color="#10b981" />
                <span>LifeLink Privacy Protection</span>
              </h4>
              <ul style={{ fontSize: '0.775rem', color: 'var(--text-muted)', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                <li>Your phone number is NEVER published publicly.</li>
                <li>Your exact home coordinates are masked (approximate radial distance only).</li>
                <li>Hospital users cannot view your confidential health profile.</li>
              </ul>
            </div>

            {/* Donation History (Section 33) */}
            <div className="card">
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={16} color="#fbbf24" />
                <span>Donation History ({currentDonor.donations_count} Total)</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last Voluntary Donation:</span>
                  <strong>{currentDonor.last_donation_date || 'None'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Preferred Blood Centre:</span>
                  <strong>{preferredCentre.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Contribution Status:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Active Good Samaritan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

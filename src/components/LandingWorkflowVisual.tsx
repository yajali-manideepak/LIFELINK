import React from 'react';
import { useLifeLink } from '../context/LifeLinkContext';
import {
  Building2,
  TestTubes,
  Users,
  Microscope,
  PackageCheck,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  Play
} from 'lucide-react';

export const LandingWorkflowVisual: React.FC = () => {
  const { setActiveTab, switchUser } = useLifeLink();

  const workflowSteps = [
    {
      num: 1,
      icon: <Building2 size={24} color="#38bdf8" />,
      title: 'Hospital Need',
      desc: 'Verified hospital creates emergency request with blood group, units & required-by time.',
      tab: 'HOSPITAL' as const,
      color: '#38bdf8'
    },
    {
      num: 2,
      icon: <TestTubes size={24} color="#fb7185" />,
      title: 'Verified Inventory Check',
      desc: 'First action: check connected blood centres. Detect fresh vs stale stock and exact shortage.',
      tab: 'HOSPITAL' as const,
      color: '#fb7185'
    },
    {
      num: 3,
      icon: <Users size={24} color="#fbbf24" />,
      title: 'Controlled Mobilisation',
      desc: 'If shortage exists, alert nearby voluntary donors in tiered radii (0–5km). Strict location privacy.',
      tab: 'DONOR' as const,
      color: '#fbbf24'
    },
    {
      num: 4,
      icon: <Microscope size={24} color="#a855f7" />,
      title: 'Medical Authority Workflow',
      desc: 'Donor arrives at blood centre: pre-screening, collection, mandatory DGHS 5-marker testing.',
      tab: 'BLOOD_CENTRE' as const,
      color: '#a855f7'
    },
    {
      num: 5,
      icon: <PackageCheck size={24} color="#34d399" />,
      title: 'Component Stock Creation',
      desc: 'Blood component (PRBC, Platelets, Plasma) prepared with authoritative shelf-life and storage.',
      tab: 'BLOOD_CENTRE' as const,
      color: '#34d399'
    },
    {
      num: 6,
      icon: <CheckCircle2 size={24} color="#10b981" />,
      title: 'Coordinated Fulfilment',
      desc: 'Reserved units dispatched to hospital. Request closed with comprehensive immutable audit trail.',
      tab: 'SIMULATION' as const,
      color: '#10b981'
    }
  ];

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0) 100%)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '2.5rem 0 2rem'
    }}>
      <div className="container">
        {/* Hero Title & Subtext (Section 46) */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(225, 29, 72, 0.15)', border: '1px solid rgba(225, 29, 72, 0.3)', padding: '0.35rem 0.85rem', borderRadius: '9999px', marginBottom: '1rem' }}>
            <HeartPulse size={16} color="#fb7185" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fb7185', letterSpacing: '0.04em' }}>
              REAL-WORLD EMERGENCY COORDINATION
            </span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.2, marginBottom: '0.75rem' }}>
            Emergency Blood Availability & Coordination Network
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Connecting verified hospitals, authorised blood centres, and voluntary donors through one seamless, safety-first coordination workflow.
          </p>

          {/* Quick Login Portals & Guided Scenario Button */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => { switchUser('usr_hosp_1'); setActiveTab('HOSPITAL'); }}
              className="btn btn-secondary"
              style={{ fontWeight: 600 }}
            >
              🏥 Hospital Portal
            </button>
            <button
              onClick={() => { switchUser('usr_donor_ravi'); setActiveTab('DONOR'); }}
              className="btn btn-secondary"
              style={{ fontWeight: 600 }}
            >
              🩸 Donor Portal
            </button>
            <button
              onClick={() => { switchUser('usr_bc_nara'); setActiveTab('BLOOD_CENTRE'); }}
              className="btn btn-secondary"
              style={{ fontWeight: 600 }}
            >
              🧪 Blood Centre Portal
            </button>
            <button
              onClick={() => setActiveTab('SIMULATION')}
              className="btn btn-emergency"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
            >
              <Play size={16} />
              <span>Launch Section 59 Demo Scenario</span>
            </button>
          </div>
        </div>

        {/* Central Workflow Visual (Section 47) */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>SECTION 47 ARCHITECTURE VISUAL</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginTop: '0.35rem' }}>
              The 6-Step Closed-Loop Coordination Lifecycle
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '0.75rem',
            position: 'relative'
          }}>
            {workflowSteps.map((step, idx) => (
              <div
                key={step.num}
                onClick={() => setActiveTab(step.tab)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-focus)',
                  borderRadius: '12px',
                  padding: '1rem 0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = step.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-focus)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--bg-surface-elevated)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: step.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.5rem'
                }}>
                  {step.num}
                </div>

                <div style={{ marginBottom: '0.5rem' }}>
                  {step.icon}
                </div>

                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
                  {step.title}
                </h4>

                <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

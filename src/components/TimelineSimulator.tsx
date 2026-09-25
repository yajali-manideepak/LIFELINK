import React from 'react';
import { useLifeLink } from '../context/LifeLinkContext';
import {
  FileText,
  Search,
  AlertOctagon,
  Megaphone,
  UserCheck,
  MapPin,
  HeartHandshake,
  Microscope,
  CheckCircle2,
  PackageCheck,
  RotateCcw,
  ArrowRight,
  Play,
  Info
} from 'lucide-react';

interface StageConfig {
  step: number;
  label: string;
  icon: React.ReactNode;
  title: string;
  actor: string;
  description: string;
  safetyRule: string;
}

export const TimelineSimulator: React.FC = () => {
  const {
    simulationStep,
    runGuidedScenarioStep,
    resetDemoToScenarioStart,
    activeRequest,
    setActiveTab
  } = useLifeLink();

  const stages: StageConfig[] = [
    {
      step: 0,
      label: 'REQUEST',
      icon: <FileText size={16} />,
      title: 'Emergency Request Created',
      actor: '🏥 Dr. Anita Desai (LifeLink General Hospital)',
      description: 'Hospital logs urgent requirement for 5 units of O+ Packed Red Blood Cells (PRBC) for acute trauma patient in Trauma ICU.',
      safetyRule: 'Unique ID (LL-2026-000184) generated, hospital account verified, duplicate check passed.'
    },
    {
      step: 1,
      label: 'INVENTORY CHECK',
      icon: <Search size={16} />,
      title: 'Inventory-First Search',
      actor: '🔍 LifeLink Coordination Engine',
      description: 'Connected blood centres checked: Narasaraopet Blood Centre has 2 units, Guntur Blood Centre has 1 unit. Total available = 3 units.',
      safetyRule: 'Never represent stale inventory as guaranteed. Narasaraopet updated 3m ago; Guntur updated 7m ago.'
    },
    {
      step: 2,
      label: 'SHORTAGE',
      icon: <AlertOctagon size={16} />,
      title: 'Shortage Detected (2 Units Needed)',
      actor: '⚖️ LifeLink Shortage Calculator',
      description: 'Required: 5 units. Verified inventory: 3 units. Exact shortage: 2 units. System prepares donor mobilisation for remaining shortfall.',
      safetyRule: 'Do not mark inventory delivered merely because it exists. 3 units reserved pending blood centre confirmation.'
    },
    {
      step: 3,
      label: 'DONOR MOBILISATION',
      icon: <Megaphone size={16} />,
      title: 'Controlled Escalation (Tier 1)',
      actor: '📢 LifeLink Escalation Engine',
      description: 'Emergency broadcast dispatched to 5 eligible Tier-1 voluntary donors (0–5 km radius). No spamming; controlled radius.',
      safetyRule: 'Donor location privacy strictly maintained (approximate distance only). Patient identity is NOT broadcast.'
    },
    {
      step: 4,
      label: 'DONOR ACCEPTED',
      icon: <UserCheck size={16} />,
      title: 'Donors Respond: Willing to Donate',
      actor: '🩸 Voluntary Donors (Ravi Kumar & Priya Sharma)',
      description: 'Ravi Kumar (2.3 km, ETA 15m) and Priya Sharma (3.4 km, ETA 25m) accept mobilisation and select Narasaraopet Blood Centre.',
      safetyRule: 'Never tell donors blood will definitely be transfused. Final eligibility is determined by the blood centre.'
    },
    {
      step: 5,
      label: 'DONOR ARRIVED',
      icon: <MapPin size={16} />,
      title: 'Arrival Confirmed at Blood Centre',
      actor: '🧪 M. K. Rao (Narasaraopet Blood Centre)',
      description: 'Donor Ravi Kumar arrives at the authorized blood centre. Blood centre staff physically confirms arrival in LifeLink.',
      safetyRule: 'LifeLink must NOT assume accepting a notification means the donor actually arrived. Physical check-in required.'
    },
    {
      step: 6,
      label: 'DONATION & SCREENING',
      icon: <HeartHandshake size={16} />,
      title: 'Pre-Screening & 450ml Collection',
      actor: '🩺 Blood Centre Medical Team',
      description: 'Donor undergoes medical questionnaire, hemoglobin test (14.1 g/dL), and BP check. Screening passed; 450ml Whole Blood collected.',
      safetyRule: 'Hospital cannot override screening. If donor is deferred, hospital only sees generic continuation, protecting medical privacy.'
    },
    {
      step: 7,
      label: 'TESTING',
      icon: <Microscope size={16} />,
      title: 'Mandatory DGHS Infection Testing',
      actor: '🔬 Blood Centre Serology Lab',
      description: 'Mandatory screening for 5 transfusion-transmissible infections (HIV, HBV, HCV, Syphilis, Malaria). All results non-reactive.',
      safetyRule: 'India DGHS mandate: unit cannot be transfused without testing clearance. LifeLink labels status as Testing Pending.'
    },
    {
      step: 8,
      label: 'COMPONENT PROCESSING',
      icon: <PackageCheck size={16} />,
      title: 'Component Prepared & Inventory Updated',
      actor: '📦 Component Processing Unit',
      description: 'Whole blood separated via centrifugation into Packed Red Blood Cells (PRBC). Expiry set to 42 days at 2–6°C. Stock updated.',
      safetyRule: 'Different components have distinct shelf lives and storage rules. Blood centre is the authoritative source of truth.'
    },
    {
      step: 9,
      label: 'FULFILLED',
      icon: <CheckCircle2 size={16} />,
      title: 'Full Coordinated Fulfilment (5 Units)',
      actor: '🤝 Hospital & Blood Centres Combined',
      description: 'Initial 3 units from inventory + 2 newly processed units = 5 units O+ PRBC delivered. Emergency request LL-2026-000184 closed.',
      safetyRule: 'Full audit log captured with actor IDs, timestamps, previous and final states. Traceability complete.'
    }
  ];

  const currentStage = stages[simulationStep] || stages[0];

  return (
    <div style={{ padding: '1.5rem 0' }}>
      <div className="container">
        {/* Scenario Banner */}
        <div className="card card-elevated" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e1b4b, #111827)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span className="badge badge-emergency">SECTION 59 & 60 SPECIFICATION</span>
                <span className="badge badge-info">Canonical End-to-End Walkthrough</span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff' }}>
                Interactive Emergency Coordination Timeline
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                Hospital Needs 5 Units O+ PRBC → Check Inventory (3 Found) → Shortage (2 Units) → Mobilise Donors → Blood Centre Workflow → Fulfilment
              </p>
            </div>

            {/* Quick Action Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={resetDemoToScenarioStart}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RotateCcw size={14} />
                <span>Reset Demo</span>
              </button>

              <button
                onClick={() => runGuidedScenarioStep(Math.max(0, simulationStep - 1))}
                disabled={simulationStep === 0}
                className="btn btn-secondary btn-sm"
              >
                Prev Stage
              </button>

              <button
                onClick={() => runGuidedScenarioStep(Math.min(stages.length - 1, simulationStep + 1))}
                disabled={simulationStep === stages.length - 1}
                className="btn btn-emergency btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>Advance to Step {Math.min(stages.length - 1, simulationStep + 1)}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Stepper Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${stages.length}, 1fr)`,
            gap: '0.4rem',
            marginTop: '1.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem'
          }}>
            {stages.map((stg) => {
              const isPast = stg.step < simulationStep;
              const isCurrent = stg.step === simulationStep;
              const isFuture = stg.step > simulationStep;

              return (
                <button
                  key={stg.step}
                  onClick={() => runGuidedScenarioStep(stg.step)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0.6rem 0.35rem',
                    borderRadius: '8px',
                    border: isCurrent
                      ? '1px solid var(--color-emergency)'
                      : isPast
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid var(--border-subtle)',
                    background: isCurrent
                      ? 'rgba(225, 29, 72, 0.18)'
                      : isPast
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'var(--bg-surface)',
                    color: isCurrent
                      ? '#fff'
                      : isPast
                      ? '#34d399'
                      : 'var(--text-dim)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                    minWidth: '95px'
                  }}
                >
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: isCurrent
                      ? 'var(--color-emergency)'
                      : isPast
                      ? '#059669'
                      : 'var(--bg-surface-elevated)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.35rem',
                    boxShadow: isCurrent ? '0 0 10px rgba(225, 29, 72, 0.5)' : 'none'
                  }}>
                    {isPast ? <CheckCircle2 size={14} /> : stg.icon}
                  </div>
                  <span style={{ fontSize: '0.675rem', fontWeight: isCurrent ? 700 : 600, letterSpacing: '0.02em' }}>
                    {stg.label}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: isCurrent ? '#fb7185' : 'var(--text-dim)' }}>
                    Step {stg.step}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Stage Detailed Card */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
          {/* Main Stage Details */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(225, 29, 72, 0.2)',
                  color: 'var(--color-emergency)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {currentStage.icon}
                </div>
                <div>
                  <span className="badge badge-emergency" style={{ fontSize: '0.65rem' }}>STAGE {currentStage.step} OF 9</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '0.15rem' }}>
                    {currentStage.title}
                  </h3>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Primary Actor</span>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8' }}>{currentStage.actor}</p>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                Workflow Description
              </h4>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                {currentStage.description}
              </p>
            </div>

            {/* Crucial Guardrail & Safety Principle */}
            <div style={{
              background: 'rgba(225, 29, 72, 0.08)',
              borderLeft: '4px solid var(--color-emergency)',
              padding: '0.85rem 1rem',
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fb7185', fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                <Info size={16} />
                <span>LifeLink Medical Guardrail Adherence</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#fecdd3' }}>
                {currentStage.safetyRule}
              </p>
            </div>

            {/* Quick Context Portal Jump */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                View this stage live in portal:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setActiveTab('HOSPITAL')} className="btn btn-secondary btn-sm">
                  🏥 Hospital View
                </button>
                <button onClick={() => setActiveTab('DONOR')} className="btn btn-secondary btn-sm">
                  🩸 Donor View
                </button>
                <button onClick={() => setActiveTab('BLOOD_CENTRE')} className="btn btn-secondary btn-sm">
                  🧪 Blood Centre View
                </button>
              </div>
            </div>
          </div>

          {/* Side Overview: Live State Metrics for Canonical Request */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Live Request State</span>
              <span className="badge badge-emergency font-mono" style={{ fontSize: '0.7rem' }}>LL-2026-000184</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hospital:</span>
                <span style={{ fontWeight: 600 }}>LifeLink General Hospital</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Required:</span>
                <span style={{ fontWeight: 700, color: '#fb7185' }}>5 Units O+ PRBC</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Found in Inventory:</span>
                <span style={{ fontWeight: 600, color: '#38bdf8' }}>{activeRequest?.inventory_found_units ?? 3} units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Shortage to Mobilise:</span>
                <span style={{ fontWeight: 600, color: '#fbbf24' }}>{activeRequest?.shortage_units ?? 2} units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Donors Notified:</span>
                <span style={{ fontWeight: 600 }}>{activeRequest?.notified_donors_count ?? 12}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Donors Accepted:</span>
                <span style={{ fontWeight: 600, color: '#34d399' }}>{activeRequest?.accepted_donors_count ?? 2}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Donors Arrived:</span>
                <span style={{ fontWeight: 600, color: '#38bdf8' }}>{activeRequest?.arrived_donors_count ?? 1}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Fulfilled:</span>
                <span style={{ fontWeight: 700, color: activeRequest?.units_fulfilled === 5 ? '#34d399' : '#f59e0b' }}>
                  {activeRequest?.units_fulfilled ?? 2} / 5 units
                </span>
              </div>
            </div>

            {/* Progress Visual */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                <span>Fulfilment Progress</span>
                <span>{Math.round(((activeRequest?.units_fulfilled ?? 2) / 5) * 100)}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${((activeRequest?.units_fulfilled ?? 2) / 5) * 100}%`,
                  background: (activeRequest?.units_fulfilled ?? 2) >= 5 ? '#10b981' : 'linear-gradient(90deg, #f59e0b, #e11d48)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

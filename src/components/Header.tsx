import React from 'react';
import { useLifeLink, ViewTab } from '../context/LifeLinkContext';
import {
  Activity,
  HeartPulse,
  Building2,
  Users,
  TestTubes,
  PlayCircle,
  FileText,
  BarChart3,
  WifiOff,
  AlertTriangle,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { DEMO_NOTICE } from '../data/mockData';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    switchUser,
    allUsers,
    isNetworkOffline,
    setIsNetworkOffline,
    activeRequest
  } = useLifeLink();

  const navItems: { tab: ViewTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { tab: 'HOSPITAL', label: 'Hospital Portal', icon: <Building2 size={18} /> },
    { tab: 'DONOR', label: 'Donor Portal', icon: <Users size={18} /> },
    { tab: 'BLOOD_CENTRE', label: 'Blood Centre (Medical Authority)', icon: <TestTubes size={18} /> },
    { tab: 'SIMULATION', label: 'Scenario Simulator', icon: <PlayCircle size={18} />, badge: 'Sec. 59' },
    { tab: 'AUDIT_LOGS', label: 'Audit Trail', icon: <FileText size={18} /> },
    { tab: 'ANALYTICS', label: 'Metrics', icon: <BarChart3 size={18} /> },
  ];

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(11, 15, 25, 0.92)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Top Demo & Guardrail Disclaimer Bar */}
      <div style={{
        background: '#1e1b4b',
        borderBottom: '1px solid rgba(129, 140, 248, 0.2)',
        padding: '0.35rem 1rem',
        fontSize: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
            DEMO MODE
          </span>
          <span style={{ color: '#c7d2fe' }}>
            {DEMO_NOTICE}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94a3b8' }}>
          <span>🔒 Coordination & Communication Layer only</span>
          <span>•</span>
          <span>Medical Authority remains with Authorised Blood Centres</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }} onClick={() => setActiveTab('HOSPITAL')}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #e11d48, #9f1239)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(225, 29, 72, 0.4)'
          }}>
            <HeartPulse size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>LifeLink</h1>
              <span className="badge badge-emergency" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                EMERGENCY NETWORK
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-World Emergency Blood Coordination</p>
          </div>
        </div>

        {/* Center Portal Switcher Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-surface)', padding: '0.3rem', borderRadius: 'var(--radius-lg)' }}>
          {navItems.map(item => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'var(--color-emergency)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '0.65rem',
                    background: isActive ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.1)',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: User Switcher & Emergency Connectivity Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Offline failure mode toggle */}
          <button
            onClick={() => setIsNetworkOffline(!isNetworkOffline)}
            className={`btn btn-sm ${isNetworkOffline ? 'btn-emergency' : 'btn-secondary'}`}
            title="Simulate network outage to verify fail-safe protocol"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}
          >
            {isNetworkOffline ? <WifiOff size={14} /> : <Activity size={14} color="#10b981" />}
            <span>{isNetworkOffline ? 'NET OFFLINE' : 'ONLINE'}</span>
          </button>

          {/* User Persona Switcher */}
          <div style={{ position: 'relative' }}>
            <select
              value={currentUser.id}
              onChange={(e) => switchUser(e.target.value)}
              className="select"
              style={{
                fontSize: '0.8rem',
                padding: '0.45rem 2rem 0.45rem 0.75rem',
                minWidth: '220px',
                cursor: 'pointer',
                background: 'var(--bg-surface)'
              }}
            >
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.role === 'HOSPITAL_STAFF' ? '🏥 ' : u.role === 'DONOR' ? '🩸 ' : '🧪 '}
                  {u.name} ({u.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Offline Alert Banner if activated */}
      {isNetworkOffline && (
        <div style={{
          background: 'linear-gradient(90deg, #991b1b, #dc2626)',
          color: '#fff',
          padding: '0.5rem 1rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={18} />
          <span>NETWORK OUTAGE SIMULATED: Internet unavailable. Please use the blood centre / hospital emergency hotline immediately. LifeLink will not create single points of failure.</span>
        </div>
      )}
    </header>
  );
};

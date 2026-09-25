import React from 'react';
import { LifeLinkProvider, useLifeLink } from './context/LifeLinkContext';
import { Header } from './components/Header';
import { LandingWorkflowVisual } from './components/LandingWorkflowVisual';
import { HospitalDashboard } from './components/HospitalDashboard';
import { DonorDashboard } from './components/DonorDashboard';
import { BloodCentreDashboard } from './components/BloodCentreDashboard';
import { TimelineSimulator } from './components/TimelineSimulator';
import { AuditLogViewer } from './components/AuditLogViewer';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { FailureSandbox } from './components/FailureSandbox';
import { Toast } from './components/Toast';

const MainContent: React.FC = () => {
  const { activeTab } = useLifeLink();

  return (
    <main style={{ paddingBottom: '5rem', minHeight: 'calc(100vh - 120px)' }}>
      {/* Landing Visual Workflow (always accessible at top, or during initial exploration) */}
      <LandingWorkflowVisual />

      {/* Active Tab Router */}
      {activeTab === 'HOSPITAL' && <HospitalDashboard />}
      {activeTab === 'DONOR' && <DonorDashboard />}
      {activeTab === 'BLOOD_CENTRE' && <BloodCentreDashboard />}
      {activeTab === 'SIMULATION' && <TimelineSimulator />}
      {activeTab === 'AUDIT_LOGS' && <AuditLogViewer />}
      {activeTab === 'ANALYTICS' && <AnalyticsDashboard />}

      {/* Bottom Floating Failure Scenario Testing Sandbox (Section 39) */}
      <FailureSandbox />

      {/* High-priority Toast Notification */}
      <Toast />
    </main>
  );
};

export default function App() {
  return (
    <LifeLinkProvider>
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Header />
        <MainContent />
      </div>
    </LifeLinkProvider>
  );
}

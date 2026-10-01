import React from 'react';
import { useLifeLink } from '../context/LifeLinkContext';
import {
  AlertTriangle,
  WifiOff,
  Clock,
  UserX,
  Lock,
  Layers,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export const FailureSandbox: React.FC = () => {
  const {
    isNetworkOffline,
    setIsNetworkOffline,
    isStaleSimulated,
    setIsStaleSimulated,
    reserveInventoryForRequest,
    recordDonorScreening,
    activeRequest
  } = useLifeLink();

  const handleTestConcurrency = () => {
    // Attempt over-reservation to trigger the concurrency guard (§31/§32)
    if (!activeRequest) return;
    void reserveInventoryForRequest('inv_nara_prbc_o_pos_1', activeRequest.id, 99).then(res => {
      window.alert(res.message);
    });
  };

  const handleSimulateDonorDeferral = () => {
    if (!activeRequest) return;
    void recordDonorScreening('dn_01_ravi', 'bc_narasaraopet', activeRequest.id, 'DEFERRED', 'Low Hemoglobin (11.8 g/dL)');
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.95)',
      borderTop: '1px solid var(--border-focus)',
      padding: '0.65rem 1rem',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 90,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 -4px 16px rgba(0,0,0,0.5)'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
            SECTION 39 FAILURE SANDBOX
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Simulate real-world resilience scenarios:
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Offline Mode Toggle */}
          <button
            onClick={() => setIsNetworkOffline(!isNetworkOffline)}
            className={`btn btn-sm ${isNetworkOffline ? 'btn-emergency' : 'btn-secondary'}`}
            style={{ fontSize: '0.725rem', padding: '0.25rem 0.6rem' }}
          >
            <WifiOff size={13} />
            <span>{isNetworkOffline ? 'Disable Net Outage' : 'Simulate Net Failure'}</span>
          </button>

          {/* Stale Inventory Toggle */}
          <button
            onClick={() => setIsStaleSimulated(!isStaleSimulated)}
            className={`btn btn-sm ${isStaleSimulated ? 'btn-warning' : 'btn-secondary'}`}
            style={{ fontSize: '0.725rem', padding: '0.25rem 0.6rem' }}
          >
            <Clock size={13} />
            <span>{isStaleSimulated ? 'Reset Stale Stock' : 'Simulate Stale Stock (>45m)'}</span>
          </button>

          {/* Donor Deferral at Screening */}
          <button
            onClick={handleSimulateDonorDeferral}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.725rem', padding: '0.25rem 0.6rem' }}
          >
            <UserX size={13} />
            <span>Simulate Donor Deferral</span>
          </button>

          {/* Concurrency Over-Reservation */}
          <button
            onClick={handleTestConcurrency}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.725rem', padding: '0.25rem 0.6rem' }}
          >
            <Lock size={13} />
            <span>Test Concurrency Lock</span>
          </button>
        </div>
      </div>
    </div>
  );
};

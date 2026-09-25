import React from 'react';
import { useLifeLink } from '../context/LifeLinkContext';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  X
} from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, dismissToast } = useLifeLink();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'emergency': return <AlertCircle size={20} color="#fb7185" />;
      case 'success': return <CheckCircle2 size={20} color="#34d399" />;
      case 'warning': return <AlertTriangle size={20} color="#fbbf24" />;
      default: return <Info size={20} color="#38bdf8" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'emergency': return 'var(--color-emergency)';
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      default: return '#0284c7';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '3.75rem',
        right: '1.5rem',
        zIndex: 1100,
        maxWidth: '420px',
        width: 'calc(100% - 3rem)',
        background: 'rgba(17, 24, 39, 0.95)',
        border: `1px solid ${getBorderColor()}`,
        borderRadius: '12px',
        padding: '0.85rem 1rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 15px rgba(225, 29, 72, 0.2)',
        backdropFilter: 'blur(8px)',
        animation: 'slideDown 0.25s ease-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ marginTop: '2px' }}>{getIcon()}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{toast.title}</h4>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{toast.timestamp}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>
              {toast.message}
            </p>
          </div>
        </div>
        <button
          onClick={dismissToast}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0.1rem' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

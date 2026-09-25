import React from 'react';
import { useLifeLink } from '../context/LifeLinkContext';
import {
  BarChart3,
  Clock,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Activity,
  Heart,
  Users,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { analytics, requests } = useLifeLink();

  return (
    <div style={{ padding: '1.5rem 0' }}>
      <div className="container">
        {/* Header */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChart3 size={26} color="#34d399" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>Emergency Coordination Analytics</h2>
                  <span className="badge badge-success font-mono" style={{ fontSize: '0.7rem' }}>Section 52</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.2rem' }}>
                  Empirical response metrics tracking actual network latency across inventory search, mobilisation, and delivery.
                </p>
              </div>
            </div>

            <div style={{ background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.3)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.775rem', color: '#7dd3fc' }}>
              <strong>Communication Guardrail (Section 51):</strong> LifeLink measures empirical time rather than promising unrealistic instant delivery.
            </div>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg. Request → Inventory Result</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>{analytics.avg_request_to_inventory_sec}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>seconds</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '0.25rem', display: 'block' }}>
              ⚡ Real-time multi-centre query
            </span>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Request → First Donor Acceptance</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>{Math.round(analytics.avg_request_to_donor_accept_sec / 60)}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>minutes</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '0.25rem', display: 'block' }}>
              Controlled Tier-1 escalation
            </span>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg. Donor Arrival Time</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>{analytics.avg_request_to_donor_arrival_min}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>minutes</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Physical transit to blood centre
            </span>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg. Request → Fulfilment</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e11d48' }}>{analytics.avg_request_to_fulfilment_min}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>minutes</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#fb7185', marginTop: '0.25rem', display: 'block' }}>
              End-to-end clinical dispatch
            </span>
          </div>
        </div>

        {/* Detailed Breakdown Grids */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Fulfilment Distribution */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Inventory vs. Donor Mobilisation Fulfilment Ratio
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span>Fulfilled from Existing Verified Stock</span>
                  <strong style={{ color: '#38bdf8' }}>{analytics.pct_fulfilled_from_inventory}%</strong>
                </div>
                <div style={{ height: '10px', background: 'var(--bg-surface)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${analytics.pct_fulfilled_from_inventory}%`, background: '#0284c7' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span>Required Donor Mobilisation (Shortages)</span>
                  <strong style={{ color: '#e11d48' }}>{analytics.pct_requiring_donor_mobilisation}%</strong>
                </div>
                <div style={{ height: '10px', background: 'var(--bg-surface)', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${analytics.pct_requiring_donor_mobilisation}%`, background: '#e11d48' }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              💡 <strong>Insight:</strong> 65% of units are coordinated immediately from connected blood centre storage, cutting emergency coordination time significantly while keeping mobilisation as a vital safety net.
            </div>
          </div>

          {/* Network Health & Quality Index */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Quality & Reliability Indices
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Donor Response</span>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>{analytics.donor_response_rate_pct}%</h4>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Donor No-Show</span>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb7185' }}>{analytics.donor_no_show_rate_pct}%</h4>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inventory Freshness</span>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>{analytics.inventory_freshness_index_pct}%</h4>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Total Network Requests Handled: <strong>{analytics.total_requests}</strong> • Fulfilled: <strong>{analytics.fulfilled_requests}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

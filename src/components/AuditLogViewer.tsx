import React, { useState } from 'react';
import { useLifeLink } from '../context/LifeLinkContext';
import {
  FileText,
  Shield,
  Search,
  Filter,
  User,
  Clock,
  ArrowRight,
  Database,
  Download,
  Copy,
  Check
} from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs } = useLifeLink();
  const [filterQuery, setFilterQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter(log => {
    const matchesQuery =
      log.action.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.actor_name.toLowerCase().includes(filterQuery.toLowerCase());

    const matchesRole = filterRole === 'ALL' || log.actor_role === filterRole;

    return matchesQuery && matchesRole;
  });

  const handleCopyLog = (id: string, log: any) => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

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
                background: 'rgba(2, 132, 199, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield size={26} color="#38bdf8" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>Immutable System Audit Trail</h2>
                  <span className="badge badge-info font-mono" style={{ fontSize: '0.7rem' }}>Section 38 & 62</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.2rem' }}>
                  Complete traceability across every actor, transition timestamp, previous state, new state, and domain entity.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-neutral font-mono">
                {filteredLogs.length} Logged Events
              </span>
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by action, Entity ID, or Actor name..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="select"
              style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            >
              <option value="ALL">All Roles</option>
              <option value="HOSPITAL_STAFF">Hospital Staff</option>
              <option value="DONOR">Donor</option>
              <option value="BLOOD_CENTRE_STAFF">Blood Centre Staff</option>
              <option value="SYSTEM">System Engine</option>
            </select>
          </div>
        </div>

        {/* Logs Timeline Table */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-focus)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Actor</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Entity ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>State Transition</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const hasTransition = log.previous_state || log.new_state;

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'top' }}>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }} className="font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#fff' }}>
                        {log.actor_name}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge ${
                          log.actor_role === 'HOSPITAL_STAFF' ? 'badge-info' : log.actor_role === 'DONOR' ? 'badge-emergency' : log.actor_role === 'BLOOD_CENTRE_STAFF' ? 'badge-success' : 'badge-neutral'
                        }`} style={{ fontSize: '0.65rem' }}>
                          {log.actor_role.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#f8fafc' }} className="font-mono">
                        {log.action}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className="font-mono" style={{ background: 'var(--bg-surface)', padding: '0.2rem 0.45rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                          {log.entity_id}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {hasTransition ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
                            {log.previous_state && (
                              <span style={{ color: 'var(--text-muted)' }}>{log.previous_state}</span>
                            )}
                            {log.previous_state && log.new_state && <ArrowRight size={12} color="var(--text-dim)" />}
                            {log.new_state && (
                              <span style={{ color: '#34d399', fontWeight: 600 }}>{log.new_state}</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleCopyLog(log.id, log)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                          title="Copy JSON Payload"
                        >
                          {copiedId === log.id ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                          <span>{copiedId === log.id ? 'Copied' : 'JSON'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

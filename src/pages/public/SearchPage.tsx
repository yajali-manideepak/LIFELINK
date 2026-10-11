import React, { useState } from 'react';
import { Search, Filter, Droplets, Clock, MapPin, Phone, AlertTriangle, ChevronDown, RefreshCw } from 'lucide-react';
import { appState, formatRelativeTime, formatDateTime } from '../../store/appState';
import { SafetyDisclaimer, StatusBadge } from '../../components/shared/ui';
import type { BloodComponent, BloodGroup } from '../../types/lifelink';
import { BLOOD_COMPONENT_LABELS } from '../../types/lifelink';

const DISTRICTS = ['Guntur', 'Palnadu'];
const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS: BloodComponent[] = ['PACKED_RED_CELLS', 'WHOLE_BLOOD', 'PLATELETS', 'FRESH_FROZEN_PLASMA', 'CRYOPRECIPITATE'];

export function SearchPage() {
  const [district, setDistrict] = useState('');
  const [component, setComponent] = useState<BloodComponent | ''>('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>('');
  const [minUnits, setMinUnits] = useState('1');
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof appState.searchInventory>>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const res = appState.searchInventory({
      district: district || undefined,
      bloodComponent: component || undefined,
      bloodGroup: bloodGroup || undefined,
      minUnits: parseInt(minUnits) || 1,
    });
    setResults(res);
    setSearched(true);
  };

  const getVerificationColor = (status: string) => {
    if (status === 'RECENTLY_VERIFIED') return 'text-emerald-600';
    if (status === 'UNVERIFIED') return 'text-amber-600';
    if (status === 'STALE') return 'text-red-600';
    return 'text-slate-400';
  };

  const getVerificationLabel = (status: string, lastVerified?: string) => {
    if (status === 'STALE') return `⚠ Stale data (last verified ${lastVerified ? formatRelativeTime(lastVerified) : 'unknown'})`;
    if (status === 'RECENTLY_VERIFIED') return `✓ Verified ${lastVerified ? formatRelativeTime(lastVerified) : ''}`;
    if (status === 'UNVERIFIED') return `~ Last reported ${lastVerified ? formatRelativeTime(lastVerified) : 'unknown'}`;
    return 'Status unknown';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Warn */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-sm text-amber-800">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <strong>Demo Data Only.</strong> All search results display fictional demonstration inventory. This is not real blood availability information.
          For actual blood availability, contact your nearest licensed blood bank or call <strong>104</strong> (Andhra Pradesh Blood on Wheels).
        </div>
      </div>

      {/* Search form */}
      <div className="card mb-6">
        <div className="card-header">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-600" /> Search Blood Availability
          </h1>
        </div>
        <div className="card-body">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="form-label">District</label>
              <select value={district} onChange={e => setDistrict(e.target.value)} className="form-select">
                <option value="">All Districts</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Blood Component</label>
              <select value={component} onChange={e => setComponent(e.target.value as BloodComponent)} className="form-select">
                <option value="">All Components</option>
                {COMPONENTS.map(c => <option key={c} value={c}>{BLOOD_COMPONENT_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Blood Group</label>
              <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value as BloodGroup)} className="form-select">
                <option value="">All Groups</option>
                {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Minimum Units</label>
              <input type="number" min="1" value={minUnits} onChange={e => setMinUnits(e.target.value)} className="form-input" />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex gap-3">
              <button type="submit" className="btn-primary">
                <Search className="w-4 h-4" /> Search
              </button>
              <button type="button" onClick={() => { setDistrict(''); setComponent(''); setBloodGroup(''); setMinUnits('1'); setSearched(false); setResults([]); }} className="btn-secondary">
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Safety disclaimer */}
      <div className="mb-6">
        <SafetyDisclaimer />
      </div>

      {/* Results */}
      {searched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              {results.length === 0 ? 'No matching inventory found' : `${results.length} result${results.length !== 1 ? 's' : ''} found`}
            </h2>
            <button onClick={handleSearch} className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {results.length === 0 ? (
            <div className="card p-8 text-center">
              <Droplets className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-600 mb-1">No inventory found matching your criteria</h3>
              <p className="text-sm text-slate-400 mb-4">Try broadening your search or contact blood banks directly.</p>
              <p className="text-sm text-slate-500">Emergency: Call <strong>104</strong> (AP Blood on Wheels) or <strong>108</strong></p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map(({ batch, org }) => (
                <div key={batch.id} className={`card p-5 ${batch.verificationStatus === 'STALE' ? 'border-amber-200 bg-amber-50/30' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{org.name}</h3>
                        <StatusBadge status={batch.verificationStatus} />
                        {batch.isDemo && <span className="badge-orange text-[10px]">DEMO</span>}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                        <MapPin className="w-3 h-3" />
                        {org.city}, {org.district}, {org.state}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-slate-500 text-xs block">Component</span>
                          <span className="font-medium text-slate-800">{BLOOD_COMPONENT_LABELS[batch.bloodComponent]}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs block">Blood Group</span>
                          <span className="font-bold text-lg text-red-600">{batch.bloodGroup}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs block">Available (unreserved)</span>
                          <span className={`font-bold ${(batch.availableUnits - batch.reservedUnits) > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            {Math.max(0, batch.availableUnits - batch.reservedUnits)} units
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs block">Reserved</span>
                          <span className="font-medium text-slate-700">{batch.reservedUnits} units</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`text-xs font-medium ${getVerificationColor(batch.verificationStatus)} mb-2`}>
                        {getVerificationLabel(batch.verificationStatus, batch.lastVerifiedAt)}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 justify-end mb-2">
                        <Phone className="w-3 h-3" />
                        {org.phone}
                      </div>
                      {batch.verificationStatus === 'STALE' && (
                        <div className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                          ⚠ Verify by calling the blood bank directly
                        </div>
                      )}
                    </div>
                  </div>
                  {batch.verificationStatus === 'STALE' && (
                    <div className="mt-3 pt-3 border-t border-amber-200 text-xs text-amber-700">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      This record is over 24 hours old and has not been re-verified. Actual availability may differ. Contact the blood bank directly to confirm.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

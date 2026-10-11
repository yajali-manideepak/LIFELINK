import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Droplets, ChevronRight, Search } from 'lucide-react';
import { appState } from '../../store/appState';
import { StatusBadge } from '../../components/shared/ui';
import { useLifeLink } from '../../context/LifeLinkContext';

const DISTRICTS = ['', 'Guntur', 'Palnadu'];

export function DirectoryPage() {
  const { navigate } = useLifeLink();
  const [district, setDistrict] = useState('');
  const [query, setQuery] = useState('');

  const banks = appState.getPublicOrgsByDistrict(district || undefined).filter(o =>
    !query || o.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Blood Bank Directory</h1>
      <p className="text-sm text-slate-500 mb-6">Verified licensed blood banks participating in the LifeLink network. Contact them directly for emergency availability.</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={district} onChange={e => setDistrict(e.target.value)} className="form-select w-auto">
          <option value="">All Districts</option>
          {DISTRICTS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="form-input pl-9 w-full"
          />
        </div>
      </div>

      {banks.length === 0 ? (
        <div className="card p-8 text-center">
          <Droplets className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No blood banks found for the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banks.map(org => {
            const profile = appState.bloodBankProfiles.find(p => p.organizationId === org.id);
            const inventory = appState.getInventoryForBloodBank(org.id);
            const totalAvailable = inventory.reduce((sum, b) => sum + Math.max(0, b.availableUnits - b.reservedUnits), 0);

            return (
              <div key={org.id} className="card hover:shadow-md transition-shadow">
                <div className="card-body">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h2 className="font-bold text-slate-900">{org.name}</h2>
                        <StatusBadge status={org.status} />
                        {org.isDemo && <span className="badge-orange text-[10px]">DEMO</span>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {org.address}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <a href={`tel:${org.phone}`} className="text-teal-600 hover:underline">{org.phone}</a>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {org.email}
                        </div>
                        {profile && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {profile.operatingHours}
                          </div>
                        )}
                      </div>
                      {profile && profile.serviceDistricts.length > 0 && (
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {profile.serviceDistricts.map(d => (
                            <span key={d} className="badge-blue">{d}</span>
                          ))}
                          {profile.supportsDelivery && <span className="badge-teal">Delivery up to {profile.deliveryRadiusKm} km</span>}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-teal-700">{totalAvailable}</div>
                      <div className="text-xs text-slate-500">units available (demo)</div>
                      <div className="text-xs text-amber-600 mt-1">Verify by calling</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-amber-600 text-center mt-6 font-medium">
        ⚠ DEMO DATA — Contact information and availability shown here is entirely fictional and for demonstration only.
      </p>
    </div>
  );
}

// Sign In page
export function SignInPage() {
  const { signIn, navigate, showToast } = useLifeLink();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = signIn(email, password);
    setLoading(false);
    if (!result.ok) setError(result.error || 'Sign in failed.');
    else showToast('Welcome back!', 'success');
  };

  const DEMO_ACCOUNTS = [
    { label: 'Super Admin', email: 'superadmin@lifelink.health', password: 'Admin@Demo1', badge: 'badge-purple' },
    { label: 'GGH Hospital', email: 'transfusion@gghguntur.ap.nic.in', password: 'Hospital@Demo1', badge: 'badge-blue' },
    { label: 'NSP Hospital', email: 'medical@nsphosp.ap.nic.in', password: 'Hospital@Demo2', badge: 'badge-blue' },
    { label: 'Blood Bank (ARBC)', email: 'technicist@arbc.ap.gov.in', password: 'BloodBank@Demo1', badge: 'badge-red' },
    { label: 'Blood Bank (Red Cross)', email: 'staff@redcrossguntur.org', password: 'BloodBank@Demo2', badge: 'badge-red' },
    { label: 'Palnadu Blood Bank', email: 'bloodbank@palnadudbc.ap.gov.in', password: 'BloodBank@Demo3', badge: 'badge-red' },
    { label: 'Donor', email: 'donor@example.com', password: 'Donor@Demo1', badge: 'badge-green' },
    { label: 'Unverified Hospital', email: 'admin@sunrisehospital.example.com', password: 'Pending@Demo1', badge: 'badge-yellow' },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="card-header text-center">
            <h1 className="text-xl font-bold text-slate-900">Sign In to LifeLink</h1>
            <p className="text-sm text-slate-500 mt-1">Access your hospital, blood bank, or admin portal</p>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <div className="alert-error text-sm rounded-lg">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-3 font-medium">Demo Accounts (click to fill):</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map(a => (
                  <button
                    key={a.email}
                    onClick={() => { setEmail(a.email); setPassword(a.password); setError(''); }}
                    className="text-left p-2 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-colors"
                  >
                    <span className={`${a.badge} text-[10px] mb-1 block`}>{a.label}</span>
                    <span className="text-xs text-slate-600 truncate block">{a.email}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 text-center">
              <button onClick={() => navigate('REGISTER_ORG')} className="text-sm text-teal-600 hover:underline">
                Register a new organization →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterOrgPage() {
  const { navigate, showToast } = useLifeLink();
  const [type, setType] = useState<'HOSPITAL' | 'BLOOD_BANK'>('HOSPITAL');
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '', state: 'Andhra Pradesh', district: '', city: '', address: '',
    phone: '', email: '', licenseNumber: '', registrationNumber: '',
    contactPerson: '', contactRole: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production: API call to register org and trigger admin review
    setSubmitted(true);
    showToast('Registration submitted. Awaiting administrator verification.', 'info');
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Registration Submitted</h2>
          <p className="text-sm text-slate-500 mb-4">
            Your organization registration has been submitted and is pending administrator verification.
            You will be notified once your account is approved.
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <strong>Note:</strong> This is a demonstration. In the live platform, the platform administrator would review your organization's licence documents and contact details.
          </p>
          <button onClick={() => navigate('HOME')} className="btn-primary w-full justify-center">Return to Home</button>
        </div>
      </div>
    );
  }

  const f = (k: string) => ({ value: form[k as keyof typeof form], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [k]: e.target.value })) });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Register Organization</h1>
      <p className="text-sm text-slate-500 mb-6">Register your hospital or blood bank to join the LifeLink network. An administrator will verify your registration before your account is activated.</p>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Organization Type *</label>
              <div className="flex gap-4">
                {(['HOSPITAL', 'BLOOD_BANK'] as const).map(t => (
                  <label key={t} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer flex-1 ${type === t ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" value={t} checked={type === t} onChange={() => setType(t)} className="accent-teal-600" />
                    <span className="font-medium text-sm">{t === 'HOSPITAL' ? 'Hospital' : 'Blood Bank'}</span>
                  </label>
                ))}
              </div>
            </div>
            <div><label className="form-label">Organization Name *</label><input required {...f('name')} className="form-input" placeholder="Full legal name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="form-label">State *</label><input {...f('state')} className="form-input" readOnly /></div>
              <div>
                <label className="form-label">District *</label>
                <select {...f('district')} className="form-select" required>
                  <option value="">Select district</option>
                  <option value="Guntur">Guntur</option>
                  <option value="Palnadu">Palnadu</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="form-label">City *</label><input required {...f('city')} className="form-input" /></div>
              <div><label className="form-label">Phone *</label><input required {...f('phone')} className="form-input" type="tel" /></div>
            </div>
            <div><label className="form-label">Address *</label><input required {...f('address')} className="form-input" /></div>
            <div><label className="form-label">Official Email *</label><input required {...f('email')} className="form-input" type="email" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="form-label">Licence Number *</label><input required {...f('licenseNumber')} className="form-input" placeholder="Regulatory licence no." /></div>
              <div><label className="form-label">Registration Number</label><input {...f('registrationNumber')} className="form-input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="form-label">Contact Person *</label><input required {...f('contactPerson')} className="form-input" /></div>
              <div><label className="form-label">Role / Designation *</label><input required {...f('contactRole')} className="form-input" /></div>
            </div>
            <div className="alert-info rounded-lg text-sm">
              <span>After submission, the platform administrator will review your licence documents and verify your organization. You will receive a notification when your account is approved.</span>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1 justify-center">Submit Registration</button>
              <button type="button" onClick={() => navigate('HOME')} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

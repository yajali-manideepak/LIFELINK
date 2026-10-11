import React from 'react';
import {
  Shield, AlertTriangle, CheckCircle, Heart, Phone, Mail,
  MapPin, Clock, Award, FileText, Lock, Users, Activity,
  ExternalLink, ChevronRight, Droplets, Info
} from 'lucide-react';
import { useLifeLink } from '../../context/LifeLinkContext';
import { appState, formatRelativeTime } from '../../store/appState';
import { StatusBadge, SafetyDisclaimer } from '../../components/shared/ui';
import { BLOOD_COMPONENT_LABELS } from '../../types/lifelink';

export function AboutPage() {
  const { navigate } = useLifeLink();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
          <Heart className="w-3.5 h-3.5 fill-red-500" /> LifeLink Platform
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Bridging the Emergency Blood Availability Gap
        </h1>
        <p className="mt-4 text-base text-slate-600 leading-relaxed">
          LifeLink is a purpose-built, real-time coordination network connecting verified hospitals,
          licensed blood banks, voluntary donors, and emergency care teams across Andhra Pradesh.
        </p>
      </div>

      <div className="space-y-10">
        {/* The Problem & Solution */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6 border-l-4 border-l-red-500">
            <h2 className="text-lg font-bold text-slate-900 mb-2">The Critical Challenge</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              During clinical emergencies—acute trauma, post-partum hemorrhage, severe dengue thrombocytopenia,
              or complicated surgeries—patients and families lose precious hours frantically making dozens of phone calls
              to individual blood banks, often encountering outdated stock registers or unanswered lines.
            </p>
          </div>

          <div className="card p-6 border-l-4 border-l-teal-500">
            <h2 className="text-lg font-bold text-slate-900 mb-2">The LifeLink Solution</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              LifeLink automates multi-facility emergency distribution. When an authorized hospital clinician raises
              a requisition, all participating blood banks in the district receive instant broadcasts with precise
              component specifications, enabling rapid stock reservation and transparent patient tracking.
            </p>
          </div>
        </div>

        {/* Core Principles */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Core Operational Principles</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            <div className="card p-5 bg-slate-50">
              <Shield className="w-8 h-8 text-teal-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Strict Institutional Vetting</h3>
              <p className="text-xs text-slate-600">
                Only licensed blood centers and verified hospitals with verified regulatory registrations can broadcast requests or reserve stock.
              </p>
            </div>
            <div className="card p-5 bg-slate-50">
              <Activity className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Atomic Inventory Reservations</h3>
              <p className="text-xs text-slate-600">
                Units reserved for an emergency are immediately locked with automated timeouts, preventing double-allocation and inventory ghosting.
              </p>
            </div>
            <div className="card p-5 bg-slate-50">
              <Lock className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Patient Privacy by Design</h3>
              <p className="text-xs text-slate-600">
                Families track status using anonymous 6-digit access tokens. No sensitive clinical dossiers or patient PII are exposed publicly.
              </p>
            </div>
          </div>
        </div>

        {/* Governance & Disclaimer */}
        <div className="card p-6 bg-amber-50 border border-amber-200">
          <div className="flex gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 space-y-2">
              <p className="font-semibold">Regulatory and Clinical Disclaimer</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                LifeLink is an emergency logistics and communication coordination platform. It does not replace
                mandatory pre-transfusion cross-matching, blood grouping verification, cold-chain transport regulations,
                or clinical judgment. Participating institutions remain solely responsible for compliance with the
                Drugs and Cosmetics Rules and National Blood Transfusion Council (NBTC) standards.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <button onClick={() => navigate('SEARCH')} className="btn-primary px-6 py-3">
            Search Real-Time Blood Stock Availability →
          </button>
        </div>
      </div>
    </div>
  );
}

export function SafetyInfoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <Shield className="w-3.5 h-3.5 text-teal-600" /> Clinical Safety & Quality Assurance
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Blood Transfusion Safety & Emergency Protocols
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          Standards followed across all LifeLink network integrations and operational workflows.
        </p>
      </div>

      <div className="space-y-6">
        <SafetyDisclaimer />

        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Mandatory Clinical Steps Before Component Administration
          </h2>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
              <span><strong>Pre-Transfusion Compatibility Testing:</strong> Cross-matching (major and minor) and ABO/Rh confirmation must be completed by the recipient hospital laboratory before unit infusion.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
              <span><strong>Cold Chain Maintenance:</strong> Whole blood and PRBC units must be transported between 2°C and 6°C in certified validation containers. Platelets must remain between 20°C and 24°C with continuous agitation until dispatch.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
              <span><strong>Visual Inspection:</strong> Inspect all blood containers for gross hemolysis, particulate matter, clotting, container discoloration, or seal leaks prior to release or acceptance.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
              <span><strong>Two-Person Bedside Identification:</strong> Two qualified healthcare professionals must verify patient identity wristband against blood bag compatibility tag immediately prior to starting transfusion.</span>
            </li>
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-900 mb-2">ABO & Rh Compatibility Matrix</h2>
            <div className="text-xs text-slate-600 space-y-2 mt-3">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-red-600">O Negative (O-)</span>: Universal PRBC Donor for extreme emergencies before grouping is complete.
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-red-600">AB Positive (AB+)</span>: Universal PRBC Recipient.
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-red-600">AB Negative (AB-)</span>: Universal Fresh Frozen Plasma (FFP) Donor.
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-900 mb-2">Adverse Event Reporting (Hemovigilance)</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Any acute transfusion reaction (febrile non-hemolytic, allergic, TRALI, or acute hemolytic) must immediately
              halt the transfusion, notify the issuing blood bank, and log an incident report with the National Hemovigilance Programme of India (HvPI).
            </p>
            <div className="p-2.5 bg-red-50 text-red-800 rounded text-xs border border-red-200">
              Emergency reaction protocol: Discontinue infusion, maintain IV line with normal saline, check vital signs, and send bag + post-transfusion recipient sample back to blood bank.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Privacy Policy & Data Protection
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          Compliant with the Digital Personal Data Protection (DPDP) Act and Indian Medical Council regulations.
        </p>
      </div>

      <div className="card p-6 space-y-6 text-sm text-slate-700 leading-relaxed">
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-2">1. Patient Pseudonymization</h2>
          <p>
            LifeLink strictly minimizes data collection for emergency coordination. Public tracking links and family inquiry tokens
            rely solely on cryptographically random 6-digit identifiers. Patient names, national IDs, medical histories, and clinician
            private notes are never exposed on public-facing screens or search results.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 mb-2">2. Role-Based Access Control (RBAC)</h2>
          <p>
            Access to hospital requisitions and inventory modification is gated by verified institutional credentials. Hospital personnel can
            only view requisitions authored by their verified institution. Blood bank technicians can only modify inventory batches registered
            under their licensed facility.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 mb-2">3. Immutable Audit Trails</h2>
          <p>
            Every inventory adjustment, reservation creation, status transition, and administrative approval is permanently logged with an
            actor timestamp, role badge, and client context. This prevents tampering and guarantees accountability for regulatory inspections.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 mb-2">4. Voluntary Donor Information</h2>
          <p>
            Voluntary donor records are collected only with express opt-in consent. Donors can modify notification preferences,
            revoke consent, or request permanent erasure of their contact records at any time through their donor dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Contact & Emergency Support Directory
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          Reach our round-the-clock coordination helpdesk or district regulatory nodal officers.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-teal-600" /> 24/7 LifeLink Emergency Helpline
          </h2>
          <div className="space-y-3 text-sm text-slate-600">
            <div>
              <p className="text-xs text-slate-400">Emergency Coordination Cell:</p>
              <p className="text-lg font-bold text-slate-900">1800-425-LIFE (5433)</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Guntur District Nodal Control:</p>
              <p className="font-semibold text-slate-800">+91 863 223 4567</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Palnadu District Nodal Control:</p>
              <p className="font-semibold text-slate-800">+91 864 722 8910</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Email Helpdesk:</p>
              <p className="font-semibold text-slate-800">support@lifelink.health</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" /> Send Technical or Verification Query
          </h2>
          <form onSubmit={e => { e.preventDefault(); alert('Your message has been sent to the LifeLink nodal support desk.'); }} className="space-y-3">
            <div>
              <label className="form-label text-xs">Organization / Your Name</label>
              <input required className="form-input text-sm" placeholder="e.g. Government General Hospital" />
            </div>
            <div>
              <label className="form-label text-xs">Email / Contact Number</label>
              <input required className="form-input text-sm" placeholder="e.g. nodal@hospital.org" />
            </div>
            <div>
              <label className="form-label text-xs">Message</label>
              <textarea required rows={3} className="form-input text-sm resize-none" placeholder="Describe the assistance or verification required..." />
            </div>
            <button type="submit" className="btn-primary w-full justify-center text-sm py-2">
              Submit Inquiry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function BloodBankDetailPage() {
  const { selectedOrgId, navigate } = useLifeLink();
  const org = selectedOrgId ? appState.getOrgById(selectedOrgId) : null;
  const profile = selectedOrgId ? appState.bloodBankProfiles.find(p => p.organizationId === selectedOrgId) : null;
  const inventory = selectedOrgId ? appState.getInventoryForBloodBank(selectedOrgId) : [];

  if (!org) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500 mb-4">No blood bank selected.</p>
        <button onClick={() => navigate('DIRECTORY')} className="btn-primary">Return to Directory</button>
      </div>
    );
  }

  const totalAvailable = inventory.reduce((sum, b) => sum + Math.max(0, b.availableUnits - b.reservedUnits), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate('DIRECTORY')} className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-flex items-center gap-1">
        ← Back to Directory
      </button>

      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
              <StatusBadge status={org.status} />
              {org.isDemo && <span className="badge-orange text-xs">DEMO DATA</span>}
            </div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-slate-400" /> {org.address}, {org.city}, {org.district}, {org.state}
            </p>
          </div>
          <div className="text-right sm:shrink-0">
            <span className="text-xs text-slate-400 block">Total Live Units</span>
            <span className="text-3xl font-extrabold text-teal-700">{totalAvailable}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block">Emergency Phone:</span>
            <span className="font-semibold text-slate-800 text-sm">{org.phone}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Official Email:</span>
            <span className="font-semibold text-slate-800 text-sm">{org.email}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Licence Registration:</span>
            <span className="font-semibold text-slate-800 text-sm">{org.licenseNumber}</span>
          </div>
          {profile && (
            <>
              <div>
                <span className="text-slate-400 block">Operating Hours:</span>
                <span className="font-medium text-slate-700">{profile.operatingHours}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Delivery Available:</span>
                <span className="font-medium text-slate-700">{profile.supportsDelivery ? `Yes (Within ${profile.deliveryRadiusKm} km)` : 'Counter Collection Only'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Licence Expiry:</span>
                <span className="font-medium text-slate-700">{profile.licenseExpiryDate}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live Inventory Overview */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Current Verified Inventory</h2>
          <span className="text-xs text-slate-400">Subject to real-time clinical reservation</span>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Blood Component</th>
                <th>Group</th>
                <th>Available Units</th>
                <th>Reserved</th>
                <th>Verification State</th>
                <th>Last Inspected</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(b => (
                <tr key={b.id} className={b.verificationStatus === 'STALE' ? 'bg-amber-50/50' : ''}>
                  <td className="text-xs font-medium">{BLOOD_COMPONENT_LABELS[b.bloodComponent]}</td>
                  <td className="font-bold text-red-600">{b.bloodGroup}</td>
                  <td className="font-bold text-teal-700">{Math.max(0, b.availableUnits - b.reservedUnits)}</td>
                  <td className="text-xs text-slate-500">{b.reservedUnits}</td>
                  <td><StatusBadge status={b.verificationStatus} /></td>
                  <td className="text-xs text-slate-400">{b.lastVerifiedAt ? formatRelativeTime(b.lastVerifiedAt) : 'Recent'}</td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr><td colSpan={6} className="text-center py-6 text-slate-400">No inventory entries available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Search, Droplets, Clock, MapPin, Phone, AlertTriangle,
  Heart, ArrowRight, Building2, CheckCircle, ExternalLink,
  Shield, Users, Activity, ChevronRight
} from 'lucide-react';
import { useLifeLink } from '../../context/LifeLinkContext';
import { appState, formatRelativeTime } from '../../store/appState';
import { SafetyDisclaimer } from '../../components/shared/ui';
import type { BloodComponent, BloodGroup, AppView } from '../../types/lifelink';
import { BLOOD_COMPONENT_LABELS } from '../../types/lifelink';

export function HomePage() {
  const { navigate } = useLifeLink();
  const [trackCode, setTrackCode] = useState('');

  const stats = {
    hospitals: appState.organizations.filter(o => o.type === 'HOSPITAL' && o.status === 'VERIFIED').length,
    bloodBanks: appState.organizations.filter(o => o.type === 'BLOOD_BANK' && o.status === 'VERIFIED').length,
    activeRequests: appState.bloodRequests.filter(r => !['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(r.status)).length,
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackCode.trim()) navigate('TRACK_REQUEST');
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-navy-800 via-navy-700 to-teal-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-red-500 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-teal-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Heart className="w-4 h-4 text-red-300" />
              <span>Real-Time Emergency Blood Coordination</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Find verified blood availability.{' '}
              <span className="text-teal-300">Coordinate faster.</span>{' '}
              Support safer care.
            </h1>
            <p className="text-lg text-slate-200 mb-8 max-w-2xl">
              LifeLink connects verified hospitals and licensed blood banks to coordinate emergency blood component requests — reducing delays when every minute matters.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('SEARCH')} className="btn-primary bg-teal-500 hover:bg-teal-400 py-3 px-6 text-base">
                <Search className="w-5 h-5" /> Search Blood Availability
              </button>
              <button onClick={() => navigate('SIGN_IN')} className="inline-flex items-center gap-2 py-3 px-6 text-base font-medium text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors">
                Hospital / Blood Bank Login <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick track + emergency */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Track request */}
            <div className="card p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" /> Track a Request
              </h2>
              <form onSubmit={handleTrack} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter 6-digit tracking code"
                  value={trackCode}
                  onChange={e => setTrackCode(e.target.value)}
                  className="form-input flex-1"
                  maxLength={6}
                  pattern="\d{6}"
                />
                <button type="submit" className="btn-primary py-2 px-4">Track</button>
              </form>
              <p className="text-xs text-slate-500 mt-2">Your tracking code was provided when the blood request was registered.</p>
            </div>

            {/* Emergency guidance */}
            <div className="rounded-lg border border-red-200 bg-red-50 p-5">
              <h2 className="text-base font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Emergency Guidance
              </h2>
              <p className="text-sm text-red-700 mb-3">
                In a medical emergency, contact the treating hospital's emergency department immediately. Do not rely on this platform as a substitute for emergency medical care.
              </p>
              <div className="flex flex-wrap gap-2">
                <a href="tel:108" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg">
                  <Phone className="w-4 h-4" /> 108 — Emergency
                </a>
                <a href="tel:104" className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg">
                  104 — Blood on Wheels (AP)
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform stats */}
      <section className="bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Verified Hospitals', value: stats.hospitals, icon: <Building2 className="w-6 h-6 text-teal-600" /> },
              { label: 'Licensed Blood Banks', value: stats.bloodBanks, icon: <Droplets className="w-6 h-6 text-red-500" /> },
              { label: 'Active Requests', value: stats.activeRequests, icon: <Activity className="w-6 h-6 text-amber-500" /> },
              { label: 'Districts Covered', value: '2', icon: <MapPin className="w-6 h-6 text-blue-500" /> },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="flex items-center gap-3">
                  {s.icon}
                  <div>
                    <div className="stat-value text-2xl">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-amber-600 mt-3 font-medium">
            ⚠ All figures above reflect DEMO DATA only — not real operational statistics.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">How LifeLink Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">A structured, transparent coordination workflow between verified hospitals and licensed blood banks.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Hospital Creates Request', desc: 'An authorized hospital staff member creates and submits a verified blood requirement with component, quantity, and urgency.' },
              { step: '2', title: 'Blood Banks Respond', desc: 'Participating licensed blood banks receive the request, check their verified inventory, and confirm availability.' },
              { step: '3', title: 'Hospital Coordinates', desc: 'The hospital reviews responses, selects the appropriate blood bank, and coordinates collection or delivery.' },
              { step: '4', title: 'Units Reserved & Issued', desc: 'Authorized staff reserve the agreed units against the request, update preparation status, and confirm fulfillment.' },
            ].map(s => (
              <div key={s.step} className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">{s.step}</div>
                  <h3 className="font-semibold text-slate-900 text-sm">{s.title}</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety notice */}
      <section className="py-10 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SafetyDisclaimer />
        </div>
      </section>

      {/* Portal links */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 text-center">Access Your Portal</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Hospital Portal', desc: 'Submit blood requirements and coordinate with blood banks.', icon: <Building2 className="w-7 h-7 text-teal-600" />, view: 'SIGN_IN' as AppView },
              { title: 'Blood Bank Portal', desc: 'Manage inventory and respond to hospital requests.', icon: <Droplets className="w-7 h-7 text-red-500" />, view: 'SIGN_IN' as AppView },
              { title: 'Donor Portal', desc: 'Register as a voluntary donor and manage preferences.', icon: <Heart className="w-7 h-7 text-pink-500" />, view: 'DONOR_REGISTER' as AppView },
              { title: 'Admin Portal', desc: 'Verify organizations and monitor platform operations.', icon: <Shield className="w-7 h-7 text-navy-600" />, view: 'SIGN_IN' as AppView },
            ].map(p => (
              <button
                key={p.title}
                onClick={() => navigate(p.view)}
                className="card p-5 text-left hover:shadow-md hover:border-teal-200 transition-all group"
              >
                <div className="mb-3">{p.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-teal-700 transition-colors">{p.title}</h3>
                <p className="text-xs text-slate-500">{p.desc}</p>
                <div className="mt-3 flex items-center text-xs font-medium text-teal-600">
                  Access Portal <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Official resources */}
      <section className="py-10 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-semibold mb-1">Official Blood Availability Resources</h3>
              <p className="text-sm text-slate-400">For authoritative blood availability information, refer to official government platforms.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://eraktkosh.mohfw.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-teal-400 hover:text-teal-300 border border-teal-800 hover:border-teal-600 px-4 py-2 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> e-RaktKosh (NBTC)
              </a>
              <a
                href="https://www.nbtc.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-teal-400 hover:text-teal-300 border border-teal-800 hover:border-teal-600 px-4 py-2 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> NBTC India
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-bold text-white">LifeLink</span>
              <span className="text-xs">— Demonstration Prototype. Not for clinical use.</span>
            </div>
            <div className="flex gap-4 text-xs">
              <button onClick={() => navigate('SAFETY_INFO')} className="hover:text-white transition-colors">Safety Information</button>
              <button onClick={() => navigate('PRIVACY')} className="hover:text-white transition-colors">Privacy Policy</button>
              <button onClick={() => navigate('CONTACT')} className="hover:text-white transition-colors">Contact</button>
              <button onClick={() => navigate('ABOUT')} className="hover:text-white transition-colors">About</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

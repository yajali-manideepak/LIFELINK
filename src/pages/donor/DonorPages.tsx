import React, { useState } from 'react';
import {
  Heart, User, CheckCircle, AlertTriangle, Calendar,
  Bell, MapPin, Award, Shield, Clock, ChevronRight
} from 'lucide-react';
import { useLifeLink } from '../../context/LifeLinkContext';
import { appState } from '../../store/appState';
import type { BloodGroup } from '../../types/lifelink';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DISTRICTS = ['Guntur', 'Palnadu'];

export function DonorRegisterPage() {
  const { navigate, showToast } = useLifeLink();
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>('');
  const [district, setDistrict] = useState('Guntur');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    age: '24',
    weight: '62',
    lastDonatedDays: '120',
    emergencyAlertsConsent: true,
    termsConsent: true,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodGroup) {
      alert('Please select your blood group.');
      return;
    }
    setSubmitted(true);
    showToast('Voluntary donor registration successful! Thank you for pledging life.', 'success');
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="card p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-red-600 fill-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank You, Voluntary Hero!</h2>
          <p className="text-sm text-slate-600 mb-6">
            Your pledge as a voluntary donor with blood group <strong className="text-red-600">{bloodGroup}</strong> in <strong className="text-slate-800">{district}</strong> has been recorded.
            You will only be contacted when emergency shortages of your blood group arise in nearby verified blood banks.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 mb-6 text-left space-y-1">
            <p className="font-semibold text-slate-700">Donor Safety Commitments:</p>
            <p>• Your personal telephone is never disclosed publicly on open directories.</p>
            <p>• You may pause or revoke your emergency alert subscription at any time.</p>
            <p>• Minimum mandatory interval: 90 days for whole blood donations.</p>
          </div>
          <button onClick={() => navigate('HOME')} className="btn-primary w-full justify-center">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <Heart className="w-3.5 h-3.5 fill-red-500" /> Voluntary Blood Donation Pledge
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Be an Emergency Lifesaver</h1>
        <p className="text-slate-600 text-sm mt-2 max-w-lg mx-auto">
          Sign up to receive verified district emergency alerts when your blood group experiences acute shortages.
        </p>
      </div>

      <div className="card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Blood group selection */}
          <div>
            <label className="form-label font-semibold">Select Your Blood Group *</label>
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {BLOOD_GROUPS.map(bg => (
                <button
                  type="button"
                  key={bg}
                  onClick={() => setBloodGroup(bg)}
                  className={`py-3 px-2 rounded-xl border text-center font-bold text-base transition-all ${
                    bloodGroup === bg
                      ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-300'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-red-300 hover:bg-red-50/50'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label text-xs">Full Name *</label>
              <input
                required
                className="form-input text-sm"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
              />
            </div>
            <div>
              <label className="form-label text-xs">Mobile Number *</label>
              <input
                required
                type="tel"
                className="form-input text-sm"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label text-xs">District *</label>
              <select
                className="form-select text-sm"
                value={district}
                onChange={e => setDistrict(e.target.value)}
              >
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Age (Years) *</label>
              <input
                required
                type="number"
                min="18"
                max="65"
                className="form-input text-sm"
                value={form.age}
                onChange={e => setForm({ ...form, age: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label text-xs">Weight (kg) *</label>
              <input
                required
                type="number"
                min="45"
                max="150"
                className="form-input text-sm"
                value={form.weight}
                onChange={e => setForm({ ...form, weight: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label text-xs">Email Address</label>
            <input
              type="email"
              className="form-input text-sm"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. ramesh@example.com"
            />
          </div>

          {/* Consents */}
          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={form.emergencyAlertsConsent}
                onChange={e => setForm({ ...form, emergencyAlertsConsent: e.target.checked })}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-slate-600">
                I consent to receiving SMS and WhatsApp notifications when licensed blood banks in my district declare an emergency shortage of my blood group.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={form.termsConsent}
                onChange={e => setForm({ ...form, termsConsent: e.target.checked })}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-slate-600">
                I confirm I am between 18-65 years of age, weigh at least 45 kg, and understand that standard medical screening by medical staff will precede any actual donation.
              </span>
            </label>
          </div>

          <button type="submit" className="btn-primary w-full justify-center py-3 text-base">
            <Heart className="w-5 h-5 fill-white" /> Register Voluntary Donor Pledge
          </button>
        </form>
      </div>
    </div>
  );
}

export function DonorDashboardPage() {
  const { navigate, currentUser } = useLifeLink();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-6 bg-gradient-to-r from-red-600 to-rose-700 text-white mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-0.5 text-xs font-semibold mb-2">
              <Award className="w-3.5 h-3.5" /> Certified Voluntary Donor
            </div>
            <h1 className="text-2xl font-bold">Welcome, {currentUser?.name || 'Registered Donor'}</h1>
            <p className="text-red-100 text-xs mt-1">Thank you for standing ready to support emergency blood needs.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20">
            <span className="text-xs text-red-200 block uppercase font-bold">Blood Group</span>
            <span className="text-3xl font-extrabold">O+</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card p-5">
          <Calendar className="w-6 h-6 text-teal-600 mb-2" />
          <h3 className="font-semibold text-slate-800 text-sm">Donation Status</h3>
          <p className="text-2xl font-bold text-emerald-600 mt-1">Eligible Now</p>
          <p className="text-xs text-slate-500 mt-1">Last whole blood donation was &gt;90 days ago.</p>
        </div>

        <div className="card p-5">
          <Bell className="w-6 h-6 text-amber-600 mb-2" />
          <h3 className="font-semibold text-slate-800 text-sm">District Shortage Level</h3>
          <p className="text-2xl font-bold text-amber-600 mt-1">Moderate</p>
          <p className="text-xs text-slate-500 mt-1">O- and Platelets are currently low in Guntur.</p>
        </div>

        <div className="card p-5">
          <Award className="w-6 h-6 text-purple-600 mb-2" />
          <h3 className="font-semibold text-slate-800 text-sm">Lifetime Donations</h3>
          <p className="text-2xl font-bold text-purple-600 mt-1">3 Units</p>
          <p className="text-xs text-slate-500 mt-1">Estimated 9 patient lives supported.</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Nearby Licensed Blood Banks In Need of Donors</h2>
        <div className="space-y-3">
          {appState.organizations.filter(o => o.type === 'BLOOD_BANK').slice(0, 3).map(bb => (
            <div key={bb.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 gap-3">
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">{bb.name}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {bb.address}, {bb.city}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  Open Today
                </span>
                <button
                  onClick={() => navigate('BLOOD_BANK_DETAIL', { orgId: bb.id })}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DonorProfilePage() {
  const { navigate, currentUser, showToast } = useLifeLink();
  const [alerts, setAlerts] = useState(true);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Donor Profile & Notification Preferences</h1>
      <div className="card p-6 space-y-4">
        <div>
          <label className="form-label text-xs">Registered Name</label>
          <input className="form-input text-sm" value={currentUser?.name || 'Voluntary Donor'} disabled />
        </div>
        <div>
          <label className="form-label text-xs">Email</label>
          <input className="form-input text-sm" value={currentUser?.email || 'donor@example.com'} disabled />
        </div>
        <div className="pt-4 border-t border-slate-100">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-slate-700">Receive Emergency Shortage Broadcasts</span>
            <input
              type="checkbox"
              checked={alerts}
              onChange={e => {
                setAlerts(e.target.checked);
                showToast(`Emergency alert notifications ${e.target.checked ? 'enabled' : 'disabled'}.`);
              }}
              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
          </label>
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-between">
          <button onClick={() => navigate('DONOR_DASHBOARD')} className="btn-secondary text-sm">Back to Dashboard</button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to opt out of the voluntary donor registry?')) {
                showToast('Your donor profile has been deactivated.');
                navigate('HOME');
              }
            }}
            className="text-xs text-red-600 hover:underline"
          >
            Deactivate Donor Registry
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Header } from './components/layout/Header';
import { useLifeLink } from './context/LifeLinkContext';
import { HomePage } from './pages/public/HomePage';
import { SearchPage } from './pages/public/SearchPage';
import { DirectoryPage, SignInPage, RegisterOrgPage } from './pages/public/DirectoryAndAuth';
import { TrackRequestPage } from './pages/public/TrackRequestPage';
import { AboutPage, SafetyInfoPage, PrivacyPage, ContactPage, BloodBankDetailPage } from './pages/public/StaticPages';
import { DonorRegisterPage, DonorDashboardPage, DonorProfilePage } from './pages/donor/DonorPages';
import {
  HospitalDashboardPage, HospitalNewRequestPage, HospitalRequestsPage,
  HospitalRequestDetailPage, HospitalResponsesPage, HospitalNotificationsPage,
  HospitalReportsPage, HospitalSettingsPage
} from './pages/hospital/HospitalPages';
import {
  BloodBankDashboardPage, BloodBankInventoryPage, BloodBankUpdateStockPage,
  BloodBankRequestsPage, BloodBankRequestDetailPage, BloodBankReservationsPage,
  BloodBankNotificationsPage, BloodBankReportsPage, BloodBankSettingsPage
} from './pages/bloodbank/BloodBankPages';
import {
  AdminDashboardPage, AdminOrgVerificationPage, AdminUsersPage,
  AdminRequestsPage, AdminInventoryQualityPage, AdminIntegrationsPage,
  AdminAuditLogPage, AdminSettingsPage
} from './pages/admin/AdminPages';
import { AlertTriangle, CheckCircle, Info, Heart, Shield, Phone, ExternalLink } from 'lucide-react';

export function App() {
  const { view, toast, currentUser, navigate } = useLifeLink();

  const renderContent = () => {
    switch (view) {
      // Public Views
      case 'HOME':
        return <HomePage />;
      case 'SEARCH':
        return <SearchPage />;
      case 'DIRECTORY':
        return <DirectoryPage />;
      case 'BLOOD_BANK_DETAIL':
        return <BloodBankDetailPage />;
      case 'TRACK_REQUEST':
        return <TrackRequestPage />;
      case 'DONOR_REGISTER':
      case 'DONOR_CONSENT':
        return <DonorRegisterPage />;
      case 'DONOR_DASHBOARD':
        return <DonorDashboardPage />;
      case 'DONOR_PROFILE':
        return <DonorProfilePage />;
      case 'ABOUT':
        return <AboutPage />;
      case 'SAFETY_INFO':
        return <SafetyInfoPage />;
      case 'PRIVACY':
        return <PrivacyPage />;
      case 'CONTACT':
        return <ContactPage />;
      case 'SIGN_IN':
        return <SignInPage />;
      case 'REGISTER_ORG':
        return <RegisterOrgPage />;
      case 'PENDING_VERIFICATION':
        return (
          <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="card p-8 max-w-md text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Account Pending Verification</h2>
              <p className="text-sm text-slate-600 mb-6">
                Your organization registration is currently under review by the platform administrator.
                You will be granted full access to request broadcasts and inventory updates once verified.
              </p>
              <button onClick={() => navigate('HOME')} className="btn-primary w-full justify-center">
                Return to Home
              </button>
            </div>
          </div>
        );

      // Hospital Views
      case 'HOSPITAL_DASHBOARD':
        return <HospitalDashboardPage />;
      case 'HOSPITAL_NEW_REQUEST':
        return <HospitalNewRequestPage />;
      case 'HOSPITAL_REQUESTS':
        return <HospitalRequestsPage />;
      case 'HOSPITAL_REQUEST_DETAIL':
        return <HospitalRequestDetailPage />;
      case 'HOSPITAL_RESPONSES':
        return <HospitalResponsesPage />;
      case 'HOSPITAL_NOTIFICATIONS':
        return <HospitalNotificationsPage />;
      case 'HOSPITAL_REPORTS':
        return <HospitalReportsPage />;
      case 'HOSPITAL_SETTINGS':
        return <HospitalSettingsPage />;

      // Blood Bank Views
      case 'BB_DASHBOARD':
        return <BloodBankDashboardPage />;
      case 'BB_INVENTORY':
        return <BloodBankInventoryPage />;
      case 'BB_UPDATE_STOCK':
        return <BloodBankUpdateStockPage />;
      case 'BB_REQUESTS':
        return <BloodBankRequestsPage />;
      case 'BB_REQUEST_DETAIL':
        return <BloodBankRequestDetailPage />;
      case 'BB_RESERVATIONS':
        return <BloodBankReservationsPage />;
      case 'BB_NOTIFICATIONS':
        return <BloodBankNotificationsPage />;
      case 'BB_REPORTS':
        return <BloodBankReportsPage />;
      case 'BB_SETTINGS':
        return <BloodBankSettingsPage />;

      // Admin Views
      case 'ADMIN_DASHBOARD':
      case 'ADMIN_REPORTS':
        return <AdminDashboardPage />;
      case 'ADMIN_ORG_VERIFICATION':
        return <AdminOrgVerificationPage />;
      case 'ADMIN_USERS':
        return <AdminUsersPage />;
      case 'ADMIN_REQUESTS':
        return <AdminRequestsPage />;
      case 'ADMIN_INVENTORY_QUALITY':
        return <AdminInventoryQualityPage />;
      case 'ADMIN_INTEGRATIONS':
        return <AdminIntegrationsPage />;
      case 'ADMIN_AUDIT_LOG':
        return <AdminAuditLogPage />;
      case 'ADMIN_SETTINGS':
        return <AdminSettingsPage />;

      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      {/* Platform Header */}
      <Header />

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700 shadow-emerald-900/20'
                : toast.type === 'error'
                ? 'bg-red-900 text-red-100 border-red-700 shadow-red-900/20'
                : toast.type === 'warning'
                ? 'bg-amber-900 text-amber-100 border-amber-700 shadow-amber-900/20'
                : 'bg-slate-900 text-slate-100 border-slate-700 shadow-slate-900/20'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-teal-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Page Area */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* Clinical Disclaimer & Regulatory Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" /> LifeLink
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Real-Time Emergency Blood Availability and Inter-Facility Coordination Platform.
                Serving verified healthcare providers and voluntary donors across Andhra Pradesh.
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md text-[11px] font-mono">
                <span>SIMULATION / DEMO MODE ACTIVE</span>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Emergency Coordination</h4>
              <ul className="space-y-2">
                <li><button onClick={() => navigate('SEARCH')} className="hover:text-white transition-colors">Search Live Inventory</button></li>
                <li><button onClick={() => navigate('DIRECTORY')} className="hover:text-white transition-colors">Licensed Blood Banks</button></li>
                <li><button onClick={() => navigate('TRACK_REQUEST')} className="hover:text-white transition-colors">Track Blood Request</button></li>
                <li><button onClick={() => navigate('DONOR_REGISTER')} className="hover:text-white transition-colors">Voluntary Donor Registry</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Governance & Safety</h4>
              <ul className="space-y-2">
                <li><button onClick={() => navigate('ABOUT')} className="hover:text-white transition-colors">About the Network</button></li>
                <li><button onClick={() => navigate('SAFETY_INFO')} className="hover:text-white transition-colors">Transfusion Safety Guidelines</button></li>
                <li><button onClick={() => navigate('PRIVACY')} className="hover:text-white transition-colors">Patient Privacy & DPDP Policy</button></li>
                <li><button onClick={() => navigate('CONTACT')} className="hover:text-white transition-colors">Helpline & Nodal Directory</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">24/7 Emergency Line</h4>
              <p className="text-slate-300 font-bold text-base mb-1">1800-425-LIFE (5433)</p>
              <p className="text-slate-500 text-[11px] leading-relaxed mb-3">
                For verified hospital transfusion officers requiring expedited emergency blood component routing.
              </p>
              <button
                onClick={() => navigate('SIGN_IN')}
                className="w-full text-center py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs border border-slate-700 transition-colors"
              >
                Institutional Portal Login →
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p>© {new Date().getFullYear()} LifeLink Coordination Network. Clinical safety remains the responsibility of participating institutions.</p>
            <div className="flex gap-4">
              <button onClick={() => navigate('PRIVACY')} className="hover:text-slate-200">Privacy Policy</button>
              <button onClick={() => navigate('SAFETY_INFO')} className="hover:text-slate-200">Safety Disclaimer</button>
              <button onClick={() => navigate('CONTACT')} className="hover:text-slate-200">Nodal Support</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;

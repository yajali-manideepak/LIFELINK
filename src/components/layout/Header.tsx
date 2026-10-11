import React, { useState } from 'react';
import {
  Heart, LogIn, LogOut, Bell, Menu, X, ChevronDown,
  Building2, Droplets, User, Shield, Home, Search
} from 'lucide-react';
import { useLifeLink } from '../../context/LifeLinkContext';
import { appState } from '../../store/appState';
import type { AppView } from '../../types/lifelink';

const NAV_LINKS: Array<{ label: string; view: AppView }> = [
  { label: 'Home', view: 'HOME' },
  { label: 'Search Availability', view: 'SEARCH' },
  { label: 'Blood Bank Directory', view: 'DIRECTORY' },
  { label: 'Track Request', view: 'TRACK_REQUEST' },
  { label: 'Donate Blood', view: 'DONOR_REGISTER' },
  { label: 'About', view: 'ABOUT' },
];

export function Header() {
  const { currentUser, view, navigate, signOut } = useLifeLink();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const orgId = currentUser?.organizationId;
  const unreadCount = orgId
    ? appState.notifications.filter(n => n.recipientOrgId === orgId && !n.isRead).length
    : 0;

  const getDashboardView = (): AppView => {
    if (!currentUser) return 'HOME';
    const map: Record<string, AppView> = {
      SUPER_ADMIN: 'ADMIN_DASHBOARD',
      HOSPITAL_ADMIN: 'HOSPITAL_DASHBOARD',
      HOSPITAL_STAFF: 'HOSPITAL_DASHBOARD',
      BLOOD_BANK_ADMIN: 'BB_DASHBOARD',
      BLOOD_BANK_STAFF: 'BB_DASHBOARD',
      DONOR: 'DONOR_DASHBOARD',
    };
    return map[currentUser.role] || 'HOME';
  };

  const getRoleLabel = () => {
    if (!currentUser) return '';
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      HOSPITAL_ADMIN: 'Hospital Admin',
      HOSPITAL_STAFF: 'Hospital Staff',
      BLOOD_BANK_ADMIN: 'Blood Bank Admin',
      BLOOD_BANK_STAFF: 'Blood Bank Staff',
      DONOR: 'Donor',
    };
    return labels[currentUser.role] || currentUser.role;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate(currentUser ? getDashboardView() : 'HOME')}
            className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shadow-sm">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-slate-900 text-lg tracking-tight">LifeLink</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Blood Coordination</span>
            </div>
          </button>

          {/* Public nav (desktop) */}
          {!currentUser && (
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(l => (
                <button
                  key={l.view}
                  onClick={() => navigate(l.view)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    view === l.view
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </nav>
          )}

          {/* Authenticated nav */}
          {currentUser && (
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => navigate(getDashboardView())}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  ['HOSPITAL_DASHBOARD', 'BB_DASHBOARD', 'ADMIN_DASHBOARD', 'DONOR_DASHBOARD'].some(v => view.startsWith(v.split('_')[0]))
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Dashboard
              </button>
              {(currentUser.role === 'HOSPITAL_ADMIN' || currentUser.role === 'HOSPITAL_STAFF') && (
                <>
                  <button onClick={() => navigate('HOSPITAL_REQUESTS')} className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100">My Requests</button>
                  <button onClick={() => navigate('HOSPITAL_NEW_REQUEST')} className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100">New Request</button>
                </>
              )}
              {(currentUser.role === 'BLOOD_BANK_ADMIN' || currentUser.role === 'BLOOD_BANK_STAFF') && (
                <>
                  <button onClick={() => navigate('BB_REQUESTS')} className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100">Requests</button>
                  <button onClick={() => navigate('BB_INVENTORY')} className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100">Inventory</button>
                </>
              )}
              {currentUser.role === 'SUPER_ADMIN' && (
                <>
                  <button onClick={() => navigate('ADMIN_ORG_VERIFICATION')} className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100">Organizations</button>
                  <button onClick={() => navigate('ADMIN_REQUESTS')} className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100">Requests</button>
                  <button onClick={() => navigate('ADMIN_AUDIT_LOG')} className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100">Audit Log</button>
                </>
              )}
            </nav>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                {/* Notifications */}
                <button
                  onClick={() => navigate(
                    currentUser.role.startsWith('HOSPITAL') ? 'HOSPITAL_NOTIFICATIONS' :
                    currentUser.role.startsWith('BLOOD') ? 'BB_NOTIFICATIONS' : 'ADMIN_DASHBOARD'
                  )}
                  className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:flex flex-col items-start leading-none">
                      <span className="text-sm font-medium text-slate-900 max-w-[120px] truncate">{currentUser.name.split(' ').slice(0, 2).join(' ')}</span>
                      <span className="text-[10px] text-slate-500">{getRoleLabel()}</span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                        {currentUser.organization && (
                          <p className="text-xs text-teal-600 truncate mt-0.5">{currentUser.organization.name}</p>
                        )}
                      </div>
                      <button
                        onClick={() => { setProfileOpen(false); navigate('HOME'); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Home className="w-4 h-4" /> Public Portal
                      </button>
                      <button
                        onClick={() => { setProfileOpen(false); signOut(); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('REGISTER_ORG')}
                  className="hidden sm:flex btn-secondary text-sm py-1.5 px-3"
                >
                  Register
                </button>
                <button
                  onClick={() => navigate('SIGN_IN')}
                  className="btn-primary text-sm py-1.5 px-3"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              </div>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {(!currentUser ? NAV_LINKS : []).map(l => (
            <button
              key={l.view}
              onClick={() => { navigate(l.view); setMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              {l.label}
            </button>
          ))}
          {currentUser && (
            <>
              <button onClick={() => { navigate(getDashboardView()); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Dashboard</button>
              <button onClick={() => { signOut(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">Sign Out</button>
            </>
          )}
          {!currentUser && (
            <>
              <button onClick={() => { navigate('SIGN_IN'); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 rounded-lg">Sign In</button>
              <button onClick={() => { navigate('REGISTER_ORG'); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">Register Organization</button>
            </>
          )}
        </div>
      )}
    </header>
  );
}

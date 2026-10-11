import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
};

const BG = {
  success: 'bg-white border-emerald-200',
  error: 'bg-white border-red-200',
  warning: 'bg-white border-amber-200',
  info: 'bg-white border-blue-200',
};

export function Toast({ message, type, onClose }: ToastProps) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full px-4 py-3 rounded-xl shadow-lg border ${BG[type]} animate-in slide-in-from-bottom-4 duration-200`}>
      {ICONS[type]}
      <p className="text-sm text-slate-700 flex-1">{message}</p>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'badge-gray',
  SUBMITTED: 'badge-blue',
  VERIFIED: 'badge-blue',
  DISTRIBUTED: 'badge-blue',
  AWAITING_RESPONSES: 'badge-yellow',
  PARTIALLY_MATCHED: 'badge-orange',
  AVAILABILITY_CONFIRMED: 'badge-teal',
  RESERVATION_PENDING: 'badge-purple',
  RESERVED: 'badge-teal',
  PREPARATION_IN_PROGRESS: 'badge-teal',
  PARTIALLY_FULFILLED: 'badge-orange',
  FULFILLED: 'badge-green',
  CANCELLED: 'badge-gray',
  EXPIRED: 'badge-red',
  ESCALATED: 'badge-red',
  // Org status
  PENDING_VERIFICATION: 'badge-yellow',
  REJECTED: 'badge-red',
  SUSPENDED: 'badge-red',
  // Inventory
  RECENTLY_VERIFIED: 'badge-green',
  UNVERIFIED: 'badge-yellow',
  STALE: 'badge-red',
  UNAVAILABLE: 'badge-gray',
  // Responses
  CONFIRMED_AVAILABLE: 'badge-green',
  PARTIAL_AVAILABLE: 'badge-yellow',
  TEMPORARILY_UNAVAILABLE: 'badge-red',
  REQUIRES_COORDINATION: 'badge-orange',
  UNABLE_TO_FULFILL: 'badge-red',
  NEEDS_CLARIFICATION: 'badge-yellow',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  VERIFIED: 'Verified',
  DISTRIBUTED: 'Distributed',
  AWAITING_RESPONSES: 'Awaiting Responses',
  PARTIALLY_MATCHED: 'Partially Matched',
  AVAILABILITY_CONFIRMED: 'Confirmed',
  RESERVATION_PENDING: 'Reservation Pending',
  RESERVED: 'Reserved',
  PREPARATION_IN_PROGRESS: 'In Preparation',
  PARTIALLY_FULFILLED: 'Partially Fulfilled',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  ESCALATED: 'Escalated',
  PENDING_VERIFICATION: 'Pending Verification',
  RECENTLY_VERIFIED: 'Recently Verified',
  UNVERIFIED: 'Unverified',
  STALE: 'Stale Data',
  UNAVAILABLE: 'Unavailable',
  CONFIRMED_AVAILABLE: 'Confirmed Available',
  PARTIAL_AVAILABLE: 'Partial Availability',
  TEMPORARILY_UNAVAILABLE: 'Temporarily Unavailable',
  REQUIRES_COORDINATION: 'Requires Coordination',
  UNABLE_TO_FULFILL: 'Unable to Fulfill',
  NEEDS_CLARIFICATION: 'Needs Clarification',
  ACTIVE: 'Active',
  RELEASED: 'Released',
  SUSPENDED: 'Suspended',
  REJECTED: 'Rejected',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cls = STATUS_STYLES[status] || 'badge-gray';
  const label = STATUS_LABELS[status] || status.replace(/_/g, ' ');
  return <span className={cls}>{label}</span>;
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const cls = {
    CRITICAL: 'urgency-critical',
    URGENT: 'urgency-urgent',
    ROUTINE: 'urgency-routine',
  }[urgency] || 'badge-gray';
  return <span className={cls}>{urgency}</span>;
}

export function DemoBanner() {
  return (
    <div className="demo-banner">
      ⚠ DEMO DATA — NOT REAL BLOOD AVAILABILITY. This platform contains entirely fictional demonstration data and does not represent actual blood stock, verified organizations, or live clinical information.
    </div>
  );
}

export function SafetyDisclaimer() {
  return (
    <div className="alert-warning text-xs rounded-lg p-3 flex gap-2">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>
        <strong>Important:</strong> Availability information does not establish clinical suitability. Compatibility assessment, cross-matching, and transfusion authorization are the responsibility of qualified clinical personnel. Always contact the treating hospital in an emergency.
      </span>
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size];
  return (
    <svg className={`${s} animate-spin text-teal-600`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12">
      {icon && <div className="flex justify-center mb-4 text-slate-300">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-600 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${widths[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

// Re-export ReactNode for Modal
import type { ReactNode } from 'react';

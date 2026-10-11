import React, { ReactNode } from 'react';
import { useLifeLink } from '../../context/LifeLinkContext';
import type { AppView } from '../../types/lifelink';

interface SidebarItem {
  icon: ReactNode;
  label: string;
  view: AppView;
  badge?: number;
}

interface SidebarLayoutProps {
  title: string;
  subtitle?: string;
  items: SidebarItem[];
  children: ReactNode;
}

export function SidebarLayout({ title, subtitle, items, children }: SidebarLayoutProps) {
  const { view, navigate } = useLifeLink();

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200 shrink-0">
        <div className="px-4 py-5 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 truncate">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map((item) => {
            const active = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => navigate(item.view)}
                className={active ? 'sidebar-link-active w-full' : 'sidebar-link-inactive w-full'}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}

export function PageHeader({ title, description, actions }: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 truncate">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import './Layout.css';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', end: true },
  { path: '/compute/vms', label: 'Compute', end: false },
  { path: '/storage', label: 'Storage', end: true },
  { path: '/network', label: 'Network', end: true },
  { path: '/billing', label: 'Billing', end: true },
  { path: '/monitoring', label: 'Monitoring', end: true },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <header className="layout-header">
        <h1 className="layout-logo">IaaS Portal</h1>
        <nav className="layout-nav" aria-label="Основная навигация">
          {NAV_ITEMS.map(({ path, label, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) => `layout-nav-item ${isActive ? 'active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="layout-main">{children}</main>
    </div>
  );
}

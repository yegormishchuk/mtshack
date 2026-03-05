import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Toast } from './Toast';
import './Layout.css';

const NAV_ITEMS = [
  { path: '/', label: 'Обзор', end: true },
  { path: '/projects', label: 'Проекты', end: false },
  { path: '/instances', label: 'Инстансы', end: false },
  { path: '/snapshots', label: 'Снапшоты', end: false },
] as const;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-root">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <div className="admin-brand-logo">
              <span className="admin-brand-logo-text">A</span>
            </div>
            <span className="admin-brand-name">IaaS</span>
            <span className="admin-badge">ADMIN</span>
          </div>
          <nav className="admin-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `admin-nav-item ${isActive ? 'admin-nav-item-active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="admin-header-right">
            <div className="admin-status-dot" title="API подключён" />
            <span className="admin-status-label">Live</span>
          </div>
        </div>
      </header>
      <main className="admin-main">{children}</main>
      <nav className="admin-bottom-nav" aria-label="Мобильная навигация">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `admin-bottom-nav-item ${isActive ? 'admin-bottom-nav-item-active' : ''}`
            }
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <Toast />
    </div>
  );
}

import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logoSrc from '../assets/logo.png';
import './Layout.css';
import { Toast } from './Toast';

interface LayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { path: '/build', label: 'Сборка', tour: 'nav-build', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/></svg> },
  { path: '/servers', label: 'Сервера', tour: 'nav-servers', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg> },
  { path: '/billing', label: 'Счета', tour: 'nav-billing', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  { path: '/account', label: 'Аккаунт', tour: 'nav-account', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-bar">
          <Link to="/" className="app-brand">
            <img src={logoSrc} alt="IaaS logo" className="app-logo-image" />
            <span className="app-brand-text">IaaS</span>
          </Link>
          <nav className="app-nav" aria-label="Главная навигация">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/servers'}
                data-tour={item.tour}
                className={({ isActive }) =>
                  `app-nav-item ${isActive ? 'app-nav-item-active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="app-main">{children}</main>
      <nav className="app-bottom-nav" aria-label="Мобильная навигация">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/servers'}
            className={({ isActive }) =>
              `app-bottom-nav-item ${isActive ? 'app-bottom-nav-item-active' : ''}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <Toast />
    </div>
  );
}


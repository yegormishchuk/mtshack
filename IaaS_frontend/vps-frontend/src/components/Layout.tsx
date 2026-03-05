import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logoSrc from '../assets/logo.png';
import './Layout.css';
import { Toast } from './Toast';

interface LayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { path: '/build', label: 'Сборка', tour: 'nav-build' },
  { path: '/servers', label: 'Сервера', tour: 'nav-servers' },
  { path: '/billing', label: 'Счета', tour: 'nav-billing' },
  { path: '/account', label: 'Аккаунт', tour: 'nav-account' },
] as const;

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
      <Toast />
    </div>
  );
}


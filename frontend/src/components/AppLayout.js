import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import logoUrl from '../img/BIKESERVIS.svg';
import '../App.css';

const sideMenuItems = [
  { icon: '🏠', label: 'Domů', link: '/dashboard' },
  { icon: '🚲', label: 'Moje kola', link: '/my-bikes' },
  { icon: '🛠️', label: 'Objednávky', link: '/dashboard?tab=servisni-kniha' },
  { icon: '🤖', label: 'Asistent', link: '/dashboard?tab=ai-chat' },
  { icon: '🏆', label: 'Věrnostní body', link: '/dashboard?tab=vernost' },
];

export default function AppLayout() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1] || 'e30='));
      setIsAdmin(payload.role === 'admin');
    } catch (e) {
      // ignore decode errors
    }
  }, [location.pathname]);
  return (
    <div className="dashboard-root">
      <aside className="dashboard-sidemenu">
        <div className="dashboard-logo-container">
          <Link to="/dashboard">
            <img src={logoUrl} alt="Logo" className="dashboard-logo" />
          </Link>
        </div>
        <nav className="dashboard-sidemenu-nav" aria-label="Hlavní navigace">
          {sideMenuItems
            .concat(isAdmin ? [{ icon: '🛡️', label: 'Admin', link: '/dashboard?tab=admin' }] : [])
            .map((item) => {
              const active = location.pathname === item.link.split('?')[0];
              return (
                <Link
                  key={item.link}
                  to={item.link}
                  className={'dashboard-sidemenu-item' + (active ? ' active' : '')}
                  aria-current={active ? 'page' : undefined}
                  title={item.label}
                >
                  <span className="dashboard-sidemenu-icon">{item.icon}</span>
                  <span className="dashboard-sidemenu-label">{item.label}</span>
                </Link>
              );
            })}
        </nav>
      </aside>
      <div className="dashboard-main">
        <div className="dashboard-content" style={{ paddingTop: 32 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import '../App.css';
import api from '../utils/apiClient';
import { ReactComponent as Logo } from '../img/BIKESERVIS.svg';
import { ReactComponent as MDashIcon } from '../img/Mechanic/dashboard.svg';
import { ReactComponent as MProfileIcon } from '../img/Mechanic/profile.svg';
import { ReactComponent as MRequestsIcon } from '../img/Mechanic/requests.svg';
import { ReactComponent as MClientsIcon } from '../img/Mechanic/clients.svg';

// Mechanic layout (now unified white theme like user dashboard)
export default function MechanicLayout() {
  const loc = useLocation();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  useEffect(()=> {
    const init = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setRole('guest'); return; }
        const payload = JSON.parse(atob(token.split('.')[1] || 'e30='));
        if (payload.displayName) setUserName(payload.displayName);
        // confirm role from API (fresh)
        const { data } = await api.get('/auth/me');
        setRole(data.role || 'user');
        const name = data.displayName || data.fullName || `${data.firstName||''} ${data.lastName||''}`.trim();
        if (name) setUserName(name);
      } catch { setRole('guest'); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  if (loading) return <div style={{ padding:40 }}>Načítám...</div>;
  if (role !== 'mechanic' && role !== 'admin') return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  const nav = [
    { to: '/mechanic/dashboard', label: 'Přehled', icon: <MDashIcon width={22} height={22} /> },
    { to: '/mechanic/profile', label: 'Profil', icon: <MProfileIcon width={22} height={22} /> },
    { to: '/mechanic/requests', label: 'Zakázky', icon: <MRequestsIcon width={22} height={22} /> },
    { to: '/mechanic/clients', label: 'Klienti', icon: <MClientsIcon width={22} height={22} /> }
  ];

  const avatarInitial = String((userName && userName.trim()[0]) || 'M').toUpperCase();
  return (
    <div className="dashboard-root">
      <aside className="dashboard-sidemenu">
        <div className="dashboard-logo-container">
          <Logo className="dashboard-logo" />
        </div>
        <nav className="dashboard-sidemenu-nav" style={{ paddingTop:0 }}>
          <div className="dashboard-sidemenu-heading">PANEL</div>
          {nav.map(item => {
            const active = loc.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={"dashboard-sidemenu-item" + (active ? ' active':'')}>
                <span className="dashboard-sidemenu-icon">{item.icon}</span>
                <span className="dashboard-sidemenu-label">{item.label}</span>
              </Link>
            );
          })}
          {/* Removed user mode switch */}
        </nav>
      </aside>
      <div className="dashboard-main">
        <div className="dashboard-header-bar full-bleed">
          <div className="topbar-left" style={{ gap: 18 }}>
            <h1 className="topbar-title" style={{ margin:0 }}>Mechanik panel</h1>
          </div>
          <div className="topbar-right" style={{ gap:12 }}>
            <div className="topbar-profile" style={{ textDecoration:'none', cursor:'default' }}>
              <div className="topbar-avatar" aria-hidden="true">{avatarInitial}</div>
              <div className="topbar-profile-text">
                <div className="topbar-name">{userName || 'Mechanik'}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

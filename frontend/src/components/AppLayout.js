import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ReactComponent as Logo } from '../img/BIKESERVIS.svg';
import '../App.css';
import { ReactComponent as BicycleIcon } from '../img/bicycle.svg';
import { ReactComponent as BellIcon } from '../img/NavBar/bell.svg';
import { ReactComponent as EmailIcon } from '../img/NavBar/email.svg';
import { ReactComponent as SettingsIcon } from '../img/NavBar/settings.svg';
import { ReactComponent as InformationIcon } from '../img/NavBar/information.svg';
import { ReactComponent as LogoutIcon } from '../img/NavBar/logout.svg';
import { ReactComponent as OrderIcon } from '../img/Sidebar/order.svg';
import { ReactComponent as AssistantIcon } from '../img/Sidebar/assistant.svg';
import { ReactComponent as LoyaltyIcon } from '../img/Sidebar/loyalty.svg';
import { ReactComponent as DashboardIcon } from '../img/Sidebar/dashboard.svg';
import api from '../utils/apiClient';

const Icon = ({ name }) => {
  const common = { width: 22, height: 22, fill: 'currentColor' };
  switch (name) {
    case 'home':
  return (<DashboardIcon width={22} height={22} />);
    case 'bikes':
      return (<BicycleIcon className="bicycle-icon" width={22} height={22} />);
    case 'orders':
  return (<OrderIcon width={22} height={22} />);
    case 'assistant':
    return <AssistantIcon width={22} height={22} />;
    case 'loyalty':
    return <LoyaltyIcon width={22} height={22} />;
    case 'admin':
      return (<svg {...common} viewBox="0 0 24 24"><path d="M12 2 3 7v6c0 5 3.5 9.74 9 11 5.5-1.26 9-6 9-11V7l-9-5Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"/></svg>);
    case 'info':
      return (<InformationIcon width={22} height={22} />);
    case 'settings':
      return (<SettingsIcon width={22} height={22} />);
    case 'logout':
      return (<LogoutIcon width={22} height={22} />);
    case 'mail':
      return (<svg {...common} viewBox="0 0 24 24"><path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 0 8 6 8-6"/></svg>);
    case 'bell':
      return (<svg {...common} viewBox="0 0 24 24"><path d="M12 2a4 4 0 0 1 4 4v2c0 .7.37 1.35.97 1.7l1.56.9A3 3 0 0 1 20 13v1H4v-1a3 3 0 0 1 1.47-2.6l1.56-.9c.6-.35.97-1 .97-1.7V6a4 4 0 0 1 4-4Zm0 20a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Z"/></svg>);
    default:
      return null;
  }
};

const sideMenuItems = [
  { icon: 'home', label: 'Domů', link: '/dashboard' },
  { icon: 'bikes', label: 'Moje kola', link: '/my-bikes' },
  { icon: 'orders', label: 'Objednávky', link: '/dashboard?tab=servisni-kniha' },
  { icon: 'assistant', label: 'Asistent', link: '/dashboard?tab=ai-chat' },
  { icon: 'loyalty', label: 'Věrnostní program', link: '/dashboard?tab=vernost' }
];

const accountMenuItems = [
  { icon: 'info', label: 'Informace', link: '/dashboard?tab=account-info' },
  { icon: 'settings', label: 'Nastavení', link: '/dashboard?tab=account-settings' },
  { icon: 'logout', label: 'Odhlásit se', link: '/login', onClick: () => { try { localStorage.removeItem('token'); } catch {} } }
];

export default function AppLayout() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const { data } = await api.get('/auth/me');
        setIsAdmin((data.role || 'user') === 'admin');
        if (data.email) setUserEmail(data.email);
        const fullName = data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim();
        if (fullName) setUserName(fullName);
      } catch (e) {
        // fallback to decoding token if API not available
        try {
          const payload = JSON.parse(atob((localStorage.getItem('token') || '').split('.')[1] || 'e30='));
          setIsAdmin(payload.role === 'admin');
          if (payload.email) setUserEmail(payload.email);
          if (payload.name || payload.fullName) setUserName(payload.name || payload.fullName);
        } catch {}
      }
    };
    run();
  }, [location.pathname]);
  const isLinkActive = (to) => {
    const [path, query] = to.split('?');
    if (location.pathname !== path) return false;
    const current = (location.search || '').replace(/^\?/, '');
    if (!query) {
      // Home without tab is active only when no "tab" param is present
      const params = new URLSearchParams(current);
      return !params.has('tab');
    }
    return current === query;
  };

  return (
    <div className="dashboard-root">
      <aside className="dashboard-sidemenu">
        <div className="dashboard-logo-container">
          <Link to="/dashboard">
            <Logo className="dashboard-logo" />
          </Link>
        </div>
        <nav className="dashboard-sidemenu-nav" aria-label="Hlavní navigace">
          <div className="dashboard-sidemenu-heading">HLAVNÍ MENU</div>
  {sideMenuItems.concat(isAdmin ? [{ icon: 'admin', label: 'Admin', link: '/dashboard?tab=admin' }] : []).map(item => {
    const active = isLinkActive(item.link);
            return (
              <Link key={item.link} to={item.link} className={"dashboard-sidemenu-item" + (active ? ' active' : '')} aria-current={active ? 'page' : undefined} title={item.label}>
        <span className="dashboard-sidemenu-icon"><Icon name={item.icon} /></span>
                <span className="dashboard-sidemenu-label">{item.label}</span>
              </Link>
            );
          })}
          <div className="dashboard-sidemenu-section-divider" />
          <div className="dashboard-sidemenu-heading">ÚČET</div>
          {accountMenuItems.map(item => {
            const active = isLinkActive(item.link);
            return (
              <Link key={item.label} to={item.link} onClick={item.onClick} className={"dashboard-sidemenu-item" + (active ? ' active' : '')} aria-current={active ? 'page' : undefined} title={item.label}>
                <span className="dashboard-sidemenu-icon"><Icon name={item.icon} /></span>
                <span className="dashboard-sidemenu-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="dashboard-main">
        {location.pathname === '/dashboard' && (
          <div className="dashboard-header-bar full-bleed">
            <div className="topbar-left" style={{ gap: 18 }}>
              <h1 className="topbar-title">Dashboard</h1>
            </div>
            <div className="topbar-center">
              <nav className="dashboard-topmenu topbar-nav" aria-label="Sekce dashboardu">
                <Link to="/dashboard?tab=servisni-kniha" className={"dashboard-topmenu-item" + ((new URLSearchParams(location.search).get('tab') === 'servisni-kniha') ? ' active' : '')}>Servisní kniha</Link>
                <Link to="/dashboard?tab=poradenstvi" className={"dashboard-topmenu-item" + ((new URLSearchParams(location.search).get('tab') === 'poradenstvi') ? ' active' : '')}>Poradenství</Link>
                <Link to="/dashboard?tab=prijmovy-formular" className={"dashboard-topmenu-item" + ((new URLSearchParams(location.search).get('tab') === 'prijmovy-formular') ? ' active' : '')}>Příjmový formulář</Link>
              </nav>
            </div>
            <div className="topbar-right">
              <button className="topbar-icon-btn topbar-icon-btn--muted" aria-label="Zprávy">
                <EmailIcon width={18} height={18} />
              </button>
              <button className="topbar-icon-btn topbar-icon-btn--muted" aria-label="Upozornění">
                <BellIcon width={18} height={18} />
              </button>
              <div className="topbar-profile" aria-label="Profil uživatele">
                <div className="topbar-avatar" aria-hidden="true">{String((userName && userName.trim()[0]) || (userEmail && userEmail.trim()[0]) || 'U').toUpperCase()}</div>
                <div className="topbar-profile-text">
                  <div className="topbar-name">{userName || 'Uživatel'}</div>
                  <div className="topbar-email">{userEmail || 'user@example.com'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
  <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

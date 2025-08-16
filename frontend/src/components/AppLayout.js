import React, { useEffect, useState, useCallback } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ReactComponent as Logo } from '../img/BIKESERVIS.svg';
import '../App.css';
import { ReactComponent as BicycleIcon } from '../img/bicycle.svg';
import { ReactComponent as BellIcon } from '../img/NavBar/bell.svg';
import { ReactComponent as EmailIcon } from '../img/NavBar/email.svg';
import { ReactComponent as SettingsIcon } from '../img/NavBar/settings.svg';
import { ReactComponent as InformationIcon } from '../img/NavBar/information.svg';
import { ReactComponent as ProfileSidebarIcon } from '../img/Sidebar/profile.svg';
import { ReactComponent as LogoutIcon } from '../img/NavBar/logout.svg';
import { ReactComponent as OrderIcon } from '../img/Sidebar/order.svg';
import { ReactComponent as AssistantIcon } from '../img/Sidebar/assistant.svg';
import { ReactComponent as LoyaltyIcon } from '../img/Sidebar/loyalty.svg';
import { ReactComponent as DashboardIcon } from '../img/Sidebar/dashboard.svg';
import { ReactComponent as ChatIcon } from '../img/Sidebar/chat.svg';
import api from '../utils/apiClient';
import { getProfileSync, ensureProfile, subscribe } from '../utils/userProfileStore';

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
    case 'chat':
      return <ChatIcon width={22} height={22} />;
    case 'admin':
      return (<svg {...common} viewBox="0 0 24 24"><path d="M12 2 3 7v6c0 5 3.5 9.74 9 11 5.5-1.26 9-6 9-11V7l-9-5Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"/></svg>);
    case 'info':
      return (<InformationIcon width={22} height={22} />);
    case 'profile':
      return (<ProfileSidebarIcon width={22} height={22} />);
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
  { icon: 'orders', label: 'Objednávky', link: '/orders' },
  { icon: 'chat', label: 'Chat', link: '/dashboard?tab=chat' },
  { icon: 'assistant', label: 'Asistent', link: '/dashboard?tab=ai-chat' },
  { icon: 'loyalty', label: 'Věrnost', link: '/dashboard?tab=vernost' }
];

const accountMenuItems = [
  { icon: 'profile', label: 'Profil', link: '/profile' },
  { icon: 'settings', label: 'Nastavení', link: '/dashboard?tab=account-settings' },
  { icon: 'logout', label: 'Odhlásit se', link: '/login', onClick: () => { try { localStorage.removeItem('token'); } catch {} } }
];

export default function AppLayout() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  // Feature flags (simple constants for now; in future could be loaded from API / config)
  const assistantEnabled = false; // AI asistent zatím není dostupný -> badge
  const loyaltyEnabled = false;   // Věrnostní program zatím není dostupný -> badge
  const chatEnabled = false;      // Chat zatím není dostupný -> badge
  // Cache to avoid flicker when navigating fast
  // Inicializace okamžitě z JWT (žádné čekání na async) + případná cache
  useEffect(() => {
    const p = getProfileSync();
    if (p) {
      if (p.email) setUserEmail(p.email);
      if (p.displayName || p.fullName) setUserName(p.displayName || p.fullName);
      if (p.role) setIsAdmin(p.role === 'admin');
      if (p.avatarUrl) {
        const v = /^https?:/i.test(p.avatarUrl) ? p.avatarUrl : (api.defaults.baseURL?.replace(/\/$/, '') || '') + p.avatarUrl;
        setAvatarUrl(v);
      }
    }
    const unsub = subscribe(np => {
      if (np.email) setUserEmail(np.email);
      if (np.displayName || np.fullName) setUserName(np.displayName || np.fullName);
      if (np.role) setIsAdmin(np.role === 'admin');
      if (np.avatarUrl) {
        const v = /^https?:/i.test(np.avatarUrl) ? np.avatarUrl : (api.defaults.baseURL?.replace(/\/$/, '') || '') + np.avatarUrl;
        setAvatarUrl(v);
      }
    });
    // Kick async refresh (non-blocking)
    ensureProfile(api);
    return () => unsub();
  }, []);
  useEffect(() => {
  // On route change, ensure profile refresh (debounced by TTL in store)
  ensureProfile(api);
  }, [location.pathname]);

  // Realtime avatar update from profile upload
  useEffect(() => {
    const handler = (e) => {
      const v = e.detail || '';
      if (!v) { setAvatarUrl(''); return; }
      const abs = /^https?:/i.test(v) ? v : (api.defaults.baseURL?.replace(/\/$/, '') || '') + v;
      setAvatarUrl(abs);
    };
    window.addEventListener('userAvatarUpdated', handler);
    return () => window.removeEventListener('userAvatarUpdated', handler);
  }, []);
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

  const handleSkip = useCallback((e) => {
    e.preventDefault();
    const main = document.getElementById('main-content');
    if (main) {
      main.setAttribute('tabIndex', '-1');
      main.focus();
      setTimeout(()=> main.removeAttribute('tabIndex'), 1000);
    }
  }, []);

  return (
    <div className="dashboard-root">
      <a href="#main-content" onClick={handleSkip} className="skip-link">Přeskočit na obsah</a>
      <aside className="dashboard-sidemenu" role="navigation" aria-label="Postranní navigace">
        <div className="dashboard-logo-container">
          <Link to="/dashboard">
            <Logo className="dashboard-logo" />
          </Link>
        </div>
        <nav className="dashboard-sidemenu-nav" aria-label="Hlavní navigace">
          <div className="dashboard-sidemenu-heading">HLAVNÍ MENU</div>
  {sideMenuItems.concat(isAdmin ? [{ icon: 'admin', label: 'Admin', link: '/dashboard?tab=admin' }] : []).map(item => {
    const active = isLinkActive(item.link);
  const isAssistant = item.icon === 'assistant';
  const isLoyalty = item.icon === 'loyalty';
  const isChat = item.icon === 'chat';
  const disabled = (isAssistant && !assistantEnabled) || (isLoyalty && !loyaltyEnabled) || (isChat && !chatEnabled);
    const content = (
      <>
        <span className="dashboard-sidemenu-icon"><Icon name={item.icon} /></span>
        <span className="dashboard-sidemenu-label">{item.label}</span>
        {disabled && (
          <span className="sidebar-badge sidebar-badge--disabled" aria-label="Funkce zatím není dostupná">
            <span className="sidebar-badge-text">Nedostupné</span>
          </span>
        )}
      </>
    );
    if (disabled) {
      return (
        <span
          key={item.link}
          className={"dashboard-sidemenu-item disabled" + (active ? ' active' : '')}
          title={`${item.label} – funkce se připravuje`}
          aria-disabled="true"
        >
          {content}
        </span>
      );
    }
    return (
      <Link
        key={item.link}
        to={item.link}
        className={"dashboard-sidemenu-item" + (active ? ' active' : '')}
        aria-current={active ? 'page' : undefined}
        title={item.label}
      >
        {content}
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
  <div className="dashboard-main" role="main" id="main-content">
        {(() => {
          const path = location.pathname || '';
          const pageTitle = (() => {
            if (path.startsWith('/dashboard')) return 'Dashboard';
            if (path.startsWith('/my-bikes')) return 'Moje kola';
            if (path.startsWith('/add-bike')) return 'Přidat kolo';
            if (path.startsWith('/bikes/') && path.endsWith('/edit')) return 'Upravit kolo';
            if (path.startsWith('/bikes/')) return 'Detail kola';
            if (path.startsWith('/orders')) return 'Objednávky'; // jednotný název i pro /orders/new
            if (path.startsWith('/profile')) return 'Profil';
            if (path.startsWith('/login')) return 'Přihlášení';
            if (path.startsWith('/register')) return 'Registrace';
            if (path.startsWith('/verify-email')) return 'Ověření emailu';
            if (path.startsWith('/forgot-password')) return 'Obnova hesla';
            return 'Cykloservis';
          })();
          return (
            <div className="dashboard-header-bar full-bleed">
              <div className="topbar-left" style={{ gap: 18 }}>
                <h1 className="topbar-title">{pageTitle}</h1>
              </div>
              <div className="topbar-center" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap: 12 }}>
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
                <Link to="/profile" className="topbar-profile" aria-label="Profil uživatele">
                  <div className="topbar-avatar" aria-hidden="true" style={avatarUrl ? { padding:0, overflow:'visible', borderRadius:12 } : undefined}>
                    {avatarUrl ? (
                      <img src={avatarUrl.startsWith('http') ? avatarUrl : (api.defaults.baseURL?.replace(/\/$/, '') || '') + avatarUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', borderRadius:12 }} onError={(ev)=>{ ev.currentTarget.style.display='none'; }} />
                    ) : (
                      String((userName && userName.trim()[0]) || (userEmail && userEmail.trim()[0]) || 'U').toUpperCase()
                    )}
                  </div>
                  <div className="topbar-profile-text">
                    <div className="topbar-name">{userName || 'Uživatel'}</div>
                    <div className="topbar-email">{userEmail || 'user@example.com'}</div>
                  </div>
                </Link>
              </div>
            </div>
          );
        })()}
        <div className="dashboard-content" aria-live="polite">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

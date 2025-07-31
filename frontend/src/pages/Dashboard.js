import React from 'react';
import { ReactComponent as Logo } from '../img/BIKESERVIS.svg';
import '../App.css';

const sideMenuItems = [
  { icon: '🚲', label: 'Moje kola', link: '#' },
  { icon: '🔩', label: 'Součástky', link: '#' },
  { icon: '🤖', label: 'AI chat', link: '#' },
  { icon: '🎁', label: 'Věrnostní program', link: '#' },
];

const topMenuItems = [
  { label: 'Servisní kniha', link: '#' },
  { label: 'Poradenství', link: '#' },
  { label: 'Příjmový formulář', link: '#' },
];

const Dashboard = () => {
  return (
    <div className="dashboard-root">
      {/* Levé vertikální menu */}
      <aside className="dashboard-sidemenu">
        <div className="dashboard-logo-container">
          <a href="/dashboard">
            <Logo className="dashboard-logo" />
          </a>
        </div>
        <nav className="dashboard-sidemenu-nav">
          {sideMenuItems.map((item, idx) => (
            <a key={idx} href={item.link} className="dashboard-sidemenu-item" title={item.label}>
              <span className="dashboard-sidemenu-icon">{item.icon}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Hlavní obsah s horizontálním menu */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <nav className="dashboard-topmenu">
            {topMenuItems.map((item, idx) => (
              <a key={idx} href={item.link} className="dashboard-topmenu-item">{item.label}</a>
            ))}
          </nav>
          <div className="dashboard-profile-menu">
            <button className="dashboard-profile-btn" title="Profil">
              <span role="img" aria-label="Profil">👤</span>
            </button>
            {/* Dropdown menu (zobrazit po kliknutí) */}
            <div className="dashboard-profile-dropdown">
              <button type="button" className="dashboard-profile-dropdown-btn">Profil</button>
              <button type="button" className="dashboard-profile-dropdown-btn">Nastavení</button>
              <button type="button" className="dashboard-profile-dropdown-btn">Oznámení</button>
            </div>
          </div>
        </header>
        <section className="dashboard-content">
          <h1>Vítejte v klientském centru Cykloservisu!</h1>
          <p>Zde najdete správu svých kol, součástek, věrnostní program a další funkce.</p>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

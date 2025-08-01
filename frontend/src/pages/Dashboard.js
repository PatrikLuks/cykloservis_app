import { fetchWeatherByCoords } from '../utils/weatherApi';
import InfoCard from '../components/InfoCard';
// Návrh dashboardu pro klienta cykloservisu:
// Viz obrázek: /Applications/cykloservis_app/ite.png
import React, { useState, useRef, useEffect } from 'react';
import { ReactComponent as Logo } from '../img/BIKESERVIS.svg';
import '../App.css';
import './DashboardCustom.css';

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
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState('');

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setWeatherError('Geolokace není podporována.');
      setWeatherLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const data = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
          setWeather(data);
        } catch (e) {
          setWeatherError('Nepodařilo se načíst počasí.');
        }
        setWeatherLoading(false);
      },
      err => {
        setWeatherError('Nepodařilo se získat polohu.');
        setWeatherLoading(false);
      }
    );
  }, []);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileBtnRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileBtnRef.current && !profileBtnRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);
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
        {/* Karta počasí vpravo nahoře pod profilem */}
        <div style={{ position: 'absolute', right: 32, top: 90, zIndex: 20, maxWidth: 320 }}>
          {weatherLoading ? (
            <InfoCard icon="☀️" title="Počasí" value="Načítám..." background="#f7faff" />
          ) : weatherError ? (
            <InfoCard icon="☀️" title="Počasí" value={weatherError} background="#f7faff" />
          ) : weather ? (
            <InfoCard
              icon={<img src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} alt={weather.weather[0].description} style={{width: 40, height: 40}} />}
              title={`Počasí: ${weather.name}`}
              value={`${Math.round(weather.main.temp)}°C, ${weather.weather[0].description}`}
              background="#f7faff"
            />
          ) : null}
        </div>
          <nav className="dashboard-topmenu">
            {topMenuItems.map((item, idx) => (
              <a key={idx} href={item.link} className="dashboard-topmenu-item">{item.label}</a>
            ))}
          </nav>
          <div className="dashboard-profile-menu" ref={profileBtnRef}>
            <button
              className="dashboard-profile-btn"
              title="Profil"
              onClick={() => setProfileOpen(v => !v)}
              aria-haspopup="true"
              aria-expanded={profileOpen}
            >
              <span role="img" aria-label="Profil">👤</span>
            </button>
            {profileOpen && (
              <div className="dashboard-profile-dropdown">
                <button type="button" className="dashboard-profile-dropdown-btn">Profil</button>
                <button type="button" className="dashboard-profile-dropdown-btn">Nastavení</button>
                <button type="button" className="dashboard-profile-dropdown-btn">Oznámení</button>
              </div>
            )}
          </div>
        </header>
        <section className="dashboard-content">
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', marginTop: 32 }}>
            <div style={{ minWidth: 260, maxWidth: 340 }}>
              <InfoCard icon="🚲" title="Moje kola" value="2 aktivní" background="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <h1>Vítejte v klientském centru Cykloservisu!</h1>
              <p>Zde najdete správu svých kol, součástek, věrnostní program a další funkce.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32, marginTop: 32 }}>
                <InfoCard icon="🎁" title="Věrnostní body" value="1 250 bodů" background="#fff" />
                <InfoCard icon="🔧" title="Servis" value="Objednaný: 3. 8. 2025" background="#f7faff" />
                <InfoCard icon="📢" title="Oznámení" value="Nová zpráva od technika" background="#f7faff" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

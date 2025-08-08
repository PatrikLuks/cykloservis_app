import { fetchWeatherByCoords } from '../utils/weatherApi';
import InfoCard from '../components/InfoCard';
import WeatherCard from '../components/WeatherCard';
import RegisterHero from '../img/Register-hero.png';
// Návrh dashboardu pro klienta cykloservisu:
// Viz obrázek: /Applications/cykloservis_app/ite.png
import React, { useState, useEffect } from 'react';
import { ReactComponent as Logo } from '../img/BIKESERVIS.svg';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import './DashboardCustom.css';

const sideMenuItems = [
  { icon: '🚲', label: 'Moje kola', link: '/my-bikes' },
  { icon: '🔩', label: 'Součástky', link: '/dashboard?tab=soucastky' },
  { icon: '🤖', label: 'AI chat', link: '/dashboard?tab=ai-chat' },
  { icon: '🎁', label: 'Věrnostní program', link: '/dashboard?tab=vernost' },
];


const Dashboard = () => {
  const navigate = useNavigate();
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const buttonStyle = {
    marginTop: 12,
    background: 'linear-gradient(90deg, #1976d2 60%, #64b5f6 100%)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 18,
    border: 'none',
    borderRadius: 12,
    padding: '12px 32px',
    boxShadow: '0 2px 8px #1976d210',
    cursor: 'pointer',
    transition: 'background 0.2s'
  };
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState('');

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setWeatherError('Geolokace není podporována.');
      setWeatherLoading(false);
      setForecastLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const data = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
          setWeather(data);
          setWeatherLoading(false);
          // Načtení předpovědi
          setForecastLoading(true);
          setForecastError('');
          try {
            const forecastData = await import('../utils/forecastApi').then(mod => mod.fetchForecastByCoords(pos.coords.latitude, pos.coords.longitude));
            setForecast(forecastData);
          } catch (e) {
            setForecastError('Nepodařilo se načíst předpověď.');
          }
          setForecastLoading(false);
        } catch (e) {
          setWeatherError('Nepodařilo se načíst počasí.');
          setWeatherLoading(false);
          setForecastLoading(false);
        }
      },
      err => {
        setWeatherError('Nepodařilo se získat polohu.');
        setWeatherLoading(false);
        setForecastLoading(false);
      }
    );
  }, []);

  return (
    <>
      <div className="dashboard-root">
        {/* Levé vertikální menu */}
        <aside className="dashboard-sidemenu">
          <div className="dashboard-logo-container">
            <Link to="/dashboard">
              <Logo className="dashboard-logo" />
            </Link>
          </div>
          <nav className="dashboard-sidemenu-nav">
            {sideMenuItems.map((item, idx) => (
              <Link key={idx} to={item.link} className="dashboard-sidemenu-item" title={item.label}>
                <span className="dashboard-sidemenu-icon">{item.icon}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Hlavní obsah s horizontálním menu */}
        <main className="dashboard-main">
          <header className="dashboard-header">
            {/* Horizontální menu sekcí */}
            <nav className="dashboard-topmenu" aria-label="Sekce dashboardu">
              <Link to="/dashboard?tab=servisni-kniha" className="dashboard-topmenu-item">Servisní kniha</Link>
              <Link to="/dashboard?tab=poradenstvi" className="dashboard-topmenu-item">Poradenství</Link>
              <Link to="/dashboard?tab=prijmovy-formular" className="dashboard-topmenu-item">Příjmový formulář</Link>
            </nav>
            {/* Profil v pravém horním rohu */}
            <div style={{ position: 'absolute', right: 32, top: 32, zIndex: 100 }}>
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
                <div className={"dashboard-profile-dropdown open"}>
                  <button type="button" className="dashboard-profile-dropdown-btn">Profil</button>
                  <button type="button" className="dashboard-profile-dropdown-btn">Nastavení</button>
                  <button type="button" className="dashboard-profile-dropdown-btn">Oznámení</button>
                  <button
                    type="button"
                    className="dashboard-profile-dropdown-btn"
                    onClick={() => { try { localStorage.removeItem('token'); } catch {}; navigate('/login'); }}
                  >
                    Odhlásit
                  </button>
                </div>
              )}
            </div>
            {/* Bohatá karta počasí pod profilem */}
            <div style={{ position: 'absolute', right: 32, top: 90, zIndex: 20, maxWidth: 340, minWidth: 260 }}>
              {/* Animace v pravém horním rohu podle počasí */}
              {weather && (
                null
              )}
              <WeatherCard
                weather={weather}
                weatherLoading={weatherLoading}
                weatherError={weatherError}
                forecast={forecast}
                forecastLoading={forecastLoading}
                forecastError={forecastError}
              />
            </div>
          </header>
          <section className="dashboard-content">
            <div style={{ position: 'relative', minHeight: 180 }}>
              <div
                className="moje-kola-card"
                style={{
                  position: 'absolute',
                  left: '80px',
                  top: '32px',
                  transform: 'translateX(-40%)',
                  zIndex: 30,
                  overflow: 'hidden',
                }}
              >
              <img src={RegisterHero} alt="Moje kolo" style={{ width: '80%', maxWidth: 220, borderRadius: 18, boxShadow: '0 2px 12px #0002', marginBottom: 16 }} />
                <h2 style={{ fontWeight: 800, fontSize: 28, color: '#1976d2', margin: 0 }}>Moje kola</h2>
                <div style={{ fontSize: 18, color: '#222', fontWeight: 500, marginBottom: 8 }}>2 aktivní kola</div>
                <div style={{ width: '100%', background: '#f7faff', borderRadius: 14, padding: '16px 12px', boxShadow: '0 2px 8px #1976d210', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, color: '#1976d2', fontSize: 17 }}>Poslední servis: 3. 8. 2025</div>
                  <div style={{ fontSize: 15, color: '#444', marginTop: 4 }}>Další servis za 120 km</div>
                </div>
                <Link to="/my-bikes"><button style={buttonStyle}>Spravovat kola</button></Link>
              </div>
              <div style={{ marginLeft: 360 }}>
                <h1>Vítejte v klientském centru Cykloservisu!</h1>
                <p>Zde najdete správu svých kol, součástek, věrnostní program a další funkce.</p>
                <div className="dashboard-infocards-grid">
                  <InfoCard icon="🎁" title="Věrnostní body" value="1 250 bodů" background="#fff" />
                  <InfoCard icon="🔧" title="Servis" value="Objednaný: 3. 8. 2025" background="#f7faff" />
                  <InfoCard icon="📢" title="Oznámení" value="Nová zpráva od technika" background="#f7faff" />
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default Dashboard;

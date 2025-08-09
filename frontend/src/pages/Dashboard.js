import { fetchWeatherByCoords } from '../utils/weatherApi';
import StatCard from '../components/StatCard';
import { useDashboardData } from '../hooks/useDashboardData';
import WeatherCard from '../components/WeatherCard';
import RegisterHero from '../img/Register-hero.png';
import React, { useState, useEffect } from 'react';
import AdminPanel from './AdminPanel';
import { useSearchParams } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import './DashboardCustom.css';


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
  const { loading: dashLoading, stats } = useDashboardData();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

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
    <div>
      <header className="dashboard-header">
        <nav className="dashboard-topmenu" aria-label="Sekce dashboardu" style={{ flex:1 }}>
          <Link to="/dashboard?tab=servisni-kniha" className="dashboard-topmenu-item">Servisní kniha</Link>
          <Link to="/dashboard?tab=poradenstvi" className="dashboard-topmenu-item">Poradenství</Link>
          <Link to="/dashboard?tab=prijmovy-formular" className="dashboard-topmenu-item">Příjmový formulář</Link>
        </nav>
        <div className="dashboard-profile-wrapper">
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
      </header>
      <section style={{ padding: '48px 40px' }}>
        {tab === 'admin' ? (
          <div style={{ background:'#fff', borderRadius:40, padding:'32px 40px', boxShadow:'0 8px 32px -8px rgba(16,24,40,0.12)' }}>
            <AdminPanel />
          </div>
        ) : (
        <div className="dashboard-responsive-grid" style={{ display:'grid', gridTemplateColumns:'360px 1fr 300px', gap:40, alignItems:'start' }}>
          {/* Left Bike summary */}
          <div style={{ background:'#fff', borderRadius:40, padding:'40px 40px 30px', boxShadow:'0 8px 32px -8px rgba(16,24,40,0.12)', display:'flex', flexDirection:'column', gap:26 }}>
            <div>
              <h2 style={{ fontSize:24, fontWeight:800, margin:'0 0 18px' }}>Moje Kola</h2>
              <div style={{ fontSize:22, fontWeight:800 }}>Trek Horské kolo</div>
              <div style={{ fontSize:18, fontWeight:500, marginTop:4 }}>Bike MX 7206P</div>
            </div>
            <div style={{ display:'flex', gap:50, fontSize:14 }}>
              <div>
                <div style={{ fontSize:13, color:'#475467', fontWeight:600, textTransform:'uppercase' }}>Celkem Km</div>
                <div style={{ fontSize:20, fontWeight:800, marginTop:4 }}>157Km</div>
              </div>
              <div>
                <div style={{ fontSize:13, color:'#475467', fontWeight:600, textTransform:'uppercase' }}>Stav</div>
                <div style={{ fontSize:20, fontWeight:800, marginTop:4 }}>Perfektní</div>
              </div>
            </div>
            <div style={{ width:'100%', display:'flex', justifyContent:'center', padding:'10px 0 0' }}>
              <img src={RegisterHero} alt="Aktuální kolo" style={{ maxWidth:'100%', maxHeight:220, objectFit:'contain', filter:'drop-shadow(0 8px 28px rgba(0,0,0,.25))' }} />
            </div>
            <Link to="/my-bikes"><button style={buttonStyle}>Spravovat kola</button></Link>
          </div>
          {/* Middle stats & recent */}
          <div style={{ display:'flex', flexDirection:'column', gap:38 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px,1fr))', gap:30 }}>
              <StatCard loading={dashLoading} title="Věrnostní body" value={`${stats.loyaltyPoints} bodů`} icon={<span role="img" aria-label="pohár">🏆</span>} iconBg="#e5f0ff" />
              <StatCard loading={dashLoading} title="Příští servis za" value={`${stats.nextServiceKm} km`} icon={<span role="img" aria-label="servis">⚙️</span>} iconBg="#e5f0ff" />
              <StatCard loading={dashLoading} title="Dokončené servisy" value={String(stats.completedServices)} subtitle="Tento rok" icon={<span role="img" aria-label="nářadí">🛠️</span>} iconBg="#e5f0ff" />
            </div>
            <div style={{ background:'#fff', borderRadius:40, padding:'38px 46px 44px', boxShadow:'0 8px 32px -8px rgba(16,24,40,0.12)' }}>
              <h2 style={{ margin:'0 0 26px', fontSize:30, fontWeight:800 }}>Nedávná aktivita</h2>
              <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:22 }}>
                <li style={{ display:'flex', gap:18 }}>
                  <span style={{ color:'#12B76A', fontSize:26 }}>•</span>
                  <div>
                    <div style={{ fontWeight:700 }}>Dokončen servis</div>
                    <div style={{ fontSize:14, color:'#475467', marginTop:2 }}>Trek Horské kolo — Velký servis + výměna brzd</div>
                  </div>
                  <div style={{ marginLeft:'auto', fontSize:13, color:'#475467' }}>Před 3 dny</div>
                </li>
                <li style={{ display:'flex', gap:18 }}>
                  <span style={{ color:'#12B76A', fontSize:26 }}>•</span>
                  <div>
                    <div style={{ fontWeight:700 }}>Naplánován termín</div>
                    <div style={{ fontSize:14, color:'#475467', marginTop:2 }}>Kontrola pohonu</div>
                  </div>
                  <div style={{ marginLeft:'auto', fontSize:13, color:'#475467' }}>Před týdnem</div>
                </li>
              </ul>
            </div>
          </div>
          {/* Right side weather + messages */}
          <div style={{ display:'flex', flexDirection:'column', gap:34 }}>
            <div style={{ position:'relative' }}>
              <WeatherCard
                weather={weather}
                weatherLoading={weatherLoading}
                weatherError={weatherError}
                forecast={forecast}
                forecastLoading={forecastLoading}
                forecastError={forecastError}
              />
            </div>
            <div style={{ background:'#fff', borderRadius:40, padding:'34px 36px 38px', boxShadow:'0 8px 32px -8px rgba(16,24,40,0.12)', minHeight:220 }}>
              <h3 style={{ margin:'0 0 18px', fontSize:24, fontWeight:800 }}>Zprávy</h3>
              <div style={{ display:'flex', alignItems:'center', gap:14, background:'#f2f4f7', padding:'14px 16px', borderRadius:22 }}>
                <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#1976d2,#64b5f6)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18 }} aria-hidden="true">J</div>
                <div style={{ fontWeight:600 }}>Jakub Tučák</div>
                <div style={{ marginLeft:'auto', background:'#ff4d4f', color:'#fff', fontSize:12, fontWeight:600, padding:'4px 8px', borderRadius:12 }}>1</div>
              </div>
            </div>
          </div>
  </div>
  )}
      </section>
    </div>
  );
}

export default Dashboard;

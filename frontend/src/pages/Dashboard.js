import { fetchWeatherByCoords } from '../utils/weatherApi';
import StatCard from '../components/StatCard';
import { useDashboardData } from '../hooks/useDashboardData';
import WeatherCard from '../components/WeatherCard';
import ShowroomBike from '../img/showroomBike.png';
import React, { useState, useEffect } from 'react';
import api from '../utils/apiClient';
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
  const buttonStyle = { marginTop: 12 };
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState('');
  const { loading: dashLoading, stats } = useDashboardData();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const [userName, setUserName] = useState('Uživatel');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [avatarInitial, setAvatarInitial] = useState('U');

  useEffect(() => {
    // Prefer fetching real user from API; fallback to JWT
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const { data } = await api.get('/auth/me');
        const fullName = data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim();
        const firstOnly = (data.firstName || (fullName || '').split(' ')[0] || '').trim();
        const name = firstOnly || 'Uživatel';
        const email = data.email || 'user@example.com';
        setUserName(name);
        setUserEmail(email);
        const initial = (name && name.trim()[0]) || (email && email.trim()[0]) || 'U';
        setAvatarInitial(String(initial).toUpperCase());
      } catch (e) {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          const payload = JSON.parse(atob(token.split('.')[1] || 'e30='));
          const firstOnly = payload.firstName || (payload.name || payload.fullName || '').split(' ')[0] || '';
          const name = (firstOnly || 'Uživatel').trim();
          const email = payload.email || 'user@example.com';
          setUserName(name);
          setUserEmail(email);
          const initial = (name && name.trim()[0]) || (email && email.trim()[0]) || 'U';
          setAvatarInitial(String(initial).toUpperCase());
        } catch {}
      }
    };
    load();
  }, []);

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
    <div className="dashboard-theme">
      <section className="dashboard-content">
        {tab === 'admin' ? (
          <div style={{ background:'#fff', borderRadius:40, padding:'32px 40px', boxShadow:'0 8px 32px -8px rgba(16,24,40,0.12)' }}>
            <AdminPanel />
          </div>
        ) : (
        <div className="dashboard-grid">
          {/* Left Bike summary */}
          <div className="ds-card" style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div>
              <h2 style={{ fontSize:22, margin:'0 0 12px' }}>Moje Kola</h2>
              <div style={{ fontSize:20, fontWeight:800 }}>Trek Horské kolo</div>
              <div className="muted" style={{ fontSize:14, fontWeight:600, marginTop:4 }}>Bike MX 7206P</div>
            </div>
            <div style={{ display:'flex', gap:30, fontSize:14 }}>
              <div>
                <div className="muted" style={{ fontSize:12, fontWeight:700, textTransform:'uppercase' }}>Celkem Km</div>
                <div style={{ fontSize:20, fontWeight:800, marginTop:4 }}>157Km</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize:12, fontWeight:700, textTransform:'uppercase' }}>Stav</div>
                <div style={{ fontSize:20, fontWeight:800, marginTop:4 }}>Perfektní</div>
              </div>
            </div>
            <div style={{ width:'100%', display:'flex', justifyContent:'center', padding:'10px 0 0' }}>
              <img src={ShowroomBike} alt="Aktuální kolo" style={{ maxWidth:'100%', maxHeight:220, objectFit:'contain', filter:'drop-shadow(0 8px 28px rgba(0,0,0,.25))' }} />
            </div>
            <Link to="/my-bikes"><button className="btn-primary" style={buttonStyle}>Spravovat kola</button></Link>
          </div>
          {/* Middle stats & recent */}
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {/* Hello card */}
            <div className="ds-card hello-card" style={{ display:'flex', alignItems:'center', justifyContent:'flex-start', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:46, height:46, borderRadius:14, background:'#eff2ff', color:'var(--ds-primary, #394ff7)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:20 }} aria-hidden="true">{avatarInitial}</div>
                <div>
                  <div style={{ fontSize:24 }}>
                    <span style={{ fontWeight:500 }}>Ahoj, </span>
                    <span style={{ fontWeight:600 }}>{userName}</span>{' '}
                    <span role="img" aria-label="wave">👋</span>
                  </div>
                  <div className="muted" style={{ fontSize:13 }}>Dnes je skvělý den sednout na kolo.</div>
                </div>
              </div>
            </div>
            {/* Ongoing orders card */}
            <div className="ds-card" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <h3 style={{ margin:'0 0 6px', fontSize:22, }}>Probíhající objednávky</h3>
              <div className="muted" style={{ fontSize:13, marginBottom:6 }}>Přehled aktuálních zakázek ve zpracování</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', border:'1px solid #eef2f7', borderRadius:12, background:'#f9fafb' }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:'#eff2ff', color:'var(--ds-primary, #394ff7)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800 }} aria-hidden="true">#1</div>
                  <div style={{ fontWeight:600 }}>Velký servis + čištění pohonu</div>
                  <div className="chip" style={{ marginLeft:'auto' }}>Probíhá</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', border:'1px solid #eef2f7', borderRadius:12, background:'#fff' }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:'#eff2ff', color:'var(--ds-primary, #394ff7)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800 }} aria-hidden="true">#2</div>
                  <div style={{ fontWeight:600 }}>Kontrola brzd a seřízení</div>
                  <div className="chip" style={{ marginLeft:'auto', background:'#fff7ed', borderColor:'#fed7aa', color:'#c2410c' }}>Čeká</div>
                </div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px,1fr))', gap:20 }}>
              <StatCard
                loading={dashLoading}
                title="Věrnostní body"
                value={`${stats.loyaltyPoints} bodů`}
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 3h10a2 2 0 0 1 2 2v2a4 4 0 0 1-5 3.87V21l-2-1-2 1V10.87A4 4 0 0 1 5 7V5a2 2 0 0 1 2-2Zm10 4V5H7v2a2 2 0 1 0 4 0h2a2 2 0 1 0 4 0Z"/></svg>}
                iconBg="#e5f0ff"
              />
              <StatCard
                loading={dashLoading}
                title="Příští servis za"
                value={`${stats.nextServiceKm} km`}
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 2h4v3h-4zM4 10h3v4H4zM17 10h3v4h-3zM10 19h4v3h-4zM7 7l2.5 2.5-2 2L5 9zM17 7l2 2-2.5 2.5-2-2zM7 17l2-2 2.5 2.5-2 2zM17 17l-2.5-2.5 2-2 2.5 2.5z"/></svg>}
                iconBg="#e5f0ff"
              />
              <StatCard
                loading={dashLoading}
                title="Dokončené servisy"
                value={String(stats.completedServices)}
                subtitle="Tento rok"
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 7.5 19.5 6l-2 2-2-2L14 7.5l2 2-2 2L15.5 12l2-2 2 2L21 9.5l-2-2ZM13 3H3v18h18V13h-2v6H5V5h8V3Z"/></svg>}
                iconBg="#e5f0ff"
              />
            </div>
          </div>
          {/* Right side weather + messages */}
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
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
            <div className="ds-card" style={{ minHeight:220 }}>
              <h3 style={{ margin:'0 0 18px', fontSize:24, }}>Zprávy</h3>
              <div style={{ display:'flex', alignItems:'center', gap:14, background:'#f2f4f7', padding:'14px 16px', borderRadius:12, border:'1px solid #eef2f7' }}>
                <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#394ff7,#64b5f6)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18 }} aria-hidden="true">J</div>
                <div style={{ fontWeight:600 }}>Jakub Tučák</div>
                <div style={{ marginLeft:'auto', background:'#ff4d4f', color:'#fff', fontSize:12, fontWeight:600, padding:'4px 8px', borderRadius:12 }}>1</div>
              </div>
            </div>
          </div>
          {/* Recent history table full width */}
          <div className="ds-card table-card" style={{ gridColumn:'1 / -1' }}>
            <div className="table-card-header">
              <h3>Nedávná aktivita</h3>
              <div className="table-card-actions">
                <input type="search" className="ds-input" placeholder="Hledat..." aria-label="Hledat v aktivitách" />
                <select className="ds-select" aria-label="Období">
                  <option>Tento týden</option>
                  <option>Minulý týden</option>
                  <option>Tento měsíc</option>
                </select>
              </div>
            </div>
            <div className="ds-table-wrapper">
              <table className="ds-table" role="table">
                <thead>
                  <tr>
                    <th>Událost</th>
                    <th>Popis</th>
                    <th>Datum</th>
                    <th>Stav</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Dokončen servis</td>
                    <td className="muted">Trek Horské kolo — Velký servis + výměna brzd</td>
                    <td>2025-08-08</td>
                    <td><span className="chip">Hotovo</span></td>
                  </tr>
                  <tr>
                    <td>Naplánován termín</td>
                    <td className="muted">Kontrola pohonu</td>
                    <td>2025-08-04</td>
                    <td><span className="chip" style={{background:'#fff7ed', borderColor:'#fed7aa', color:'#c2410c'}}>Čeká</span></td>
                  </tr>
                  <tr>
                    <td>Přidán nový bicykl</td>
                    <td className="muted">Gravel Canyon — seriové číslo ABC123</td>
                    <td>2025-07-29</td>
                    <td><span className="chip" style={{background:'#eff2ff'}}>Potvrzeno</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
  </div>
  )}
      </section>
    </div>
  );
}

export default Dashboard;

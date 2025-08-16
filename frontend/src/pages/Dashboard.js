import { fetchWeatherByCoords } from '../utils/weatherApi';
import StatCard from '../components/StatCard';
import { useDashboardData } from '../hooks/useDashboardData';
import WeatherCard from '../components/WeatherCard';
import ShowroomBike from '../img/showroomBike.png';
import { listBikes } from '../utils/bikesApi';
import React, { useState, useEffect } from 'react';
import api from '../utils/apiClient';
import AdminPanel from './AdminPanel';
import { useSearchParams } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import './DashboardCustom.css';
import { ReactComponent as ArrowBackIcon } from '../img/arrow-icon-back.svg';
import { ReactComponent as ActivityIcon } from '../img/icons/activity.svg';
import { fetchRecentActivity } from '../utils/activityApi';
import { listServiceRequests } from '../utils/serviceRequestsApi';


function getInitialUserInfo(){
  let name = 'Uživatel';
  let email = 'user@example.com';
  try {
    const token = localStorage.getItem('token');
    if (token){
      const payload = JSON.parse(atob(token.split('.')[1] || 'e30='));
      const display = payload.displayName || payload.fullName || `${payload.firstName || ''} ${payload.lastName || ''}`.trim();
      if (display) name = display.split(' ')[0] || display; // first name for greeting
      if (payload.email) email = payload.email;
      return { name, email, initial: (name.trim()[0] || email.trim()[0] || 'U').toUpperCase() };
    }
  } catch {}
  try {
    const cached = JSON.parse(localStorage.getItem('userProfileCache') || 'null');
    if (cached){
      const display = cached.displayName || cached.fullName || `${cached.firstName || ''} ${cached.lastName || ''}`.trim();
      if (display) name = display.split(' ')[0] || display;
      if (cached.email) email = cached.email;
    }
  } catch {}
  return { name, email, initial: (name.trim()[0] || email.trim()[0] || 'U').toUpperCase() };
}

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
  const initialUser = getInitialUserInfo();
  const [userName, setUserName] = useState(initialUser.name);
  const [userEmail, setUserEmail] = useState(initialUser.email);
  const [avatarInitial, setAvatarInitial] = useState(initialUser.initial);
  const [firstBike, setFirstBike] = useState(null);
  const [bikesLoading, setBikesLoading] = useState(true);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  useEffect(() => {
    // Prefer fetching real user from API; fallback to JWT
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const { data } = await api.get('/auth/me');
  const fullName = data.displayName || data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim();
  const firstOnly = (data.firstName || (fullName || '').split(' ')[0] || '').trim();
  const name = firstOnly || fullName || 'Uživatel';
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

  // Load recent activity (bike create/delete)
  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try {
        setActivityLoading(true);
        const data = await fetchRecentActivity();
        if (mounted) setActivity(data);
      } catch { if (mounted) setActivity([]); }
      finally { if (mounted) setActivityLoading(false); }
    })();
    return ()=> { mounted = false; };
  }, []);

  // Load service requests (ongoing orders)
  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try {
        setRequestsLoading(true);
        const data = await listServiceRequests();
        if (mounted) setRequests(data);
      } catch { if (mounted) setRequests([]); }
      finally { if (mounted) setRequestsLoading(false); }
    })();
    return ()=> { mounted = false; };
  }, []);

  // Load bikes and keep the earliest created (assuming API returns newest first -> take last; if oldest first -> take first). We'll just pick the first element for now.
  useEffect(()=>{
    (async ()=> {
      try {
        setBikesLoading(true);
        const data = await listBikes();
        if (Array.isArray(data) && data.length>0) {
          // Determine earliest by createdAt if present
          let chosen = data[0];
          if (data[0] && data[0].createdAt) {
            chosen = data.slice().sort((a,b)=> new Date(a.createdAt)-new Date(b.createdAt))[0];
          }
          setFirstBike(chosen);
        } else {
          setFirstBike(null);
        }
      } catch { setFirstBike(null); }
      finally { setBikesLoading(false); }
    })();
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
          {/* Left column: Hello + My Bikes */}
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {/* Hello card (moved above bikes) */}
            <div className="ds-card hello-card" style={{ display:'flex', alignItems:'center', justifyContent:'flex-start', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:46, height:46, borderRadius:14, background:'#eff2ff', color:'var(--ds-primary, #394ff7)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:20 }} aria-hidden="true">{avatarInitial}</div>
                <div className="dashboard-welcome-content">
                  <div style={{ fontSize:24 }}>
                    <span style={{ fontWeight:500 }}>Ahoj, </span>
                    <span style={{ fontWeight:600 }}>{userName}</span>{' '}
                    <span role="img" aria-label="wave">👋</span>
                  </div>
                  <div className="muted" style={{ fontSize:13 }}>Dnes je skvělý den sednout na kolo.</div>
                </div>
              </div>
            </div>
            {/* My Bikes card */}
            <div className="ds-card" style={{ display:'flex', flexDirection:'column', gap:18, minHeight:340 }}>
              <h2 style={{ fontSize:22, margin:'0 0 4px' }}>Moje Kola</h2>
              {bikesLoading ? (
                <div style={{ display:'flex', flexDirection:'column', flexGrow:1 }}>
                  <div className="muted" style={{ fontSize:13 }}>Načítám kola…</div>
                  <div style={{ flexGrow:1 }} />
                </div>
              ) : !firstBike ? (
                <div style={{ display:'flex', flexDirection:'column', flexGrow:1, height:'100%', padding:'10px 4px' }}>
                  <div style={{ flexGrow:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div className="muted" style={{ fontSize:14, textAlign:'center' }}>Žádné kolo – přidejte první</div>
                  </div>
                  <div style={{ marginTop:'auto' }}>
                    <Link to="/add-bike" style={{ width:'100%', textDecoration:'none' }}>
                      <button className="btn-cta" style={{ width:'100%', justifyContent:'space-between', display:'flex', alignItems:'center', background:'#394ff7', color:'#fff' }}>
                        <span>Přidat první kolo</span>
                        <ArrowBackIcon class="basic-icons" width={20} height={20} style={{ transform:'rotate(180deg)' }} />
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ fontSize:20, fontWeight:800 }}>
                      {firstBike.type ? (firstBike.type + ' kolo') : firstBike.title}
                    </div>
                    <div className="muted" style={{ fontSize:14, fontWeight:600, marginTop:4 }}>{firstBike.model || '—'}</div>
                  </div>
                  <div style={{ display:'flex', gap:30, fontSize:14 }}>
                    <div>
                      <div className="muted" style={{ fontSize:12, fontWeight:700, textTransform:'uppercase' }}>Rok</div>
                      <div style={{ fontSize:20, fontWeight:500, marginTop:4 }}>{firstBike.year || '—'}</div>
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize:12, fontWeight:700, textTransform:'uppercase' }}>Minuty</div>
                      <div style={{ fontSize:20, fontWeight:500, marginTop:4 }}>{firstBike.minutesRidden != null ? firstBike.minutesRidden : '0'}</div>
                    </div>
                  </div>
                  <div style={{ width:'100%', display:'flex', justifyContent:'center', padding:'10px 0 0' }}>
                    <img src={firstBike.imageUrl || ShowroomBike} alt={firstBike.title} style={{ maxWidth:'100%', maxHeight:220, objectFit:'contain', filter:'drop-shadow(0 8px 28px rgba(0,0,0,.25))' }} onError={(e)=>{ e.currentTarget.src=ShowroomBike; }} />
                  </div>
                  <div style={{ marginTop:'auto', width:'100%' }}>
                    <Link to="/my-bikes" style={{ textDecoration:'none' }}>
                      <button className="btn-cta" style={{ width:'100%', justifyContent:'space-between', display:'flex', alignItems:'center', background:'#394ff7', color:'#fff' }}>
                        <span>Spravovat kola</span>
                        <ArrowBackIcon class="basic-icons" width={20} height={20} style={{ transform:'rotate(180deg)'}} />
                      </button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Middle stats & recent */}
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {/* Ongoing orders card */}
            <div className="ds-card" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <h3 style={{ margin:'0 0 6px', fontSize:22, }}>Probíhající objednávky</h3>
              <div className="muted" style={{ fontSize:13, marginBottom:6 }}>Přehled aktuálních zakázek ve zpracování</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {requestsLoading && <div className="muted" style={{ fontSize:13 }}>Načítám…</div>}
                {!requestsLoading && requests.filter(r=>r.status !== 'done' && r.status !== 'cancelled').length === 0 && (
                  <div className="muted" style={{ fontSize:13 }}>Momentálně nemáte žádné probíhající objednávky.</div>
                )}
                {!requestsLoading && requests.filter(r=>r.status !== 'done' && r.status !== 'cancelled').map((reqItem, idx) => {
                  const badge = `#${idx+1}`;
                  const waiting = reqItem.status === 'new';
                  const inProgress = reqItem.status === 'in_progress';
                  const chipStyle = waiting
                    ? { background:'#fff7ed', borderColor:'#fed7aa', color:'#c2410c' }
                    : inProgress
                      ? { }
                      : { background:'#e0fbea', borderColor:'#bbf7d0', color:'#166534' };
                  const chipLabel = waiting ? 'Čeká' : inProgress ? 'Probíhá' : 'Hotovo';
                  return (
                    <div key={reqItem._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', border:'1px solid #eef2f7', borderRadius:12, background: inProgress ? '#f9fafb' : '#fff' }}>
                      <div style={{ width:32, height:32, borderRadius:10, background:'#eff2ff', color:'var(--ds-primary, #394ff7)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:500 }} aria-hidden="true">{badge}</div>
                      <div style={{ fontWeight:500, flexGrow:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reqItem.title}</div>
                      <div className="chip" style={{ marginLeft:'auto', ...chipStyle }}>{chipLabel}</div>
                    </div>
                  );
                })}
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
                <div style={{ width:42, height:42, borderRadius:'50%', background: 'linear-gradient(135deg,#394ff7,#64b5f6)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18 }} aria-hidden="true">J</div>
                <div style={{ fontWeight:600 }}>Jakub Tučák</div>
                <div style={{ marginLeft:'auto', background:'#ff4d4f', color:'#fff', fontSize:12, fontWeight:600, padding:'4px 8px', borderRadius:12 }}>1</div>
              </div>
            </div>
          </div>
          {/* Recent history table full width */}
          <div className="ds-card table-card" style={{ gridColumn:'1 / -1' }}>
            <div className="table-card-header">
              <h3 style={{ display:'flex', alignItems:'center', gap:8, margin:0 }}>
                <ActivityIcon className="title-icon-svg" width={32} height={32} />
                <span>Nedávná aktivita</span>
              </h3>
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
                  {activityLoading && (
                    <tr><td colSpan={4} className="muted">Načítám aktivitu…</td></tr>
                  )}
                  {!activityLoading && activity.length === 0 && (
                    <tr><td colSpan={4} className="muted">Žádná aktivita.</td></tr>
                  )}
                  {!activityLoading && activity.slice(0, 5).map(item => {
                    let eventLabel = '';
                    let statusEl = null;
                    if (item.action === 'bike_create') { eventLabel = 'Přidáno kolo'; statusEl = <span className="chip" style={{background:'#eff2ff'}}>Nové</span>; }
                    else if (item.action === 'bike_soft_delete') { eventLabel = 'Odebráno kolo'; statusEl = <span className="chip" style={{background:'#ffe4e6', borderColor:'#fecdd3', color:'#b91c1c'}}>Smazáno</span>; }
                    else if (item.action === 'bike_restore') { eventLabel = 'Obnoveno kolo'; statusEl = <span className="chip" style={{background:'#e0fbea', borderColor:'#bbf7d0', color:'#166534'}}>Obnoveno</span>; }
                    else if (item.action === 'bike_hard_delete') { eventLabel = 'Trvale smazáno kolo'; statusEl = <span className="chip" style={{background:'#ffe4e6', borderColor:'#fecdd3', color:'#991b1b'}}>Trvale pryč</span>; }
                    const date = new Date(item.date).toISOString().slice(0,10);
                    const bikeId = item.details && item.details.bikeId ? item.details.bikeId : '—';
                    return (
                      <tr key={item.id + item.date}>
                        <td>{eventLabel}</td>
                        <td className="muted">ID kola: {bikeId}</td>
                        <td>{date}</td>
                        <td>{statusEl}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Omezena viditelnost na 5 posledních aktivit bez tlačítka více */}
          </div>
  </div>
  )}
      </section>
    </div>
  );
}

export default Dashboard;

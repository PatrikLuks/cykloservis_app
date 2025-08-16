
import React from 'react';
import heroImg from '../img/weather hero.jpg';
// Dynamic condition icons (single set, no day/night variants)
import clear from '../img/icons/weather/clear.svg';
import few_clouds from '../img/icons/weather/few_clouds.svg';
import scattered_clouds from '../img/icons/weather/scattered_clouds.svg';
import broken_clouds from '../img/icons/weather/broken_clouds.svg';
import overcast from '../img/icons/weather/overcast.svg';
import drizzle from '../img/icons/weather/drizzle.svg';
import rain_light from '../img/icons/weather/rain_light.svg';
import rain from '../img/icons/weather/rain.svg';
import rain_heavy from '../img/icons/weather/rain_heavy.svg';
import thunderstorm from '../img/icons/weather/thunderstorm.svg';
import snow from '../img/icons/weather/snow.svg';
import sleet from '../img/icons/weather/sleet.svg';
import fog from '../img/icons/weather/fog.svg';
import dust_sand from '../img/icons/weather/dust_sand.svg';
import tornado from '../img/icons/weather/tornado.svg';
import fallback from '../img/icons/weather/fallback.svg';
import sunriseSvg from '../img/icons/weather/sunrise.svg';
import sunsetSvg from '../img/icons/weather/sunset.svg';

const Icon = ({ name, size = 24, color = 'currentColor' }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: color, 'aria-hidden': true };
  switch (name) {
    case 'sun':
      return (
        <svg {...props}><path d="M12 4a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1Zm0 13a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm7-6a1 1 0 0 1 1 1 1 1 0 1 1-2 0 1 1 0 0 1 1-1ZM4 12a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm12.95 6.536a1 1 0 1 1 1.414 1.414 1 1 0 0 1-1.414-1.414ZM5.636 5.636a1 1 0 1 1 1.414 1.414A1 1 0 0 1 5.636 5.636Zm0 12.728a1 1 0 0 1 1.414 0 1 1 0 1 1-1.414 1.414 1 1 0 0 1 0-1.414ZM18.364 5.636a1 1 0 1 1 1.414 1.414 1 1 0 0 1-1.414-1.414Z"/></svg>
      );
    case 'cloud':
      return (
        <svg {...props}><path d="M7 18a4 4 0 1 1 1-7.874A5.5 5.5 0 0 1 19 12.5 3.5 3.5 0 0 1 15.5 16H7Z"/></svg>
      );
    case 'rain':
      return (
        <svg {...props}><path d="M7 18a4 4 0 1 1 1-7.874A5.5 5.5 0 0 1 19 12.5c0 .966-.784 1.75-1.75 1.75H7Z"/><path d="M8 20l1.5-2M12 20l1.5-2M16 20l1.5-2" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
      );
    case 'snow':
      return (
        <svg {...props}><path d="M12 4v16M4 12h16M6.5 7l11 10M6.5 17l11-10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>
      );
    case 'storm':
      return (
        <svg {...props}><path d="M7 16a4 4 0 1 1 1-7.874A5.5 5.5 0 0 1 19 10.5c0 1.105-.895 2-2 2h-2l-2 3h2l-2 3" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>
      );
    case 'drizzle':
      return (
        <svg {...props}><path d="M7 18a4 4 0 1 1 1-7.874A5.5 5.5 0 0 1 19 12.5c0 .966-.784 1.75-1.75 1.75H7Z"/><path d="M9 20l.8-1.2M13 20l.8-1.2M17 20l.8-1.2" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
      );
    case 'thermo':
      return (
        <svg {...props}><path d="M14 14.76V6a2 2 0 1 0-4 0v8.76a4 4 0 1 0 4 0Z"/></svg>
      );
    case 'humidity':
      return (
        <svg {...props}><path d="M12 3s5 5 5 9a5 5 0 1 1-10 0c0-4 5-9 5-9Z"/></svg>
      );
    case 'wind':
      return (
        <svg {...props}><path d="M4 10h9a2 2 0 1 0-2-2M4 14h13a2 2 0 1 1-2 2" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"/></svg>
      );
    case 'pressure':
      return (
        <svg {...props}><path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 9 4-4" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"/></svg>
      );
    case 'visibility':
      return (
        <svg {...props}><path d="M12 6c5 0 8.5 4 9.5 6-1 2-4.5 6-9.5 6S3.5 14 2.5 12C3.5 10 7 6 12 6Zm0 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>
      );
    case 'sunrise':
      return (
        <svg {...props}><path d="M12 5V3M7 8l5-5 5 5M5 13a7 7 0 0 1 14 0" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"/></svg>
      );
    case 'sunset':
      return (
        <svg {...props}><path d="M12 3v2M7 7l5 5 5-5M5 13a7 7 0 0 1 14 0" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"/></svg>
      );
    default:
      return (
        <svg {...props}><circle cx="12" cy="12" r="5"/></svg>
      );
  }
};

// Map OpenWeatherMap condition id + main to our svg key
const iconMap = {
  clear,
  few_clouds,
  scattered_clouds,
  broken_clouds,
  overcast,
  drizzle,
  rain_light,
  rain,
  rain_heavy,
  thunderstorm,
  snow,
  sleet,
  fog,
  dust_sand,
  tornado,
  fallback,
};

function mapWeatherCodeToIcon(id, main) {
  if (id >= 200 && id <= 232) return 'thunderstorm'; // Thunderstorm
  if (id >= 300 && id <= 321) return 'drizzle'; // Drizzle
  if (id >= 500 && id <= 531) { // Rain variations
    if (id === 500 || id === 501) return 'rain_light';
    if (id === 502 || id === 503 || id === 504) return 'rain';
    if (id >= 520) return 'rain_heavy';
    return 'rain';
  }
  if (id >= 600 && id <= 622) { // Snow / Sleet
    if ([611, 612, 613, 615, 616].includes(id)) return 'sleet';
    return 'snow';
  }
  if (id >= 700 && id <= 781) { // Atmosphere
    if ([701, 741].includes(id)) return 'fog';
    if ([731, 751, 761].includes(id)) return 'dust_sand';
    if (id === 781) return 'tornado';
    return 'fog';
  }
  if (id === 800) return 'clear';
  if (id === 801) return 'few_clouds';
  if (id === 802) return 'scattered_clouds';
  if (id === 803) return 'broken_clouds';
  if (id === 804) return 'overcast';
  const mainLower = (main || '').toLowerCase();
  if (mainLower.includes('cloud')) return 'overcast';
  if (mainLower.includes('rain')) return 'rain';
  if (mainLower.includes('snow')) return 'snow';
  if (mainLower.includes('thunder')) return 'thunderstorm';
  return 'fallback';
}

const WeatherCard = ({ weather, weatherLoading, weatherError, forecast, forecastLoading, forecastError }) => {
  const buildDaily = () => {
    if (!forecast || !forecast.list || !weather) return [];
    const list = forecast.list;
    const todayKey = new Date(weather.dt * 1000).toISOString().slice(0,10);
    const groups = new Map();
    list.forEach(item => {
      const d = new Date(item.dt * 1000);
      const key = d.toISOString().slice(0,10);
      if (key === todayKey) return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    const daily = [];
    for (const [key, items] of groups.entries()) {
      items.sort((a,b)=> a.dt - b.dt);
      let pick = items.find(it => { const h = new Date(it.dt * 1000).getHours(); return h >= 11 && h <= 14; });
      if (!pick) {
        pick = items.reduce((best, cur) => {
          const h = new Date(cur.dt * 1000).getHours();
          const diff = Math.abs(h - 12);
          if (!best) return cur;
          const bestDiff = Math.abs(new Date(best.dt * 1000).getHours() - 12);
          return diff < bestDiff ? cur : best;
        }, null);
      }
      if (pick) daily.push(pick);
    }
    daily.sort((a,b)=> a.dt - b.dt);
    return daily.slice(0,5);
  };
  const daily = buildDaily();
  if (weatherLoading) return <div className="ds-card" style={{ padding:16 }}>Načítám počasí...</div>;
  if (weatherError) return <div className="ds-card" style={{ padding:16, color:'#e53935' }}>{weatherError}</div>;
  if (!weather) return null;
  const weatherIcon = weather.weather && weather.weather[0] && iconMap[mapWeatherCodeToIcon(weather.weather[0].id, weather.weather[0].main)];
  const sunrise = new Date(weather.sys.sunrise * 1000).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  const sunset = new Date(weather.sys.sunset * 1000).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="weather-hero-card" style={{ background:'#fff', borderRadius:14, overflow:'hidden', width:'100%', fontFamily:'inherit', boxShadow:'0 4px 16px -4px rgba(0,0,0,0.12),0 2px 6px -2px rgba(0,0,0,0.08)' }}>
      {/* Image / top section */}
  <div style={{ position:'relative', height:190 }}>
  <img src={heroImg} alt="počasí" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center bottom' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.55))' }} />
        <div style={{ position:'absolute', top:10, left:10, display:'flex', gap:8 }}>
          <div style={{ background:'rgba(255,255,255,0.9)', border:'1px solid #d9d9d9', borderRadius:4, padding:'4px 10px', fontSize:12, display:'flex', alignItems:'center', color:'#111', fontWeight:500 }}>
            {weather.name}
          </div>
        </div>
        <div style={{ position:'absolute', top:18, right:16, textAlign:'right', color:'#fff', textShadow:'0 1px 2px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize:36, fontWeight:500, lineHeight:1 }}>{Math.round(weather.main.temp)}°C</div>
          <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:500, textTransform:'capitalize' }}>
            {weatherIcon && <img src={weatherIcon} alt={weather.weather[0].description} style={{ width:24, height:24 }} />}
            {weather.weather[0].description}
          </div>
        </div>
      </div>
     {/* Bottom info bar */}
      <div style={{ display:'flex', alignItems:'stretch', padding:'10px 14px 12px', gap:28, fontSize:12 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:140 , justifyContent: 'center', gap: 15 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, color:'#333', fontSize:13, fontWeight:500 }}>
            <img src={sunriseSvg} alt="východ" style={{ width:24, height:24, display:'block' }} />
            <span>Východ: {sunrise}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, color:'#333', fontSize:13, fontWeight:500 }}>
            <img src={sunsetSvg} alt="západ" style={{ width:24, height:24, display:'block' }} />
            <span>Západ: {sunset}</span>
          </div>
        </div>
  <div style={{ display:'flex', gap:18, flexWrap:'nowrap', paddingBottom:4 }}>
          {forecastLoading && <span style={{ fontSize:12 }}>Načítám…</span>}
          {!forecastLoading && !forecastError && daily.map((d,i)=>{
            const labelDate = new Date(d.dt*1000);
            const label = i===0 ? 'Zítra' : labelDate.toLocaleDateString('cs-CZ',{ weekday:'short' });
            return (
              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, fontSize:12, minWidth:56 }}>
                <div style={{ fontWeight:600, textTransform:'capitalize', color:'#555' }}>{label}</div>
                <img src={iconMap[mapWeatherCodeToIcon(d.weather[0].id, d.weather[0].main)]} alt={d.weather[0].description} style={{ width:26, height:26 }} />
                <div style={{ fontWeight:600, color:'#222' }}>{Math.round(d.main.temp)}°C</div>
              </div>
            );
          })}
          {!forecastLoading && forecastError && <span style={{ color:'#ff6b6b', fontSize:12 }}>{forecastError}</span>}
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;

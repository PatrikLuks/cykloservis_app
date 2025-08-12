
import React from 'react';

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

const weatherMainToIcon = (main) => {
  switch (main) {
    case 'Clear': return 'sun';
    case 'Rain': return 'rain';
    case 'Clouds': return 'cloud';
    case 'Snow': return 'snow';
    case 'Thunderstorm': return 'storm';
    case 'Drizzle': return 'drizzle';
    default: return 'thermo';
  }
};

const WeatherCard = ({ weather, weatherLoading, weatherError, forecast, forecastLoading, forecastError }) => {
  return (
    <div style={{ position: 'relative', minHeight: 260 }}>
      {weatherLoading ? (
        <div className="ds-card" style={{ padding: 16 }}>Načítám počasí...</div>
      ) : weatherError ? (
        <div className="ds-card" style={{ padding: 16, color: '#e53935' }}>{weatherError}</div>
      ) : weather ? (
        <div className="ds-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minWidth: 240 }}>
          <div style={{ color: '#394ff7' }}>
            <Icon name={weatherMainToIcon(weather.weather[0].main)} size={44} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#394ff7', marginBottom: 0 }}>{weather.name}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1f2937' }}>
            {Math.round(weather.main.temp)}°C{' '}
            <span style={{ fontWeight: 500, fontSize: 13, color: '#394ff7' }}>({weather.weather[0].description})</span>
          </div>
          <div style={{ fontSize: 13, color: '#4b5563', marginTop: -2 }}>Pocitově: <b>{Math.round(weather.main.feels_like)}°C</b></div>
          <div style={{ display: 'flex', gap: 12, margin: '8px 0', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#394ff7', fontWeight: 700 }} title="Vlhkost vzduchu">
              <Icon name="humidity" size={16} /> {weather.main.humidity}%
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#394ff7', fontWeight: 700 }} title="Rychlost větru">
              <Icon name="wind" size={16} /> {Math.round(weather.wind.speed)} m/s
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#394ff7', fontWeight: 700 }} title="Tlak vzduchu">
              <Icon name="pressure" size={16} /> {weather.main.pressure} hPa
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#394ff7', fontWeight: 700 }} title="Viditelnost">
              <Icon name="visibility" size={16} /> {weather.visibility ? (weather.visibility / 1000).toFixed(1) : '-'} km
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, display: 'flex', gap: 10, justifyContent: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="sunrise" size={16} color="#394ff7" />
              {new Date(weather.sys.sunrise * 1000).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>|</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="sunset" size={16} color="#394ff7" />
              {new Date(weather.sys.sunset * 1000).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div style={{ marginTop: 12, width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#394ff7', marginBottom: 6 }}>Předpověď na další dny:</div>
            {forecastLoading ? (
              <div style={{ fontSize: 13, color: '#6b7280' }}>Načítám předpověď...</div>
            ) : forecastError ? (
              <div style={{ fontSize: 13, color: '#e53935' }}>{forecastError}</div>
            ) : forecast && forecast.list ? (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}>
                {forecast.list.filter((item, idx) => [8, 16, 24, 32].includes(idx)).map((item, idx) => (
                  <div
                    key={idx}
                    className="ds-card"
                    style={{ padding: '8px 10px', minWidth: 92, textAlign: 'center', fontSize: 12 }}
                  >
                    <div style={{ fontWeight: 700, color: '#394ff7', fontSize: 12 }}>
                      {new Date(item.dt * 1000).toLocaleDateString('cs-CZ', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </div>
                    <div style={{ margin: '4px 0', color: '#394ff7' }}>
                      <Icon name={weatherMainToIcon(item.weather[0].main)} size={24} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{Math.round(item.main.temp)}°C</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{item.weather[0].description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#6b7280' }}>Předpověď není dostupná.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WeatherCard;

import React from 'react';

const WeatherCard = ({ weather, weatherLoading, weatherError, forecast, forecastLoading, forecastError }) => {
  const getWeatherIcon = main => {
    switch (main) {
      case 'Clear': return '☀️';
      case 'Rain': return '🌧️';
      case 'Clouds': return '☁️';
      case 'Snow': return '❄️';
      case 'Thunderstorm': return '⛈️';
      case 'Drizzle': return '🌦️';
      default: return '🌡️';
    }
  };
  const getBgClass = main => {
    switch (main) {
      case 'Clear': return 'weather-card-bg-clear';
      case 'Rain': return 'weather-card-bg-rain';
      case 'Clouds': return 'weather-card-bg-clouds';
      case 'Snow': return 'weather-card-bg-snow';
      default: return 'weather-card-bg-default';
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: 260 }}>
      {weatherLoading ? (
        <div className="weather-info-card">Načítám počasí...</div>
      ) : weatherError ? (
        <div className="weather-info-card error">{weatherError}</div>
      ) : weather ? (
        <div className={`weather-card-animated ${getBgClass(weather.weather[0].main)}`}
          style={{
            borderRadius: 24,
            boxShadow: '0 6px 24px rgba(25,118,210,0.12)',
            padding: '22px 18px 16px 18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            minWidth: 240,
            maxWidth: 340,
            position: 'relative',
          }}>
          <div style={{ fontSize: 44, marginBottom: 0, filter: 'drop-shadow(0 2px 8px #1976d220)' }}>
            {getWeatherIcon(weather.weather[0].main)}
          </div>
          <div style={{ fontWeight: 800, fontSize: 19, color: '#1976d2', marginBottom: 1, textShadow:'0 2px 8px #fff8' }}>{weather.name}</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#222', marginBottom: 1, textShadow:'0 2px 8px #fff8' }}>{Math.round(weather.main.temp)}°C <span style={{fontWeight:400, fontSize:13, color:'#1976d2'}}>({weather.weather[0].description})</span></div>
          <div style={{ fontSize: 13, color: '#444', marginBottom: 1 }}>Pocitově: <b>{Math.round(weather.main.feels_like)}°C</b></div>
          <div style={{ display: 'flex', gap: 10, margin: '6px 0', justifyContent: 'center', flexWrap:'wrap' }}>
            <div style={{ fontSize: 13, color: '#1976d2', fontWeight: 700 }} title="Vlhkost vzduchu">💧 {weather.main.humidity}%</div>
            <div style={{ fontSize: 13, color: '#1976d2', fontWeight: 700 }} title="Rychlost větru">💨 {Math.round(weather.wind.speed)} m/s</div>
            <div style={{ fontSize: 13, color: '#1976d2', fontWeight: 700 }} title="Tlak vzduchu">🌡️ {weather.main.pressure} hPa</div>
            <div style={{ fontSize: 13, color: '#1976d2', fontWeight: 700 }} title="Viditelnost">👁️ {weather.visibility ? (weather.visibility/1000).toFixed(1) : '-'} km</div>
          </div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 2, display:'flex', gap:8, justifyContent:'center' }}>
            <span>🌅 {new Date(weather.sys.sunrise * 1000).toLocaleTimeString('cs-CZ', {hour: '2-digit', minute: '2-digit'})}</span>
            <span>|</span>
            <span>🌇 {new Date(weather.sys.sunset * 1000).toLocaleTimeString('cs-CZ', {hour: '2-digit', minute: '2-digit'})}</span>
          </div>
          <div style={{marginTop: 12, width: '100%'}}>
            <div style={{fontWeight:700, fontSize:14, color:'#1976d2', marginBottom:6, textShadow:'0 2px 8px #fff8'}}>Předpověď na další dny:</div>
            {forecastLoading ? (
              <div style={{fontSize:13, color:'#888'}}>Načítám předpověď...</div>
            ) : forecastError ? (
              <div style={{fontSize:13, color:'#e53935'}}>{forecastError}</div>
            ) : forecast && forecast.list ? (
              <div style={{display:'flex', gap:8, justifyContent:'center', flexWrap:'nowrap', overflowX:'auto', paddingBottom:4}}>
                {forecast.list.filter((item, idx) => [8,16,24,32].includes(idx)).map((item, idx) => (
                  <div key={idx} style={{background:'#fff', borderRadius:12, boxShadow:'0 2px 8px #1976d210', padding:'8px 10px', minWidth:80, textAlign:'center', transition:'transform 0.2s, box-shadow 0.2s', cursor:'pointer', border:'2px solid #e3f2fd', fontSize:12}}
                    onMouseEnter={e => {e.currentTarget.style.transform='scale(1.07)';e.currentTarget.style.boxShadow='0 8px 32px #1976d220';}}
                    onMouseLeave={e => {e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 2px 8px #1976d210';}}>
                    <div style={{fontWeight:700, color:'#1976d2', fontSize:12}}>{new Date(item.dt*1000).toLocaleDateString('cs-CZ', {weekday:'short', day:'2-digit', month:'2-digit'})}</div>
                    <img src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`} alt={item.weather[0].description} style={{width:28, height:28, margin:'4px 0'}} />
                    <div style={{fontSize:13, fontWeight:700, color:'#222'}}>{Math.round(item.main.temp)}°C</div>
                    <div style={{fontSize:11, color:'#555'}}>{item.weather[0].description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{fontSize:13, color:'#888'}}>Předpověď není dostupná.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WeatherCard;

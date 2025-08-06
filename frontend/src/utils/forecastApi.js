// Získání předpovědi na další dny podle polohy uživatele (OpenWeatherMap)
export async function fetchForecastByCoords(lat, lon) {
  const OPENWEATHER_API_KEY = '54bcbc9c37aafbd39e64139b538f5933';
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=cz&appid=${OPENWEATHER_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Nepodařilo se načíst předpověď');
  return await res.json();
}

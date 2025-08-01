// Získání aktuálního počasí podle polohy uživatele (OpenWeatherMap)
// POZOR: Vložte svůj API klíč do proměnné OPENWEATHER_API_KEY

export async function fetchWeatherByCoords(lat, lon) {
  const OPENWEATHER_API_KEY = '54bcbc9c37aafbd39e64139b538f5933';
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=cz&appid=${OPENWEATHER_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Nepodařilo se načíst počasí');
  return await res.json();
}

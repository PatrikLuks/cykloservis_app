// Split forecast list (3h steps) into daily representative points.
// Exported as a separate chunk via dynamic import in WeatherCard.
export function groupForecast(list, currentDt) {
  if (!Array.isArray(list)) return [];
  const todayKey = new Date(currentDt * 1000).toISOString().slice(0,10);
  const groups = new Map();
  for (const item of list) {
    const d = new Date(item.dt * 1000);
    const key = d.toISOString().slice(0,10);
    if (key === todayKey) continue; // skip rest of today
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  const daily = [];
  for (const items of groups.values()) {
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
}

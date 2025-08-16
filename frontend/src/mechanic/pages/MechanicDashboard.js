import React, { useEffect, useState } from 'react';
import MechanicPanel from './MechanicPanel';
import { getMechanicStats } from '../../utils/mechanicSelfApi';

export default function MechanicDashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(()=>{ (async()=>{ try{ const s = await getMechanicStats(); setStats(s);} catch(e){ setErr('Chyba načtení'); } })(); }, []);
  return (
    <div style={{ display:'grid', gap:24 }}>
      <div className="ds-card" style={{ display:'grid', gap:16 }}>
        <h2 style={{ margin:0 }}>Rychlý přehled</h2>
        {err && <div style={{ color:'#dc2626', fontSize:12 }}>{err}</div>}
        {!stats && !err && <div className="muted" style={{ fontSize:12 }}>Načítám...</div>}
        {stats && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
            <Stat label="Dnes" value={stats.today} />
            <Stat label="Posledních 7 dní" value={stats.week} />
            <Stat label="Otevřené" value={stats.open} />
            <Stat label="Celkem" value={stats.total} />
          </div>
        )}
      </div>
      <MechanicPanel />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ flex:'1 1 120px', minWidth:120, background:'#0f172a', color:'#fff', padding:'16px 18px', borderRadius:14, display:'grid', gap:4 }}>
      <div style={{ fontSize:12, textTransform:'uppercase', letterSpacing:.5, color:'#94a3b8' }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700 }}>{value}</div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { listMyClients } from '../../utils/mechanicSelfApi';
import dayjs from 'dayjs';

export default function MechanicClients() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  useEffect(()=>{ (async()=>{
    setLoading(true); setError(null);
    try { const list = await listMyClients(); setItems(list); } catch(e){ setError('Chyba načtení'); }
    finally { setLoading(false); }
  })(); }, []);

  if (loading) return <div className="ds-card">Načítám...</div>;
  if (error) return <div className="ds-card" style={{ color:'#dc2626' }}>{error}</div>;

  return (
    <div className="ds-card" style={{ display:'grid', gap:16 }}>
      <h2>Moji klienti</h2>
      {items.length === 0 && <div className="muted" style={{ fontSize:12 }}>Žádní klienti</div>}
      <div style={{ display:'grid', gap:10 }}>
        {items.map(c => (
          <div key={c.email} style={{ padding:'10px 14px', border:'1px solid #e2e8f0', borderRadius:10, display:'grid', gap:4 }}>
            <div style={{ fontWeight:600 }}>{c.email}</div>
            <div style={{ fontSize:12, display:'flex', gap:12, flexWrap:'wrap' }}>
              <span>Zakázky: {c.totalRequests}</span>
              <span>Otevřené: {c.openRequests}</span>
              <span>Poslední stav: {c.lastStatus}</span>
              <span>Poslední: {dayjs(c.lastCreatedAt).format('DD.MM. HH:mm')}</span>
            </div>
            {c.bikes && c.bikes.length>0 && <div style={{ fontSize:12, color:'#64748b' }}>Kola: {c.bikes.map(b=>b.title).join(', ')}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

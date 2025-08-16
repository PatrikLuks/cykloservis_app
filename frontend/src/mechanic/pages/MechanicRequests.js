import React, { useEffect, useState } from 'react';
import { listMyAssignedRequests, updateMyRequestStatus } from '../../utils/mechanicSelfApi';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

export default function MechanicRequests() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  useEffect(()=>{ (async()=>{
    setLoading(true); setError(null);
    try { const list = await listMyAssignedRequests(); setItems(list); }
    catch(e){ setError('Chyba načtení'); }
    finally { setLoading(false); }
  })(); }, []);

  if (loading) return <div className="ds-card">Načítám...</div>;
  if (error) return <div className="ds-card" style={{ color:'#dc2626' }}>{error}</div>;

  async function changeStatus(id, status) {
    try {
      const updated = await updateMyRequestStatus(id, status);
      setItems(list => list.map(x => x._id === id ? updated : x));
    } catch(e) { /* ignore for now */ }
  }

  const statuses = ['new','in_progress','done','cancelled'];
  const visible = items.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (q && !r.title.toLowerCase().includes(q.toLowerCase()) && !(r.description||'').toLowerCase().includes(q.toLowerCase())) return false;
    if (from && new Date(r.createdAt) < new Date(from)) return false;
    if (to && new Date(r.createdAt) > new Date(to)) return false;
    return true;
  });

  return (
    <div className="ds-card" style={{ display:'grid', gap:12 }}>
      <h2>Moje zakázky</h2>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, fontSize:12 }}>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ padding:6 }}>
          <option value="">Všechny stavy</option>
          {statuses.map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
        <input placeholder="Hledat" value={q} onChange={e=>setQ(e.target.value)} style={{ padding:6 }} />
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ padding:6 }} />
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{ padding:6 }} />
        <button onClick={()=>{ setStatusFilter(''); setQ(''); setFrom(''); setTo(''); }} style={{ padding:'6px 10px' }}>Reset</button>
      </div>
      {visible.length === 0 && <div className="muted" style={{ fontSize:12 }}>Žádné zakázky</div>}
      <div style={{ display:'grid', gap:8 }}>
        {visible.map(r => (
          <div key={r._id} style={{ padding:'10px 14px', border:'1px solid #e2e8f0', borderRadius:10, display:'grid', gap:6 }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
              <div style={{ fontWeight:600 }}><Link to={`/mechanic/requests/${r._id}`} style={{ textDecoration:'none', color:'inherit' }}>{r.title}</Link></div>
              {r.assignedDate && <div style={{ fontSize:12 }}>Termín: {dayjs(r.assignedDate).format('DD.MM. HH:mm')}</div>}
              <div style={{ fontSize:12, color:'#64748b' }}>Vytvořeno: {dayjs(r.createdAt).format('DD.MM. HH:mm')}</div>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {statuses.map(s => (
                <button key={s} onClick={()=>changeStatus(r._id, s)} style={{ fontSize:11, padding:'4px 8px', borderRadius:6, border:'1px solid #cbd5e1', background: r.status===s ? '#394ff7' : '#fff', color: r.status===s ? '#fff':'#0f172a', cursor:'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

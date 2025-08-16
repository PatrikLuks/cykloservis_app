import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyRequestDetail, updateMyRequestStatus } from '../../utils/mechanicSelfApi';
import dayjs from 'dayjs';

export default function MechanicRequestDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const statuses = ['new','in_progress','done','cancelled'];

  async function load() {
    setLoading(true); setError(null);
    try { const d = await getMyRequestDetail(id); setData(d); } catch(e){ setError('Nenalezeno'); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, [id]);

  async function changeStatus(s) {
    try { await updateMyRequestStatus(id, s); await load(); } catch(e) { /* ignore */ }
  }

  if (loading) return <div className="ds-card">Načítám...</div>;
  if (error) return <div className="ds-card" style={{ color:'#dc2626' }}>{error}</div>;
  if (!data) return null;
  return (
    <div style={{ display:'grid', gap:24 }}>
      <div className="ds-card" style={{ display:'grid', gap:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ margin:0 }}>{data.title}</h2>
          <Link to="/mechanic/requests" style={{ fontSize:12 }}>← Zpět na zakázky</Link>
        </div>
        <div style={{ fontSize:13 }}><b>Stav:</b> {data.status}</div>
        <div style={{ fontSize:13 }}><b>Typy:</b> {(data.serviceTypes||[]).join(', ') || '—'}</div>
        <div style={{ fontSize:13 }}><b>Popis:</b> {data.description || '—'}</div>
        <div style={{ fontSize:13 }}><b>Zákazník:</b> {data.ownerEmail}</div>
        {data.bike && <div style={{ fontSize:13 }}><b>Kolo:</b> {data.bike.title} ({data.bike.manufacturer || ''} {data.bike.model || ''})</div>}
        <div style={{ fontSize:13 }}><b>Vytvořeno:</b> {dayjs(data.createdAt).format('DD.MM.YYYY HH:mm')}</div>
        {data.assignedDate && <div style={{ fontSize:13 }}><b>Termín:</b> {dayjs(data.assignedDate).format('DD.MM.YYYY HH:mm')}</div>}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {statuses.map(s => (
            <button key={s} onClick={()=>changeStatus(s)} style={{ fontSize:11, padding:'4px 8px', borderRadius:6, border:'1px solid #cbd5e1', background: data.status===s ? '#394ff7' : '#fff', color: data.status===s ? '#fff':'#0f172a', cursor:'pointer' }}>{s}</button>
          ))}
        </div>
      </div>
      <div className="ds-card" style={{ display:'grid', gap:12 }}>
        <h3 style={{ margin:0 }}>Historie</h3>
        <div style={{ display:'grid', gap:8 }}>
          {(data.events || []).slice().sort((a,b)=> new Date(b.at)-new Date(a.at)).map((ev,i)=>(
            <div key={i} style={{ fontSize:12, border:'1px solid #e2e8f0', borderRadius:8, padding:'6px 10px', background:'#f8fafc' }}>
              <div><b>{ev.type}</b> {ev.from && ' ('+ev.from+' → '+ev.to+')'}</div>
              <div style={{ color:'#64748b' }}>{dayjs(ev.at).format('DD.MM.YYYY HH:mm')} · {ev.by}</div>
              {ev.note && <div>{ev.note}</div>}
            </div>
          ))}
          {(data.events || []).length === 0 && <div className="muted" style={{ fontSize:12 }}>Žádné události</div>}
        </div>
      </div>
    </div>
  );
}

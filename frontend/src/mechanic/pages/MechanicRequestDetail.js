import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyRequestDetail, updateMyRequestStatus } from '../../utils/mechanicSelfApi';
import api from '../../utils/apiClient';
import dayjs from 'dayjs';

export default function MechanicRequestDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const statuses = ['new','in_progress','done','cancelled'];
  const [catalog, setCatalog] = useState([]);
  const [opsDraft, setOpsDraft] = useState([]); // {code, minutes, price}
  const [compDraft, setCompDraft] = useState([]); // {componentName, action}
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  async function load() {
    setLoading(true); setError(null);
    try { const d = await getMyRequestDetail(id); setData(d); } catch(e){ setError('Nenalezeno'); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, [id]);

  useEffect(()=>{
    (async ()=>{
      try {
        const { data } = await api.get('/service-requests/catalog');
        setCatalog(data || []);
      } catch {}
    })();
  }, []);

  useEffect(()=>{
    if (!id) return;
    (async ()=>{
      try {
        const { data } = await api.get(`/service-requests/${id}/messages`);
        setChatMessages(data || []);
      } catch {}
    })();
  }, [id]);

  async function postMessage(e){
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatLoading(true);
    try {
      const { data } = await api.post(`/service-requests/${id}/messages`, { body: chatInput.trim() });
      setChatMessages(m => [...m, data]);
      setChatInput('');
    } catch {} finally { setChatLoading(false); }
  }

  function addOperation(code){
    const item = catalog.find(c => c.code === code);
    if (!item) return;
    setOpsDraft(d => [...d, { code: item.code, minutes: item.baseMinutes, price: item.basePrice }]);
  }
  function updateOp(i, field, val){ setOpsDraft(d => d.map((o,idx)=> idx===i ? { ...o, [field]: val } : o)); }
  function removeOp(i){ setOpsDraft(d => d.filter((_,idx)=> idx!==i)); }
  function addComponent(){ setCompDraft(d => [...d, { componentName:'', action:'install' }]); }
  function updateComp(i, field, val){ setCompDraft(d => d.map((c,idx)=> idx===i ? { ...c, [field]: val } : c)); }
  function removeComp(i){ setCompDraft(d => d.filter((_,idx)=> idx!==i)); }
  async function saveIntake(){
    try {
      await api.put(`/service-requests/${id}/intake`, { operations: opsDraft, componentsDelta: compDraft });
      await load();
    } catch {}
  }

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
      <div className="ds-card" style={{ display:'grid', gap:16 }}>
        <h3 style={{ margin:0 }}>Intake / Úkony</h3>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <select onChange={e=> { if (e.target.value) { addOperation(e.target.value); e.target.value=''; } }} style={{ padding:6 }}>
            <option value="">+ Přidat úkon podle katalogu</option>
            {catalog.map(i => <option key={i.code} value={i.code}>{i.code} – {i.name}</option>)}
          </select>
        </div>
        <div style={{ display:'grid', gap:8 }}>
          {opsDraft.map((op,i)=>(
            <div key={i} style={{ display:'flex', gap:8, alignItems:'center', fontSize:12 }}>
              <code>{op.code}</code>
              <label>Min <input value={op.minutes} type="number" min={0} style={{ width:70 }} onChange={e=>updateOp(i,'minutes', parseInt(e.target.value,10)||0)} /></label>
              <label>Cena <input value={op.price} type="number" min={0} style={{ width:80 }} onChange={e=>updateOp(i,'price', parseFloat(e.target.value)||0)} /></label>
              <button onClick={()=>removeOp(i)} style={{ background:'none', border:'1px solid #e2e8f0', padding:'4px 6px', borderRadius:6, cursor:'pointer' }}>×</button>
            </div>
          ))}
          {opsDraft.length === 0 && <div style={{ fontSize:12, color:'#64748b' }}>Žádné úkony zatím nepřidány.</div>}
        </div>
        <h4 style={{ margin:'8px 0 0', fontSize:14 }}>Komponenty</h4>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={addComponent} style={{ fontSize:12, padding:'4px 10px', borderRadius:6, border:'1px solid #cbd5e1', background:'#fff', cursor:'pointer' }}>+ Komponenta</button>
        </div>
        <div style={{ display:'grid', gap:8 }}>
          {compDraft.map((c,i)=>(
            <div key={i} style={{ display:'flex', gap:8, alignItems:'center', fontSize:12 }}>
              <input placeholder="Název" value={c.componentName} onChange={e=>updateComp(i,'componentName', e.target.value)} style={{ flex:1 }} />
              <select value={c.action} onChange={e=>updateComp(i,'action', e.target.value)}>
                <option value="install">instalace</option>
                <option value="replace">výměna</option>
                <option value="remove">odstranění</option>
              </select>
              <button onClick={()=>removeComp(i)} style={{ background:'none', border:'1px solid #e2e8f0', padding:'4px 6px', borderRadius:6, cursor:'pointer' }}>×</button>
            </div>
          ))}
          {compDraft.length === 0 && <div style={{ fontSize:12, color:'#64748b' }}>Žádné změny komponent.</div>}
        </div>
        <div>
          <button onClick={saveIntake} style={{ background:'#394ff7', color:'#fff', border:'none', padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:13 }}>Uložit intake</button>
        </div>
      </div>
      <div className="ds-card" style={{ display:'grid', gap:12 }}>
        <h3 style={{ margin:0 }}>Chat</h3>
        <div style={{ maxHeight:260, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
          {chatMessages.map(m => (
            <div key={m._id || m.createdAt+Math.random()} style={{ fontSize:12, border:'1px solid #e2e8f0', borderRadius:8, padding:'6px 10px', background:'#f8fafc' }}>
              <div style={{ fontWeight:600 }}>{m.role} • {new Date(m.createdAt).toLocaleString()}</div>
              <div>{m.body}</div>
            </div>
          ))}
          {chatMessages.length === 0 && <div className="muted" style={{ fontSize:12 }}>Žádné zprávy.</div>}
        </div>
        <form onSubmit={postMessage} style={{ display:'flex', gap:8 }}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Napsat zprávu" style={{ flex:1 }} />
          <button disabled={chatLoading} style={{ background:'#394ff7', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer', fontSize:12 }}>Odeslat</button>
        </form>
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

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listServiceRequests, updateServiceRequestStatus, deleteServiceRequest } from '../utils/serviceRequestsApi';
import dayjs from 'dayjs';

function StatusBadge({ status }) {
  const map = {
    new: { text: 'Nová', color: '#2563eb', bg: '#dbeafe' },
    in_progress: { text: 'Probíhá', color: '#92400e', bg: '#fef3c7' },
    done: { text: 'Hotovo', color: '#065f46', bg: '#d1fae5' },
    cancelled: { text: 'Zrušeno', color: '#991b1b', bg: '#fee2e2' }
  };
  const conf = map[status] || { text: status, color: '#374151', bg: '#e5e7eb' };
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 20, background: conf.bg, color: conf.color }}>{conf.text}</span>;
}

export default function Orders() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [updating, setUpdating] = useState({});

  async function load() {
    setLoading(true); setError(null);
    try {
      const data = await listServiceRequests();
      setItems(data);
    } catch (e) { setError('Nelze načíst objednávky'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function changeStatus(id, status) {
    setUpdating(u => ({ ...u, [id]: true }));
    try {
      await updateServiceRequestStatus(id, status);
      await load();
    } catch (e) { /* ignore */ }
    finally { setUpdating(u => ({ ...u, [id]: false })); }
  }

  async function remove(id) {
    if (!window.confirm('Opravdu smazat objednávku?')) return;
    setUpdating(u => ({ ...u, [id]: true }));
    try { await deleteServiceRequest(id); await load(); } catch (e) { /* ignore */ }
    finally { setUpdating(u => ({ ...u, [id]: false })); }
  }

  const filtered = filterStatus ? items.filter(i => i.status === filterStatus) : items;

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div className="ds-card" style={{ padding: 20, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Objednávky</h2>
          <p className="muted" style={{ marginTop: 8 }}>Přehled vašich servisních objednávek.</p>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <span className="select-wrap">
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="filter-select">
            <option value="">Všechny stavy</option>
            <option value="new">Nové</option>
            <option value="in_progress">Probíhá</option>
            <option value="done">Hotovo</option>
            <option value="cancelled">Zrušeno</option>
          </select>
          </span>
          <Link to="/orders/new" className="btn-cta" style={{ width:'auto', whiteSpace:'nowrap' }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            Nová objednávka
          </Link>
        </div>
      </div>
      <div className="ds-card" style={{ minHeight: 240, padding: 0 }}>
        {loading ? (
          <div style={{ padding: 20 }} className="muted">Načítám...</div>
        ) : error ? (
          <div style={{ padding: 20, color:'#dc2626' }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 20 }} className="muted">Žádné objednávky</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ textAlign:'left', fontSize:12, background:'#f1f5f9' }}>
                  <th style={{ padding: '10px 14px' }}>Název</th>
                  <th style={{ padding: '10px 14px' }}>Typy</th>
                  <th style={{ padding: '10px 14px' }}>Mechanik</th>
                  <th style={{ padding: '10px 14px' }}>Termín</th>
                  <th style={{ padding: '10px 14px' }}>Stav</th>
                  <th style={{ padding: '10px 14px' }}>Cena (odh.)</th>
                  <th style={{ padding: '10px 14px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r._id} style={{ borderTop:'1px solid #e5e7eb', fontSize:13 }}>
                    <td style={{ padding: '10px 14px', fontWeight:600 }}>{r.title}</td>
                    <td style={{ padding: '10px 14px' }}>{(r.serviceTypes||[]).join(', ')}</td>
                    <td style={{ padding: '10px 14px' }}>{r.mechanicId || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>{r.assignedDate ? dayjs(r.assignedDate).format('DD.MM.YYYY HH:mm') : (r.preferredDate ? dayjs(r.preferredDate).format('DD.MM.YYYY HH:mm') : '—')}</td>
                    <td style={{ padding: '10px 14px' }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding: '10px 14px' }}>{r.priceEstimate != null ? r.priceEstimate + ' Kč' : '—'}</td>
                    <td style={{ padding: '10px 14px', display:'flex', gap:8 }}>
                      {r.status === 'new' && <button disabled={!!updating[r._id]} onClick={()=>changeStatus(r._id,'in_progress')} className="btn-secondary" style={{ padding:'6px 10px' }}>Spustit</button>}
                      {r.status === 'in_progress' && <button disabled={!!updating[r._id]} onClick={()=>changeStatus(r._id,'done')} className="btn-secondary" style={{ padding:'6px 10px' }}>Dokončit</button>}
                      {r.status !== 'cancelled' && r.status !== 'done' && <button disabled={!!updating[r._id]} onClick={()=>changeStatus(r._id,'cancelled')} className="btn-secondary" style={{ padding:'6px 10px' }}>Zrušit</button>}
                      <button disabled={!!updating[r._id]} onClick={()=>remove(r._id)} className="btn" style={{ padding:'6px 10px', border:'1px solid #dc2626', color:'#dc2626' }}>Smazat</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

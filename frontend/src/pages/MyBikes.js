import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listBikes, deleteBike, listDeletedBikes, restoreBike, hardDeleteBike, uploadBikeImage } from '../utils/bikesApi';
import './MyBikes.css';

function minutesToHhMm(mins = 0) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export default function MyBikes() {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  // Removed deleted bikes toggle/button
  const [uploadingId, setUploadingId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // Inline formulář byl nahrazen wizardem /add-bike
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  async function refresh(reset=false) {
    if (reset) {
      setPage(1); setHasNext(false); setBikes([]);
    }
    setLoading(true);
    try {
      const resp = await listBikes({ page: reset ? 1 : page, limit: 12 });
      if (resp && resp.pagination) {
        const merged = reset ? resp.data : [...bikes, ...resp.data];
        setBikes(merged);
        setHasNext(resp.pagination.hasNext);
      } else if (Array.isArray(resp)) {
        setBikes(resp);
        setHasNext(false);
      }
    } catch (e) {
      if (reset) setBikes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent('/my-bikes')}`);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || 'e30='));
      setIsAdmin(payload.role === 'admin');
    } catch {}
  refresh(true);
  }, [navigate]);

  // handleCreate odstraněn – nepotřebný

  const handleDelete = async (id) => {
    if (!window.confirm('Opravdu odebrat kolo?')) return;
    try {
      await deleteBike(id);
  await refresh(true);
    } catch (e) {
      alert('Nepodařilo se odebrat kolo');
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreBike(id);
  await refresh(true);
    } catch (e) {
      alert('Obnova selhala');
    }
  };

  const handleHardDelete = async (id) => {
    if (!window.confirm('Trvale smazat kolo? Tuto akci nelze vrátit.')) return;
    try {
      await hardDeleteBike(id);
  await refresh(true);
    } catch (e) {
      alert('Hard delete selhal (možná nemáte oprávnění).');
    }
  };

  const handleUpload = async (id, file) => {
    if (!file) return;
    setUploadingId(id);
    try {
      await uploadBikeImage(id, file);
      await refresh();
    } catch (e) {
      alert('Upload selhal');
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="mybikes-wrap">
      <div className="mybikes-surface">
        <header className="mybikes-header">
          <h1 className="mybikes-title">Moje kola</h1>
          <button className="btn-cta" style={{ width:'auto', whiteSpace:'nowrap' }} onClick={() => navigate('/add-bike')}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            Přidat kolo
          </button>
        </header>
        {loading && bikes.length === 0 ? (
          <div className="mybikes-loading">Načítám…</div>
        ) : (
          <div className="mybikes-grid">
            {bikes.map(b => (
              <div className="bike-card" key={b._id}>
                <div className="bike-img-area">
                  <img src={b.imageUrl || require('../img/showroomBike.png')} alt={b.title} onError={(e)=>{ e.currentTarget.src=require('../img/showroomBike.png'); }} />
                </div>
                <div className="bike-body">
                  <div className="bike-title-row">
                    <div className="bike-title-text">{b.type ? (b.type + ' kolo') : b.title}</div>
                  </div>
                  <div className="bike-model-text">{b.title}</div>
                  <div className="bike-model-text" style={{ opacity:.7 }}>{b.model}</div>
                  <div className="bike-meta-row">
                    <div>
                      <div className="meta-label">Rok výroby</div>
                      <div className="meta-value bold">{b.year || '—'}</div>
                    </div>
                    <div>
                      <div className="meta-label">Odjeté Hodiny</div>
                      <div className="meta-value bold">{minutesToHhMm(b.minutesRidden)}</div>
                    </div>
                  </div>
                </div>
                <div className="bike-actions-row">
                  <label className="bike-action">
                    📷 <span>Obrázek</span>
                    <input style={{ display: 'none' }} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(b._id, f); e.target.value=''; }} />
                  </label>
                  <button className="bike-action" onClick={() => navigate(`/bikes/${b._id}`)} title="Detaily">ℹ️ <span>Detaily</span></button>
                  <button className="bike-action" onClick={() => navigate(`/bikes/${b._id}/edit`)} title="Upravit">✎ <span>Upravit</span></button>
                  <button className="bike-action danger" onClick={() => handleDelete(b._id)} title="Odebrat">🗑️ <span>{uploadingId===b._id ? '...' : 'Odebrat'}</span></button>
                </div>
              </div>
            ))}
            {bikes.length === 0 && !loading && (
              <div className="mybikes-empty">Zatím nemáte žádná kola. Přidejte první pomocí tlačítka nahoře vpravo.</div>
            )}
            {hasNext && (
              <div style={{ gridColumn:'1 / -1', display:'flex', justifyContent:'center', marginTop:24 }}>
                <button disabled={loading} onClick={()=> { setPage(p=>p+1); setTimeout(()=>refresh(false),0); }} className="add-bike-pill" style={{ fontSize:14, padding:'10px 20px' }}>
                  {loading ? 'Načítám…' : 'Načíst další'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

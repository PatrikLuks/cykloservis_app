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
  const [deleted, setDeleted] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // Inline formulář byl nahrazen wizardem /add-bike
  const navigate = useNavigate();

  async function refresh() {
    setLoading(true);
    try {
      const data = await listBikes();
      setBikes(Array.isArray(data) ? data : []);
      const d = await listDeletedBikes().catch(()=>[]);
      setDeleted(Array.isArray(d) ? d : []);
    } catch (e) {
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
    refresh();
  }, [navigate]);

  // handleCreate odstraněn – nepotřebný

  const handleDelete = async (id) => {
    if (!window.confirm('Opravdu odebrat kolo?')) return;
    try {
      await deleteBike(id);
      await refresh();
    } catch (e) {
      alert('Nepodařilo se odebrat kolo');
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreBike(id);
      await refresh();
    } catch (e) {
      alert('Obnova selhala');
    }
  };

  const handleHardDelete = async (id) => {
    if (!window.confirm('Trvale smazat kolo? Tuto akci nelze vrátit.')) return;
    try {
      await hardDeleteBike(id);
      await refresh();
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
          <h1 className="mybikes-title">Moje Kola</h1>
          <button className="add-bike-pill" onClick={() => navigate('/add-bike')}>
            <span className="add-bike-pill-icon">＋</span>
            <span>Přidat kolo</span>
          </button>
          <button className="add-bike-pill" onClick={()=> setShowDeleted(v=>!v)}>
            <span className="add-bike-pill-icon">🗂</span>
            <span>{showDeleted ? 'Aktivní' : `Smazaná (${deleted.length})`}</span>
          </button>
        </header>
        {loading ? (
          <div className="mybikes-loading">Načítám…</div>
        ) : showDeleted ? (
          <div className="mybikes-grid">
            {deleted.map(b => (
              <div className="bike-card deleted" key={b._id}>
                <div className="bike-img-area">
                  <img src={b.imageUrl || '/logo512.png'} alt={b.title} onError={(e)=>{ e.currentTarget.src='/logo512.png'; }} />
                </div>
                <div className="bike-body">
                  <div className="bike-title-row">
                    <div className="bike-title-text">{b.title}</div>
                  </div>
                  <div className="bike-model-text">{b.model}</div>
                  <div className="bike-meta-row">
                    <div>
                      <div className="meta-label">Smazáno</div>
                      <div className="meta-value bold">{new Date(b.deletedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
                <div className="bike-actions-row">
                  <button className="bike-action" onClick={() => handleRestore(b._id)}>↺ <span>Obnovit</span></button>
                  {isAdmin && <button className="bike-action danger" onClick={() => handleHardDelete(b._id)}>💣 <span>Hard</span></button>}
                </div>
              </div>
            ))}
            {deleted.length === 0 && (
              <div className="mybikes-empty">Žádná soft-smazaná kola.</div>
            )}
          </div>
        ) : (
          <div className="mybikes-grid">
            {bikes.map(b => (
              <div className="bike-card" key={b._id}>
                <div className="bike-img-area">
                  <img src={b.imageUrl || '/logo512.png'} alt={b.title} onError={(e)=>{ e.currentTarget.src='/logo512.png'; }} />
                </div>
                <div className="bike-body">
                  <div className="bike-title-row">
                    <div className="bike-title-text">{b.title}</div>
                  </div>
                  <div className="bike-model-text">{b.model}</div>
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
            {bikes.length === 0 && (
              <div className="mybikes-empty">Zatím nemáte žádná kola. Přidejte první pomocí tlačítka nahoře vpravo.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

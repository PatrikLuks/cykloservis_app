import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listBikes, createBike, deleteBike } from '../utils/bikesApi';
import './MyBikes.css';

function minutesToHhMm(mins = 0) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export default function MyBikes() {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', model: '', year: '', minutesRidden: 0, imageUrl: '' });
  const navigate = useNavigate();

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const data = await listBikes();
      setBikes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Nepodařilo se načíst kola.');
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
    refresh();
  }, [navigate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        model: form.model.trim(),
        year: form.year ? Number(form.year) : undefined,
        minutesRidden: form.minutesRidden ? Number(form.minutesRidden) : 0,
        imageUrl: form.imageUrl.trim() || undefined
      };
      if (!payload.title) { setError('Název je povinný'); return; }
      await createBike(payload);
      setShowForm(false);
      setForm({ title: '', model: '', year: '', minutesRidden: 0, imageUrl: '' });
      await refresh();
    } catch (e) {
      setError('Nepodařilo se přidat kolo.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Opravdu odebrat kolo?')) return;
    try {
      await deleteBike(id);
      await refresh();
    } catch (e) {
      alert('Nepodařilo se odebrat kolo');
    }
  };

  return (
    <div className="mybikes-root">
      <header className="mybikes-header">
        <h1>Moje Kola</h1>
        <button className="add-bike-btn" onClick={() => setShowForm(v => !v)}>+ Přidat kolo</button>
      </header>

      {showForm && (
        <form className="mybikes-form" onSubmit={handleCreate}>
          <input placeholder="Název (např. Trek Horské kolo)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Model (např. Bike MX 7206P)" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
          <input placeholder="Rok výroby" type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
          <input placeholder="Odjeté minuty" type="number" value={form.minutesRidden} onChange={e => setForm({ ...form, minutesRidden: e.target.value })} />
          <input placeholder="URL obrázku" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
          <button type="submit">Uložit</button>
          {error && <div className="mybikes-error">{error}</div>}
        </form>
      )}

      {loading ? (
        <div className="mybikes-loading">Načítám…</div>
      ) : (
        <div className="mybikes-grid">
          {bikes.map(b => (
            <div className="bike-card" key={b._id}>
              <div className="bike-image-wrap">
                <img src={b.imageUrl || '/logo512.png'} alt={b.title} onError={(e)=>{ e.currentTarget.src='/logo512.png'; }} />
              </div>
              <div className="bike-title">{b.title}</div>
              <div className="bike-model">{b.model}</div>
              <div className="bike-meta">
                <div>
                  <div className="meta-label">Rok výroby</div>
                  <div className="meta-value">{b.year || '—'}</div>
                </div>
                <div>
                  <div className="meta-label">Odjeté Hodiny</div>
                  <div className="meta-value">{minutesToHhMm(b.minutesRidden)}</div>
                </div>
              </div>
              <div className="bike-actions">
                <button className="action-danger" onClick={() => handleDelete(b._id)}>Odebrat</button>
                <button className="action-muted" disabled>Detaily</button>
                <button className="action-muted" disabled>Upravit</button>
              </div>
            </div>
          ))}
          {bikes.length === 0 && (
            <div className="mybikes-empty">Zatím nemáte žádná kola. Přidejte první pomocí tlačítka výše.</div>
          )}
        </div>
      )}
    </div>
  );
}

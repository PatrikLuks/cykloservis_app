import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBike, updateBike } from '../utils/bikesApi';
import './AddBike.css'; // Re‑use existing form + layout styles for visual consistency

const BIKE_TYPES = ['Horské', 'Silniční', 'Gravel', 'Městské', 'Elektro', 'Dětské'];

export default function EditBike() {
  const { id } = useParams();
  const [form, setForm] = useState({
    title: '',
    model: '',
    year: '',
    minutesRidden: 0,
    type: '',
    brakes: '',
    specs: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(`/bikes/${id}/edit`)}`);
      return;
    }
    (async () => {
      try {
        const data = await getBike(id);
        setForm(f => ({
          ...f,
          title: data.title || '',
          model: data.model || '',
          year: data.year || '',
          minutesRidden: data.minutesRidden || 0,
          type: data.type || '',
          brakes: data.brakes || '',
          specs: data.specs || ''
        }));
      } catch (e) {
        setError('Kolo nenalezeno');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'minutesRidden' ? parseInt(value||'0',10) : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateBike(id, { ...form, year: form.year ? parseInt(form.year,10) : undefined });
      navigate(`/bikes/${id}`);
    } catch (err) {
      setError('Uložení selhalo');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="addbike-shell">Načítám…</div>;
  if (error) return <div className="addbike-shell">{error} <Link to="/my-bikes" className="ab-cancel">Zpět</Link></div>;

  return (
    <div className="addbike-shell">
      <h1 className="ab-page-title">Upravit Kolo</h1>
      <div className="addbike-white-card" style={{ maxWidth:1200 }}>
        <div style={{ display:'flex', gap:60, flexWrap:'wrap' }}>
          <form onSubmit={onSubmit} className="ab-form" style={{ flex:1, minWidth:320 }} autoComplete="off">
            <label className="ab-field">
              <span>Název</span>
              <input name="title" value={form.title} onChange={onChange} required />
            </label>
            <label className="ab-field">
              <span>Model</span>
              <input name="model" value={form.model} onChange={onChange} />
            </label>
            <label className="ab-field">
              <span>Rok výroby</span>
              <input name="year" type="number" value={form.year} onChange={onChange} />
            </label>
            <label className="ab-field">
              <span>Minuty odjeto</span>
              <input name="minutesRidden" type="number" value={form.minutesRidden} onChange={onChange} />
            </label>
            <label className="ab-field">
              <span>Typ kola</span>
              <div className="ab-select-wrapper">
                <select name="type" value={form.type||''} onChange={onChange}>
                  <option value="">(neuvedeno)</option>
                  {BIKE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="ab-select-caret">▾</span>
              </div>
            </label>
            <label className="ab-field">
              <span>Brzdy</span>
              <input name="brakes" value={form.brakes||''} onChange={onChange} />
            </label>
            <label className="ab-field">
              <span>Specifikace</span>
              <textarea name="specs" value={form.specs||''} onChange={onChange} rows={4} />
            </label>
            {error && <div className="ab-error" role="alert">{error}</div>}
            {/* Actions for narrow view (mobile) */}
            <div className="ab-bottom-bar" style={{ padding:0, background:'transparent', borderTop:'none', marginTop:8, justifyContent:'flex-start', gap:16 }}>
              <button type="submit" className="ab-continue" disabled={saving}>
                <span>{saving ? 'Ukládám…' : 'Uložit'}</span>
                <span className="ab-continue-icon">✔</span>
              </button>
              <Link to={`/bikes/${id}`} className="ab-continue ab-cancel-btn" style={{ textDecoration:'none' }}>
                <span>Zrušit</span>
                <span className="ab-continue-icon" style={{ background:'#344054', color:'#fff' }}>✕</span>
              </Link>
            </div>
          </form>
          {/* Future: place for image / advanced attributes */}
        </div>
      </div>
    </div>
  );
}

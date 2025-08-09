import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBike, updateBike } from '../utils/bikesApi';

export default function EditBike() {
  const { id } = useParams();
  const [form, setForm] = useState({ title: '', model: '', year: '', minutesRidden: 0 });
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
        setForm({
          title: data.title || '',
          model: data.model || '',
          year: data.year || '',
          minutesRidden: data.minutesRidden || 0,
          type: data.type || '',
          brakes: data.brakes || '',
          specs: data.specs || ''
        });
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

  if (loading) return <div className="page-pad">Načítám…</div>;
  if (error) return <div className="page-pad">{error} <Link to="/my-bikes">Zpět</Link></div>;

  return (
    <div className="page-pad">
      <h1>Upravit kolo</h1>
      <form onSubmit={onSubmit} style={{maxWidth:400, display:'grid', gap:12}}>
        <label> Název
          <input name="title" value={form.title} onChange={onChange} required />
        </label>
        <label> Model
          <input name="model" value={form.model} onChange={onChange} />
        </label>
        <label> Rok
          <input name="year" type="number" value={form.year} onChange={onChange} />
        </label>
        <label> Minuty odjeto
          <input name="minutesRidden" type="number" value={form.minutesRidden} onChange={onChange} />
        </label>
        <label> Typ
          <input name="type" value={form.type||''} onChange={onChange} />
        </label>
        <label> Brzdy
          <input name="brakes" value={form.brakes||''} onChange={onChange} />
        </label>
        <label> Specifikace
          <textarea name="specs" value={form.specs||''} onChange={onChange} rows={4} />
        </label>
        {error && <div style={{color:'red'}}>{error}</div>}
        <div style={{display:'flex', gap:12}}>
          <button type="submit" disabled={saving}>{saving ? 'Ukládám…' : 'Uložit'}</button>
          <Link to={`/bikes/${id}`}>Zrušit</Link>
        </div>
      </form>
    </div>
  );
}

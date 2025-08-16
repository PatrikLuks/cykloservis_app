import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMechanics, getMechanicAvailability } from '../utils/mechanicsApi';
import { createServiceRequest } from '../utils/serviceRequestsApi';
import { listBikes } from '../utils/bikesApi';
import dayjs from 'dayjs';

const SERVICE_TYPES = [
  { value: 'servis', label: 'Servis kola' },
  { value: 'reklamace', label: 'Reklamace' },
  { value: 'odpruzeni', label: 'Servis odpružení' }
];

const MAX_SERVICE_TYPES = 2;

function PricePreview({ serviceTypes }) {
  if (!serviceTypes || !serviceTypes.length) return null;
  const base = 300; // Kč
  const typeAdd = { servis: 200, reklamace: 0, odpruzeni: 500 };
  const estimate = serviceTypes.reduce((sum, t) => sum + (typeAdd[t] || 0), base);
  return (
    <div style={{ fontSize: 13, background: '#f8fafc', padding: '8px 12px', borderRadius: 8 }}>
      <strong>Odhad ceny:</strong> ~ {estimate} Kč (orientační)
    </div>
  );
}

export default function NewOrder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [serviceTypes, setServiceTypes] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [mechanicsLoading, setMechanicsLoading] = useState(false);
  const [mechanicId, setMechanicId] = useState('');
  const [availability, setAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [preferredDateIso, setPreferredDateIso] = useState('');
  const [firstAvailable, setFirstAvailable] = useState(false);
  const [deferredBike, setDeferredBike] = useState(false);
  const [bikes, setBikes] = useState([]);
  const [bikeId, setBikeId] = useState('');
  const [title, setTitle] = useState('Servis kola');
  const [description, setDescription] = useState('');
  const [created, setCreated] = useState(null);

  // Load bikes once
  useEffect(() => {
    (async () => {
      try {
        const mod = await import('../utils/bikesApi');
        const data = await mod.listBikes();
        setBikes(data);
      } catch (e) {/* ignore */}
    })();
  }, []);

  // Load mechanics when serviceTypes changes
  useEffect(() => {
    (async () => {
      setMechanicsLoading(true);
      try {
        const list = await listMechanics(serviceTypes);
        setMechanics(list);
      } catch (e) { /* ignore */ }
      finally { setMechanicsLoading(false); }
    })();
  }, [serviceTypes]);

  // Load availability when mechanicId chosen
  useEffect(() => {
    if (!mechanicId) { setAvailability([]); return; }
    (async () => {
      setAvailabilityLoading(true);
      try {
        const data = await getMechanicAvailability(mechanicId);
        setAvailability(data.slots || []);
      } catch (e) { /* ignore */ }
      finally { setAvailabilityLoading(false); }
    })();
  }, [mechanicId]);

  const canNextFromStep1 = serviceTypes.length > 0;
  const canNextFromStep2 = mechanicId !== '';
  const canNextFromStep3 = firstAvailable || preferredDateIso !== '';
  const canNextFromStep4 = deferredBike || bikeId !== '';

  const freeSlots = useMemo(() => availability.filter(s => !s.occupied), [availability]);

  async function submit() {
    setLoading(true); setError(null);
    try {
      const payload = {
        title: title || 'Servis',
        description,
        mechanicId: mechanicId || undefined,
        serviceTypes,
        deferredBike,
        bikeId: deferredBike ? undefined : bikeId,
        preferredDate: preferredDateIso || undefined,
        firstAvailable,
      };
      const data = await createServiceRequest(payload);
      setCreated(data);
      setStep(6);
    } catch (e) {
      setError(e?.response?.data?.error || 'Chyba při vytváření');
    } finally { setLoading(false); }
  }

  function resetForm() {
    setStep(1);
    setServiceTypes([]);
    setMechanicId('');
    setAvailability([]);
    setPreferredDateIso('');
    setFirstAvailable(false);
    setDeferredBike(false);
    setBikeId('');
    setTitle('Servis kola');
    setDescription('');
    setCreated(null);
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div className="ds-card" style={{ padding: 20 }}>
        <h2 style={{ margin: 0 }}>Nová objednávka</h2>
        <p className="muted" style={{ marginTop: 4 }}>Krok {step <=5 ? step : 5} / 5</p>
      </div>

      {step === 1 && (
        <div className="ds-card" style={{ padding: 20, display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0 }}>1. Typ služby</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {SERVICE_TYPES.map(t => {
              const active = serviceTypes.includes(t.value);
              const disabled = !active && serviceTypes.length >= MAX_SERVICE_TYPES;
              return (
                <button key={t.value} type="button" disabled={disabled} onClick={() => {
                  setServiceTypes(prev => active ? prev.filter(v => v!==t.value) : [...prev, t.value]);
                }} className="btn" style={{
                  background: active ? '#394ff7' : '#fff',
                  color: active ? '#fff' : (disabled ? '#9ca3af' : '#394ff7'),
                  border: '1.5px solid ' + (disabled ? '#d1d5db' : '#394ff7'),
                  padding: '8px 14px',
                  borderRadius: 8,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  opacity: disabled ? 0.6 : 1
                }}>{t.label}</button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Max {MAX_SERVICE_TYPES} typy</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span />
            <button disabled={!canNextFromStep1} onClick={() => setStep(2)} className="btn-primary">Další</button>
          </div>
        </div>
      )}

      {step === 2 && (
              <div className="ds-card" style={{ padding: 28, display: 'grid', gap: 22 }}>
                <h3 style={{ margin: 0 }}>2. Výběr mechanika</h3>
                {mechanicsLoading && <div className="muted">Načítám mechaniky...</div>}
                {!mechanicsLoading && mechanics.length === 0 && <div className="muted">Žádný mechanik nenalezen</div>}
                <div style={{ display:'grid', gap:18, gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))' }}>
                  {mechanics.map(m => {
                    const active = mechanicId === m._id;
                    const skills = (m.skills||[]).slice(0,3);
                    const more = (m.skills||[]).length - skills.length;
                    const avatar = m.avatarUrl ? (m.avatarUrl.startsWith('http') ? m.avatarUrl : (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001') + m.avatarUrl) : null;
                    return (
                      <label key={m._id} style={{
                        position:'relative',
                        border: active ? '2px solid #394ff7' : '1px solid #e5e7eb',
                        background: active ? '#f5f7ff' : '#fff',
                        padding: '18px 18px 20px',
                        borderRadius: 26,
                        cursor: 'pointer',
                        display:'grid',
                        gap:14,
                        boxShadow: active ? '0 4px 14px -4px rgba(57,79,247,0.35)' : '0 3px 10px -4px rgba(16,24,40,0.14)'
                      }}>
                        <input style={{ position:'absolute', top:10, left:10 }} disabled={mechanicsLoading} type="radio" name="mechanic" value={m._id} checked={active} onChange={() => setMechanicId(m._id)} />
                        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                          <div style={{ width:64, height:64, borderRadius:'50%', overflow:'hidden', background:'#f2f4f7', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:600, color:'#475467' }}>
                            {avatar ? <img src={avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (
                              (m.displayName||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
                            )}
                          </div>
                          <div style={{ display:'grid', gap:4, flex:1 }}>
                            <div style={{ fontWeight:600, fontSize:16 }}>{m.displayName || 'Mechanik'}</div>
                            {m.address && <div style={{ fontSize:12, color:'#475467' }}>{m.address}</div>}
                            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                              {skills.map(s => <span key={s} style={{ fontSize:11, background:'#eef2ff', color:'#394ff7', padding:'4px 10px', borderRadius:20, fontWeight:500 }}>{s}</span>)}
                              {more>0 && <span style={{ fontSize:11, background:'#f2f4f7', color:'#475467', padding:'4px 10px', borderRadius:20 }}>+{more}</span>}
                            </div>
                          </div>
                        </div>
                        {active && <div style={{ position:'absolute', top:10, right:14, background:'#394ff7', color:'#fff', fontSize:11, padding:'4px 10px', borderRadius:20, fontWeight:600 }}>Vybráno</div>}
                      </label>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <button onClick={() => setStep(1)} className="btn-secondary">Zpět</button>
                  <button disabled={!canNextFromStep2} onClick={() => setStep(3)} className="btn-primary">Další</button>
                </div>
              </div>
            )}

      {step === 3 && (
        <div className="ds-card" style={{ padding: 20, display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0 }}>3. Termín</h3>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={firstAvailable} onChange={e => { setFirstAvailable(e.target.checked); if(e.target.checked) setPreferredDateIso(''); }} />
            <span>První volný termín</span>
          </label>
          {!firstAvailable && (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Volné sloty</div>
              {availabilityLoading && <div className="muted">Načítám dostupnost...</div>}
              {!availabilityLoading && freeSlots.length === 0 && <div className="muted">Žádné volné sloty</div>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {freeSlots.slice(0, 24).map(s => {
                  const d = dayjs(s.slot);
                  const iso = d.toDate().toISOString();
                  const active = preferredDateIso === iso;
                  return (
                    <button key={iso} type="button" disabled={availabilityLoading} onClick={() => setPreferredDateIso(iso)} style={{
                      background: active ? '#394ff7' : '#fff',
                      color: active ? '#fff' : '#394ff7',
                      border: '1.5px solid #394ff7',
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: availabilityLoading ? 'wait' : 'pointer',
                      fontWeight: 600
                    }}>{d.format('DD.MM. HH:mm')}</button>
                  );
                })}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button onClick={() => setStep(2)} className="btn-secondary">Zpět</button>
            <button disabled={!canNextFromStep3} onClick={() => setStep(4)} className="btn-primary">Další</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="ds-card" style={{ padding: 20, display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0 }}>4. Kolo</h3>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={deferredBike} onChange={e => { setDeferredBike(e.target.checked); if(e.target.checked) setBikeId(''); }} />
            <span>Přidám kolo až na místě (mechanik vyplní)</span>
          </label>
          {!deferredBike && (
            <select value={bikeId} onChange={e => setBikeId(e.target.value)} className="register-input" style={{ maxWidth: 320 }}>
              <option value="">-- vyberte kolo --</option>
              {bikes.map(b => <option key={b._id} value={b._id}>{b.brand || 'Kolo'} {b.model || ''}</option>)}
            </select>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button onClick={() => setStep(3)} className="btn-secondary">Zpět</button>
            <button disabled={!canNextFromStep4} onClick={() => setStep(5)} className="btn-primary">Další</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="ds-card" style={{ padding: 20, display: 'grid', gap: 16, maxWidth: 720 }}>
          <h3 style={{ margin: 0 }}>5. Shrnutí & detaily</h3>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Název</span>
            <input className="register-input" value={title} onChange={e => setTitle(e.target.value)} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Popis</span>
            <textarea className="register-input" style={{ minHeight: 100 }} value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          <div style={{ fontSize: 13 }}>
            <strong>Typy služby:</strong> {serviceTypes.join(', ')}<br />
            <strong>Mechanik:</strong> {mechanicId || '—'}<br />
            <strong>Termín:</strong> {firstAvailable ? 'První volný' : (preferredDateIso ? dayjs(preferredDateIso).format('DD.MM.YYYY HH:mm') : '—')}<br />
            <strong>Kolo:</strong> {deferredBike ? 'Přidá se později' : (bikeId || '—')}
          </div>
          <PricePreview serviceTypes={serviceTypes} />
          {error && <div style={{ color: '#e53935', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button onClick={() => setStep(4)} className="btn-secondary">Zpět</button>
            <button disabled={loading} onClick={submit} className="btn-primary">{loading? 'Ukládám…' : 'Vytvořit objednávku'}</button>
          </div>
        </div>
      )}

  {step === 6 && created && (
        <div className="ds-card" style={{ padding: 20, display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0 }}>Objednávka vytvořena</h3>
          <div style={{ fontSize: 13 }}>
            ID: {created._id}<br />
            Stav: {created.status}<br />
            Přiřazený termín: {created.assignedDate ? dayjs(created.assignedDate).format('DD.MM.YYYY HH:mm') : '—'}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={resetForm} className="btn-primary">Nová objednávka</button>
            <button onClick={() => navigate('/orders')} className="btn-secondary">Na seznam objednávek</button>
          </div>
        </div>
      )}
    </div>
  );
}

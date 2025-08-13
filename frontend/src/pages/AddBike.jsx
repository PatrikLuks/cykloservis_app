import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBike } from '../utils/bikesApi';
import '../App.css';
import './AddBike.css';

const BIKE_TYPES = ['Horské', 'Silniční', 'Gravel', 'Městské', 'Elektro', 'Dětské'];

export default function AddBike() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: '',
    model: '',
    manufacturer: '',
    year: '',
    imageUrl: '',
    driveBrand: '',
    driveType: '',
    color: '',
    brakes: '',
    suspension: '',
    suspensionType: '',
    specs: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [step, setStep] = useState(1);
  const currentYear = new Date().getFullYear();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError('');
    if (step === 1) {
      if (!form.type && !form.model) {
        setError('Vyplňte alespoň typ nebo model.');
        return;
      }
      if (form.year) {
        const y = Number(form.year);
        if (y < 1980 || y > currentYear + 1) {
          setError(`Rok musí být v rozsahu 1980–${currentYear + 1}`);
          return;
        }
      }
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      await createBike({
        title: form.model || form.type || 'Kolo',
        type: form.type || undefined,
        manufacturer: form.manufacturer || undefined,
        model: form.model || undefined,
        year: form.year ? Number(form.year) : undefined,
        imageUrl: form.imageUrl || undefined,
        driveBrand: form.driveBrand || undefined,
        driveType: form.driveType || undefined,
        color: form.color || undefined,
        brakes: form.brakes || undefined,
        suspension: form.suspension || undefined,
        suspensionType: form.suspensionType || undefined,
        specs: form.specs || undefined,
      });
      navigate('/my-bikes');
    } catch (e) {
      setError('Nepodařilo se uložit kolo.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleImageFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      update('imageUrl', e.target.result); // Base64 MVP
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="addbike-shell">
      <h1 className="ab-page-title">Přidat Nové Kolo</h1>
      <div className="addbike-white-card">
        <div className="ab-progress" aria-label="Postup vytvoření kola">
          <div className={'ab-progress-step' + (step >= 1 ? ' done' : '')}>
            <span className="ab-progress-index">1</span>
            <span className="ab-progress-label">Základní údaje</span>
          </div>
          <div className="ab-progress-line" aria-hidden="true">
            <div className="ab-progress-line-fill" style={{ width: step === 1 ? '50%' : '100%' }} />
          </div>
          <div className={'ab-progress-step' + (step >= 2 ? ' done' : '')}>
            <span className="ab-progress-index">2</span>
            <span className="ab-progress-label">Podrobné info</span>
          </div>
        </div>
        <div className="ab-inner-panel">
          <div className="ab-form-col">
            {step === 1 && (
              <>
                <h2 className="ab-section-title">Zadejte základní údaje o kole</h2>
                <form
                  id="addbike-form"
                  onSubmit={handleSubmit}
                  className="ab-form"
                  autoComplete="off"
                >
                  <label className="ab-field">
                    <span>Typ Kola</span>
                    <div className="ab-select-wrapper">
                      <select value={form.type} onChange={(e) => update('type', e.target.value)}>
                        <option value="">Vyberte typ</option>
                        {BIKE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <span className="ab-select-caret">▾</span>
                    </div>
                  </label>
                  <label className="ab-field">
                    <span>Model</span>
                    <input
                      placeholder="Např. MX 7206P"
                      value={form.model}
                      onChange={(e) => update('model', e.target.value)}
                    />
                  </label>
                  <label className="ab-field">
                    <span>Výrobce</span>
                    <input
                      placeholder="Např. Maxbike"
                      value={form.manufacturer}
                      onChange={(e) => update('manufacturer', e.target.value)}
                    />
                  </label>
                  <label className="ab-field">
                    <span>Rok výroby</span>
                    <input
                      type="number"
                      placeholder={`Např. ${currentYear}`}
                      value={form.year}
                      onChange={(e) => update('year', e.target.value)}
                    />
                  </label>
                  {error && (
                    <div className="ab-error" role="alert">
                      {error}
                    </div>
                  )}
                </form>
              </>
            )}
            {step === 2 && (
              <>
                <h2 className="ab-section-title">Podrobné informace o kole</h2>
                <form
                  id="addbike-form"
                  onSubmit={handleSubmit}
                  className="ab-form"
                  autoComplete="off"
                >
                  <label className="ab-field">
                    <span>Značka Pohonu</span>
                    <input
                      value={form.driveBrand}
                      onChange={(e) => update('driveBrand', e.target.value)}
                    />
                  </label>
                  <label className="ab-field">
                    <span>Typ Pohonu</span>
                    <input
                      value={form.driveType}
                      onChange={(e) => update('driveType', e.target.value)}
                    />
                  </label>
                  <label className="ab-field">
                    <span>Barva</span>
                    <input value={form.color} onChange={(e) => update('color', e.target.value)} />
                  </label>
                  <label className="ab-field">
                    <span>Brzdy (značka, model)</span>
                    <input value={form.brakes} onChange={(e) => update('brakes', e.target.value)} />
                  </label>
                  <label className="ab-field">
                    <span>Odpružení</span>
                    <input
                      value={form.suspension}
                      onChange={(e) => update('suspension', e.target.value)}
                    />
                  </label>
                  <label className="ab-field">
                    <span>Typ Odpružení</span>
                    <input
                      value={form.suspensionType}
                      onChange={(e) => update('suspensionType', e.target.value)}
                    />
                  </label>
                  <label className="ab-field">
                    <span>Specifikace</span>
                    <input value={form.specs} onChange={(e) => update('specs', e.target.value)} />
                  </label>
                  {error && (
                    <div className="ab-error" role="alert">
                      {error}
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
          <div className="ab-image-col">
            <div className="ab-image-frame large">
              {preview ? (
                <img src={preview} alt="Náhled kola" />
              ) : (
                <div className="ab-image-placeholder">Žádný obrázek</div>
              )}
            </div>
            <div className="ab-upload-box overlay">
              <div>{preview ? 'Aktuální fotka' : 'Přidejte fotku vašeho kola'}</div>
              <input
                id="bike-image-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleImageFile(e.target.files?.[0])}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => document.getElementById('bike-image-input').click()}
                  className="ab-upload-btn"
                >
                  {preview ? 'Změnit' : 'Nahrát'}
                </button>
                {preview && (
                  <button
                    type="button"
                    className="ab-remove-btn"
                    onClick={() => {
                      setPreview('');
                      update('imageUrl', '');
                    }}
                  >
                    Odstranit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="ab-bottom-bar">
          <div className="ab-bottom-left" style={{ display: 'flex', gap: 16 }}>
            <button
              type="button"
              className="ab-continue ab-back-btn"
              onClick={() => {
                if (step === 2) {
                  setStep(1);
                  setError('');
                } else {
                  navigate(-1);
                }
              }}
            >
              <span>Zpět</span>
              <span className="ab-continue-icon" style={{ transform: 'rotate(180deg)' }}>
                ➜
              </span>
            </button>
            <button
              type="button"
              className="ab-continue ab-cancel-btn"
              onClick={() => navigate('/my-bikes')}
            >
              <span>Zrušit</span>
              <span className="ab-continue-icon" style={{ background: '#344054', color: '#fff' }}>
                ✕
              </span>
            </button>
          </div>
          <div className="ab-bottom-right" style={{ display: 'flex', gap: 16 }}>
            {step === 1 && (
              <button form="addbike-form" className="ab-continue" disabled={submitting}>
                <span>{'Pokračovat'}</span>
                <span className="ab-continue-icon">➜</span>
              </button>
            )}
            {step === 2 && (
              <button form="addbike-form" className="ab-continue" disabled={submitting}>
                <span>{submitting ? 'Ukládám…' : 'Potvrdit'}</span>
                <span className="ab-continue-icon">✔</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

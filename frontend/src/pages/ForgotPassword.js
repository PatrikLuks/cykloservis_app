import React, { useState } from 'react';
import axios from 'axios';
import './MultiStepRegister.css';
import RegisterNavbar from './RegisterNavbar';

export default function ForgotPassword() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const codeInputs = [React.useRef(), React.useRef(), React.useRef(), React.useRef(), React.useRef(), React.useRef()];

  // 1. krok: zadání emailu
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.post('http://localhost:5000/auth/forgot-password', { email });
      setStep(1);
      setMessage('Byl vám odeslán ověřovací kód na email.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Chyba při odesílání emailu');
    } finally {
      setLoading(false);
    }
  };

  // 2. krok: zadání kódu
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.post('http://localhost:5000/auth/verify-reset-code', { email, code: code.join('') });
      setStep(2);
      setMessage('Kód ověřen, nastavte nové heslo.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Chybný kód');
    } finally {
      setLoading(false);
    }
  };

  // 3. krok: nové heslo
  const handleSetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.post('http://localhost:5000/auth/reset-password', { email, code: code.join(''), newPassword });
      setStep(3);
      setMessage('Heslo bylo úspěšně změněno.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Chyba při změně hesla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <RegisterNavbar />
      <div className="register-layout">
        <div className="register-image" />
        <div className="register-right">
          <div className="register-container" style={{ marginTop: 40 }}>
            <h2 className="register-title">Obnova hesla</h2>
            {step === 0 && (
              <form className="register-form" onSubmit={handleSendEmail}>
                <div className="register-field">
                  <label htmlFor="email" className="register-label">E-mail</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Zadejte svůj e-mail"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" disabled={loading} style={{ minHeight: 48, height: 48, fontWeight: 500 }}>
                  {loading ? <span className="spinner-in-btn" aria-label="Načítání"></span> : 'Odeslat kód'}
                </button>
              </form>
            )}
            {step === 1 && (
              <form className="register-form" onSubmit={handleVerifyCode}>
                <label className="register-label">Zadejte 6-místný kód z emailu</label>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', margin: '24px 0' }}>
                  {code.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={codeInputs[idx]}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        if (!val) return;
                        const newCode = [...code];
                        newCode[idx] = val;
                        setCode(newCode);
                        if (idx < 5 && val) codeInputs[idx + 1].current.focus();
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Backspace') {
                          if (code[idx]) {
                            const newCode = [...code];
                            newCode[idx] = '';
                            setCode(newCode);
                          } else if (idx > 0) {
                            codeInputs[idx - 1].current.focus();
                          }
                        }
                      }}
                      style={{
                        width: 'fit-content !important',
                        height: 'fit-content !important',
                        fontSize: '1.5rem',
                        textAlign: 'center',
                        border: '2px solid #a39f9f',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#fff',
                      }}
                      required
                    />
                  ))}
                </div>
                <button type="submit" disabled={code.some(d => !d) || loading} style={{ minHeight: 48, height: 48, fontWeight: 500 }}>
                  {loading ? <span className="spinner-in-btn" aria-label="Načítání"></span> : 'Ověřit kód'}
                </button>
              </form>
            )}
            {step === 2 && (
              <form className="register-form" onSubmit={handleSetPassword}>
                <div className="register-field">
                  <label htmlFor="newPassword" className="register-label">Nové heslo</label>
                  <div className="register-password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="newPassword"
                      name="newPassword"
                      placeholder="Nové heslo"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                    />
                    <span
                      className="register-password-eye"
                      tabIndex={0}
                      role="button"
                      aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
                      onClick={() => setShowPassword(v => !v)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowPassword(v => !v); }}
                    >
                      {showPassword ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="3.5" stroke="#222" strokeWidth="1.5"/>
                          <path d="M2 12C3.73 7.61 7.86 4.5 12 4.5C16.14 4.5 20.27 7.61 22 12C20.27 16.39 16.14 19.5 12 19.5C7.86 19.5 3.73 16.39 2 12Z" stroke="#222" strokeWidth="1.5"/>
                          <line x1="6" y1="6" x2="18" y2="18" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="3.5" stroke="#222" strokeWidth="1.5"/>
                          <path d="M2 12C3.73 7.61 7.86 4.5 12 4.5C16.14 4.5 20.27 7.61 22 12C20.27 16.39 16.14 19.5 12 19.5C7.86 19.5 3.73 16.39 2 12Z" stroke="#222" strokeWidth="1.5"/>
                        </svg>
                      )}
                    </span>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={{ minHeight: 48, height: 48, fontWeight: 500 }}>
                  {loading ? <span className="spinner-in-btn" aria-label="Načítání"></span> : 'Nastavit nové heslo'}
                </button>
              </form>
            )}
            {step === 3 && (
              <div className="register-message">Heslo bylo úspěšně změněno. Nyní se můžete <a href="/login">přihlásit</a>.</div>
            )}
            <div className="register-message">{message}</div>
          </div>
        </div>
      </div>
    </>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MultiStepRegister.css';
import RegisterNavbar from './RegisterNavbar';

const steps = [
  'Vytvořit Účet',
  'Zadejte heslo',
  'Zadejte kód, který jste obdrželi',
  'Dokončete svůj účet'
];

export default function MultiStepRegister() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    location: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const codeInputs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Načti email z query parametru při načtení komponenty
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const stepParam = params.get('step');
    if (email) {
      setForm(f => ({ ...f, email }));
    }
    if (stepParam && !isNaN(Number(stepParam))) {
      setStep(Number(stepParam));
    }
  }, []);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Krok 1: Registrace
  // Krok 1: Email
  // Uložený email pro porovnání při návratu na krok 1
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Krok 1: pouze posun na další krok
  const handleEmailOnly = (e) => {
    e.preventDefault();
    setStep(1);
    setMessage('');
  };

  // Krok 2: Heslo
  // Krok 2: pouze posun na další krok
  // Krok 2: po zadání hesla automaticky odešle kód na email a posune na krok 3
  const [loadingPassword, setLoadingPassword] = useState(false);
  const handlePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoadingPassword(true);
    try {
      await axios.post('http://localhost:5000/auth/register', { email: form.email });
      setStep(2); // posun na krok ověření kódu
      setMessage('Kód byl odeslán na váš email.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Chyba při odesílání kódu');
    } finally {
      setLoadingPassword(false);
    }
  };

  // Krok 3: nejprve odešle email na backend, pak čeká na zadání kódu
  const [codeRequested, setCodeRequested] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown for resend button
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);
  const handleRequestCode = async () => {
    if (resendCooldown > 0) return;
    setMessage('');
    try {
      await axios.post('http://localhost:5000/auth/register', { email: form.email });
      setCodeRequested(true);
      setResendCooldown(30); // 30s cooldown
      setMessage('Kód byl odeslán na váš email.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Chyba při odesílání kódu');
    }
  };

  // Ověření kódu
  const handleVerifyCode = async (e) => {
    e.preventDefault && e.preventDefault();
    setMessage('');
    const codeStr = Array.isArray(code) ? code.join('') : code;
    try {
      await axios.post('http://localhost:5000/auth/verify-code', { email: form.email, code: codeStr });
      setStep(3);
      setMessage('Email byl ověřen.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Chybný kód');
    }
  };

  // Krok 4: Odeslání všeho na backend
  const handlePersonalData = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/auth/complete-profile', {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        birthDate: form.birthDate,
        gender: form.gender,
        location: form.location
      });
      navigate('/onboarding');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Chyba při registraci');
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Validace hesla
  const passwordValidations = [
    { label: '1 velké písmeno', valid: /[A-Z]/.test(form.password) },
    { label: '1 malé písmeno', valid: /[a-z]/.test(form.password) },
    { label: '1 číslice', valid: /[0-9]/.test(form.password) },
    { label: '1 speciální znak', valid: /[^A-Za-z0-9]/.test(form.password) },
    { label: '8 znaků', valid: form.password.length >= 8 },
    { label: 'Bez mezer', valid: !/\s/.test(form.password) }
  ];

  return (
    <>
      <RegisterNavbar />
      <div className="register-layout">
        <div className="register-image" />
        <div className="register-right">
          <div className="register-container">
            <div className="register-progress-bar">
              <div
                className="register-progress-bar-fill"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
            {step === 0 && (
              <>
                <h2 className="register-title">{steps[0]}</h2>
                <form className="register-form" onSubmit={handleEmailOnly}>
                  <div className="register-field">
                    <label htmlFor="email" className="register-label">E-mail</label>
                    <input type="email" id="email" name="email" placeholder="priklad@mail.com" value={form.email} onChange={handleChange} required />
                  </div>
                  <button type="submit">Pokračovat</button>
                  <div className="register-or">
                    <span>Nebo se přihlaste pomocí</span>
                    <div className="register-social-row">
                      <div className="register-social-btn">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/24px-Google_%22G%22_logo.svg.png?20230822192911" alt="Google-logo" />
                      </div>
                    </div>
                  </div>
                </form>
               
                  <div className="already-registered-button">
                    <div className="have-an-account"> Už máte účet?</div>
                
                    <a href="/login" className="register-login-link">Přihlásit se</a>
                  </div>
                  <div className="register-terms">
                    Souhlasím s vytvořením účtu pomocí e-mailové adresy podle{' '}
                    <a href="#">obchodních podmínek</a>.
                  </div>
           
              </>
            )}
            {step === 1 && (
              <>
                <h2 className="register-title">{steps[1]}</h2>
               
                  <div className="register-password-header">
                    <span style={{ fontWeight: 'bold' }}>{form.email}</span>
                    <button type="button" className="register-edit-email" onClick={() => setStep(0)}>Upravit</button>
                  </div>
                   <div className="register-password-step">
                  <form className="register-form" onSubmit={handlePassword}>
                  <div className="password-field">
                    <label htmlFor="password" className="register-label">Zadejte heslo</label>
                    <div className="register-password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        placeholder="Heslo"
                        value={form.password}
                        onChange={e => { handleChange(e); setPasswordTouched(true); }}
                        required
                        autoComplete="new-password"
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
                          // Oko s křížkem přes něj
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="3.5" stroke="#222" strokeWidth="1.5"/>
                            <path d="M2 12C3.73 7.61 7.86 4.5 12 4.5C16.14 4.5 20.27 7.61 22 12C20.27 16.39 16.14 19.5 12 19.5C7.86 19.5 3.73 16.39 2 12Z" stroke="#222" strokeWidth="1.5"/>
                            <line x1="6" y1="6" x2="18" y2="18" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          // Otevřené oko (eye)
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="3.5" stroke="#222" strokeWidth="1.5"/>
                            <path d="M2 12C3.73 7.61 7.86 4.5 12 4.5C16.14 4.5 20.27 7.61 22 12C20.27 16.39 16.14 19.5 12 19.5C7.86 19.5 3.73 16.39 2 12Z" stroke="#222" strokeWidth="1.5"/>
                          </svg>
                        )}
                      </span>
                    </div>
</div>


                    <ul className="register-password-criteria">
                      {passwordValidations.map((v, i) => (
                        <li key={i}>
                          <span className={v.valid ? 'criteria-circle criteria-circle-valid' : 'criteria-circle'}></span> {v.label}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="submit"
                      disabled={!passwordValidations.every(v => v.valid) || loadingPassword}
                      style={{ background: passwordValidations.every(v => v.valid) ? '#1976d2' : '#88accfff', color: '#fff', position: 'relative' }}
                    >
                      {loadingPassword ? (
                        <span className="spinner-in-btn" aria-label="Načítání"></span>
                      ) : (
                        'Pokračovat'
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h2 className="register-title">{steps[2]}</h2>
                <form className="register-form" onSubmit={e => {
                  e.preventDefault();
                  const codeStr = code.join('');
                  handleVerifyCode({ preventDefault: () => {}, target: { value: codeStr } });
                }}>
                  <label className="form-desc">Při registraci je vyžadován kód pro ověření. Tento jednorázový kód je odeslán na adresu:</label>
                  <div className="register-password-header">
                    <span style={{ fontWeight: 'bold' }}>{form.email}</span>
                  </div>
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
                  <button type="submit" disabled={code.some(d => !d)}>Ověřit</button>
                  <span
                    className={`resend-code-link${resendCooldown > 0 ? ' disabled' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => { if (resendCooldown === 0) handleRequestCode(); }}
                    onKeyDown={e => { if (e.key === 'Enter' && resendCooldown === 0) handleRequestCode(); }}
                    aria-disabled={resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? `Zaslat znovu (${resendCooldown}s)` : 'Zaslat kód znovu'}
                  </span>
                </form>
              </>
            )}
            {step === 3 && (
              <>
                <h2 className="register-title">{steps[3]}</h2>
                <form className="register-form" onSubmit={handlePersonalData}>
                  <div className="register-field">
                    <label htmlFor="firstName" className="register-label">Jméno</label>
                    <input type="text" id="firstName" name="firstName" placeholder="Jméno" value={form.firstName} onChange={handleChange} required />
                  </div>
                  <div className="register-field">
                    <label htmlFor="lastName" className="register-label">Příjmení</label>
                    <input type="text" id="lastName" name="lastName" placeholder="Příjmení" value={form.lastName} onChange={handleChange} required />
                  </div>
                  <div className="register-field">
                    <label htmlFor="birthDate" className="register-label">Datum narození</label>
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        id="birthDate"
                        name="birthDate"
                        placeholder="Datum narození"
                        value={form.birthDate}
                        onChange={handleChange}
                        required
                        className="styled-date-input"
                      />
                      <span className="calendar-icon" aria-hidden="true">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="5" width="14" height="12" rx="2" stroke="#888" strokeWidth="1.5"/>
                          <path d="M7 2V5M13 2V5" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
                          <rect x="7" y="9" width="2" height="2" rx="1" fill="#888"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div className="register-field">
                    <label htmlFor="gender" className="register-label">Pohlaví</label>
                    <select id="gender" name="gender" value={form.gender} onChange={handleChange} required>
                      <option value="">Pohlaví</option>
                      <option value="male">Muž</option>
                      <option value="female">Žena</option>
                      <option value="other">Jiné</option>
                    </select>
                  </div>
                  <div className="register-field">
                    <label htmlFor="location" className="register-label">Lokalita</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      placeholder="Např. Město, Kraj, Stát"
                      value={form.location}
                      onChange={handleChange}
                      required
                      autoComplete="off"
                    />
                  </div>
                  <button type="submit">Dokončit registraci</button>
                </form>
              </>
            )}
            {step !== 3 && (
              <div className="register-message">{message}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

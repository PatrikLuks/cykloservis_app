import { Link, useNavigate } from 'react-router-dom';

import React, { useState } from 'react';
import axios from 'axios';
import './MultiStepRegister.css';
import RegisterNavbar from './RegisterNavbar';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Helper functions for robust error matching
  const isEmailError = msg => msg && (
    msg.toLowerCase().includes('neexistuje') ||
    msg === 'Zadejte platnou e-mailovou adresu' ||
    msg.toLowerCase().includes('není ověřen')
  );
  const isPasswordError = msg => msg && msg.toLowerCase().includes('heslo');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (
      (e.target.name === 'password' && isPasswordError(message)) ||
      (e.target.name === 'email' && isEmailError(message))
    ) {
      setMessage('');
    }
  };

  // Simple email validation
  const isValidEmail = email => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !isValidEmail(form.email)) {
      setMessage('Zadejte platnou e-mailovou adresu');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
<<<<<<< HEAD
      await axios.post('http://localhost:5001/auth/login', { email: form.email, password: form.password });
      navigate('/onboarding');
=======
      const res = await axios.post('http://localhost:5000/auth/login', { email: form.email, password: form.password });
      if (res.data && res.data.finallyRegistered === false) {
        // Přesměruj na MultiStepRegister na krok 3 (dokončení profilu)
        navigate(`/register?email=${encodeURIComponent(form.email)}&step=3`);
      } else {
        navigate('/onboarding');
      }
>>>>>>> aedbf0f (Aktuální stav projektu - registrace, login, finallyRegistered, UX)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Chyba při přihlášení');
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
            <h2 className="register-title">Přihlášení</h2>
            <form className="register-form" onSubmit={handleSubmit}>
              <div className="register-field">
                <label htmlFor="email" className="register-label">E-mail</label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  placeholder="priklad@mail.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className={isEmailError(message) ? 'input-error' : ''}
                  inputMode="email"
                  spellCheck={false}
                />
                {isEmailError(message) && (
                  <div className="input-error-message">{message}</div>
                )}
              </div>
              <div className="register-field">
                <label htmlFor="password" className="register-label">Heslo</label>
                <div className="register-password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="Heslo"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className={isPasswordError(message) ? 'input-error' : ''}
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
                {isPasswordError(message) && (
                  <div className="input-error-message">{message}</div>
                )}
              </div>
              <Link to="/forgot-password" className="register-login-link" style={{ alignSelf: 'start', marginBottom: 8 }}>
                Zapomněli jste heslo?
              </Link>
              <button type="submit" disabled={loading} style={{ minHeight: 48, height: 48, fontWeight: 500 }}>
                {loading ? (
                  <span className="spinner-in-btn" aria-label="Načítání"></span>
                ) : (
                  'Přihlásit se'
                )}
              </button>
              <div className="register-or">
                <span>Nebo se přihlaste pomocí</span>
                <div className="register-social-row">
                  <div className="register-social-btn">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/24px-Google_%22G%22_logo.svg.png?20230822192911" alt="Google-logo" />
                  </div>
                </div>
              </div>
            </form>
         
            <div className="already-registered-button" >
              <span className="have-an-account">Jste nový?</span>
              <Link to="/register" className="register-login-link">Založte si účet</Link>
            </div>
               {message && !isPasswordError(message) && !isEmailError(message) && (
                 <div className="register-message">{message}</div>
               )}
          </div>
        </div>
      </div>
    </>
  );
}

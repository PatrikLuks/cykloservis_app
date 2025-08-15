import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner, InputErrorMessage } from '../components/CommonUI.jsx';
import api from '../utils/apiClient';
import RegisterNavbar from './RegisterNavbar';
import './MultiStepRegister.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const email = params.get('email');
      if (email) setForm((f) => ({ ...f, email }));
    } catch (e) {
      // ignore query parsing
    }
  }, []);

  const isEmailError = (msg) =>
    msg &&
    (msg.toLowerCase().includes('neexistuje') ||
      msg === 'Zadejte platnou e-mailovou adresu' ||
      msg.toLowerCase().includes('není ověřen'));
  const isPasswordError = (msg) => msg && msg.toLowerCase().includes('heslo');
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (
      (e.target.name === 'password' && isPasswordError(message)) ||
      (e.target.name === 'email' && isEmailError(message))
    ) {
      setMessage('');
    }
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
      const res = await api.post('/auth/login', { email: form.email, password: form.password });
      if (res.data?.token) {
        try {
          localStorage.setItem('token', res.data.token);
        } catch (e) {
          /* ignore storage */
        }
      }
      if (res.data && res.data.finallyRegistered === false) {
        navigate(`/register?email=${encodeURIComponent(form.email)}&step=3`);
      } else {
        navigate('/dashboard');
      }
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
                <label htmlFor="email" className="register-label">
                  E-mail
                </label>
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
                {isEmailError(message) && <InputErrorMessage>{message}</InputErrorMessage>}
              </div>
              <div className="register-field">
                <label htmlFor="password" className="register-label">
                  Heslo
                </label>
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
                    onClick={() => setShowPassword((v) => !v)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setShowPassword((v) => !v);
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </span>
                </div>
                {isPasswordError(message) && <InputErrorMessage>{message}</InputErrorMessage>}
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ minHeight: 48, height: 48, fontWeight: 500 }}
              >
                {loading ? <Spinner /> : 'Přihlásit se'}
              </button>
            </form>
            <div className="already-registered-button">
              <span className="have-an-account">Jste nový?</span>
              <Link to="/register" className="register-login-link">
                Založte si účet
              </Link>
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

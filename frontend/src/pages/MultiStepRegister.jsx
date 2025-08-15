import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/apiClient';
import RegisterNavbar from './RegisterNavbar';
import { Spinner, InputErrorMessage } from '../components/CommonUI.jsx';
import CodeInput from '../components/CodeInput.jsx';
import { getPasswordValidations } from '../utils/passwordValidation';
import './MultiStepRegister.css';

/*
  Rekonstrukce více‑krokové registrace – inkrementálně.
  Fáze 1: pouze krok e‑mailu (STEP 0) s validací a voláním /auth/register.
  Další kroky (heslo, kód, profil) budou doplněny postupně po otestování základu.
*/

const STEP = {
  EMAIL: 0,
  PASSWORD: 1, // zatím neimplementováno
  CODE: 2, // zatím neimplementováno
  PROFILE: 3, // zatím neimplementováno
};

export default function MultiStepRegister() {
  const [step, setStep] = useState(STEP.EMAIL);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const codeRefs = useRef(Array.from({ length: 6 }, () => React.createRef()));
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    location: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const navigate = useNavigate();

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isEmailError = (msg) =>
    msg && (msg.includes('platnou') || msg.toLowerCase().includes('existuje'));

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setMessage('Zadejte platnou e-mailovou adresu');
      return;
    }
    setMessage('');
    setLoading(true);
    try {
      await api.post('/auth/register', { email });
      setStep(STEP.PASSWORD); // posun na další krok (zatím placeholder)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Chyba při registraci';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const passwordValidations = getPasswordValidations(password);
  const allPasswordValid = password.length > 0 && passwordValidations.every((v) => v.valid);

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (!allPasswordValid) return;
    setMessage('');
    setLoadingPassword(true);
    try {
      await api.post('/auth/save-password', { email, password });
      setStep(STEP.CODE); // placeholder pro další krok
      // Po úspěchu automaticky požádat backend (znovu) o zaslání kódu – reuse /auth/register (pokud tak backend funguje)
      try {
        await api.post('/auth/register', { email });
      } catch (e) {
        /* optional retry suppressed */
      }
      setResendCooldown(30);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Chyba při ukládání hesla');
    } finally {
      setLoadingPassword(false);
    }
  };

  // Odpočet resend cooldownu
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResendCode = async () => {
    if (resending || resendCooldown > 0) return;
    setMessage('');
    setResending(true);
    try {
      await api.post('/auth/register', { email });
      setResendCooldown(30);
      setMessage('Kód znovu odeslán.');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Chyba při odesílání kódu');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (code.some((d) => !d)) return;
    setMessage('');
    setVerifying(true);
    try {
      await api.post('/auth/verify-code', { email, code: code.join('') });
      setStep(STEP.PROFILE); // Další krok bude teprve implementován
    } catch (err) {
      setMessage('Nesprávný ověřovací kód');
    } finally {
      setVerifying(false);
    }
  };

  const profileValid =
    profile.firstName &&
    profile.lastName &&
    profile.birthDate &&
    profile.gender &&
    profile.location;

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    if (!profileValid) return;
    setMessage('');
    setSavingProfile(true);
    try {
      await api.post('/auth/complete-profile', { email, ...profile, password });
      navigate('/dashboard');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Chyba při dokončení profilu');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <>
      <RegisterNavbar />
      <div className="register-layout" data-testid="register-layout">
        <div className="register-image" />
        <div className="register-right">
          <div className="register-container">
            {/* Progress bar (zatím jen 1/4) */}
            <div className="register-progress-bar" aria-label="Průběh registrace">
              <div
                className="register-progress-bar-fill"
                style={{ width: `${((step + 1) / 4) * 100}%` }}
              />
            </div>

            {step === STEP.EMAIL && (
              <>
                <h2 className="register-title">Vytvořit účet</h2>
                <form className="register-form" onSubmit={handleSubmitEmail} noValidate>
                  <div className="register-field">
                    <label htmlFor="email" className="register-label">
                      E-mail
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="priklad@mail.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (isEmailError(message)) setMessage('');
                      }}
                      autoComplete="email"
                      inputMode="email"
                      spellCheck={false}
                      className={isEmailError(message) ? 'input-error' : ''}
                      aria-invalid={isEmailError(message) ? 'true' : 'false'}
                    />
                    {isEmailError(message) && <InputErrorMessage>{message}</InputErrorMessage>}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ minHeight: 48, height: 48, fontWeight: 500 }}
                  >
                    {loading ? <Spinner /> : 'Pokračovat'}
                  </button>
                </form>
                {message && !isEmailError(message) && (
                  <div className="register-message">{message}</div>
                )}
              </>
            )}

            {step === STEP.PROFILE && (
              <div data-testid="profile-step" style={{ padding: '8px 0 32px' }}>
                <h2 className="register-title">Dokončete svůj účet</h2>
                <form className="register-form" onSubmit={handleSubmitProfile} noValidate>
                  <div className="register-field">
                    <label htmlFor="firstName" className="register-label">
                      Jméno
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      value={profile.firstName}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="register-field">
                    <label htmlFor="lastName" className="register-label">
                      Příjmení
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      value={profile.lastName}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="register-field">
                    <label htmlFor="birthDate" className="register-label">
                      Datum narození
                    </label>
                    <input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      value={profile.birthDate}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="register-field">
                    <label htmlFor="gender" className="register-label">
                      Pohlaví
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={profile.gender}
                      onChange={handleProfileChange}
                      required
                    >
                      <option value="">Vyberte</option>
                      <option value="male">Muž</option>
                      <option value="female">Žena</option>
                      <option value="other">Jiné</option>
                    </select>
                  </div>
                  <div className="register-field">
                    <label htmlFor="location" className="register-label">
                      Lokalita
                    </label>
                    <input
                      id="location"
                      name="location"
                      value={profile.location}
                      onChange={handleProfileChange}
                      placeholder="Město"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    data-testid="profile-submit"
                    disabled={!profileValid || savingProfile}
                    style={{ minHeight: 48, height: 48, fontWeight: 500 }}
                  >
                    {savingProfile ? <Spinner /> : 'Dokončit registraci'}
                  </button>
                </form>
                {message && (
                  <div className="register-message" style={{ marginTop: 16 }}>
                    {message}
                  </div>
                )}
              </div>
            )}

            {step === STEP.PASSWORD && (
              <div data-testid="password-step" style={{ padding: '8px 0 32px' }}>
                <h2 className="register-title">Zadejte heslo</h2>
                <form className="register-form" onSubmit={handleSubmitPassword} noValidate>
                  <div className="register-field password-field">
                    <label htmlFor="password" className="register-label">
                      Heslo
                    </label>
                    <div className="register-password-input-wrapper">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        autoComplete="new-password"
                        onChange={(e) => setPassword(e.target.value)}
                        data-testid="password-input"
                      />
                      <span
                        className="register-password-eye"
                        role="button"
                        tabIndex={0}
                        aria-label={showPassword ? 'Skrýt' : 'Zobrazit'}
                        onClick={() => setShowPassword((v) => !v)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') setShowPassword((v) => !v);
                        }}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </span>
                    </div>
                  </div>
                  <ul className="register-password-criteria" aria-label="Kritéria hesla">
                    {passwordValidations.map((v) => (
                      <li key={v.label}>
                        <span
                          className={
                            v.valid ? 'criteria-circle criteria-circle-valid' : 'criteria-circle'
                          }
                        />
                        {v.label}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="submit"
                    disabled={!allPasswordValid || loadingPassword || password.length === 0}
                    style={{
                      minHeight: 48,
                      height: 48,
                      fontWeight: 500,
                      background: allPasswordValid ? '#1976d2' : '#88accfff',
                      color: '#fff',
                    }}
                    data-testid="password-submit"
                  >
                    {loadingPassword ? <Spinner /> : 'Pokračovat'}
                  </button>
                </form>
                {message && (
                  <div className="register-message" style={{ marginTop: 16 }}>
                    {message}
                  </div>
                )}
              </div>
            )}

            {step === STEP.CODE && (
              <div data-testid="code-step" style={{ padding: '8px 0 32px' }}>
                <h2 className="register-title">Zadejte kód</h2>
                <form className="register-form" onSubmit={handleVerifyCode} noValidate>
                  <p className="form-desc" style={{ marginTop: 0 }}>
                    Zadejte 6‑místný kód zaslaný na <strong>{email}</strong>.
                  </p>
                  <CodeInput
                    code={code}
                    setCode={setCode}
                    message={message}
                    codeInputs={codeRefs.current}
                  />
                  <button
                    type="submit"
                    disabled={code.some((d) => !d) || verifying}
                    style={{ minHeight: 48, height: 48, fontWeight: 500 }}
                    data-testid="code-submit"
                  >
                    {verifying ? <Spinner /> : 'Ověřit kód'}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending || resendCooldown > 0}
                  className={`resend-code-link${resendCooldown > 0 ? ' disabled' : ''}`}
                  style={{ marginTop: 16 }}
                  data-testid="resend-btn"
                >
                  {resending
                    ? 'Odesílám…'
                    : resendCooldown > 0
                      ? `Znovu (${resendCooldown}s)`
                      : 'Zaslat kód znovu'}
                </button>
                {message && message !== 'Nesprávný ověřovací kód' && (
                  <div className="register-message" style={{ marginTop: 16 }}>
                    {message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

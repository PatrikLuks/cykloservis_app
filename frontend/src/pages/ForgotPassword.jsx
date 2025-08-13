import { Spinner, InputErrorMessage } from '../components/CommonUI';
import CodeInput from '../components/CodeInput';
import React, { useState } from 'react';
import { getPasswordValidations } from '../utils/passwordValidation';
import api from '../utils/apiClient';
import './MultiStepRegister.css';
import RegisterNavbar from './RegisterNavbar';

export default function ForgotPassword() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // const [passwordTouched, setPasswordTouched] = useState(false); // odstraněno, nebylo využito
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [message, setMessage] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);
  // Samostatný stav pro spinner v resend tlačítku
  const [loadingResend, setLoadingResend] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const codeInputs = [
    React.useRef(),
    React.useRef(),
    React.useRef(),
    React.useRef(),
    React.useRef(),
    React.useRef(),
  ];

  // Cooldown for resend code
  const [resendCooldown, setResendCooldown] = useState(0);
  React.useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendCode = async () => {
    if (resendCooldown > 0 || loadingResend) return;
    setLoadingResend(true);
    setMessage('');
    try {
      await api.post('/auth/forgot-password', { email });
      setMessage('Byl vám odeslán ověřovací kód na email.');
      setResendCooldown(30);
    } catch (err) {
      setMessage('Chyba při odesílání emailu');
    } finally {
      setLoadingResend(false);
    }
  };

  // Helper for robust error match
  const isEmailError = (msg) =>
    msg &&
    (msg.toLowerCase().includes('neexistuje') || msg === 'Zadejte platnou e-mailovou adresu');
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 1. krok: zadání emailu
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email || !isValidEmail(email)) {
      setMessage('Zadejte platnou e-mailovou adresu');
      return;
    }
    setLoadingEmail(true);
    setMessage('');
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(1);
      setMessage('Byl vám odeslán ověřovací kód na email.');
    } catch (err) {
      if (
        err.response?.data?.message &&
        err.response.data.message.toLowerCase().includes('neexistuje')
      ) {
        setMessage('Uživatel s tímto emailem neexistuje');
      } else {
        setMessage(err.response?.data?.message || 'Chyba při odesílání emailu');
      }
    } finally {
      setLoadingEmail(false);
    }
  };

  // 2. krok: zadání kódu
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoadingCode(true);
    setMessage('');
    try {
      await api.post('/auth/verify-reset-code', { email, code: code.join('') });
      setStep(2);
      setMessage('Kód ověřen, nastavte nové heslo.');
    } catch (err) {
      setMessage('Nesprávný kód');
    } finally {
      setLoadingCode(false);
    }
  };

  // Validace hesla (stejné jako v registraci)
  const passwordValidations = getPasswordValidations(newPassword);

  // 3. krok: nové heslo
  const handleSetPassword = async (e) => {
    e.preventDefault();
    // setPasswordTouched(true); // odstraněno, nebylo využito
    setConfirmTouched(true);
    if (!passwordValidations.every((v) => v.valid)) {
      setMessage('Heslo nesplňuje všechna kritéria.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Hesla se neshodují.');
      return;
    }
    setLoadingPassword(true);
    setMessage('');
    try {
      await api.post('/auth/reset-password', { email, code: code.join(''), newPassword });
      setStep(3);
      setMessage('Heslo bylo úspěšně změněno.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Chyba při změně hesla');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <>
      <RegisterNavbar />
      <div className="register-layout">
        <div className="register-image" />
        <div className="register-right">
          <div className="register-container" style={{ marginTop: 40 }}>
            <h2 className="register-title">
              {step === 2 ? 'Nastavit nové heslo' : 'Obnova hesla'}
            </h2>
            {step === 0 && (
              <div className="form-desc">
                Pro obnovu hesla zadejte e-mailovou adresu, kterou jste použili při registraci svého
                účtu.
              </div>
            )}
            {step === 2 && (
              <div className="register-message" style={{ marginBottom: 16, textAlign: 'left' }}>
                Kód ověřen, nastavte nové heslo.
              </div>
            )}
            {step === 0 && (
              <form className="register-form" onSubmit={handleSendEmail}>
                <div className="register-field">
                  <label htmlFor="email" className="register-label">
                    E-mail
                  </label>
                  <input
                    type="text"
                    id="email"
                    name="email"
                    placeholder="Zadejte svůj e-mail"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (isEmailError(message)) setMessage('');
                    }}
                    autoComplete="email"
                    className={isEmailError(message) ? 'input-error' : ''}
                    inputMode="email"
                    spellCheck={false}
                  />
                  {isEmailError(message) && <InputErrorMessage>{message}</InputErrorMessage>}
                </div>
                <button
                  type="submit"
                  disabled={loadingEmail}
                  style={{ minHeight: 48, height: 48, fontWeight: 500 }}
                >
                  {loadingEmail ? <Spinner /> : 'Odeslat kód'}
                </button>
              </form>
            )}
            {step === 1 && (
              <form className="register-form" onSubmit={handleVerifyCode}>
                <label className="register-label">
                  Pro obnovu hesla zadejte ověřovací kód, který jsme vám zaslali e-mailem. Tento
                  jednorázový kód je odeslán na adresu:
                </label>
                <CodeInput
                  code={code}
                  setCode={setCode}
                  message={message}
                  codeInputs={codeInputs}
                />
                <button
                  type="submit"
                  disabled={code.some((d) => !d) || loadingCode}
                  style={{ minHeight: 48, height: 48, fontWeight: 500 }}
                >
                  {loadingCode ? <Spinner /> : 'Ověřit'}
                </button>
                <span
                  className={`resend-code-link${resendCooldown > 0 || loadingResend ? ' disabled' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (resendCooldown === 0 && !loadingResend) handleResendCode();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && resendCooldown === 0 && !loadingResend)
                      handleResendCode();
                  }}
                  aria-disabled={resendCooldown > 0 || loadingResend}
                  style={{
                    color: resendCooldown > 0 || loadingResend ? '#aaa' : '#1976d2',
                    cursor: resendCooldown > 0 || loadingResend ? 'not-allowed' : 'pointer',
                    marginTop: 12,
                    display: 'inline-block',
                    fontWeight: 600,
                    minWidth: 120,
                    position: 'relative',
                  }}
                >
                  {loadingResend ? (
                    <Spinner />
                  ) : resendCooldown > 0 ? (
                    `Zaslat znovu (${resendCooldown}s)`
                  ) : (
                    'Zaslat kód znovu'
                  )}
                </span>
                {/* Info hláška po odeslání kódu byla odstraněna na přání */}
              </form>
            )}
            {step === 2 && (
              <form className="register-form" onSubmit={handleSetPassword}>
                <div className="register-field">
                  <label htmlFor="newPassword" className="register-label">
                    Nové heslo
                  </label>
                  <div className="register-password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="newPassword"
                      name="newPassword"
                      placeholder="Nové heslo"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                      }}
                      required
                      autoComplete="new-password"
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
                      {showPassword ? (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="12" cy="12" r="3.5" stroke="#222" strokeWidth="1.5" />
                          <path
                            d="M2 12C3.73 7.61 7.86 4.5 12 4.5C16.14 4.5 20.27 7.61 22 12C20.27 16.39 16.14 19.5 12 19.5C7.86 19.5 3.73 16.39 2 12Z"
                            stroke="#222"
                            strokeWidth="1.5"
                          />
                          <line
                            x1="6"
                            y1="6"
                            x2="18"
                            y2="18"
                            stroke="#222"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="12" cy="12" r="3.5" stroke="#222" strokeWidth="1.5" />
                          <path
                            d="M2 12C3.73 7.61 7.86 4.5 12 4.5C16.14 4.5 20.27 7.61 22 12C20.27 16.39 16.14 19.5 12 19.5C7.86 19.5 3.73 16.39 2 12Z"
                            stroke="#222"
                            strokeWidth="1.5"
                          />
                        </svg>
                      )}
                    </span>
                  </div>
                </div>
                <ul className="register-password-criteria">
                  {passwordValidations.map((v, i) => (
                    <li key={i}>
                      <span
                        className={
                          v.valid ? 'criteria-circle criteria-circle-valid' : 'criteria-circle'
                        }
                      ></span>{' '}
                      {v.label}
                    </li>
                  ))}
                </ul>
                <div className="register-field">
                  <label htmlFor="confirmPassword" className="register-label">
                    Potvrdit heslo
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Potvrdit heslo"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmTouched(true);
                    }}
                    required
                    autoComplete="new-password"
                  />
                  {confirmTouched && confirmPassword && newPassword !== confirmPassword && (
                    <div
                      className="register-error"
                      style={{ color: 'red', fontSize: 13, marginTop: 4 }}
                    >
                      Hesla se neshodují.
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={
                    loadingPassword ||
                    !passwordValidations.every((v) => v.valid) ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                  style={{ minHeight: 48, height: 48, fontWeight: 500 }}
                >
                  {loadingPassword ? <Spinner /> : 'Nastavit nové heslo'}
                </button>
              </form>
            )}
            {step === 3 && (
              <div className="register-message">
                Heslo bylo úspěšně změněno. Nyní se můžete <a href="/login">přihlásit</a>.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

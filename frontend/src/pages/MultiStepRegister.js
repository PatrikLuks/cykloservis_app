import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MultiStepRegister.css';
import RegisterNavbar from './RegisterNavbar';

const steps = [
  'Nová Registrace',
  'Ověření emailu',
  'Osobní údaje'
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
    address: '',
    city: '',
    zip: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Krok 1: Registrace
  const handleEmailPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/auth/register', {
        email: form.email,
        password: form.password
      });
      setStep(1);
      setMessage('Zkontrolujte email a klikněte na ověřovací odkaz.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Chyba při registraci');
    }
  };

  // Krok 2: Ověření emailu
  const handleVerifyEmail = async () => {
    setMessage('Po kliknutí na odkaz v emailu pokračujte.');
    setStep(2);
  };

  // Krok 3: Osobní údaje
  const handlePersonalData = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/auth/complete-profile', {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        birthDate: form.birthDate,
        gender: form.gender,
        address: form.address,
        city: form.city,
        zip: form.zip
      });
      navigate('/dashboard');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Chyba při ukládání údajů');
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <>
      <RegisterNavbar />
      <div className="register-layout">
        <div className="register-image" />
        <div className="register-right">
          <div className="register-container">
            {step === 0 && (
              <>
                <h2>{steps[0]}</h2>
                <form className="register-form" onSubmit={handleEmailPassword}>
                  <label htmlFor="email" className="register-label">E-mail</label>
                  <input type="email" id="email" name="email" placeholder="priklad@mail.com" value={form.email} onChange={handleChange} required />
                  <label htmlFor="password" className="register-label">Heslo</label>
                  <input type="password" id="password" name="password" placeholder="Heslo" value={form.password} onChange={handleChange} required />
                  <button type="submit">Pokračovat</button>
                </form>
              </>
            )}
            {step === 1 && (
              <>
                <h2>{steps[1]}</h2>
                <div className="verify-email-step">
                  <p>{message || 'Zkontrolujte email a klikněte na ověřovací odkaz.'}</p>
                  <button onClick={handleVerifyEmail}>Pokračovat</button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h2>{steps[2]}</h2>
                <form className="register-form" onSubmit={handlePersonalData}>
                  <input type="text" name="firstName" placeholder="Jméno" value={form.firstName} onChange={handleChange} required />
                  <input type="text" name="lastName" placeholder="Příjmení" value={form.lastName} onChange={handleChange} required />
                  <input type="date" name="birthDate" placeholder="Datum narození" value={form.birthDate} onChange={handleChange} required />
                  <select name="gender" value={form.gender} onChange={handleChange} required>
                    <option value="">Pohlaví</option>
                    <option value="male">Muž</option>
                    <option value="female">Žena</option>
                    <option value="other">Jiné</option>
                  </select>
                  <input type="text" name="address" placeholder="Adresa" value={form.address} onChange={handleChange} required />
                  <input type="text" name="city" placeholder="Město" value={form.city} onChange={handleChange} required />
                  <input type="text" name="zip" placeholder="PSČ" value={form.zip} onChange={handleChange} required />
                  <button type="submit">Dokončit registraci</button>
                </form>
              </>
            )}
            <div className="register-message">{message}</div>
          </div>
        </div>
      </div>
    </>
  );
}

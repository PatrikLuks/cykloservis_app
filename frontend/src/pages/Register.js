
import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';

export default function Register() {
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

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/auth/register', form);
      setMessage('Registrace úspěšná! Zkontrolujte email pro ověření.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Chyba při registraci');
    }
  };

  return (
    <div className="register-container">
      <h2>Registrace</h2>
      <form className="register-form" onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Heslo" value={form.password} onChange={handleChange} required />
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
        <button type="submit">Registrovat se</button>
      </form>
      <div className="register-message">{message}</div>
    </div>
  );
}


import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/auth/login', { email, password });
      setMessage('Přihlášení úspěšné!');
      // Uložit token, redirect atd.
    } catch (err) {
      setMessage(err.response?.data?.message || 'Chyba při přihlášení');
    }
  };

  return (
    <div className="login-container">
      <h2>Přihlášení</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Heslo" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Přihlásit se</button>
      </form>
      <div className="login-message">{message}</div>
    </div>
  );
}

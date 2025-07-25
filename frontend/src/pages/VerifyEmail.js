import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function VerifyEmail() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      axios.get(`http://localhost:5000/auth/verify-email?token=${token}`)
        .then(res => setMessage(res.data.message))
        .catch(err => setMessage(err.response?.data?.message || 'Chyba při ověřování emailu'));
    } else {
      setMessage('Chybí ověřovací token');
    }
  }, []);

  return (
    <div>
      <h2>Ověření emailu</h2>
      <div>{message}</div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    let email = '';
    if (token) {
      try {
        // decode JWT payload to get email
        const payload = JSON.parse(atob(token.split('.')[1]));
        email = payload.email;
      } catch (e) {
        /* noop invalid token decoding */
      }
      axios
        .get(`http://localhost:5001/auth/verify-email?token=${token}`)
        .then((res) => {
          setMessage(res.data.message);
          if (res.data.message === 'Email verified. You can continue registration.') {
            setTimeout(() => {
              navigate(`/register?step=2&email=${encodeURIComponent(email)}`);
            }, 1500);
          }
        })
        .catch((err) => setMessage(err.response?.data?.message || 'Chyba při ověřování emailu'));
    } else {
      setMessage('Chybí ověřovací token');
    }
  }, [navigate]);

  return (
    <div>
      <h2>Ověření emailu</h2>
      <div>{message}</div>
      {message === 'Email verified. You can continue registration.' && (
        <div>Přesměrovávám na další krok…</div>
      )}
    </div>
  );
}

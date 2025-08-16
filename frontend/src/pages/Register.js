
import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

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
      const res = await axios.post('http://localhost:5001/auth/register', form);
      setMessage('Registrace úspěšná! Zkontrolujte email pro ověření.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Chyba při registraci');
    }
  };

  return (
    <div className="register-container">
      <h2>Registrace</h2>
      <form className="register-form" onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="E-mail" value={form.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Heslo" value={form.password} onChange={handleChange} required />
        <input type="text" name="firstName" placeholder="Jméno" value={form.firstName} onChange={handleChange} required />
        <input type="text" name="lastName" placeholder="Příjmení" value={form.lastName} onChange={handleChange} required />
        <DatePicker
          label={null}
          value={form.birthDate ? dayjs(form.birthDate) : null}
          onChange={(newValue) => setForm(f => ({ ...f, birthDate: newValue ? newValue.format('YYYY-MM-DD') : '' }))}
          format="DD. MM. YYYY"
          disableFuture
          slotProps={{
            textField: {
              name: 'birthDate',
              placeholder: 'Datum narození',
              required: true,
              fullWidth: true,
              size: 'medium',
              variant: 'outlined',
              hiddenLabel: true,
              InputProps: { notched: false },
        inputProps: { readOnly: true },
        className: 'register-input',
              sx: {
                fontFamily: 'inherit',
                mb: '4px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: 48,
                  backgroundColor: 'transparent',
                  fontSize: '16px',
          boxShadow: 'none',
          transition: 'all 0.2s linear',
                  '& fieldset': { borderColor: '#b7b4b4', borderWidth: '1.5px' },
                  '&:hover fieldset': { borderColor: '#394ff7' },
                  '&.Mui-focused fieldset': { borderColor: '#394ff7' },
                  '&.Mui-focused': { boxShadow: 'inset 0 0 0 1.5px #394ff7' }
                },
                '& .MuiOutlinedInput-input': { height: '100%', padding: '14px 44px 14px 14px' },
                '& input::placeholder': { color: '#9e9e9e', opacity: 1 },
                '& .MuiOutlinedInput-notchedOutline legend': { display: 'none' },
                '& .MuiIconButton-root': { background: 'transparent !important' },
                '& .MuiSvgIcon-root': { color: '#9e9e9e' }
              }
            }
          }}
        />
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

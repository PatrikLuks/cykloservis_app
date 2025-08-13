import React from 'react';
import './RegisterNavbar.css';
import { useNavigate } from 'react-router-dom';

export default function RegisterNavbar() {
  const navigate = useNavigate();
  return (
    <nav className="register-navbar">
      <button className="navbar-back" onClick={() => navigate(-1)}>
        <img
          src={require('../img/arrow-icon-back.svg').default}
          alt="Zpět"
          style={{ height: 22, width: 22, marginRight: 8, verticalAlign: 'middle' }}
        />
        Zpět
      </button>
      <div className="navbar-logo">
        <img src={require('../img/BIKESERVIS.svg').default} alt="Logo" style={{ height: 36 }} />
      </div>
      <div className="navbar-placeholder" />
    </nav>
  );
}

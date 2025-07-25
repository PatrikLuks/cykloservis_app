import React from 'react';
import './RegisterNavbar.css';
import { useNavigate } from 'react-router-dom';
import logo from '../logo.svg'; // Můžeš nahradit vlastním logem

export default function RegisterNavbar() {
  const navigate = useNavigate();
  return (
    <nav className="register-navbar">
      <button className="navbar-back" onClick={() => navigate(-1)}>&larr; Zpět</button>
      <div className="navbar-logo">
        <img src="https://login.decathlon.net/assets/decathlon-logo-vp-DDH3S1xy.svg" alt="Logo" />
      </div>
      <div className="navbar-placeholder" />
    </nav>
  );
}

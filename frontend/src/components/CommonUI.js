import React from 'react';

export function Spinner() {
  return <span className="spinner-in-btn" aria-label="Načítání"></span>;
}

export function InputErrorMessage({ children, style }) {
  return <div className="input-error-message" style={style}>{children}</div>;
}

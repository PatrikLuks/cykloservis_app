import React from 'react';

// Reusable spinner + message
const spinnerBase = {
  width: 34,
  height: 34,
  border: '4px solid #d9e2ef',
  borderTopColor: '#1479ff',
  borderRadius: '50%',
  animation: 'spin 0.9s linear infinite'
};

const keyframes = `@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`;

const Loader = ({ message = 'Načítám…', inline = false, size = 34 }) => {
  const spinnerStyle = { ...spinnerBase, width: size, height: size };
  if (inline) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <style>{keyframes}</style>
        <span style={spinnerStyle} aria-hidden="true" />
        {message}
      </span>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, fontSize: 14, fontWeight: 500, color: '#2e3e59' }}>
      <style>{keyframes}</style>
      <div style={spinnerStyle} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
};

export default Loader;

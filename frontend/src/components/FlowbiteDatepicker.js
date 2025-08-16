import React from 'react';

// Deprecated: FlowbiteDatepicker was removed. This is a simple native date input fallback.
export default function FlowbiteDatepicker({ id, name, value, onChange, placeholder = 'Datum narození', className = '', ...rest }) {
  return (
    <input
      id={id}
      name={name}
      type="date"
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      {...rest}
    />
  );
}

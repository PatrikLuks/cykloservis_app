import React from 'react';

/**
 * Komponenta pro zadávání ověřovacího kódu (např. 6-místný kód)
 * Props:
 *   code: pole hodnot (např. ['','','','','',''])
 *   setCode: setter pro pole kódu
 *   message: chybová hláška
 *   codeInputs: pole refů pro inputy
 *   onChange: volitelný callback při změně
 *   onKeyDown: volitelný callback při stisku klávesy
 */
export default function CodeInput({ code, setCode, message, codeInputs, onChange, onKeyDown }) {
  return (
    <div className="code-inputs-group">
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
        {code.map((digit, idx) => {
          let inputClass = '';
          let borderColor = '#a39f9f';
          const isCodeError = message === 'Nesprávný ověřovací kód';
          if (isCodeError) {
            inputClass = 'input-error';
            borderColor = '#e53935';
          } else if (digit) {
            inputClass = 'code-input-filled';
            borderColor = '#000';
          }
          return (
            <input
              key={idx}
              ref={codeInputs[idx]}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                const newCode = [...code];
                newCode[idx] = val;
                setCode(newCode);
                if (onChange) onChange(e, idx, val);
                if (val && idx < code.length - 1) codeInputs[idx + 1].current.focus();
              }}
              onKeyDown={e => {
                if (e.key === 'Backspace') {
                  if (code[idx]) {
                    const newCode = [...code];
                    newCode[idx] = '';
                    setCode(newCode);
                    if (onKeyDown) onKeyDown(e, idx);
                  } else if (idx > 0) {
                    codeInputs[idx - 1].current.focus();
                  }
                }
              }}
              className={inputClass}
              style={{
                width: 'fit-content',
                height: 'fit-content',
                fontSize: '1.5rem',
                textAlign: 'center',
                border: `2px solid ${borderColor}`,
                borderRadius: '8px',
                outline: 'none',
                background: '#fff',
              }}
              required
            />
          );
        })}
      </div>
      {message === 'Nesprávný ověřovací kód' && (
        <div className="input-error-message" style={{marginBottom: 12}}>{message}</div>
      )}
    </div>
  );
}

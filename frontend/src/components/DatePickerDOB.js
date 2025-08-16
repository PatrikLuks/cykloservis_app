import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { cs } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import 'react-day-picker/dist/style.css';

/**
 * DatePickerDOB
 * Props:
 * - value: string (YYYY-MM-DD) or ''
 * - onChange: (value: string) => void
 * - minYear?: number (default 1930)
 * - maxYear?: number (default current year)
 */
export default function DatePickerDOB({ value, onChange, minYear = 1930, maxYear = new Date().getFullYear() }) {
  const selectedDate = useMemo(() => {
    if (!value) return undefined;
    try { return parseISO(value); } catch { return undefined; }
  }, [value]);

  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState(selectedDate);
  const ref = useRef(null);
  const [months, setMonths] = useState(1);

  // Responsive: show 2 months on wider screens
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const update = () => setMonths(mq.matches ? 2 : 1);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useEffect(() => { if (open) setTemp(selectedDate); }, [open, selectedDate]);

  const toStr = (d) => (d ? format(d, 'yyyy-MM-dd') : '');
  const label = selectedDate ? format(selectedDate, 'd. M. yyyy') : '';

  const fromDate = useMemo(() => new Date(minYear, 0, 1), [minYear]);
  const toDate = useMemo(() => new Date(maxYear, 11, 31), [maxYear]);

  return (
    <div className="dob-picker" ref={ref}>
      <div className="dob-input-row">
        <div className={`dob-input ${open ? 'open' : ''}`} role="button" tabIndex={0}
             onClick={() => setOpen(o => !o)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o); }}>
          <input
            type="text"
            readOnly
            placeholder="Datum narození"
            value={label}
            aria-label="Datum narození"
          />
          <span className="calendar-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="5" width="14" height="12" rx="2" stroke="#888" strokeWidth="1.5"/>
              <path d="M7 2V5M13 2V5" stroke="#888" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="7" y="9" width="2" height="2" rx="1" fill="#888"/>
            </svg>
          </span>
        </div>
        <button type="button" className="today-chip" onClick={() => { const d = new Date(); setTemp(d); onChange(toStr(d)); }}>Dnes</button>
      </div>
      {open && (
        <div className="dob-popover" role="dialog" aria-label="Výběr data narození">
          <div className="dob-panel">
            <div className="dob-sidebar" aria-hidden="false">
              {[
                { k: 'today', label: 'Dnes', action: () => setTemp(new Date()) },
                { k: 'yesterday', label: 'Včera', action: () => setTemp(new Date(Date.now() - 86400000)) },
                { k: 'thisweek', label: 'Tento týden', action: () => setTemp(new Date()) },
                { k: 'lastweek', label: 'Minulý týden', action: () => setTemp(new Date(Date.now() - 7*86400000)) },
                { k: 'thismonth', label: 'Tento měsíc', action: () => setTemp(new Date()) },
                { k: 'lastmonth', label: 'Minulý měsíc', action: () => { const d = new Date(); d.setMonth(d.getMonth()-1); setTemp(d); } },
                { k: 'custom', label: 'Vlastní', action: () => {} },
              ].map((p) => (
                <button key={p.k} type="button" className="preset" onClick={p.action}>{p.label}</button>
              ))}
            </div>
            <div className="dob-cal">
              <DayPicker
                mode="single"
                selected={temp}
                onSelect={setTemp}
                locale={cs}
                fromDate={fromDate}
                toDate={toDate}
                captionLayout="dropdown-buttons"
                fromYear={minYear}
                toYear={maxYear}
                weekStartsOn={1}
                showOutsideDays
                numberOfMonths={months}
              />
            </div>
          </div>
          <div className="dob-footer">
            <div style={{ flex: 1 }} />
            <button type="button" className="btn-secondary" onClick={() => { setOpen(false); setTemp(selectedDate); }}>Zrušit</button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => { onChange(toStr(temp)); setOpen(false); }}
              disabled={!temp}
            >Potvrdit</button>
          </div>
        </div>
      )}
    </div>
  );
}
// removed during revert to native date input

import React from 'react';

export default function InfoCard({ icon, title, value, color = '#394ff7', background = '#fff' }) {
  return (
    <div className="dashboard-info-card" style={{ background, borderRadius: 16, boxShadow: '0 4px 16px #0001', padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
      <span className="dashboard-info-card-icon" style={{ fontSize: 36, color, flexShrink: 0 }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 700, fontSize: 22, color }}>{title}</span>
        <span style={{ fontWeight: 500, fontSize: 18, color: '#222', marginTop: 4 }}>{value}</span>
      </div>
    </div>
  );
}

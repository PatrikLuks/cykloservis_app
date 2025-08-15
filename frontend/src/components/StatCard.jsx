import React from 'react';
import '../App.css';

export default function StatCard({ title, value, subtitle, icon, iconBg='#fff', loading=false }) {
  return (
    <div className={"statcard-root" + (loading ? ' loading' : '')}>
      <div className="statcard-text">
        <div className="statcard-title">{title}</div>
        <div className="statcard-value">{loading ? <span className="stat-skel" /> : value}</div>
        {subtitle && <div className="statcard-sub">{loading ? <span className="stat-skel short" /> : subtitle}</div>}
      </div>
      {icon && <div className="statcard-icon" style={{ background: iconBg }}>{icon}</div>}
    </div>
  );
}

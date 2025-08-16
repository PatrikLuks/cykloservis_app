import React, { useEffect, useState } from 'react';
import { getServiceTypes, upgradeToMechanic, getMyMechanicProfile, updateMyMechanicProfile, addMySlot, removeMySlot, uploadMechanicAvatar } from '../../utils/mechanicSelfApi';
import dayjs from 'dayjs';
import '../mechanic.css';
import api from '../../utils/apiClient';

export default function MechanicPanel() {
  const [loading, setLoading] = useState(true);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newSlot, setNewSlot] = useState('');

  async function loadAll() {
    setLoading(true); setError(null);
    try {
      const [types] = await Promise.all([
        getServiceTypes().catch(()=>[])
      ]);
      setServiceTypes(types);
      try { const p = await getMyMechanicProfile(); setProfile(p); } catch(e) { /* no profile yet */ }
    } catch (e) { setError('Chyba načtení'); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ loadAll(); }, []);
  // Normalize avatar URL if relative whenever profile changes
  useEffect(()=>{
    if (profile && profile.avatarUrl && profile.avatarUrl.startsWith('/uploads/')) {
      const base = api.defaults.baseURL?.replace(/\/$/, '') || '';
      setProfile(p => ({ ...p, avatarUrl: base + p.avatarUrl }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.avatarUrl]);

  async function ensureUpgrade() {
    try { await upgradeToMechanic(); await loadAll(); } catch(e) { setError('Nelze aktivovat'); }
  }

  function toggleSkill(skill) {
    if (!profile) return;
    const exists = profile.skills.includes(skill);
    const next = exists ? profile.skills.filter(s=>s!==skill) : [...profile.skills, skill];
    setProfile({ ...profile, skills: next });
  }

  async function saveProfile(patch) {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await updateMyMechanicProfile({
        skills: profile.skills,
        note: profile.note || '',
        active: profile.active,
        availableSlots: profile.availableSlots,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        phoneCountryCode: profile.phoneCountryCode,
        address: profile.address,
        avatarUrl: profile.avatarUrl,
        ...patch
      });
      // API now returns { profile, user }
      setProfile({ ...updated.profile, ...mapUserToProfileFields(updated.user) });
    } catch(e) { setError('Uložení selhalo'); }
    finally { setSaving(false); }
  }

  function mapUserToProfileFields(user){
    if(!user) return {}; return {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phoneNumber: user.phoneNumber || '',
      phoneCountryCode: user.phoneCountryCode || '',
      address: user.address || ''
    };
  }

  async function handleAvatarChange(e){
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    setSaving(true); setError(null);
    try {
      const url = await uploadMechanicAvatar(file);
  // Ensure absolute URL for dev (CRA runs on different port)
  const base = api.defaults.baseURL?.replace(/\/$/, '') || '';
  const abs = url.startsWith('http') ? url : (base + url);
  setProfile(p => ({ ...p, avatarUrl: abs }));
    } catch (err) {
      setError(err.message || 'Upload fotky selhal');
    } finally { setSaving(false); }
  }

  async function addSlot() {
    if (!newSlot) return;
    try {
      const updated = await addMySlot(newSlot);
      setProfile(updated);
      setNewSlot('');
    } catch(e) { setError('Nelze přidat slot'); }
  }

  if (loading) return <div className="ds-card" style={{ padding:20 }}>Načítám…</div>;

  if (!profile) {
    return (
      <div className="ds-card" style={{ display:'grid', gap:16 }}>
        <h2>Mechanik – aktivace</h2>
        <p className="muted">Ještě nemáš aktivovaný mechanický profil. Aktivací umožníš uživatelům tě vybírat při vytváření objednávky.</p>
        <button className="btn-cta" onClick={ensureUpgrade}>Aktivovat profil</button>
        {error && <div style={{ color:'#dc2626' }}>{error}</div>}
      </div>
    );
  }

  return (
    <div className="mech-shell" style={{ display:'grid', gap:34 }}>
      <div className="mech-profile-card">
        <h2 style={{ margin:0, fontSize:32 }}>Můj mechanický profil</h2>
        <div className="mech-profile-header">
          <div className="mech-avatar-box">
            <div className="mech-avatar-frame">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="avatar" /> : <span>Bez fotky</span>}
            </div>
            <label className="mech-label" style={{ marginTop:4 }}>Fotka</label>
            <input id="mech-avatar-input" type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange} />
            <button type="button" className="mech-upload-btn" onClick={()=>document.getElementById('mech-avatar-input').click()} disabled={saving}>{saving? 'Ukládám…':'Nahrát'}</button>
          </div>
          <div className="mech-fields-col">
            <div className="mech-row-2">
              <div className="mech-field" style={{ flex:1 }}>
                <label>Jméno</label>
                <input className="mech-input" value={profile.firstName||''} onChange={e=>setProfile(p=>({...p, firstName:e.target.value}))} />
              </div>
              <div className="mech-field" style={{ flex:1 }}>
                <label>Příjmení</label>
                <input className="mech-input" value={profile.lastName||''} onChange={e=>setProfile(p=>({...p, lastName:e.target.value}))} />
              </div>
            </div>
            <div className="mech-row-2">
              <div className="mech-field" style={{ width:110 }}>
                <label>Kód</label>
                <input className="mech-input" value={profile.phoneCountryCode||''} onChange={e=>setProfile(p=>({...p, phoneCountryCode:e.target.value}))} />
              </div>
              <div className="mech-field" style={{ flex:1 }}>
                <label>Telefon</label>
                <input className="mech-input" value={profile.phoneNumber||''} onChange={e=>setProfile(p=>({...p, phoneNumber:e.target.value}))} />
              </div>
            </div>
            <div className="mech-field">
              <label>Adresa</label>
              <input className="mech-input" value={profile.address||''} onChange={e=>setProfile(p=>({...p, address:e.target.value}))} />
            </div>
          </div>
        </div>
        <div className="mech-skills">
          {serviceTypes.map(st => {
            const active = profile.skills.includes(st);
            return (
              <button key={st} type="button" onClick={()=>toggleSkill(st)} className={"mech-skill" + (active? ' active':'')}>
                {st}
              </button>
            );
          })}
        </div>
        <div className="mech-note">
          <label>Poznámka</label>
          <textarea className="mech-textarea" value={profile.note || ''} onChange={e=>setProfile({ ...profile, note: e.target.value })} rows={3} />
        </div>
        <div className="mech-switch-row">
            <label className="mech-label" style={{ fontSize:14 }}>Aktivní pro uživatele</label>
            <input type="checkbox" checked={!!profile.active} onChange={e=> setProfile({ ...profile, active: e.target.checked })} />
        </div>
        {error && <div className="mech-error" role="alert">{error}</div>}
        <div className="mech-save-bar">
          <button disabled={saving} className="mech-save-btn" onClick={()=>saveProfile()}>
            {saving ? 'Ukládám…' : 'Uložit'}
            <span style={{ background:'#fff', color:'#394ff7', width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>✔</span>
          </button>
        </div>
      </div>
      <div className="ds-card" style={{ display:'grid', gap:18, padding:28 }}>
        <h3>Dostupné sloty</h3>
        <div style={{ display:'flex', gap:8 }}>
          <input type="datetime-local" value={newSlot} onChange={e=>setNewSlot(e.target.value)} className="ds-input" style={{ flex:1 }} />
          <button className="btn-primary" style={{ width:'auto' }} onClick={addSlot}>Přidat</button>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {(profile.availableSlots || []).sort((a,b)=> new Date(a)-new Date(b)).map(s => (
            <div key={s} style={{ fontSize:12, background:'#eef2ff', border:'1px solid #c7d2fe', padding:'6px 10px', borderRadius:6, display:'flex', alignItems:'center', gap:6 }}>
              <span>{dayjs(s).format('DD.MM. HH:mm')}</span>
              <button onClick={async ()=>{
                try { const updated = await removeMySlot(s); setProfile(updated); } catch(e) { setError('Nelze odebrat slot'); }
              }} style={{ background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontSize:14, lineHeight:1 }}>×</button>
            </div>
          ))}
          {(!profile.availableSlots || profile.availableSlots.length===0) && <div className="muted" style={{ fontSize:12 }}>Žádné sloty</div>}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/apiClient';
import addIcon from '../img/icons/Profile/add.svg';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // fatální chyba načtení
  const [avatarError, setAvatarError] = useState(''); // lokální chyba uploadu / odstranění
  const [user, setUser] = useState({ firstName: '', lastName: '', fullName: '', email: '', birthDate: null, gender: '', location: '', phoneCountryCode: '', phoneNumber: '', avatarUrl:'', createdAt: null, registeredAt: null });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const countryCodes = useMemo(() => ([
    { code: '+420', label: '🇨🇿 +420' },
    { code: '+421', label: '🇸🇰 +421' },
    { code: '+48', label: '🇵🇱 +48' },
    { code: '+49', label: '🇩🇪 +49' },
    { code: '+43', label: '🇦🇹 +43' },
    { code: '+36', label: '🇭🇺 +36' },
    { code: '+44', label: '🇬🇧 +44' },
    { code: '+1', label: '🇺🇸 +1' },
  ]), []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/auth/me');
        const toAbs = (u) => {
          if (!u) return '';
            return /^https?:/i.test(u) ? u : (api.defaults.baseURL?.replace(/\/$/, '') || '') + u;
        };
        setUser({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          fullName: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          email: data.email || '',
          birthDate: data.birthDate || null,
          gender: data.gender || '',
          location: data.location || '',
          avatarUrl: toAbs(data.avatarUrl || ''),
          phoneCountryCode: data.phoneCountryCode || '+420',
          phoneNumber: data.phoneNumber || '',
          createdAt: data.createdAt || data.registeredAt || null,
          registeredAt: data.registeredAt || data.createdAt || null
        });
        setLoading(false);
      } catch (e) {
        // Fallback to JWT decode if API fails
        try {
          const payload = JSON.parse(atob((localStorage.getItem('token') || '').split('.')[1] || 'e30='));
          const toAbs = (u) => {
            if (!u) return '';
            return /^https?:/i.test(u) ? u : (api.defaults.baseURL?.replace(/\/$/, '') || '') + u;
          };
          setUser({
            firstName: payload.firstName || '',
            lastName: payload.lastName || '',
            fullName: payload.name || payload.fullName || `${payload.firstName || ''} ${payload.lastName || ''}`.trim(),
            email: payload.email || '',
            birthDate: payload.birthDate || null,
            gender: payload.gender || '',
            location: payload.location || '',
            avatarUrl: toAbs(payload.avatarUrl || ''),
            phoneCountryCode: payload.phoneCountryCode || '+420',
            phoneNumber: payload.phoneNumber || '',
            createdAt: payload.createdAt || payload.registeredAt || null,
            registeredAt: payload.registeredAt || payload.createdAt || null
          });
          setLoading(false);
        } catch (err) {
          setError('Nepodařilo se načíst uživatelský profil.');
          setLoading(false);
        }
      }
    };
    fetchUser();
  }, []);

  const onSavePhone = async () => {
    setSaving(true);
    try {
      const payload = {
        phoneCountryCode: user.phoneCountryCode || '',
        phoneNumber: user.phoneNumber || ''
      };
      const { data } = await api.patch('/auth/me', payload);
      setUser(u => ({ ...u, phoneCountryCode: data.phoneCountryCode || '', phoneNumber: data.phoneNumber || '' }));
    } catch (e) {
      setError('Uložení telefonního čísla se nezdařilo.');
    } finally {
      setSaving(false);
    }
  };

  const phoneValid = !!(user.phoneCountryCode && /^\d{4,15}$/.test(user.phoneNumber || ''));

  const displayGender = useMemo(() => {
    const raw = (user.gender || '').toString().trim().toLowerCase();
    if (!raw) return '—';
    const normalized = raw.replace('ž', 'z');
    if (['male','m','muz','man'].includes(normalized)) return 'Muž';
    if (['female','f','zena','woman'].includes(normalized)) return 'Žena';
    // If already Czech labels typed by user
    if (raw === 'muž') return 'Muž';
    if (raw === 'žena') return 'Žena';
    return user.gender;
  }, [user.gender]);
  if (loading) {
    return (
          <div className="ds-card" style={{ padding: 20 }}>Načítám profil…</div>
    );
  }

  if (error) {
    return (
      <div className="ds-card" style={{ padding: 20, color: '#b42318', background: '#fef3f2', border: '1px solid #fee4e2' }}>{error}</div>
    );
  }

  const initial = (user.fullName || user.email || 'U').trim().charAt(0).toUpperCase();

  async function handleAvatarSelect(e){
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    setUploading(true); setAvatarError('');
    try {
      const form = new FormData(); form.append('avatar', file);
      const { data } = await api.post('/auth/me/avatar', form, { headers:{ 'Content-Type':'multipart/form-data' } });
      const base = api.defaults.baseURL?.replace(/\/$/, '') || '';
      const abs = data.avatarUrl.startsWith('http') ? data.avatarUrl : base + data.avatarUrl;
      setUser(u => ({ ...u, avatarUrl: abs }));
      try {
        const cacheRaw = localStorage.getItem('userProfileCache');
        const cache = cacheRaw ? JSON.parse(cacheRaw) : {};
        cache.avatarUrl = data.avatarUrl;
        localStorage.setItem('userProfileCache', JSON.stringify(cache));
      } catch {}
      // Okamžitá aktualizace navbaru
      try { window.dispatchEvent(new CustomEvent('userAvatarUpdated', { detail: abs })); } catch {}
      setAvatarMenuOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Nahrání fotky selhalo.';
      setAvatarError(msg);
  // Zůstaň / znovu otevři popup pro zobrazení chyby
  setAvatarMenuOpen(true);
    } finally { setUploading(false); }
  }

  async function handleAvatarRemove(){
    setUploading(true); setAvatarError('');
    try {
      const { data } = await api.delete('/auth/me/avatar');
      setUser(u => ({ ...u, avatarUrl: data.avatarUrl || '' }));
      try {
        const cacheRaw = localStorage.getItem('userProfileCache');
        const cache = cacheRaw ? JSON.parse(cacheRaw) : {};
        cache.avatarUrl = '';
        localStorage.setItem('userProfileCache', JSON.stringify(cache));
      } catch {}
      try { window.dispatchEvent(new CustomEvent('userAvatarUpdated', { detail: '' })); } catch {}
    } catch (err) {
  setAvatarError(err?.response?.data?.error || 'Odebrání avataru selhalo.');
    } finally {
      setUploading(false); setAvatarMenuOpen(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Unified header block styled like dashboard user chip */}
      <div className="ds-card" style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:28, padding:'22px 28px' }}>
        <div className="topbar-profile" style={{ background:'transparent', boxShadow:'none', border:'none', padding:0, gap:14 }}>
          <div style={{ position:'relative', width:72, height:72 }}>
          <input id="user-avatar-input" type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarSelect} />
          <button type="button" onClick={()=>{ setAvatarError(''); setAvatarMenuOpen(true); }} style={{
            width:'100%', height:'100%', background:'#eff2ff', border:'1px solid #eff2ff', borderRadius:20, cursor:'pointer', padding:0, position:'relative', display:'flex', alignItems:'center', justifyContent:'center', overflow:'visible'
          }} aria-label="Akce avatar">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={(ev)=>{ ev.currentTarget.style.display='none'; }} />
            ) : (
              <span style={{ fontSize:30, fontWeight:800, color:'var(--ds-primary, #394ff7)' }}>{initial}</span>
            )}
            <span style={{ position:'absolute', right:-4, bottom:-4, width:28, height:28, borderRadius:'50%', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px -2px rgba(0,0,0,0.45)' }}>
              <img src={addIcon} alt="Přidat" style={{ width:18, height:18, display:'block' }} />
            </span>
            {uploading && <span style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', color:'#fff', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:600 }}>...</span>}
          </button>
          {avatarMenuOpen && (
            <div role="dialog" aria-modal="true" style={{ position:'absolute', top:'100%', left:'50%', transform:'translate(-50%,8px)', background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, boxShadow:'0 8px 24px -4px rgba(16,24,40,0.25)', padding:12, width:200, zIndex:40, display:'grid', gap:8 }}>
              <div style={{ fontSize:12, fontWeight:700, letterSpacing:.5, textTransform:'uppercase', color:'#475467' }}>Avatar</div>
              <button
                onClick={()=>{ document.getElementById('user-avatar-input').click(); }}
                style={{ width:'100%', fontSize:14, padding:'10px 14px', background:'var(--ds-primary, #394ff7)', color:'#fff', border:'none', borderRadius:12, fontWeight:600, cursor:'pointer' }}
              >
                Nahrát
              </button>
              {user.avatarUrl && (
                <button
                  onClick={handleAvatarRemove}
                  style={{
                    width:'100%',
                    fontSize:14,
                    padding:'10px 14px',
                    background:'#b42318',
                    color:'#fff',
                    border:'none',
                    borderRadius:12,
                    fontWeight:600,
                    cursor:'pointer'
                  }}
                >Odebrat</button>
              )}
              <button onClick={()=>{ setAvatarMenuOpen(false); setAvatarError(''); }} style={{ width:'100%', fontSize:13, padding:'6px 8px', background:'transparent', border:'none', color:'#475467', cursor:'pointer' }}>Zavřít</button>
              {avatarError && <div style={{ fontSize:11, color:'#b42318', lineHeight:1.3 }}>{avatarError}</div>}
            </div>
          )}
          </div>
          <div className="topbar-profile-text" style={{ lineHeight:1.2 }}>
            <div className="topbar-name" style={{ fontSize:20 }}>{user.fullName || 'Uživatel'}</div>
            <div className="topbar-email" style={{ fontSize:13 }}>{user.email || '—'}</div>
            {(user.location || user.registeredAt) && (
              <div style={{ fontSize:12, color:'#64748b', display:'flex', gap:12, flexWrap:'wrap', marginTop:6 }}>
                {user.location && <span>{user.location}</span>}
                {user.registeredAt && (
                  <span style={{ color:'#667085' }}>Členem od {new Date(user.registeredAt).toLocaleDateString('cs-CZ')}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ds-card" style={{ display: 'grid', gap: 14, padding: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Základní informace</div>
        <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', gap:10 }}>
          <div className="muted" style={{ fontWeight: 600 }}>Jméno</div>
          <div style={{ fontWeight: 600 }}>{user.firstName || '—'}</div>
          <div className="muted" style={{ fontWeight: 600 }}>Příjmení</div>
          <div style={{ fontWeight: 600 }}>{user.lastName || '—'}</div>
          <div className="muted" style={{ fontWeight: 600 }}>Email</div>
          <div style={{ fontWeight: 600 }}>{user.email || '—'}</div>
          <div className="muted" style={{ fontWeight: 600 }}>Datum narození</div>
          <div style={{ fontWeight: 600 }}>{user.birthDate ? new Date(user.birthDate).toLocaleDateString('cs-CZ') : '—'}</div>
          <div className="muted" style={{ fontWeight: 600 }}>Pohlaví</div>
          <div style={{ fontWeight: 600 }}>{displayGender}</div>
          <div className="muted" style={{ fontWeight: 600 }}>Lokalita</div>
          <div style={{ fontWeight: 600 }}>{user.location || '—'}</div>
        </div>
      </div>

      <div className="ds-card" style={{ display: 'grid', gap: 14, padding: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Telefonní kontakt</div>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 10, alignItems: 'center' }}>
          <div className="muted" style={{ fontWeight: 600 }}>Telefon</div>
          <div style={{ display:'flex', gap:10, alignItems:'center', background:'#f9fafb', border:'1px solid #eef2f7', borderRadius:12, padding:'8px 10px' }}>
            <select
              className="ds-select"
              style={{ minWidth: 120 }}
              value={user.phoneCountryCode || ''}
              onChange={(e) => setUser(u => ({ ...u, phoneCountryCode: e.target.value }))}
              aria-label="Předvolba telefonu"
            >
              <option value="">— vyberte —</option>
              {countryCodes.map(cc => (
                <option key={cc.code} value={cc.code}>{cc.label}</option>
              ))}
            </select>
            <input
              className="ds-input"
              style={{ flex: 1 }}
              inputMode="numeric"
              pattern="\\d*"
              value={user.phoneNumber || ''}
              onChange={(e) => {
                const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                setUser(u => ({ ...u, phoneNumber: onlyNums }));
              }}
              placeholder="Zadejte číslo bez mezer"
              aria-label="Telefonní číslo"
            />
          </div>
          <div />
          <div className="muted" style={{ fontSize: 12 }}>
            Náhled: {user.phoneCountryCode || ''} {String(user.phoneNumber || '').replace(/(\d{3})(?=\d)/g,'$1 ').trim()}
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop: 10 }}>
          <button className="btn-primary" style={{ width: 'auto', minWidth: 180 }} onClick={onSavePhone} disabled={saving || !phoneValid}>
            {saving ? 'Ukládám…' : 'Uložit telefon'}
          </button>
        </div>
      </div>
    </div>
  );
}

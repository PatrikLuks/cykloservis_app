// Simple in-memory + localStorage backed user profile store to avoid refetch flashes
// and keep name consistent during rapid route changes.

const listeners = new Set();
let profile = null; // {displayName, email, ...}
let lastFetch = 0;
const TTL_MS = 60_000; // 1 min cache
let inflight = null;

function readCacheLS() {
  try {
    const raw = localStorage.getItem('userProfileCache');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function getProfileSync() {
  if (profile) return profile;
  profile = readCacheLS();
  if (!profile) {
    // Try decode token
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1] || 'e30='));
        const full = payload.displayName || payload.fullName || `${payload.firstName || ''} ${payload.lastName || ''}`.trim();
        profile = {
          displayName: full || 'Uživatel',
          email: payload.email || 'user@example.com',
          avatarUrl: payload.avatarUrl || ''
        };
      }
    } catch {}
  }
  return profile;
}

export async function ensureProfile(api) {
  const now = Date.now();
  if (profile && (now - lastFetch) < TTL_MS) return profile;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data } = await api.get('/auth/me');
      profile = data;
      lastFetch = Date.now();
      try { localStorage.setItem('userProfileCache', JSON.stringify(data)); } catch {}
      listeners.forEach(fn => { try { fn(profile); } catch {} });
      return profile;
    } catch (e) {
      // Leave current profile; do not blast listeners to avoid overwriting with placeholder
      return profile || getProfileSync();
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function updateProfile(p) {
  profile = { ...(profile||{}), ...p };
  try { localStorage.setItem('userProfileCache', JSON.stringify(profile)); } catch {}
  listeners.forEach(fn => { try { fn(profile); } catch {} });
}

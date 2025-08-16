import api from './apiClient';

export async function getServiceTypes() {
  const { data } = await api.get('/mechanics/service-types/list');
  return data.types || [];
}

export async function upgradeToMechanic() {
  const { data } = await api.post('/mechanics/self/upgrade');
  return data;
}

export async function getMyMechanicProfile() {
  const { data } = await api.get('/mechanics/self');
  return data;
}

export async function updateMyMechanicProfile(payload) {
  const { data } = await api.put('/mechanics/self', payload);
  return data;
}

export async function uploadMechanicAvatar(file) {
  const form = new FormData();
  form.append('avatar', file);
  try {
    const { data } = await api.post('/mechanics/self/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.avatarUrl;
  } catch (e) {
    const msg = e?.response?.data?.error;
    if (msg) {
      if (msg.includes('příliš velký')) throw new Error('Soubor je moc velký (max 1.5 MB).');
      if (msg.includes('Nepodporovaný')) throw new Error('Nepodporovaný formát. Použij JPG, PNG nebo WebP.');
    }
    throw new Error('Nahrání fotky selhalo.');
  }
}

export async function addMySlot(slotIso) {
  const { data } = await api.post('/mechanics/self/slots', { slot: slotIso });
  return data;
}

export async function removeMySlot(slotIso) {
  const { data } = await api.delete('/mechanics/self/slots', { data: { slot: slotIso } });
  return data;
}

export async function listMyAssignedRequests() {
  const { data } = await api.get('/mechanics/self/requests');
  return data.requests || [];
}

export async function updateMyRequestStatus(id, status) {
  const { data } = await api.put(`/mechanics/self/requests/${id}/status`, { status });
  return data;
}

export async function listMyClients() {
  const { data } = await api.get('/mechanics/self/clients');
  return data.clients || [];
}

export async function getMyRequestDetail(id) {
  const { data } = await api.get(`/mechanics/self/requests/${id}`);
  return data;
}

export async function getMechanicStats() {
  const { data } = await api.get('/mechanics/self/stats');
  return data;
}

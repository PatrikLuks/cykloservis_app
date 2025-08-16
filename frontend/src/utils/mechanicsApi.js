import api from './apiClient';

export async function listMechanics(skills) {
  const params = skills && skills.length ? { skills: skills.join(',') } : {};
  const { data } = await api.get('/mechanics', { params });
  return data;
}

export async function getMechanicAvailability(id) {
  const { data } = await api.get(`/mechanics/${id}/availability`);
  return data;
}

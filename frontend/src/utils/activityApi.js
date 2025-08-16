import api from './apiClient';

export async function fetchRecentActivity(limit = 5) {
  const { data } = await api.get(`/activity?limit=${limit}`);
  return data;
}

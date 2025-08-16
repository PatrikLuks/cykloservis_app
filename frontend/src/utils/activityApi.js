import api from './apiClient';

export async function fetchRecentActivity() {
  const { data } = await api.get('/activity');
  return data;
}

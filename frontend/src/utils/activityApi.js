import api from './apiClient';

export async function fetchRecentActivity(limit = 5, page){
  const params = [`limit=${limit}`];
  if (page) params.push(`page=${page}`);
  const { data } = await api.get(`/activity?${params.join('&')}`);
  return data;
}

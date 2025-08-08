import api from './apiClient';

export async function listServiceRequests() {
  const { data } = await api.get('/service-requests');
  return data;
}

export async function createServiceRequest(payload) {
  const { data } = await api.post('/service-requests', payload);
  return data;
}

export async function updateServiceRequestStatus(id, status) {
  const { data } = await api.put(`/service-requests/${id}/status`, { status });
  return data;
}

export async function deleteServiceRequest(id) {
  const { data } = await api.delete(`/service-requests/${id}`);
  return data;
}

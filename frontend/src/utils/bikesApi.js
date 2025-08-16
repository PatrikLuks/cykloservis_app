import api from './apiClient';

// Základní skeleton pro budoucí CRUD kol
export async function listBikes({ page, limit } = {}) {
	const params = [];
	if (limit) params.push(`limit=${limit}`);
	if (page) params.push(`page=${page}`);
	const qs = params.length ? `?${params.join('&')}` : '';
	const { data } = await api.get(`/bikes${qs}`);
	return data;
}

export async function createBike(payload) {
	const { data } = await api.post('/bikes', payload);
	return data;
}

export async function getBike(id) {
	const { data } = await api.get(`/bikes/${id}`);
	return data;
}

export async function updateBike(id, payload) {
	const { data } = await api.put(`/bikes/${id}`, payload);
	return data;
}

export async function deleteBike(id) {
	const { data } = await api.delete(`/bikes/${id}`);
	return data;
}

export async function listDeletedBikes() {
	const { data } = await api.get('/bikes/deleted');
	return data;
}

export async function restoreBike(id) {
	const { data } = await api.post(`/bikes/${id}/restore`);
	return data;
}

export async function hardDeleteBike(id) {
	const { data } = await api.delete(`/bikes/${id}/hard`);
	return data;
}

export async function uploadBikeImage(id, file) {
	const form = new FormData();
	form.append('image', file);
	const { data } = await api.post(`/bikes/${id}/image`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
	return data;
}

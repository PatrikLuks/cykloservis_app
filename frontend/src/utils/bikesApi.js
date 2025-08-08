import api from './apiClient';

// Základní skeleton pro budoucí CRUD kol
export async function listBikes() {
	const { data } = await api.get('/bikes');
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

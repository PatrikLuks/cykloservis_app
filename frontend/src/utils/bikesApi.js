// Refaktor: přechod na typovaný klient. Zachováváme původní názvy funkcí.
import {
	apiListBikes,
	apiCreateBike,
	apiGetBike,
	apiUpdateBike,
	apiSoftDeleteBike,
	apiListDeletedBikes,
	apiRestoreBike,
	apiHardDeleteBike,
	apiUploadBikeImage
} from '../api/client';

export async function listBikes() {
	return apiListBikes();
}
export async function createBike(payload) {
	return apiCreateBike(payload);
}
export async function getBike(id) {
	return apiGetBike(id);
}
export async function updateBike(id, payload) {
	return apiUpdateBike(id, payload);
}
export async function deleteBike(id) {
	return apiSoftDeleteBike(id);
}
export async function listDeletedBikes() {
	return apiListDeletedBikes();
}
export async function restoreBike(id) {
	return apiRestoreBike(id);
}
export async function hardDeleteBike(id) {
	return apiHardDeleteBike(id);
}
export async function uploadBikeImage(id, file) {
	return apiUploadBikeImage(id, file);
}

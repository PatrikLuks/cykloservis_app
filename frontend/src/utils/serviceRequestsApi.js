import {
  apiListServiceRequests,
  apiCreateServiceRequest,
  apiUpdateServiceRequestStatus,
  apiDeleteServiceRequest
} from '../api/client';

export async function listServiceRequests() {
  return apiListServiceRequests();
}
export async function createServiceRequest(payload) {
  return apiCreateServiceRequest(payload);
}
export async function updateServiceRequestStatus(id, status) {
  return apiUpdateServiceRequestStatus(id, status);
}
export async function deleteServiceRequest(id) {
  return apiDeleteServiceRequest(id);
}

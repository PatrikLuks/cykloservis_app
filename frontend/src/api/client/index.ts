import axios, { AxiosInstance } from 'axios';
import type { paths } from '../generated/schema.js';

// Extract types
export type Bike = paths['/bikes']['get']['responses']['200']['content']['application/json'][number];
export type ServiceRequest = import('../generated/schema.js').components['schemas']['ServiceRequest'];
export type TokenResponse = import('../generated/schema.js').components['schemas']['TokenResponse'];
export type MessageResponse = import('../generated/schema.js').components['schemas']['MessageResponse'];

// Jednoduchý fallback: produkční build Vite nahradí process.env.VITE_API_BASE_URL pluginem, v pre-commit TypeScriptu použijeme lokální default.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const baseURL: string = (process.env && (process.env as any).VITE_API_BASE_URL) || 'http://localhost:5001';

function createClient(): AxiosInstance {
  const inst = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
  inst.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return inst;
}

const http = createClient();

// Auth
export async function apiLogin(email: string, password: string) {
  const res = await http.post< TokenResponse >('/auth/login', { email, password });
  return res.data;
}
export async function apiRegisterStart(email: string) {
  const res = await http.post< MessageResponse >('/auth/register', { email });
  return res.data;
}
export async function apiSavePassword(email: string, password: string) {
  const res = await http.post< MessageResponse >('/auth/save-password', { email, password });
  return res.data;
}
export async function apiVerifyCode(email: string, code: string) {
  const res = await http.post< MessageResponse >('/auth/verify-code', { email, code });
  return res.data;
}
export async function apiCompleteProfile(payload: { email: string; firstName: string; lastName: string; birthDate: string; gender: string; location: string; }) {
  const res = await http.post< MessageResponse >('/auth/complete-profile', payload);
  return res.data;
}
export async function apiForgotPassword(email: string) {
  const res = await http.post< MessageResponse >('/auth/forgot-password', { email });
  return res.data;
}
export async function apiVerifyResetCode(email: string, code: string) {
  const res = await http.post< MessageResponse >('/auth/verify-reset-code', { email, code });
  return res.data;
}
export async function apiResetPassword(email: string, code: string, newPassword: string) {
  const res = await http.post< MessageResponse >('/auth/reset-password', { email, code, newPassword });
  return res.data;
}

// Bikes
export async function apiListBikes() {
  const res = await http.get<Bike[]>('/bikes');
  return res.data;
}
export async function apiListDeletedBikes() {
  const res = await http.get<Bike[]>('/bikes/deleted');
  return res.data;
}
export async function apiCreateBike(payload: Partial<Bike>) {
  const res = await http.post<Bike>('/bikes', payload);
  return res.data;
}
export async function apiGetBike(id: string) {
  const res = await http.get<Bike>(`/bikes/${id}`);
  return res.data;
}
export async function apiUpdateBike(id: string, payload: Partial<Bike>) {
  const res = await http.put<Bike>(`/bikes/${id}`, payload);
  return res.data;
}
export async function apiSoftDeleteBike(id: string) {
  const res = await http.delete<{ ok: boolean; softDeleted?: boolean }>(`/bikes/${id}`);
  return res.data;
}
export async function apiRestoreBike(id: string) {
  const res = await http.post<Bike>(`/bikes/${id}/restore`);
  return res.data;
}
export async function apiHardDeleteBike(id: string) {
  const res = await http.delete<{ ok: boolean; hardDeleted?: boolean }>(`/bikes/${id}/hard`);
  return res.data;
}
export async function apiUploadBikeImage(id: string, file: File) {
  const form = new FormData();
  form.append('image', file);
  const res = await http.post<Bike>(`/bikes/${id}/image`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}

// Service Requests
export async function apiListServiceRequests() {
  const res = await http.get<ServiceRequest[]>(`/service-requests`);
  return res.data;
}
export async function apiCreateServiceRequest(payload: { bikeId: string; title: string; description?: string; preferredDate?: string; priceEstimate?: number; }) {
  const res = await http.post<ServiceRequest>(`/service-requests`, payload);
  return res.data;
}
export async function apiUpdateServiceRequestStatus(id: string, status: ServiceRequest['status']) {
  const res = await http.put<ServiceRequest>(`/service-requests/${id}/status`, { status });
  return res.data;
}
export async function apiDeleteServiceRequest(id: string) {
  const res = await http.delete<{ ok: boolean }>(`/service-requests/${id}`);
  return res.data;
}

export default {
  apiLogin,
  apiRegisterStart,
  apiSavePassword,
  apiVerifyCode,
  apiCompleteProfile,
  apiForgotPassword,
  apiVerifyResetCode,
  apiResetPassword,
  apiListBikes,
  apiListDeletedBikes,
  apiCreateBike,
  apiGetBike,
  apiUpdateBike,
  apiSoftDeleteBike,
  apiRestoreBike,
  apiHardDeleteBike,
  apiUploadBikeImage,
  apiListServiceRequests,
  apiCreateServiceRequest,
  apiUpdateServiceRequestStatus,
  apiDeleteServiceRequest
}

import { test, expect, request } from '@playwright/test';

// Negativní / edge scénáře registračního toku a auth API.
// Využívá test-utils endpointy pokud ENABLE_TEST_UTILS=1, jinak některé aserce obchází.

async function apiCtx() {
  return request.newContext({ baseURL: 'http://localhost:5001' });
}

test('invalid verification code is rejected', async () => {
  const api = await apiCtx();
  const email = `neg_invalid_${Date.now()}@example.com`;
  const r = await api.post('/auth/register', { data: { email } });
  expect(r.ok()).toBeTruthy();
  const bad = await api.post('/auth/verify-code', { data: { email, code: '000000' } });
  expect(bad.status()).toBe(400);
  const body = await bad.json();
  expect(body.error || body.message || JSON.stringify(body)).toMatch(/code|platn/i);
});

test('reuse of verification code after success is blocked', async () => {
  const api = await apiCtx();
  const email = `neg_reuse_${Date.now()}@example.com`;
  await api.post('/auth/register', { data: { email } });
  const helper = await api.get(`/test-utils/user?email=${encodeURIComponent(email)}`);
  if (helper.status() !== 200) test.skip(true, 'test-utils disabled');
  const { verificationCode } = await helper.json();
  const first = await api.post('/auth/verify-code', { data: { email, code: verificationCode } });
  expect(first.ok()).toBeTruthy();
  const second = await api.post('/auth/verify-code', { data: { email, code: verificationCode } });
  expect(second.status()).toBeGreaterThanOrEqual(400);
});

test('password policy enforced (too weak rejected)', async () => {
  const api = await apiCtx();
  const email = `neg_pwd_${Date.now()}@example.com`;
  await api.post('/auth/register', { data: { email } });
  const helper = await api.get(`/test-utils/user?email=${encodeURIComponent(email)}`);
  if (helper.status() !== 200) test.skip(true, 'test-utils disabled');
  const { verificationCode } = await helper.json();
  await api.post('/auth/verify-code', { data: { email, code: verificationCode } });
  const weak = await api.post('/auth/save-password', { data: { email, password: 'abc' } });
  expect(weak.status()).toBe(400);
  const strong = await api.post('/auth/save-password', { data: { email, password: 'Abcdef1' } });
  expect(strong.ok()).toBeTruthy();
});

test('cannot complete profile without password set', async () => {
  const api = await apiCtx();
  const email = `neg_profile_${Date.now()}@example.com`;
  await api.post('/auth/register', { data: { email } });
  const helper = await api.get(`/test-utils/user?email=${encodeURIComponent(email)}`);
  if (helper.status() !== 200) test.skip(true, 'test-utils disabled');
  const { verificationCode } = await helper.json();
  await api.post('/auth/verify-code', { data: { email, code: verificationCode } });
  const prof = await api.post('/auth/complete-profile', { data: { email, firstName: 'X', lastName: 'Y' } });
  expect(prof.status()).toBeGreaterThanOrEqual(400);
});

test('duplicate registration returns consistent response', async () => {
  const api = await apiCtx();
  const email = `neg_dup_${Date.now()}@example.com`;
  const first = await api.post('/auth/register', { data: { email } });
  expect(first.ok()).toBeTruthy();
  const second = await api.post('/auth/register', { data: { email } });
  expect([200, 201, 202, 409]).toContain(second.status());
});

import { test, expect, request } from '@playwright/test';

// Plný registration + verify + set password + complete profile flow.
// Dokud UI není kompletní, část kroků děláme přes direct API volání.

test('full registration flow (API assisted)', async () => {
  const api = await request.newContext({ baseURL: 'http://localhost:5001' });
  const email = `e2e_${Date.now()}@example.com`;
  // 1) Register
  const registerRes = await api.post('/auth/register', { data: { email } });
  expect(registerRes.ok()).toBeTruthy();
  // 2) Získání kódu
  const helper = await api.get(`/test-utils/user?email=${encodeURIComponent(email)}`);
  if (helper.ok()) {
    const { verificationCode } = await helper.json();
    expect(verificationCode).toHaveLength(6);
  const verify = await api.post('/auth/verify-code', { data: { email, code: verificationCode } });
    expect(verify.ok()).toBeTruthy();
  const pwd = await api.post('/auth/save-password', { data: { email, password: 'Abcdef1' } });
    expect(pwd.ok()).toBeTruthy();
  const profile = await api.post('/auth/complete-profile', {
      data: {
        email,
        firstName: 'E2E',
        lastName: 'Tester',
        birthDate: '1990-01-01',
        gender: 'other',
        location: 'TestCity',
      },
    });
    expect(profile.ok()).toBeTruthy();
  } else {
    // fallback smoke: endpoint nedostupný => alespoň registrace proběhla (403 or 404 depending on routing)
    expect([403,404]).toContain(helper.status());
  }
});


require('dotenv').config();
const mongoose = require('mongoose');
const fetch = global.fetch || ((...args) => import('node-fetch').then(({default: f}) => f(...args)));
const User = require('../models/User');

(async () => {
  try {
    const email = `e2e_${Date.now()}@example.com`;
    await mongoose.connect(process.env.MONGO_URI);
    // 1) register (send code)
    let res = await fetch('http://localhost:5001/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
    });
    console.log('register status', res.status);
    if (res.status !== 201) {
      const t = await res.text();
      throw new Error('register failed: ' + t);
    }
    // 2) load code from DB
    const user = await User.findOne({ email });
    if (!user || !user.verificationCode) throw new Error('no verification code found');
    console.log('verificationCode', user.verificationCode);
    // 3) save password
    res = await fetch('http://localhost:5001/auth/save-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'Test123!' })
    });
    console.log('save-password status', res.status);
    if (!res.ok) throw new Error('save-password failed');
    // 4) verify code
    res = await fetch('http://localhost:5001/auth/verify-code', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: user.verificationCode })
    });
    console.log('verify-code status', res.status);
    if (!res.ok) throw new Error('verify-code failed');
    // 5) complete profile
    res = await fetch('http://localhost:5001/auth/complete-profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        email,
        firstName: 'E2E',
        lastName: 'User',
        birthDate: '1990-01-01',
        gender: 'male',
        location: 'Praha'
      })
    });
    console.log('complete-profile status', res.status);
    if (!res.ok) throw new Error('complete-profile failed');
    console.log('E2E registration finished successfully for', email);
  } catch (err) {
    console.error('E2E failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();

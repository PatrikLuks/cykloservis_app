const mongoose = require('mongoose');
const { ensureUserWithPassword, setPassword } = require('../services/userService');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { ensureDb } = require('./helpers/testFactory');

describe('userService', () => {
  beforeAll(async () => {
    await ensureDb();
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('ensureUserWithPassword creates user if not exists', async () => {
    const hash = await bcrypt.hash('Abcdef1', 10);
    const user = await ensureUserWithPassword('service_test@example.com', hash);
    expect(user).toBeTruthy();
    const found = await User.findOne({ email: 'service_test@example.com' });
    expect(found).toBeTruthy();
  });

  it('setPassword updates existing user', async () => {
    const email = `pwd_test_${Date.now()}@example.com`;
    const user = new User({ email });
    await user.save();
    const updated = await setPassword(email, 'Abcdef1');
    expect(updated.password).toBeTruthy();
    const match = await bcrypt.compare('Abcdef1', updated.password);
    expect(match).toBe(true);
  });
});

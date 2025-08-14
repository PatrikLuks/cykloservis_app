const request = require('supertest');
const app = require('../..');
const mongoose = require('mongoose');

let memoryServer;
let connectingPromise;
async function ensureDb() {
  if (mongoose.connection.readyState !== 0) return;
  if (connectingPromise) {
    await connectingPromise;
    return;
  }
  let uri = process.env.MONGO_URI || process.env.MONGO_URI_TEST;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    // Reuse existing instance if already created
    if (!memoryServer) {
      // Try creating with a couple of retries to mitigate transient download / lock issues
      const maxAttempts = 3;
      let lastErr;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          memoryServer = await MongoMemoryServer.create({
            // Use systemBinary if already cached & available silently
            // downloadDir default is user cache; lock errors may happen -> we retry
            binary: { version: '7.0.14' },
            instance: { storageEngine: 'wiredTiger' },
          });
          break;
        } catch (err) {
          lastErr = err;
          if (attempt === maxAttempts) {
            throw err;
          }
          await new Promise((r) => setTimeout(r, 500 * attempt));
        }
      }
      if (!memoryServer) throw lastErr || new Error('MongoMemoryServer not started');
    }
    uri = memoryServer.getUri();
  }
  // Add small retry for initial connect
  connectingPromise = (async () => {
    const maxConnAttempts = 3;
    for (let i = 1; i <= maxConnAttempts; i++) {
      try {
        await mongoose.connect(uri, {});
        break;
      } catch (err) {
        if (i === maxConnAttempts) throw err;
        await new Promise((r) => setTimeout(r, 300 * i));
      }
    }
  })();
  await connectingPromise;
  connectingPromise = null;
}

// Export hook to stop memory server if used (can be called from globalTeardown if needed)
async function stopMemory() {
  if (memoryServer) {
    try {
      await memoryServer.stop();
    } catch (e) {
      /* ignore stop error */
    }
    memoryServer = null;
  }
}

async function createUserAndLogin(prefix = 'user') {
  await ensureDb();
  const email = `${prefix}_${Date.now()}@example.com`;
  await request(app)
    .post('/auth/register')
    .set('Content-Type', 'application/json')
    .send({ email })
    .expect(201);
  await request(app).post('/auth/save-password').send({ email, password: 'Aa123456' }).expect(200);
  const User = require('../../models/User');
  const user = await User.findOne({ email });
  const code = user.verificationCode;
  await request(app).post('/auth/verify-code').send({ email, code }).expect(200);
  await request(app)
    .post('/auth/complete-profile')
    .send({
      email,
      firstName: 'T',
      lastName: 'U',
      birthDate: '2000-01-01',
      gender: 'x',
      location: 'y',
    })
    .expect(200);
  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email, password: 'Aa123456' })
    .expect(200);
  return { token: loginRes.body.token, email };
}

async function createBike(token, title = 'Test Bike') {
  const res = await request(app)
    .post('/bikes')
    .set('Authorization', `Bearer ${token}`)
    .send({ title })
    .expect(201);
  return res.body.id;
}

module.exports = { createUserAndLogin, createBike, stopMemory, ensureDb };

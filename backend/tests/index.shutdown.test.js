const app = require('..');
const mongoose = require('mongoose');

describe('index.js shutdown & connect branches', () => {
  it('connectMongo success path logs', async () => {
    const { connectMongo } = app;
    // mock successful connect
    const orig = mongoose.connect;
    mongoose.connect = () => Promise.resolve();
    await connectMongo(() => Promise.resolve());
    mongoose.connect = orig;
  });

  it('connectMongo failure path logs error', async () => {
    const { connectMongo } = app;
    await connectMongo(() => Promise.reject(new Error('fail connect')));
  });

  it('shutdown without server (no server branch)', async () => {
    const { _shutdown } = app;
    await mongoose
      .connect('mongodb://localhost:27017/test', { serverSelectionTimeoutMS: 10 })
      .catch(() => {});
    _shutdown('TEST1');
  });

  it('shutdown with started server', async () => {
    const { _startTestServer, _shutdown } = app;
    const srv = _startTestServer();
    expect(srv.listening).toBe(true);
    _shutdown('TEST2');
  });
});

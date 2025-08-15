const { requestLogger } = require('../middleware/logger');

function createRes() {
  const headers = {};
  const listeners = {};
  return {
    statusCode: 200,
    setHeader: (k, v) => {
      headers[k.toLowerCase()] = v;
    },
    getHeader: (k) => headers[k.toLowerCase()],
    on: (ev, cb) => {
      listeners[ev] = cb;
    },
    trigger: (ev) => listeners[ev] && listeners[ev](),
  };
}

describe('requestLogger middleware', () => {
  it('přidá req.id a nastaví x-request-id', () => {
    const req = { method: 'GET', originalUrl: '/x', headers: {} };
    const res = createRes();
    let nextCalled = false;
    requestLogger(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
    expect(req.id).toBeTruthy();
    expect(res.getHeader('x-request-id')).toBe(req.id);
  });

  it('zaloguje dokončení (finish listener lze vyvolat)', () => {
    const req = { method: 'GET', originalUrl: '/y', headers: {} };
    const res = createRes();
    requestLogger(req, res, () => {});
    // simulate finish
    res.trigger('finish');
    expect(res.getHeader('x-request-id')).toBeTruthy();
  });
});

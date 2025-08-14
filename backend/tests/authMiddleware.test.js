// Integrační test auth middleware proti in-memory Mongo místo mocků (spolehlivější pro async await)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const jwt = require('jsonwebtoken');
const { ensureDb } = require('./helpers/testFactory');
const User = require('../models/User');
const { authOptional, requireAuth } = require('../middleware/auth');

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.body = obj;
      return this;
    },
  };
}

describe('auth middleware', () => {
  beforeAll(async () => {
    await ensureDb();
  });

  describe('authOptional', () => {
    it('pokračuje bez tokenu', async () => {
      const req = { headers: {} };
      const res = makeRes();
      let nextCalled = false;
      await authOptional(req, res, () => {
        nextCalled = true;
      });
      expect(nextCalled).toBe(true);
      expect(req.user).toBeUndefined();
    });

    it('ignoruje neplatný token', async () => {
      const req = { headers: { authorization: 'Bearer NEPLATNY' } };
      const res = makeRes();
      let nextCalled = false;
      await authOptional(req, res, () => {
        nextCalled = true;
      });
      expect(nextCalled).toBe(true);
      expect(req.user).toBeUndefined();
    });

    it('přidá uživatele při platném tokenu', async () => {
      const u = await User.create({ email: 'u@e.cz', role: 'admin', isVerified: true });
      const token = jwt.sign({ id: u._id }, process.env.JWT_SECRET);
      const req = { headers: { authorization: 'Bearer ' + token } };
      const res = makeRes();
      await authOptional(req, res, () => {});
      expect(req.user).toEqual({ id: String(u._id), email: 'u@e.cz', role: 'admin' });
    });
  });

  describe('requireAuth', () => {
    it('vrací 401 bez tokenu', async () => {
      const req = { headers: {} };
      const res = makeRes();
      await requireAuth(req, res, () => {});
      expect(res.statusCode).toBe(401);
      expect(res.body).toMatchObject({ message: 'Unauthorized' });
    });

    it('vrací 401 s neplatným tokenem', async () => {
      const req = { headers: { authorization: 'Bearer BADTOKEN' } };
      const res = makeRes();
      await requireAuth(req, res, () => {});
      expect(res.statusCode).toBe(401);
    });

    it('vrací 401 pokud uživatel nenalezen', async () => {
      // vytvoříme token s náhodným id
      const randomId = '66b4d6b4d6b4d6b4d6b4d6b4';
      const token = jwt.sign({ id: randomId }, process.env.JWT_SECRET);
      const req = { headers: { authorization: 'Bearer ' + token } };
      const res = makeRes();
      await requireAuth(req, res, () => {});
      expect(res.statusCode).toBe(401);
    });

    it('pokračuje při platném tokenu a nalezeném uživateli', async () => {
      const u = await User.create({ email: 'x@y.cz', role: 'user', isVerified: true });
      const token = jwt.sign({ id: u._id }, process.env.JWT_SECRET);
      const req = { headers: { authorization: 'Bearer ' + token } };
      const res = makeRes();
      let nextCalled = false;
      await requireAuth(req, res, () => {
        nextCalled = true;
      });
      expect(nextCalled).toBe(true);
      expect(req.user).toEqual({ id: String(u._id), email: 'x@y.cz', role: 'user' });
    });
  });
});

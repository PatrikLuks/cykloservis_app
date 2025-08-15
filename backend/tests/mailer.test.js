// no path usage

describe('mailer branches', () => {
  const originalEnv = { ...process.env };
  afterEach(() => {
    // Restore environment & module cache
    Object.assign(process.env, originalEnv);
    jest.resetModules();
  });

  it('returns true immediately when transporter null (test env)', async () => {
    process.env.NODE_ENV = 'test';
    const { sendMail } = require('../utils/mailer');
    const ok = await sendMail({ to: 'a@b.c', subject: 'x', html: '<b>x</b>' });
    expect(ok).toBe(true); // early branch
  });

  it('succeeds when transporter.sendMail resolves (non-test env)', async () => {
    process.env.NODE_ENV = 'dev';
    jest.doMock('nodemailer', () => ({
      createTransport: jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue({ accepted: ['a@b.c'] }),
      })),
    }));
    const { sendMail } = require('../utils/mailer');
    const ok = await sendMail({ to: 'a@b.c', subject: 'y', html: '<b>y</b>' });
    expect(ok).toBe(true);
  });

  it('returns false when transporter.sendMail rejects (non-test env)', async () => {
    process.env.NODE_ENV = 'dev';
    const err = new Error('smtp fail');
    jest.doMock('nodemailer', () => ({
      createTransport: jest.fn(() => ({ sendMail: jest.fn().mockRejectedValue(err) })),
    }));
    const { sendMail } = require('../utils/mailer');
    const ok = await sendMail({ to: 'a@b.c', subject: 'z', html: '<b>z</b>' });
    expect(ok).toBe(false);
  });
});

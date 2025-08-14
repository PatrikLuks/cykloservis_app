const fs = require('fs');
const path = require('path');

describe('auditLog', () => {
  const logPath = path.join(__dirname, '../audit.log');
  beforeEach(() => {
    try {
      fs.unlinkSync(logPath);
    } catch (e) {
      /* ignore unlink */
    }
  });
  it('appends json line', (done) => {
    const auditLog = require('../utils/auditLog');
    auditLog('test_action', 'user@example.com', { foo: 1 });
    setTimeout(() => {
      const content = fs.readFileSync(logPath, 'utf8').trim();
      expect(content).toContain('test_action');
      done();
    }, 30);
  });
  it('handles fs error gracefully', (done) => {
    jest
      .spyOn(fs, 'appendFile')
      .mockImplementationOnce((f, data, cb) => cb(new Error('disk full')));
    const auditLog = require('../utils/auditLog');
    auditLog('err_action', 'user@example.com');
    // Just ensure no throw; allow console.error branch
    setTimeout(() => done(), 10);
  });
});

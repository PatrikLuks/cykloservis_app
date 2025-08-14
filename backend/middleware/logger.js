const { randomUUID } = require('crypto');
const pino = require('pino');

const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;
const logger = pino({
  level: isTest ? 'silent' : process.env.LOG_LEVEL || 'info',
  transport:
    isTest || process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: { translateTime: 'SYS:standard', singleLine: true },
        },
});

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const reqId = req.headers['x-request-id'] || randomUUID();
  req.id = reqId;
  res.setHeader('x-request-id', reqId);
  const child = logger.child({ reqId });
  req.log = child;
  child.info({ method: req.method, url: req.originalUrl }, 'request:start');
  res.on('finish', () => {
    const durMs = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    child[level]({ status: res.statusCode, duration: durMs.toFixed(1) }, 'request:done');
  });
  next();
}

module.exports = { logger, requestLogger };

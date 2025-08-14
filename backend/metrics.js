const client = require('prom-client');

// V test prostředí nechceme běžící interval collectDefaultMetrics => podmíněně
let stopDefaultMetrics = () => {};
if (!process.env.JEST_WORKER_ID) {
  stopDefaultMetrics = client.collectDefaultMetrics({ prefix: 'cyklo_' });
}

const httpRequestDurationMs = new client.Histogram({
  name: 'cyklo_http_request_duration_ms',
  help: 'Doba zpracování HTTP (ms)',
  labelNames: ['method', 'route', 'status'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
});

const httpRequestsTotal = new client.Counter({
  name: 'cyklo_http_requests_total',
  help: 'Počet HTTP požadavků',
  labelNames: ['method', 'route', 'status'],
});

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const route = req.route && req.route.path ? req.route.path : req.path;
    const labels = { method: req.method, route, status: String(res.statusCode) };
    httpRequestsTotal.inc(labels);
    const durMs = Number(process.hrtime.bigint() - start) / 1e6;
    httpRequestDurationMs.observe(labels, durMs);
  });
  next();
}

async function metricsHandler(req, res) {
  res.set('Content-Type', client.register.contentType);
  try {
    res.end(await client.register.metrics());
  } catch (e) {
    res.status(500).end('# metrics error');
  }
}

module.exports = { metricsMiddleware, metricsHandler, stopDefaultMetrics };

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

// Počet právě probíhajících HTTP požadavků
const httpRequestsInFlight = new client.Gauge({
  name: 'cyklo_http_requests_in_flight',
  help: 'Aktuální počet paralelně obsluhovaných HTTP požadavků',
  labelNames: ['method', 'route'],
});

// Počet chybových odpovědí (4xx,5xx) – agregováno podle method+route+statusClass
const httpRequestErrorsTotal = new client.Counter({
  name: 'cyklo_http_request_errors_total',
  help: 'Počet chybových HTTP odpovědí (4xx,5xx)',
  labelNames: ['method', 'route', 'status_class'],
});

// Apdex (Application Performance Index) – threshold T (ms): satisfied (<=T), tolerating (<=4T)
const APDEX_T = Number(process.env.APDEX_T_MS || 300);
const apdexSatisfied = new client.Counter({
  name: 'cyklo_apdex_satisfied_total',
  help: `Počet požadavků s dobou odezvy <= T (T=${APDEX_T}ms)`,
});
const apdexTolerating = new client.Counter({
  name: 'cyklo_apdex_tolerating_total',
  help: `Počet požadavků s dobou odezvy mezi T a 4T (T=${APDEX_T}ms)`,
});
const apdexAll = new client.Counter({
  name: 'cyklo_apdex_total',
  help: 'Celkový počet měřených požadavků pro výpočet Apdex',
});

// Status class agregace (redukuje cardinalitu oproti plnému status labelu – ponecháme route+method pro konzistenci)
const httpStatusClassTotal = new client.Counter({
  name: 'cyklo_http_status_class_total',
  help: 'Počet HTTP odpovědí podle status class (1xx..5xx)',
  labelNames: ['method', 'route', 'status_class'],
});

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  // Optimistické in-flight ++
  const routeLabel = req.path; // route ještě nemusí být při vstupu určena
  httpRequestsInFlight.inc({ method: req.method, route: routeLabel });
  res.on('finish', () => {
    const route = req.route && req.route.path ? req.route.path : req.path;
    const labels = { method: req.method, route, status: String(res.statusCode) };
    httpRequestsTotal.inc(labels);
    const durMs = Number(process.hrtime.bigint() - start) / 1e6;
    httpRequestDurationMs.observe(labels, durMs);
    httpRequestsInFlight.dec({ method: req.method, route });
    const sc = res.statusCode;
    if (sc >= 400) {
      const statusClass = Math.floor(sc / 100) + 'xx';
      httpRequestErrorsTotal.inc({ method: req.method, route, status_class: statusClass });
    }
    // Status class agregace
    const statusClass = Math.floor(sc / 100) + 'xx';
    httpStatusClassTotal.inc({ method: req.method, route, status_class: statusClass });
    // Apdex klasifikace
    apdexAll.inc();
    if (durMs <= APDEX_T) apdexSatisfied.inc();
    else if (durMs <= APDEX_T * 4) apdexTolerating.inc();
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

module.exports = {
  metricsMiddleware,
  metricsHandler,
  stopDefaultMetrics,
  httpRequestsInFlight,
  httpRequestErrorsTotal,
  httpStatusClassTotal,
  apdexSatisfied,
  apdexTolerating,
  apdexAll,
  APDEX_T,
};

#!/usr/bin/env node
const http = require('http');

const url = process.env.HEALTH_URL || 'http://localhost:5001/api/health/health';
const timeoutMs = parseInt(process.env.HEALTH_TIMEOUT || '4000', 10);

const req = http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    const ok = res.statusCode === 200;
    if (!ok) {
      console.error(`Health check FAILED: status ${res.statusCode}\n${data}`);
      process.exit(1);
    }
    console.log(`Health OK (${res.statusCode}) -> ${data}`);
  });
});

req.setTimeout(timeoutMs, () => {
  console.error(`Health check TIMEOUT after ${timeoutMs}ms: ${url}`);
  req.destroy();
  process.exit(2);
});

req.on('error', (err) => {
  console.error('Health check ERROR:', err.message);
  process.exit(3);
});

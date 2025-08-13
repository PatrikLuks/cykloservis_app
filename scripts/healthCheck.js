#!/usr/bin/env node
const http = require('http');

const url = process.argv[2] || 'http://localhost:5001/api/health/health';
const timeoutMs = Number(process.env.HEALTH_TIMEOUT || 4000);

function exit(code, msg){
  if(msg) console.log(msg);
  process.exit(code);
}

const req = http.get(url, { timeout: timeoutMs }, res => {
  let data='';
  res.on('data', c => data+=c);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if(json.status === 'ok') {
        exit(0, `HEALTH OK (${url}) uptime=${json.uptime?.toFixed?.(2)}s`);
      } else {
        exit(2, `HEALTH FAIL (${url}) unexpected body: ${data}`);
      }
    } catch(e){
      exit(3, `HEALTH PARSE ERROR (${url}) raw: ${data}`);
    }
  });
});
req.on('error', err => exit(4, `HEALTH ERROR (${url}) ${err.message}`));
req.on('timeout', () => {
  req.destroy(new Error('timeout'));
});

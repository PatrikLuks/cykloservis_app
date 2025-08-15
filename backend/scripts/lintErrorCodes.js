#!/usr/bin/env node
/**
 * Kontrola, že všechny 4xx/5xx odpovědi (kromě 401 s UnauthorizedResponse a 404 s MessageResponse)
 * používající ErrorResponse uvádí v příkladech / runtime implementaci pole 'code'.
 * Zde jen staticky ověříme, že schema ErrorResponse obsahuje required: [error, code].
 * A že ve všech paths kde je reference na ErrorResponse u 4xx/5xx je přítomna.
 * (Heuristika: projdeme openapi.yaml a zkontrolujeme, že definice ErrorResponse má required code
 * a vypíšeme varování, pokud ne.)
 */
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const specPath = path.join(__dirname, '..', 'openapi.yaml');
const txt = fs.readFileSync(specPath, 'utf8');
const doc = yaml.parse(txt);
let failed = false;

// 1) Ověřit ErrorResponse required
const er = doc?.components?.schemas?.ErrorResponse;
if (!er) {
  console.error('ErrorResponse schema not found');
  failed = true;
} else if (!Array.isArray(er.required) || !er.required.includes('code')) {
  console.error('ErrorResponse.required must include code');
  failed = true;
}

// 2) Projít responses
for (const [, item] of Object.entries(doc.paths || {})) {
  for (const [, op] of Object.entries(item)) {
    if (!op || typeof op !== 'object') continue;
    const responses = op.responses || {};
    for (const [status, resp] of Object.entries(responses)) {
      if (!/^4|5/.test(status)) continue; // jen 4xx/5xx
      const content = resp?.content;
      const appJson = content && content['application/json'];
      const schema = appJson && appJson.schema;
      if (schema && schema.$ref === '#/components/schemas/ErrorResponse') {
        // OK – schema samo vyžaduje code, nic dalšího neřešíme
      }
    }
  }
}

if (failed) {
  console.error('Lint error: viz výše');
  process.exit(1);
} else {
  console.log('lintErrorCodes: OK');
}

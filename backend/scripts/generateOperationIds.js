#!/usr/bin/env node
// Generates a TypeScript enum of operationIds from openapi.yaml
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const specPath = path.join(__dirname, '..', 'openapi.yaml');
const outDir = path.join(__dirname, '..', 'types');
const outFile = path.join(outDir, 'operation-ids.d.ts');

const raw = fs.readFileSync(specPath, 'utf8');
const doc = yaml.parse(raw);
const ops = [];
for (const p of Object.keys(doc.paths || {})) {
  const pathItem = doc.paths[p];
  for (const method of Object.keys(pathItem)) {
    const op = pathItem[method];
    if (op && op.operationId) ops.push(op.operationId);
  }
}
ops.sort();
const uniq = [...new Set(ops)];

const dts = `// Auto-generated. Do not edit manually.\nexport type OperationId =\n${uniq
  .map((o) => `  | '${o}'`)
  .join('\n')};\n\nexport enum OperationIds {\n${uniq
  .map((o) => `  ${o} = '${o}',`)
  .join('\n')}\n}\n`;

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, dts);
console.log(`Generated ${outFile} with ${uniq.length} operationIds.`);

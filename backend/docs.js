const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const swaggerUi = require('swagger-ui-express');

const specPath = path.join(__dirname, 'openapi.yaml');
const raw = fs.readFileSync(specPath, 'utf8');
const openapiDoc = yaml.parse(raw);

function setupDocs(app) {
  app.get('/api/openapi', (req, res) => res.json(openapiDoc));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
}

module.exports = { openapiDoc, setupDocs };

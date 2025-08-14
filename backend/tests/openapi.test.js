const { openapiDoc } = require('../docs');

describe('OpenAPI spec', () => {
  it('obsahuje základní cesty', () => {
    const paths = Object.keys(openapiDoc.paths || {});
    expect(paths).toEqual(
      expect.arrayContaining(['/auth/register', '/auth/login', '/bikes', '/api/health/health'])
    );
  });
});

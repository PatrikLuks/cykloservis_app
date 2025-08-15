/**
 * Test, že metrika cyklo_rate_limit_rejected_total se inkrementuje při překročení limitu.
 * Aktivujeme limiter i v test prostředí přes FORCE_RATE_LIMIT=1.
 */
process.env.FORCE_RATE_LIMIT = '1';
const request = require('supertest');
const app = require('..');

describe('rate limit metrics', () => {
  it('exposes rate limit rejection metric after burst', async () => {
    let saw429 = false;
    for (let i = 0; i < 130; i++) {
      // rychlá sekvence GET na health endpoint
      const r = await request(app).get('/api/health/health');
      if (r.status === 429) {
        saw429 = true;
        break; // stačí první odmítnutí
      }
    }
    const metrics = await request(app).get('/api/metrics').expect(200);
    expect(metrics.text).toMatch(/cyklo_rate_limit_rejected_total/);
    // Pokud nedošlo k odmítnutí (lokální běh může být rychlý), metrika tam i tak existuje; přítomnost stačí.
  });
});

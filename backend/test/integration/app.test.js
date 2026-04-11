const request = require('supertest');

jest.mock('../../config/gridfs', () => ({
  initBucket: jest.fn(),
}));

jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(undefined),
  };
});

const savedAtlasUri = process.env.ATLAS_URI;
process.env.ATLAS_URI = 'mongodb://localhost:27017/test';
const app = require('../../app');
if (savedAtlasUri !== undefined) {
  process.env.ATLAS_URI = savedAtlasUri;
} else {
  delete process.env.ATLAS_URI;
}

describe('app integration', () => {
  test('responds to CORS preflight with 204', async () => {
    const res = await request(app)
      .options('/users')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'x-user-id,content-type');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-methods']).toContain('GET');
    expect(res.headers['access-control-allow-headers']).toContain('x-user-id');
  });

  test('returns unread count 0 when user is not authenticated', async () => {
    const res = await request(app).get('/notif');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 0 });
  });

  test('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/this-route-does-not-exist');

    expect(res.status).toBe(404);
  });
});

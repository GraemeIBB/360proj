const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const indexRouter = require('../routes/index');

// Mock Mongoose model and bcrypt before importing anything that uses them
jest.mock('../models/User');
jest.mock('bcrypt');

// Build a minimal Express app with just the login route
const app = express();
app.use(express.json());
app.use('/', indexRouter);

// Helper: simulate a POST /login
async function postLogin(body) {
  return new Promise((resolve, reject) => {
    const req = {
      body,
      method: 'POST',
      url: '/login',
    };

    const res = {
      _status: 200,
      _body: null,
      status(code) {
        this._status = code;
        return this;
      },
      json(data) {
        this._body = data;
        resolve({ status: this._status, body: this._body });
      },
    };

    // Pull the login handler directly from the router stack
    const loginLayer = indexRouter.stack.find(
      (layer) => layer.route && layer.route.path === '/login'
    );
    const handler = loginLayer.route.stack[0].handle;
    handler(req, res, (err) => reject(err));
  });
}

describe('POST /login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 400 when username is missing', async () => {
    const { status, body } = await postLogin({ password: 'secret' });
    expect(status).toBe(400);
    expect(body.message).toMatch(/username and password are required/i);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test('returns 400 when password is missing', async () => {
    const { status, body } = await postLogin({ username: 'alice' });
    expect(status).toBe(400);
    expect(body.message).toMatch(/username and password are required/i);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  test('returns 400 when both fields are missing', async () => {
    const { status, body } = await postLogin({});
    expect(status).toBe(400);
    expect(body.message).toMatch(/username and password are required/i);
  });

  test('returns 401 when user does not exist', async () => {
    User.findOne.mockResolvedValue(null);

    const { status, body } = await postLogin({ username: 'ghost', password: 'secret' });
    expect(status).toBe(401);
    expect(body.message).toMatch(/invalid username or password/i);
    expect(User.findOne).toHaveBeenCalledWith({ username: 'ghost' });
  });

  test('returns 401 when password does not match', async () => {
    User.findOne.mockResolvedValue({ username: 'alice', password: 'hashedpw', _id: '123' });
    bcrypt.compare.mockResolvedValue(false);

    const { status, body } = await postLogin({ username: 'alice', password: 'wrongpw' });
    expect(status).toBe(401);
    expect(body.message).toMatch(/invalid username or password/i);
    expect(bcrypt.compare).toHaveBeenCalledWith('wrongpw', 'hashedpw');
  });

  test('returns 200 with username and userId on valid credentials', async () => {
    const fakeUser = { _id: 'abc123', username: 'alice', password: 'hashedpw' };
    User.findOne.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true);

    const { status, body } = await postLogin({ username: 'alice', password: 'correctpw' });
    expect(status).toBe(200);
    expect(body.message).toMatch(/logged in/i);
    expect(body.username).toBe('alice');
    expect(body.userId).toBe('abc123');
  });

  test('does not return password in response', async () => {
    const fakeUser = { _id: 'abc123', username: 'alice', password: 'hashedpw' };
    User.findOne.mockResolvedValue(fakeUser);
    bcrypt.compare.mockResolvedValue(true);

    const { body } = await postLogin({ username: 'alice', password: 'correctpw' });
    expect(body.password).toBeUndefined();
  });

  test('returns 500 when database throws', async () => {
    User.findOne.mockRejectedValue(new Error('DB connection failed'));

    const { status, body } = await postLogin({ username: 'alice', password: 'pw' });
    expect(status).toBe(500);
    expect(body.error).toBe('DB connection failed');
  });
});

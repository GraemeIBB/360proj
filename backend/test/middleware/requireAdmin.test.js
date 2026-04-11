jest.mock('../../models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn(),
    },
  },
}));

const requireAdmin = require('../../middleware/requireAdmin');
const User = require('../../models/User');
const mongoose = require('mongoose');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('requireAdmin middleware', () => {
  test('returns 401 when x-user-id header is missing', async () => {
    const req = { headers: {} };
    const res = createRes();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(mongoose.Types.ObjectId.isValid).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when x-user-id is invalid', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = { headers: { 'x-user-id': 'bad-id' } };
    const res = createRes();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('bad-id');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when user is not found', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const select = jest.fn().mockResolvedValue(null);
    User.findById.mockReturnValue({ select });

    const req = { headers: { 'x-user-id': '507f1f77bcf86cd799439011' } };
    const res = createRes();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(select).toHaveBeenCalledWith('admin');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next and adds adminUser for admin users', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const adminUser = { _id: '507f1f77bcf86cd799439011', admin: true };
    const select = jest.fn().mockResolvedValue(adminUser);
    User.findById.mockReturnValue({ select });

    const req = { headers: { 'x-user-id': '507f1f77bcf86cd799439011' } };
    const res = createRes();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(req.adminUser).toEqual(adminUser);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

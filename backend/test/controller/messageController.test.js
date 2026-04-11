jest.mock('../../models/Message', () => ({
  create: jest.fn(),
  countDocuments: jest.fn(),
  updateMany: jest.fn(),
}));

jest.mock('../../models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../../models/Book', () => ({
  findById: jest.fn(),
}));

jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn(),
    },
  },
}));

const Message = require('../../models/Message');
const User = require('../../models/User');
const Book = require('../../models/Book');
const mongoose = require('mongoose');
const {
  sendMessage,
  markThreadRead,
  getUnreadCount,
} = require('../../controller/messageController');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('messageController', () => {
  test('sendMessage returns 401 if sender is not authenticated', async () => {
    const req = { headers: {}, body: {} };
    const res = createRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
  });

  test('sendMessage returns 400 if sender tries to message themselves', async () => {
    const req = {
      headers: { 'x-user-id': 'user-1' },
      body: { recipientId: 'user-1', bookId: 'book-1', body: 'Hello' },
    };
    const res = createRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cannot message yourself' });
  });

  test('sendMessage returns 400 for invalid recipient/book ObjectId', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);

    const req = {
      headers: { 'x-user-id': '507f1f77bcf86cd799439011' },
      body: {
        recipientId: 'bad-recipient-id',
        bookId: 'bad-book-id',
        body: 'Hello',
      },
    };
    const res = createRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid recipientId or bookId' });
  });

  test('sendMessage returns 404 when recipient does not exist', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    Book.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'book-id' }) });

    const req = {
      headers: { 'x-user-id': '507f1f77bcf86cd799439011' },
      body: {
        recipientId: '507f1f77bcf86cd799439012',
        bookId: '507f1f77bcf86cd799439013',
        body: 'Hello',
      },
    };
    const res = createRes();

    await sendMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Recipient not found' });
  });

  test('sendMessage creates and returns message for valid request', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'user-id' }) });
    Book.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'book-id' }) });

    const created = {
      _id: 'msg-id',
      sender: '507f1f77bcf86cd799439011',
      recipient: '507f1f77bcf86cd799439012',
      book: '507f1f77bcf86cd799439013',
      body: 'Hello there',
    };
    Message.create.mockResolvedValue(created);

    const req = {
      headers: { 'x-user-id': '507f1f77bcf86cd799439011' },
      body: {
        recipientId: '507f1f77bcf86cd799439012',
        bookId: '507f1f77bcf86cd799439013',
        body: 'Hello there',
      },
    };
    const res = createRes();

    await sendMessage(req, res);

    expect(Message.create).toHaveBeenCalledWith({
      sender: '507f1f77bcf86cd799439011',
      recipient: '507f1f77bcf86cd799439012',
      book: '507f1f77bcf86cd799439013',
      body: 'Hello there',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  test('markThreadRead returns 400 for invalid ids', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);
    const req = {
      headers: { 'x-user-id': '507f1f77bcf86cd799439011' },
      params: { otherId: 'bad', bookId: 'bad' },
    };
    const res = createRes();

    await markThreadRead(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid otherId or bookId' });
  });

  test('getUnreadCount returns count for authenticated user', async () => {
    Message.countDocuments.mockResolvedValue(3);
    const req = { headers: { 'x-user-id': '507f1f77bcf86cd799439011' } };
    const res = createRes();

    await getUnreadCount(req, res);

    expect(Message.countDocuments).toHaveBeenCalledWith({
      recipient: '507f1f77bcf86cd799439011',
      read: false,
    });
    expect(res.json).toHaveBeenCalledWith({ count: 3 });
  });
});

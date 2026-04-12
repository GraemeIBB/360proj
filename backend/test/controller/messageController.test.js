jest.mock('../../models/Message', () => ({
  create: jest.fn(),
  countDocuments: jest.fn(),
  updateMany: jest.fn(),
  find: jest.fn(),
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
  getConversations,
  getThread,
} = require('../../controller/messageController');

// Returns a mongoose-query-like object whose chain methods all return itself,
// and which is thenable so `await Message.find(...).sort(...).populate(...)` works.
function mockQuery(result) {
  const q = {};
  ['sort', 'populate'].forEach(m => { q[m] = jest.fn().mockReturnValue(q); });
  q.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  q.catch = fn => Promise.resolve(result).catch(fn);
  return q;
}

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

  test('markThreadRead marks messages as read and returns ok', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Message.updateMany.mockResolvedValue({ nModified: 2 });
    const req = {
      headers: { 'x-user-id': '507f1f77bcf86cd799439011' },
      params: { otherId: '507f1f77bcf86cd799439012', bookId: '507f1f77bcf86cd799439013' },
    };
    const res = createRes();

    await markThreadRead(req, res);

    expect(Message.updateMany).toHaveBeenCalledWith(
      { sender: '507f1f77bcf86cd799439012', recipient: '507f1f77bcf86cd799439011', book: '507f1f77bcf86cd799439013', read: false },
      { read: true }
    );
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});

describe('getConversations', () => {
  const ME = '507f1f77bcf86cd799439011';
  const OTHER = '507f1f77bcf86cd799439012';
  const BOOK = '507f1f77bcf86cd799439013';

  test('returns 401 when not authenticated', async () => {
    const req = { headers: {} };
    const res = createRes();

    await getConversations(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
  });

  test('returns empty array when there are no messages', async () => {
    Message.find.mockReturnValue(mockQuery([]));
    const req = { headers: { 'x-user-id': ME } };
    const res = createRes();

    await getConversations(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('groups messages between the same two users into one conversation', async () => {
    const messages = [
      {
        _id: 'msg1',
        sender: { _id: ME, username: 'me', profilePicture: '' },
        recipient: { _id: OTHER, username: 'them', profilePicture: '' },
        book: { _id: BOOK, title: 'Gatsby', coverImage: '' },
        read: true,
      },
      {
        _id: 'msg2',
        sender: { _id: OTHER, username: 'them', profilePicture: '' },
        recipient: { _id: ME, username: 'me', profilePicture: '' },
        book: { _id: BOOK, title: 'Gatsby', coverImage: '' },
        read: false,
      },
    ];
    Message.find.mockReturnValue(mockQuery(messages));
    const req = { headers: { 'x-user-id': ME } };
    const res = createRes();

    await getConversations(req, res);

    const [conversations] = res.json.mock.calls[0];
    expect(conversations).toHaveLength(1);
    expect(conversations[0].otherUser.username).toBe('them');
    expect(conversations[0].book.title).toBe('Gatsby');
    expect(conversations[0].lastMessage._id).toBe('msg1');
  });

  test('counts only unread messages directed at the current user', async () => {
    const messages = [
      {
        _id: 'msg1',
        sender: { _id: OTHER, username: 'them', profilePicture: '' },
        recipient: { _id: ME, username: 'me', profilePicture: '' },
        book: { _id: BOOK, title: 'Gatsby', coverImage: '' },
        read: false,
      },
      {
        _id: 'msg2',
        sender: { _id: OTHER, username: 'them', profilePicture: '' },
        recipient: { _id: ME, username: 'me', profilePicture: '' },
        book: { _id: BOOK, title: 'Gatsby', coverImage: '' },
        read: false,
      },
      {
        _id: 'msg3',
        sender: { _id: ME, username: 'me', profilePicture: '' },
        recipient: { _id: OTHER, username: 'them', profilePicture: '' },
        book: { _id: BOOK, title: 'Gatsby', coverImage: '' },
        read: false, // outgoing unread — should NOT be counted
      },
    ];
    Message.find.mockReturnValue(mockQuery(messages));
    const req = { headers: { 'x-user-id': ME } };
    const res = createRes();

    await getConversations(req, res);

    const [conversations] = res.json.mock.calls[0];
    expect(conversations[0].unreadCount).toBe(2);
  });
});

describe('getThread', () => {
  const ME = '507f1f77bcf86cd799439011';
  const OTHER = '507f1f77bcf86cd799439012';
  const BOOK = '507f1f77bcf86cd799439013';

  test('returns 401 when not authenticated', async () => {
    const req = { headers: {}, params: { otherId: OTHER, bookId: BOOK } };
    const res = createRes();

    await getThread(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
  });

  test('returns 400 for invalid otherId or bookId', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);
    const req = {
      headers: { 'x-user-id': ME },
      params: { otherId: 'bad', bookId: 'bad' },
    };
    const res = createRes();

    await getThread(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid otherId or bookId' });
  });

  test('returns thread messages for valid request', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const threadMessages = [
      { _id: 'msg1', sender: { _id: ME, username: 'me' }, body: 'Hello' },
      { _id: 'msg2', sender: { _id: OTHER, username: 'them' }, body: 'Hey back' },
    ];
    Message.find.mockReturnValue(mockQuery(threadMessages));
    const req = {
      headers: { 'x-user-id': ME },
      params: { otherId: OTHER, bookId: BOOK },
    };
    const res = createRes();

    await getThread(req, res);

    expect(res.json).toHaveBeenCalledWith(threadMessages);
  });

  test('queries messages in both directions between the two users', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    Message.find.mockReturnValue(mockQuery([]));
    const req = {
      headers: { 'x-user-id': ME },
      params: { otherId: OTHER, bookId: BOOK },
    };
    const res = createRes();

    await getThread(req, res);

    expect(Message.find).toHaveBeenCalledWith({
      book: BOOK,
      $or: [
        { sender: ME, recipient: OTHER },
        { sender: OTHER, recipient: ME },
      ],
    });
  });
});

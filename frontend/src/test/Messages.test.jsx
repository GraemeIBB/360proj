import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import Messages from '../Messages'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Prevent Navbar's fetch calls from interfering with test fetch mocks
vi.mock('../components/Header', () => ({ default: () => null }))
vi.mock('../components/Footer', () => ({ default: () => null }))

// Shared test data
const CONV = {
  otherUser: { _id: 'user2', username: 'alice', profilePicture: '' },
  book: { _id: 'book1', title: 'The Great Gatsby' },
  lastMessage: { body: 'Hey', createdAt: new Date().toISOString() },
  unreadCount: 0,
}

const THREAD = [
  { _id: 'msg1', sender: { _id: 'user1', username: 'me', profilePicture: '' }, body: 'Hello!', read: true },
  { _id: 'msg2', sender: { _id: 'user2', username: 'alice', profilePicture: '' }, body: 'Hey back!', read: true },
]

function makeFetch({ conversations = [], thread = [], sendOk = true } = {}) {
  return vi.fn((url, options = {}) => {
    const method = (options.method || 'GET').toUpperCase()
    if (method === 'PATCH') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) })
    }
    if (method === 'POST') {
      return Promise.resolve({ ok: sendOk, json: () => Promise.resolve({}) })
    }
    if (url.includes('/messages/conversations')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(conversations) })
    }
    if (url.includes('/messages/thread')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(thread) })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })
}

function renderMessages() {
  return render(
    <MemoryRouter>
      <Messages />
    </MemoryRouter>
  )
}

beforeEach(() => {
  localStorage.clear()
  mockNavigate.mockClear()
  global.fetch = makeFetch()
})

afterEach(() => {
  cleanup()
})

describe('Messages - auth', () => {
  test('redirects to /login when not authenticated', async () => {
    renderMessages()
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'))
  })
})

describe('Messages - conversation list', () => {
  beforeEach(() => {
    localStorage.setItem('userId', 'user1')
  })

  test('shows empty state when there are no conversations', async () => {
    global.fetch = makeFetch({ conversations: [] })
    renderMessages()
    await waitFor(() => expect(screen.getByText('No conversations yet')).toBeInTheDocument())
  })

  test('renders conversation with username and book title', async () => {
    global.fetch = makeFetch({ conversations: [CONV] })
    renderMessages()
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument())
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument()
  })

  test('shows unread badge when unreadCount > 0', async () => {
    global.fetch = makeFetch({ conversations: [{ ...CONV, unreadCount: 3 }] })
    renderMessages()
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument())
  })

  test('no unread badge when unreadCount is 0', async () => {
    global.fetch = makeFetch({ conversations: [{ ...CONV, unreadCount: 0 }] })
    renderMessages()
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument())
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})

describe('Messages - chat panel', () => {
  beforeEach(() => {
    localStorage.setItem('userId', 'user1')
  })

  test('shows placeholder when no conversation is selected', async () => {
    global.fetch = makeFetch({ conversations: [] })
    renderMessages()
    await waitFor(() => expect(screen.getByText('Select a conversation to start chatting')).toBeInTheDocument())
  })

  test('loads thread when a conversation is clicked', async () => {
    global.fetch = makeFetch({ conversations: [CONV], thread: THREAD })
    renderMessages()
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument())
    fireEvent.click(screen.getByText('alice').closest('.messages-conv-item'))
    await waitFor(() => expect(screen.getByText('Hello!')).toBeInTheDocument())
    expect(screen.getByText('Hey back!')).toBeInTheDocument()
  })

  test('shows selected conversation name and book in chat header', async () => {
    global.fetch = makeFetch({ conversations: [CONV], thread: [] })
    renderMessages()
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument())
    fireEvent.click(screen.getByText('alice').closest('.messages-conv-item'))
    await waitFor(() => expect(screen.getByText('re: The Great Gatsby')).toBeInTheDocument())
  })

  test('calls markRead when a conversation is selected', async () => {
    global.fetch = makeFetch({ conversations: [CONV], thread: [] })
    renderMessages()
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument())
    fireEvent.click(screen.getByText('alice').closest('.messages-conv-item'))
    await waitFor(() => {
      const patchCall = global.fetch.mock.calls.find(
        ([url, opts]) => url.includes('/read') && opts?.method === 'PATCH'
      )
      expect(patchCall).toBeTruthy()
    })
  })
})

describe('Messages - send', () => {
  beforeEach(() => {
    localStorage.setItem('userId', 'user1')
    global.fetch = makeFetch({ conversations: [CONV], thread: THREAD })
  })

  async function selectConversation() {
    renderMessages()
    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument())
    fireEvent.click(screen.getByText('alice').closest('.messages-conv-item'))
    await waitFor(() => expect(screen.getByPlaceholderText(/type here/i)).toBeInTheDocument())
  }

  test('sends message with correct payload on form submit', async () => {
    await selectConversation()
    fireEvent.change(screen.getByPlaceholderText(/type here/i), { target: { value: 'Hello there' } })
    fireEvent.submit(screen.getByPlaceholderText(/type here/i).closest('form'))
    await waitFor(() => {
      const postCall = global.fetch.mock.calls.find(([url, opts]) => opts?.method === 'POST')
      expect(postCall).toBeTruthy()
      const body = JSON.parse(postCall[1].body)
      expect(body.recipientId).toBe('user2')
      expect(body.bookId).toBe('book1')
      expect(body.body).toBe('Hello there')
    })
  })

  test('clears input after successful send', async () => {
    await selectConversation()
    const input = screen.getByPlaceholderText(/type here/i)
    fireEvent.change(input, { target: { value: 'Hello there' } })
    fireEvent.submit(input.closest('form'))
    await waitFor(() => expect(input.value).toBe(''))
  })

  test('Enter key submits the message', async () => {
    await selectConversation()
    const input = screen.getByPlaceholderText(/type here/i)
    fireEvent.change(input, { target: { value: 'Enter send' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })
    await waitFor(() => {
      const postCall = global.fetch.mock.calls.find(([url, opts]) => opts?.method === 'POST')
      expect(postCall).toBeTruthy()
    })
  })

  test('Shift+Enter does not submit', async () => {
    await selectConversation()
    const input = screen.getByPlaceholderText(/type here/i)
    fireEvent.change(input, { target: { value: 'No send yet' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    const postCall = global.fetch.mock.calls.find(([url, opts]) => opts?.method === 'POST')
    expect(postCall).toBeUndefined()
  })

  test('Send button is disabled when input is empty', async () => {
    await selectConversation()
    expect(screen.getByText('Send')).toBeDisabled()
  })
})

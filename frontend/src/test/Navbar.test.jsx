import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import Navbar from '../components/Navbar'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Build a fetch mock that handles /notif and /users/:id
function makeFetch({ count = 0, user = {} } = {}) {
  return vi.fn((url) => {
    if (url.includes('/notif')) {
      return Promise.resolve({ json: () => Promise.resolve({ count }) })
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ profilePicture: '', isDisabled: false, ...user }),
    })
  })
}

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
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

describe('Navbar - logged out', () => {
  test('shows Sign In and Sign Up links', () => {
    renderNavbar()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  test('hides Post Book, Logout, and Admin', () => {
    renderNavbar()
    expect(screen.queryByText('+ Post Book')).not.toBeInTheDocument()
    expect(screen.queryByText('Logout')).not.toBeInTheDocument()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })

  test('My Listings links to /login', () => {
    renderNavbar()
    expect(screen.getByText('My Listings').closest('a')).toHaveAttribute('href', '/login')
  })

  test('Messages links to /login', () => {
    renderNavbar()
    expect(screen.getByText('Messages').closest('a')).toHaveAttribute('href', '/login')
  })

  test('no notification badge', () => {
    renderNavbar()
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
  })
})

describe('Navbar - logged in', () => {
  beforeEach(() => {
    localStorage.setItem('userId', 'user123')
    localStorage.setItem('username', 'testuser')
  })

  test('shows Logout and Post Book', async () => {
    renderNavbar()
    await waitFor(() => expect(screen.getByText('Logout')).toBeInTheDocument())
    expect(screen.getByText('+ Post Book')).toBeInTheDocument()
  })

  test('hides Sign In and Sign Up', async () => {
    renderNavbar()
    await waitFor(() => expect(screen.getByText('Logout')).toBeInTheDocument())
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument()
  })

  test('My Listings links to /my-listings', async () => {
    renderNavbar()
    await waitFor(() => expect(screen.getByText('Logout')).toBeInTheDocument())
    expect(screen.getByText('My Listings').closest('a')).toHaveAttribute('href', '/my-listings')
  })

  test('Messages links to /messages', async () => {
    renderNavbar()
    await waitFor(() => expect(screen.getByText('Logout')).toBeInTheDocument())
    expect(screen.getByText('Messages').closest('a')).toHaveAttribute('href', '/messages')
  })

  test('no Admin link for non-admin users', async () => {
    renderNavbar()
    await waitFor(() => expect(screen.getByText('Logout')).toBeInTheDocument())
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })
})

describe('Navbar - admin', () => {
  beforeEach(() => {
    localStorage.setItem('userId', 'user123')
    localStorage.setItem('isAdmin', 'true')
  })

  test('shows Admin link pointing to /admin', async () => {
    renderNavbar()
    await waitFor(() => expect(screen.getByText('Admin')).toBeInTheDocument())
    expect(screen.getByText('Admin').closest('a')).toHaveAttribute('href', '/admin')
  })
})

describe('Navbar - notification badge', () => {
  test('shows unread count badge when count > 0', async () => {
    global.fetch = makeFetch({ count: 5 })
    localStorage.setItem('userId', 'user123')
    renderNavbar()
    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument())
  })

  test('no badge when unread count is 0', async () => {
    global.fetch = makeFetch({ count: 0 })
    localStorage.setItem('userId', 'user123')
    renderNavbar()
    await waitFor(() => expect(screen.getByText('Logout')).toBeInTheDocument())
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})

describe('Navbar - logout', () => {
  beforeEach(() => {
    localStorage.setItem('userId', 'user123')
    localStorage.setItem('username', 'testuser')
    localStorage.setItem('isAdmin', 'false')
    localStorage.setItem('profilePicture', '/img/pic.jpg')
  })

  test('clears all auth keys from localStorage', async () => {
    renderNavbar()
    await waitFor(() => expect(screen.getByText('Logout')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Logout'))
    expect(localStorage.getItem('userId')).toBeNull()
    expect(localStorage.getItem('username')).toBeNull()
    expect(localStorage.getItem('profilePicture')).toBeNull()
    expect(localStorage.getItem('isAdmin')).toBeNull()
  })

  test('navigates to / after logout', async () => {
    renderNavbar()
    await waitFor(() => expect(screen.getByText('Logout')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Logout'))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})

describe('Navbar - profile click', () => {
  test('navigates to /profile when logged in', async () => {
    localStorage.setItem('userId', 'user123')
    renderNavbar()
    await waitFor(() => expect(screen.getByAltText('Profile')).toBeInTheDocument())
    mockNavigate.mockClear()
    fireEvent.click(screen.getByAltText('Profile'))
    expect(mockNavigate).toHaveBeenCalledWith('/profile')
  })
})

describe('Navbar - disabled user', () => {
  test('clears auth and redirects to /login', async () => {
    localStorage.setItem('userId', 'user123')
    localStorage.setItem('username', 'testuser')
    global.fetch = makeFetch({ user: { isDisabled: true, profilePicture: '' } })
    renderNavbar()
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'))
    expect(localStorage.getItem('userId')).toBeNull()
    expect(localStorage.getItem('username')).toBeNull()
  })
})

describe('Navbar - profile picture', () => {
  beforeEach(() => {
    localStorage.setItem('userId', 'user123')
  })

  test('prepends backend origin for relative paths', async () => {
    global.fetch = makeFetch({ user: { profilePicture: '/uploads/pic.jpg' } })
    renderNavbar()
    await waitFor(() => expect(screen.getByAltText('Profile')).toBeInTheDocument())
    expect(screen.getByAltText('Profile')).toHaveAttribute(
      'src',
      'http://localhost:8800/uploads/pic.jpg'
    )
  })

  test('uses absolute URL as-is', async () => {
    global.fetch = makeFetch({ user: { profilePicture: 'https://example.com/pic.jpg' } })
    renderNavbar()
    await waitFor(() => expect(screen.getByAltText('Profile')).toBeInTheDocument())
    expect(screen.getByAltText('Profile')).toHaveAttribute('src', 'https://example.com/pic.jpg')
  })

  test('falls back to placehold.co when no picture', async () => {
    global.fetch = makeFetch({ user: { profilePicture: '' } })
    renderNavbar()
    await waitFor(() => expect(screen.getByAltText('Profile')).toBeInTheDocument())
    expect(screen.getByAltText('Profile')).toHaveAttribute('src', 'https://placehold.co/40x40')
  })
})

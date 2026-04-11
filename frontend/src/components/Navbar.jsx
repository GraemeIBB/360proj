import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const [notifs, setNotifs] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profilePicture, setProfilePicture] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUnread = () => {
      const uid = localStorage.getItem('userId');
      if (!uid) { setNotifs(0); return; }
      fetch("http://localhost:8800/notif", { headers: { 'x-user-id': uid } })
        .then(res => res.json())
        .then(data => setNotifs(data.count ?? 0))
        .catch(() => setNotifs(0));
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 4000);
    return () => clearInterval(interval);
  }, [])

  useEffect(() => {
    const syncLoginState = async () => {
      const userId = localStorage.getItem('userId')
      setIsLoggedIn(Boolean(userId))

      if (!userId) {
        setProfilePicture('')
        return
      }

      try {
        const response = await fetch(`http://localhost:8800/users/${userId}`, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Unable to load profile picture')
        }

        const user = await response.json()
        const nextPicture = user?.profilePicture || localStorage.getItem('profilePicture') || ''
        setProfilePicture(nextPicture)
        localStorage.setItem('profilePicture', nextPicture)
      } catch (error) {
        console.debug('Profile picture unavailable:', error.message)
        setProfilePicture(localStorage.getItem('profilePicture') || '')
      }
    }

    syncLoginState()
    window.addEventListener('focus', syncLoginState)
    window.addEventListener('storage', syncLoginState)

    return () => {
      window.removeEventListener('focus', syncLoginState)
      window.removeEventListener('storage', syncLoginState)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('profilePicture')
    localStorage.removeItem('isAdmin')
    // Notify same-tab listeners that auth state changed.
    window.dispatchEvent(new Event('storage'))
    navigate('/')
  }

  const handleProfileClick = () => {
    if (localStorage.getItem('userId')) {
      navigate('/profile')
      return
    }
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">Book Buddies</Link>
        </div>

        <ul className="navbar-menu">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/">Search</Link></li>
          <li className="navbar-messages-item">
            <Link to="/messages">My Messages</Link>
            {notifs > 0 && (
              <span className="navbar-notif">{notifs}</span>
            )}
          </li>
        </ul>

        <div className="navbar-actions">
          {isLoggedIn && (
            <button className="navbar-logout" onClick={handleLogout}>
              Logout
            </button>
          )}
          <button className="navbar-profile" onClick={handleProfileClick} title="View Profile">
            <img
              src={profilePicture ? (profilePicture.startsWith('/') ? `http://localhost:8800${profilePicture}` : profilePicture) : 'https://placehold.co/40x40'}
              alt="Profile"
            />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar


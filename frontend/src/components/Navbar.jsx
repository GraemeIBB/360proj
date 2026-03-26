import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const [notifs, setNotifs] = useState(1)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetch("http://localhost:8080/notif")
      .then(res => res.json())
      .then(data => setNotifs(data))
  }, [])

  useEffect(() => {
    const syncLoginState = () => {
      setIsLoggedIn(Boolean(localStorage.getItem('userId')))
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
          <li><Link to="/post-book">My Listings</Link></li>
          <li className="navbar-messages-item">
            <Link to="/">My Messages</Link>
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
            <img src="https://placehold.co/40x40" alt="Profile" />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar


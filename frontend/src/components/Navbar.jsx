import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const [notifs, setNotifs] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    fetch("http://localhost:8080/notif")
      .then(res => res.json())
      .then(data => setNotifs(data))
  }, [])

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">Book Buddies</Link>
        </div>

        <ul className="navbar-menu">
          <li><Link to="/">Home</Link></li>
          <li><a href="search">Search</a></li>
          <li><a href="listings">My Listings</a></li>
          <li className="navbar-messages-item">
            <a href="messages">My Messages</a>
            {notifs > 0 && (
              <span className="navbar-notif">{notifs}</span>
            )}
          </li>
        </ul>

        <div className="navbar-actions">
          <button className="navbar-profile" onClick={() => navigate('/login')}>
            <img src="https://placehold.co/40x40" alt="Profile" />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar


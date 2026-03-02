import './Navbar.css'

function Navbar({ notifCount = 0 }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <a href="/">Book Buddies</a>
        </div>

        <ul className="navbar-menu">
          <li><a href="home">Home</a></li>
          <li><a href="search">Search</a></li>
          <li><a href="listings">My Listings</a></li>
          <li className="navbar-messages-item">
            <a href="messages">My Messages</a>
            {notifCount > 0 && (
              <span className="navbar-notif">{notifCount}</span>
            )}
          </li>
        </ul>

        <div className="navbar-actions">
          <button className="navbar-profile" onClick={() => window.location.href = "/profile"}>
            <img src="https://placehold.co/40x40" alt="Profile" />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar


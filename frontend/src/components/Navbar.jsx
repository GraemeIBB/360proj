import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <a href="/">MyApp</a>
        </div>
        
        <ul className="navbar-menu">
          <li><a href="home">Home</a></li>
          <li><a href="search">Search</a></li>
          <li><a href="listings">My Listings </a></li>
          <li><a href="profile">Profile</a></li>
        </ul>
        
     </div>
    </nav>
  )
}

export default Navbar


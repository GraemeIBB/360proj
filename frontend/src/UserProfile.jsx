import { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Button from './components/Button';
import Sidebar from './components/Sidebar';
import './UserProfile.css';
import { User } from 'lucide-react';

function UserProfile() {
  const sidebarRef = useRef(null);
  //TODO: Replace with actual user data from backend, hardcoded for now
  const [username, setUsername] = useState('JaxonHay');
  const [password, setPassword] = useState('••••••••');
  const [city, setCity] = useState('Kelowna');
  
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingCity, setEditingCity] = useState(false);
  
  const [tempUsername, setTempUsername] = useState(username);
  const [tempPassword, setTempPassword] = useState(password);
  const [tempCity, setTempCity] = useState(city);

  // Track what content the sidebar is currently showing
  const [viewMode, setViewMode] = useState('default');
  const [sidebarContent, setSidebarContent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const displayDefaultSidebarContent = () => {
    setViewMode('default');
    setSidebarContent(
    <div>
        <h2>Welcome, {username}!</h2>
        <p>Use the sidebar to navigate your profile settings and actions.</p>
    </div>
    );
  };

  const handleSidebarToggle = (isOpen) => {
    setIsSidebarOpen(isOpen);
  };

  const handleSaveUsername = () => {
    setUsername(tempUsername);
    setEditingUsername(false);
  };

  const handleSavePassword = () => {
    setPassword(tempPassword);
    setEditingPassword(false);
  };

  const handleSaveCity = () => {
    setCity(tempCity);
    setEditingCity(false);
  };

  const handleCancelUsername = () => {
    setTempUsername(username);
    setEditingUsername(false);
  };

  const handleCancelPassword = () => {
    setTempPassword(password);
    setEditingPassword(false);
  };

  const handleCancelCity = () => {
    setTempCity(city);
    setEditingCity(false);
  };

  const handleViewTransactionHistory = () => {
    // TODO: implement viewing the transaction history in the sidebar
    setSidebarContent(
      <div>
        <h2>Your Transaction History</h2>
        <p>Here you can view your past transactions.</p>
      </div>
    );

    // Only toggle if we aren't already looking at transactions
    if (sidebarRef.current && isSidebarOpen && viewMode !== 'transactions') {
      // don't toggle since we're already open, just update content
    } else {
      sidebarRef.current.toggle();
    }
    setViewMode('transactions');
  };

  const handleViewBookPostings = () => {
    // TODO: implement viewing the user's book postings in the sidebar
    setSidebarContent(
      <div>
        <h2>Your Book Postings</h2>
        <p>Here you can view and manage your book postings.</p>
      </div>
    );

    // Only toggle if we aren't already looking at book postings
    if (sidebarRef.current && isSidebarOpen && viewMode !== 'bookPostings') {
      // don't toggle since we're already open, just update content
    } else {
      sidebarRef.current.toggle();
    }
    setViewMode('bookPostings');
  };

    const handleChangeProfilePicture = () => {
        // TODO: Implement profile picture change functionality
        console.log('Change profile picture');
    };

    useEffect(() => {
        displayDefaultSidebarContent();
    }, []);

  return (
    <div className={`user-profile-container${isSidebarOpen ? ' sidebar-open' : ''}`}>
      <Header />
      <Sidebar ref={sidebarRef} onToggle={handleSidebarToggle}>
        {sidebarContent}
      </Sidebar>
      <div className="profile-content">
        <h1>User Profile</h1>
        
        <div className="profile-wrapper">
          <div className="profile-left">
            <div className="profile-section">
              <div className="profile-field">
                <label>Username:</label>
                {editingUsername ? (
                  <div className="edit-field">
                    <input
                      type="text"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                    />
                    <button onClick={handleSaveUsername}>Save</button>
                    <button onClick={handleCancelUsername}>Cancel</button>
                  </div>
                ) : (
                  <div className="display-field">
                    <span>{username}</span>
                    <button
                      className="change-btn"
                      onClick={() => {
                        setTempUsername(username);
                        setEditingUsername(true);
                      }}
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              <div className="profile-field">
                <label>Password:</label>
                {editingPassword ? (
                  <div className="edit-field">
                    <input
                      type="password"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                    />
                    <button onClick={handleSavePassword}>Save</button>
                    <button onClick={handleCancelPassword}>Cancel</button>
                  </div>
                ) : (
                  <div className="display-field">
                    <span>{password}</span>
                    <button
                      className="change-btn"
                      onClick={() => {
                        setTempPassword(password);
                        setEditingPassword(true);
                      }}
                    >Change</button>
                  </div>
                )}
              </div>

              <div className="profile-field">
                <label>City Location:</label>
                {editingCity ? (
                  <div className="edit-field">
                    <input
                      type="text"
                      value={tempCity}
                      onChange={(e) => setTempCity(e.target.value)}
                    />
                    <button onClick={handleSaveCity}>Save</button>
                    <button onClick={handleCancelCity}>Cancel</button>
                  </div>
                ) : (
                  <div className="display-field">
                    <span>{city}</span>
                    <button
                      className="change-btn"
                      onClick={() => {
                        setTempCity(city);
                        setEditingCity(true);
                      }}
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="profile-right">
            <div className="profile-picture-section">
              <div className="profile-picture-container">
                <User size={120} strokeWidth={1.5} />
              </div>
              <button className="change-picture-btn" onClick={handleChangeProfilePicture}>Change Profile Picture</button>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <Button
            title="View Transaction History"
            onClick={handleViewTransactionHistory}
          />
          <Button
            title="View Your Book Postings"
            onClick={handleViewBookPostings}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default UserProfile;
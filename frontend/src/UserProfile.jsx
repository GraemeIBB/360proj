import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Button from './components/Button';
import Sidebar from './components/Sidebar';
import './UserProfile.css';
import { User } from 'lucide-react';

function UserProfile() {
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  
  // User profile state - will be populated from backend on mount
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  
  // Edit mode toggles for each field
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingCity, setEditingCity] = useState(false);
  
  // Temporary state for field edits before saving
  const [tempUsername, setTempUsername] = useState(username);
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

  // Handle saving username changes
  const handleSaveUsername = () => {
    setUsername(tempUsername);
    setEditingUsername(false);
    // TODO: Send updated username to backend
  };

  // Handle saving city changes
  const handleSaveCity = () => {
    setCity(tempCity);
    setEditingCity(false);
    // TODO: Send updated city to backend
  };

  // Discard username changes and revert to original
  const handleCancelUsername = () => {
    setTempUsername(username);
    setEditingUsername(false);
  };

  // Discard city changes and revert to original
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
        // Fetch user data from backend when component loads
        const userId = localStorage.getItem('userId');
      const cachedUsername = localStorage.getItem('username') || '';

      if (!userId) {
        navigate('/login');
        return;
      }

      if (cachedUsername) {
        setUsername(cachedUsername);
        setTempUsername(cachedUsername);
      }
        
      // Normalizes API payload shape and hydrates all profile fields in one place.
      const applyUserData = (data) => {
        // Some older records use firstname/lastname instead of firstName/lastName.
        const nextUsername = data.username || cachedUsername || '';
        const nextCity = data.city || 'Kelowna';

        setUsername(nextUsername);
        setEmail(data.email || '');
        setFirstName(data.firstName || data.firstname || '');
        setLastName(data.lastName || data.lastname || '');
        setCity(nextCity);
        setTempUsername(nextUsername);
        setTempCity(nextCity);
      };

      // Fallback path when /users/:id fails: load users list and find current user by cached username.
      // This prevents blank profile fields if userId is stale or missing after refresh/navigation.
      const fetchByUsernameFallback = () => {
        if (!cachedUsername) {
          // No username means we have no safe key to match a user record from the list endpoint.
          return;
        }

        fetch('http://localhost:8800/users', { cache: 'no-store' })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch users list: ${response.status}`);
            }
            return response.json();
          })
          .then(payload => {
            const users = Array.isArray(payload) ? payload : (payload.users || []);
            // Match exact username from login/localStorage to pick the correct profile row.
            const match = users.find((u) => (u.username || '') === cachedUsername);
            if (match) {
              applyUserData(match);
            }
          })
          .catch(err => {
            console.error('Error loading profile from fallback users list:', err);
          });
      };

      // Call backend to get user details by ID (excluding password for security)
      fetch(`http://localhost:8800/users/${userId}`, { cache: 'no-store' })// do not cache, always get fresh data, gaurentees up to date
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch user: ${response.status}`);
          }
          return response.json();
        })
        .then(applyUserData)
        .catch(err => {
          console.error('Error loading user profile by id:', err);
          // If id lookup fails, retry via username list lookup.
          fetchByUsernameFallback();
        });

        // Display default sidebar content with user's actual username
        displayDefaultSidebarContent();
      }, [navigate]);

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
                <label>Email:</label>
                <div className="display-field">
                  <span>{email}</span>
                </div>
              </div>

              <div className="profile-field">
                <label>First Name:</label>
                <div className="display-field">
                  <span>{firstName}</span>
                </div>
              </div>

              <div className="profile-field">
                <label>Last Name:</label>
                <div className="display-field">
                  <span>{lastName}</span>
                </div>
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
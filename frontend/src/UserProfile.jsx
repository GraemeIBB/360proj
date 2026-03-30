
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
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Edit mode toggles for each field
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);

  // Temporary state for edits
  const [tempUsername, setTempUsername] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [tempLocation, setTempLocation] = useState('');

  // Sidebar state
  const [sidebarContent, setSidebarContent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load user data on mount
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const cachedUsername = localStorage.getItem('username') || '';
    if (!userId) {
      navigate('/login');
      return;
    }

    // Helper to apply user data
    const applyUserData = (data) => {
      setUsername(data.username || cachedUsername || '');
      setEmail(data.email || '');
      setLocation(data.location || '');
      setFirstName(data.firstName || data.firstname || '');
      setLastName(data.lastName || data.lastname || '');
      setTempUsername(data.username || cachedUsername || '');
      setTempEmail(data.email || '');
      setTempPassword('');
      setTempLocation(data.location || '');
    };

    // Fallback fetch by username
    const fetchByUsernameFallback = () => {
      if (!cachedUsername) return;
      fetch('http://localhost:8800/users', { cache: 'no-store' })
        .then(res => res.json())
        .then(payload => {
          const users = Array.isArray(payload) ? payload : (payload.users || []);
          const match = users.find((u) => (u.username || '') === cachedUsername);
          if (match) applyUserData(match);
        })
        .catch(() => {});
    };

    fetch(`http://localhost:8800/users/${userId}`, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(applyUserData)
      .catch(fetchByUsernameFallback);
  }, [navigate]);

  // Sidebar toggle
  const handleSidebarToggle = (isOpen) => setIsSidebarOpen(isOpen);


  // Save handlers (with backend update)
  const userId = localStorage.getItem('userId');
  const [statusMsg, setStatusMsg] = useState('');

  // Helper to update user field
  const updateUserField = async (field, value) => {
    if (!userId) return;
    setStatusMsg('');
    try {
      const res = await fetch(`http://localhost:8800/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Update failed');
      }
      setStatusMsg('Profile updated!');
    } catch (err) {
      setStatusMsg(err.message || 'Update failed');
    }
  };

  const handleSaveUsername = async () => {
    await updateUserField('username', tempUsername);
    setUsername(tempUsername);
    setEditingUsername(false);
  };
  const handleSaveEmail = async () => {
    await updateUserField('email', tempEmail);
    setEmail(tempEmail);
    setEditingEmail(false);
  };
  const handleSavePassword = async () => {
    await updateUserField('password', tempPassword);
    setPassword(tempPassword);
    setEditingPassword(false);
  };
  const handleSaveLocation = async () => {
    await updateUserField('location', tempLocation);
    setLocation(tempLocation);
    setEditingLocation(false);
  };

  // Cancel handlers
  const handleCancelUsername = () => { setTempUsername(username); setEditingUsername(false); };
  const handleCancelEmail = () => { setTempEmail(email); setEditingEmail(false); };
  const handleCancelPassword = () => { setTempPassword(''); setEditingPassword(false); };
  const handleCancelLocation = () => { setTempLocation(location); setEditingLocation(false); };

  // Sidebar content actions (unchanged)
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

  // Book postings state
  const [userBooks, setUserBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [booksError, setBooksError] = useState('');
  const [viewMode, setViewMode] = useState('');

  const handleViewBookPostings = async () => {
    setLoadingBooks(true);
    setBooksError('');
    try {
      const res = await fetch('http://localhost:8800/books', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch books');
      // If we fetched a data array, filter the results to only include books postings owned by the user
      const filtered = (Array.isArray(data) ? data : []).filter(
        (book) => {
          // book.owner can be string or object with _id
          if (!book.owner) return false;
          if (typeof book.owner === 'string') return book.owner === userId;
          if (typeof book.owner === 'object' && book.owner._id) return book.owner._id === userId;
          return false;
        }
      );
      setUserBooks(filtered);
      setSidebarContent(
        <div>
          <h2>Your Book Postings</h2>
          {loadingBooks ? (
            <p>Loading...</p>
          ) : booksError ? (
            <p className="sidebar-error">{booksError}</p>
          ) : filtered.length === 0 ? (
            <p>You have no book postings.</p>
          ) : (
            // Display list of user's book postings as clickable cards that navigate to the book details page
            <div className="sidebar-book-list">
              {filtered.map((book) => {
                const coverImage = book.coverImage || 'https://via.placeholder.com/80x120?text=No+Cover';
                return (
                  <div
                    key={book._id}
                    className="sidebar-book-card"
                    onClick={() => navigate(`/books/${book._id}`)}
                  >
                    <img src={coverImage} alt={book.title} className="sidebar-book-cover" />
                    <div className="sidebar-book-info">
                      <div className="sidebar-book-title">{book.title}</div>
                      <div className="sidebar-book-author">{book.author}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    } catch (err) {
      setBooksError(err.message || 'Failed to load books');
      setSidebarContent(
        <div>
          <h2>Your Book Postings</h2>
          <p className="sidebar-error">{err.message || 'Failed to load books'}</p>
        </div>
      );
    } finally {
      setLoadingBooks(false);
    }
    // Only toggle if we aren't already looking at book postings
    if (sidebarRef.current && isSidebarOpen && viewMode === 'bookPostings') {
      // already open and correct view
    } else {
      sidebarRef.current.toggle();
    }
    setViewMode('bookPostings');
  };
  const handleChangeProfilePicture = () => {
    // TODO: Implement profile picture change functionality
    console.log('Change profile picture');
  };

  return (
    <div className={`user-profile-container${isSidebarOpen ? ' sidebar-open' : ''}`}>
      <Header />
      <Sidebar ref={sidebarRef} onToggle={handleSidebarToggle}>
        {sidebarContent}
      </Sidebar>
      <div className="profile-content">
        <h1>User Profile</h1>
        {statusMsg && <div className="status-message">{statusMsg}</div>}
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
                {editingEmail ? (
                  <div className="edit-field">
                    <input type="email" value={tempEmail} onChange={e => setTempEmail(e.target.value)} />
                    <button onClick={handleSaveEmail}>Save</button>
                    <button onClick={handleCancelEmail}>Cancel</button>
                  </div>
                ) : (
                  <div className="display-field">
                    <span>{email}</span>
                    <button className="change-btn" onClick={() => { setTempEmail(email); setEditingEmail(true); }}>Change</button>
                  </div>
                )}
              </div>
              {/* Password */}
              <div className="profile-field">
                <label>Password:</label>
                {editingPassword ? (
                  <div className="edit-field">
                    <input type="password" value={tempPassword} onChange={e => setTempPassword(e.target.value)} />
                    <button onClick={handleSavePassword}>Save</button>
                    <button onClick={handleCancelPassword}>Cancel</button>
                  </div>
                ) : (
                  <div className="display-field">
                    <span>********</span>
                    <button className="change-btn" onClick={() => { 
                      setTempPassword(''); setEditingPassword(true); }}>Change</button>
                  </div>
                )}
              </div>
              {/* Location */}
              <div className="profile-field">
                <label>Location:</label>
                {editingLocation ? (
                  <div className="edit-field">
                    <input type="text" value={tempLocation} onChange={e => setTempLocation(e.target.value)} />
                    <button onClick={handleSaveLocation}>Save</button>
                    <button onClick={handleCancelLocation}>Cancel</button>
                  </div>
                ) : (
                  <div className="display-field">
                    <span>{location}</span>
                    <button className="change-btn" onClick={() => {
                      setTempLocation(location); setEditingLocation(true); }}>Change</button>
                  </div>
                )}
              </div>
              {/* First Name (not editable) */}
              <div className="profile-field">
                <label>First Name:</label>
                <div className="display-field">
                  <span>{firstName}</span>
                </div>
              </div>
              {/* Last Name (not editable) */}
              <div className="profile-field">
                <label>Last Name:</label>
                <div className="display-field">
                  <span>{lastName}</span>
                </div>
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
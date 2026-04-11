
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
  const profileFileInputRef = useRef(null);
  
  // User profile state - will be populated from backend on mount
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [uploadingPicture, setUploadingPicture] = useState(false);

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
      setProfilePicture(data.profilePicture || '');
      localStorage.setItem('profilePicture', data.profilePicture || '');
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
        .catch((err) => {
          alert(err?.message || 'Failed to fetch user by username');
        });
    };

    fetch(`http://localhost:8800/users/${userId}`, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user profile');
        return res.json();
      })
      .then(applyUserData)
      .catch((err) => {
        alert(err?.message || 'Failed to fetch user profile');
        fetchByUsernameFallback();
      });
  }, [navigate]);

  // Sidebar toggle
  const handleSidebarToggle = (isOpen) => setIsSidebarOpen(isOpen);


  // Save handlers (with backend update)
  const userId = localStorage.getItem('userId');
  const [statusMsg, setStatusMsg] = useState('');

  // Helper to update user field
  // Improved: returns {user, error} and sets statusMsg appropriately
  const updateUserField = async (field, value) => {
    if (!userId) {
      alert('No user ID, sign in first');
      return { user: null, error: 'No user ID' };
    }
    setStatusMsg('');
    try {
      const res = await fetch(`http://localhost:8800/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Update failed');
        setStatusMsg(data.error || 'Update failed');
        return { user: null, error: data.error || 'Update failed' };
      }
      setStatusMsg('Profile updated!');
      return { user: data.user, error: null };
    } catch (err) {
      alert(err.message || 'Update failed');
      setStatusMsg(err.message || 'Update failed');
      return { user: null, error: err.message || 'Update failed' };
    }
  };

  const handleSaveUsername = async () => {
    const { user, error } = await updateUserField('username', tempUsername);
    if (!error && user) {
      setUsername(user.username);
      setTempUsername(user.username);
      setEditingUsername(false);
    }
  };
  const handleSaveEmail = async () => {
    const { user, error } = await updateUserField('email', tempEmail);
    if (!error && user) {
      setEmail(user.email);
      setTempEmail(user.email);
      setEditingEmail(false);
    }
  };
  const handleSavePassword = async () => {
    const { user, error } = await updateUserField('password', tempPassword);
    if (!error && user) {
      setPassword(''); // Don't store password in state
      setTempPassword('');
      setEditingPassword(false);
    }
  };
  const handleSaveLocation = async () => {
    const { user, error } = await updateUserField('location', tempLocation);
    if (!error && user) {
      setLocation(user.location);
      setTempLocation(user.location);
      setEditingLocation(false);
    }
  };

  // Cancel handlers
  const handleCancelUsername = () => { setTempUsername(username); setEditingUsername(false); };
  const handleCancelEmail = () => { setTempEmail(email); setEditingEmail(false); };
  const handleCancelPassword = () => { setTempPassword(''); setEditingPassword(false); };
  const handleCancelLocation = () => { setTempLocation(location); setEditingLocation(false); };


  // Book postings state
  const [userBooks, setUserBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [booksError, setBooksError] = useState('');
  const [viewMode, setViewMode] = useState('');

  // Fetch and show book postings in sidebar
  const fetchAndSetBookPostings = async () => {
    setLoadingBooks(true);
    setBooksError('');
    try {
      const res = await fetch('http://localhost:8800/books', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch books');
      const filtered = (Array.isArray(data) ? data : []).filter(
        (book) => {
          if (!book.owner) return false;
          if (typeof book.owner === 'string') return book.owner === userId;
          if (typeof book.owner === 'object' && book.owner._id) return book.owner._id === userId;
          return false;
        }
      );
      setUserBooks(filtered);
    } catch (err) {
      alert(err.message || 'Failed to load books');
      setBooksError(err.message || 'Failed to load books');
    } finally {
      setLoadingBooks(false);
    }
  };

  // Fetch user book postings on mount so they're ready when sidebar opens
  useEffect(() => {
    fetchAndSetBookPostings();
  }, []);

  // Button handler: open sidebar if not open, always refresh book postings
  const handleViewBookPostings = async () => {
      sidebarRef.current.toggle();
  };
  const handleChangeProfilePicture = () => {
    if (profileFileInputRef.current) {
      profileFileInputRef.current.click();
    }
  };

  const handleProfilePictureSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !userId) {
      return;
    }

    setUploadingPicture(true);
    setStatusMsg('');

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const res = await fetch(`http://localhost:8800/users/${userId}/profile-picture`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || data?.message || 'Failed to upload profile picture');
        throw new Error(data?.error || data?.message || 'Failed to upload profile picture');
      }

      const nextPicture = data?.profilePicture || data?.user?.profilePicture || '';
      setProfilePicture(nextPicture);
      localStorage.setItem('profilePicture', nextPicture);
      window.dispatchEvent(new Event('storage'));
      setStatusMsg('Profile picture updated!');
    } catch (err) {
      alert(err.message || 'Failed to upload profile picture');
      setStatusMsg(err.message || 'Failed to upload profile picture');
    } finally {
      event.target.value = '';
      setUploadingPicture(false);
    }
  };

  const profilePictureSrc = profilePicture
    ? (profilePicture.startsWith('/') ? `http://localhost:8800${profilePicture}` : profilePicture)
    : '';

  return (
    <div className={`user-profile-container${isSidebarOpen ? ' sidebar-open' : ''}`}>
      <Header />
      <Sidebar ref={sidebarRef} onToggle={handleSidebarToggle}>
        <div>
          <h2>Your Book Postings</h2>
          {loadingBooks ? (
            <p>Loading...</p>
          ) : booksError ? (
            <p className="sidebar-error">{booksError}</p>
          ) : userBooks.length === 0 ? (
            <p>You have no book postings.</p>
          ) : (
            <div className="sidebar-book-list">
              {userBooks.map((book) => {
                const raw = book.coverImage;
                const fallback = "http://localhost:8800/images/Book.png";
                const coverImage = !raw
                  ? fallback
                  : (raw.startsWith('/') ? `http://localhost:8800${raw}` : raw);
                return (
                  <div
                    key={book._id}
                    className="sidebar-book-card"
                    onClick={() => navigate(`/books/${book._id}`)}
                  >
                    <img
                      src={coverImage}
                      alt={book.title}
                      className="sidebar-book-cover"
                      onError={e => { e.target.onerror = null; e.target.src = fallback; }}
                    />
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
              {localStorage.getItem('isAdmin') === 'true' && (
                <button className="change-picture-btn admin-panel-btn" onClick={() => navigate('/admin')}>Admin Panel</button>
              )}
              <div className="profile-picture-container">
                {profilePictureSrc ? (
                  <img src={profilePictureSrc} alt="Profile" className="profile-picture-image" />
                ) : (
                  <User size={120} strokeWidth={1.5} />
                )}
              </div>
              <input
                ref={profileFileInputRef}
                type="file"
                accept="image/*"
                className="profile-picture-input"
                onChange={handleProfilePictureSelected}
              />
              <button className="change-picture-btn" onClick={handleChangeProfilePicture} disabled={uploadingPicture}>
                {uploadingPicture ? 'Uploading...' : 'Change Profile Picture'}
              </button>
            </div>
          </div>
        </div>

        <div className="action-buttons">
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
import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Button from './components/Button';
import './Login.css';


function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [status, setStatus] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordMismatch, setShowPasswordMismatch] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (password !== confirmPassword) {
      setShowPasswordMismatch(true);
      return;
    } else {
      setShowPasswordMismatch(false);
    }

    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('location', location);
      formData.append('username', username);
      formData.append('password', password);
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      const response = await fetch('http://localhost:8800/users', {
        method: 'POST',
        body: formData,
      });

      // Backend may return HTML/text on server errors, so parse safely.
      const rawBody = await response.text();
      let data = {};
      try {
        data = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        data = { message: rawBody };
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.details?.[0] || data?.message || 'Failed to create user';
        setStatus({ type: 'error', message: errorMessage });
        alert(`User creation failed: ${errorMessage}`);
        return;
      }

      setStatus({ type: 'success', message: 'User created successfully!' });
      alert('User created successfully!');

      setFirstName('');
      setLastName('');
      setEmail('');
      setLocation('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setProfileImage(null);

      // log in the user after signup
      fetch('http://localhost:8800/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })
        .then(async response => {
          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username || '');
            alert('Login successful!');
            navigate('/');
          } else {
            const data = await response.json();
            const errorMsg = data?.message || 'Invalid username or password';
            alert('Login failed: ' + errorMsg);
          }
        })
        .catch(error => {
          console.log('Login error:', error);
          alert('Login failed: Network error. Could not reach server.');
        });
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Could not reach server.' });
      alert('User creation failed: Network error. Could not reach server.');
    }
  };

  return (
    <div className="login-container">
      <Header />
      <div className="login-form-wrapper">
        <div className="login-form">
          <h1>Create User</h1>

          {status && (
            <div className={`status-message ${status.type}`}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Your Location</label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="ex. Vancouver"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setShowPasswordMismatch(false);
                }}
                placeholder="Confirm Password"
                required
              />

              {/* Password mismatch message below confirm password field */}
              <div className={`confirm-password-error-msg ${showPasswordMismatch ? 'visible' : ''}`}>
                passwords do not match
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="profileImage">Profile Photo</label>
              <input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={e => setProfileImage(e.target.files[0])}
              />
            </div>
            <Button type="submit" title="Create user" />
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default SignUp;

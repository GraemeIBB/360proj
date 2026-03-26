import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Button from './components/Button';
import './Login.css';

function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus(null);

    try {
      const response = await fetch('http://localhost:8800/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, email, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.error || data?.details?.[0] || data?.message || 'Failed to create user';
        setStatus({ type: 'error', message: errorMessage });
        return;
      }

      setStatus({ type: 'success', message: 'User created successfully!' });
      setFirstName('');
      setLastName('');
      setEmail('');
        setUsername('');
        setPassword('');
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Could not reach server.' });
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

            <Button type="submit" title="Create user" />
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default SignUp;

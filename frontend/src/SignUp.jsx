import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Button from './components/Button';
import './Login.css';

function SignUp() {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus(null);

    // TODO: make sure this works, on success log user in and nagivate back to home page
    try {
      const response = await fetch('http://localhost:8000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstname, lastname, email, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus({ type: 'error', message: data.message || 'Failed to create user' });
        return;
      }

      setStatus({ type: 'success', message: 'User created successfully!' });
      setFirstname('');
      setLastname('');
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
              <label htmlFor="firstname">First name</label>
              <input
                id="firstname"
                type="text"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                placeholder="First name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastname">Last name</label>
              <input
                id="lastname"
                type="text"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
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
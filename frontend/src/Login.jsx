import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Button from './components/Button';
import './Login.css';

     function  Login () {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Login attempted with:', { username, password });
        
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
                // Store the user ID from login response so profile page can fetch the user data
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('username', data.username || '');
                localStorage.setItem('isAdmin', data.isAdmin ? 'true' : 'false');
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
    };

    return (
        <div className="login-container">
            <Header />
            <div id="test"></div>
            <div className="login-form-wrapper">
                <div className="login-form">
                    <h1>Login</h1>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">Username:</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password:</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                        <Button type="submit" title="Submit" />
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default Login;

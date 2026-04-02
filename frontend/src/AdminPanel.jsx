import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import './AdminPanel.css';

const API = 'http://localhost:8800';

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function AdminPanel() {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    const [tab, setTab] = useState('accounts');
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [storage, setStorage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userId || !isAdmin) {
            navigate('/');
        }
    }, [userId, isAdmin, navigate]);

    const headers = { 'x-user-id': userId };

    const fetchTab = async (name) => {
        setTab(name);
        setError('');
        setLoading(true);
        try {
            if (name === 'accounts' && !users.length) {
                const res = await fetch(`${API}/admin/users`, { headers });
                if (!res.ok) throw new Error((await res.json()).error);
                setUsers(await res.json());
            } else if (name === 'usage' && !stats) {
                const res = await fetch(`${API}/admin/stats`, { headers });
                if (!res.ok) throw new Error((await res.json()).error);
                setStats(await res.json());
            } else if (name === 'storage' && !storage) {
                const res = await fetch(`${API}/admin/storage`, { headers });
                if (!res.ok) throw new Error((await res.json()).error);
                setStorage(await res.json());
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId && isAdmin) fetchTab('accounts');
    }, []);

    if (!userId || !isAdmin) return null;

    return (
        <div className="admin-container">
            <Header />
            <div className="admin-content">
                <h1>Admin Panel</h1>
                <div className="admin-tabs">
                    <button className={tab === 'accounts' ? 'active' : ''} onClick={() => fetchTab('accounts')}>Accounts</button>
                    <button className={tab === 'usage' ? 'active' : ''} onClick={() => fetchTab('usage')}>Site Usage</button>
                    <button className={tab === 'storage' ? 'active' : ''} onClick={() => fetchTab('storage')}>Storage</button>
                </div>

                {loading && <p className="admin-status">Loading...</p>}
                {error && <p className="admin-error">{error}</p>}

                {/* ACCOUNTS */}
                {tab === 'accounts' && !loading && !error && (
                    <div className="admin-section">
                        <h2>All Accounts <span className="admin-count">({users.length})</span></h2>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Name</th>
                                    <th>Location</th>
                                    <th>Admin</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id}>
                                        <td>{u.username}</td>
                                        <td>{u.email}</td>
                                        <td>{u.firstName} {u.lastName}</td>
                                        <td>{u.location}</td>
                                        <td className={u.admin ? 'admin-yes' : 'admin-no'}>{u.admin ? 'Yes' : 'No'}</td>
                                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* SITE USAGE */}
                {tab === 'usage' && !loading && !error && stats && (
                    <div className="admin-section">
                        <h2>Site Usage</h2>
                        <div className="admin-stat-grid">
                            <div className="admin-stat-card">
                                <span className="stat-value">{stats.totalUsers}</span>
                                <span className="stat-label">Total Users</span>
                            </div>
                            <div className="admin-stat-card">
                                <span className="stat-value">{stats.totalBooks}</span>
                                <span className="stat-label">Total Listings</span>
                            </div>
                            <div className="admin-stat-card">
                                <span className="stat-value">{stats.availableBooks}</span>
                                <span className="stat-label">Available</span>
                            </div>
                            <div className="admin-stat-card">
                                <span className="stat-value">{stats.unavailableBooks}</span>
                                <span className="stat-label">Unavailable</span>
                            </div>
                        </div>

                        <div className="admin-breakdown-row">
                            <div className="admin-breakdown">
                                <h3>By Genre</h3>
                                <table className="admin-table">
                                    <thead><tr><th>Genre</th><th>Count</th></tr></thead>
                                    <tbody>
                                        {stats.genreBreakdown.map(g => (
                                            <tr key={g._id}><td>{g._id || 'Unset'}</td><td>{g.count}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="admin-breakdown">
                                <h3>By Condition</h3>
                                <table className="admin-table">
                                    <thead><tr><th>Condition</th><th>Count</th></tr></thead>
                                    <tbody>
                                        {stats.conditionBreakdown.map(c => (
                                            <tr key={c._id}><td>{c._id || 'Unset'}</td><td>{c.count}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* STORAGE */}
                {tab === 'storage' && !loading && !error && storage && (
                    <div className="admin-section">
                        <h2>Storage</h2>
                        <div className="admin-stat-grid">
                            <div className="admin-stat-card">
                                <span className="stat-value">{storage.gridfsFiles}</span>
                                <span className="stat-label">Cover Images</span>
                            </div>
                            <div className="admin-stat-card">
                                <span className="stat-value">{formatBytes(storage.gridfsBytes)}</span>
                                <span className="stat-label">Image Storage</span>
                            </div>
                            <div className="admin-stat-card">
                                <span className="stat-value">{formatBytes(storage.dbDataSize)}</span>
                                <span className="stat-label">DB Data Size</span>
                            </div>
                            <div className="admin-stat-card">
                                <span className="stat-value">{formatBytes(storage.dbStorageSize)}</span>
                                <span className="stat-label">DB Storage Size</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default AdminPanel;

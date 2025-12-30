import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import './ProtectedRoute.css';

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, isAuthenticated, getCredentials } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if already authenticated (in-memory only)
  useEffect(() => {
    // Check in-memory credentials - no sessionStorage access
    if (isAuthenticated()) {
      setCheckingAuth(false);
    } else {
      setCheckingAuth(false);
    }
  }, [isAuthenticated]);

  const verifyCredentials = async (user, pass) => {
    setLoading(true);
    setError(null);

    try {
      await api.verifyAuth(user, pass);
      // Store credentials in memory only - never in browser storage
      login(user, pass);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
      // Clear any stale credentials
      logout();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await verifyCredentials(username, password);
  };

  const handleLogout = () => {
    setUsername('');
    setPassword('');
    // Clear in-memory credentials only
    logout();
  };

  // Still checking authentication status
  if (checkingAuth || loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Not authenticated - show login form
  if (!isAuthenticated()) {
    return (
      <div className="protected-route-container">
        <div className="auth-login-form">
          <h1>Admin Authentication Required</h1>
          <p>Please enter your credentials to access this page</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-username">Username</label>
              <input
                type="text"
                id="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated - render children with logout option
  const showBackButton = location.pathname === '/add-user';
  const currentCredentials = getCredentials();
  const displayUsername = currentCredentials?.username || '';
  
  return (
    <div className="protected-content">
      <div className="protected-header">
        {showBackButton && (
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-back-to-leaderboard"
          >
            ← Back to Leaderboard
          </button>
        )}
        <button onClick={handleLogout} className="btn-logout">
          Logout ({displayUsername})
        </button>
      </div>
      {children}
    </div>
  );
}


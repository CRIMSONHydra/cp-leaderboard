import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import './ProtectedRoute.css';

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check sessionStorage for saved credentials
  useEffect(() => {
    const savedUsername = sessionStorage.getItem('admin_username');
    const savedPassword = sessionStorage.getItem('admin_password');
    
    if (savedUsername && savedPassword) {
      // Auto-verify saved credentials
      verifyCredentials(savedUsername, savedPassword);
    } else {
      setIsAuthenticated(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyCredentials = async (user, pass) => {
    setLoading(true);
    setError(null);

    try {
      await api.verifyAuth(user, pass);
      setIsAuthenticated(true);
      setUsername(user);
      // Store credentials in sessionStorage (cleared on browser close)
      sessionStorage.setItem('admin_username', user);
      sessionStorage.setItem('admin_password', pass);
    } catch (err) {
      setIsAuthenticated(false);
      setError(err.message || 'Invalid credentials');
      sessionStorage.removeItem('admin_username');
      sessionStorage.removeItem('admin_password');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await verifyCredentials(username, password);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    sessionStorage.removeItem('admin_username');
    sessionStorage.removeItem('admin_password');
  };

  // Still checking saved credentials
  if (isAuthenticated === null || loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Not authenticated - show login form
  if (!isAuthenticated) {
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
          Logout ({username})
        </button>
      </div>
      {children}
    </div>
  );
}


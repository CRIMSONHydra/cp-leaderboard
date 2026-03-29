import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthPages.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const returnTo = searchParams.get('returnTo') || '/spaces';

  if (isAuthenticated()) {
    navigate(returnTo, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(loginId, password);
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Sign In</h1>
        <p>Welcome back to CP Leaderboard</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-id">Username or Email</label>
            <input
              type="text"
              id="login-id"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
              autoFocus
              placeholder="Enter username or email"
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
              autoComplete="current-password"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <span>
            Don&apos;t have an account? <Link to="/register">Sign up</Link>
          </span>
        </div>

        <div className="auth-back">
          <Link to="/">Back to Leaderboard</Link>
        </div>
      </div>
    </div>
  );
}

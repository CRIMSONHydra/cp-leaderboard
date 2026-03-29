import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import './AuthPages.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset Password</h1>

        {sent ? (
          <div className="auth-success">
            <p>If an account with that email exists, we&apos;ve sent a password reset link.</p>
            <p>Check your inbox and follow the instructions.</p>
            <div className="auth-links">
              <Link to="/login">Back to Sign In</Link>
            </div>
          </div>
        ) : (
          <>
            <p>Enter your email and we&apos;ll send you a reset link</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="reset-email">Email</label>
                <input
                  type="email"
                  id="reset-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                  placeholder="your@email.com"
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="auth-links">
              <Link to="/login">Back to Sign In</Link>
            </div>
          </>
        )}

        <div className="auth-back">
          <Link to="/">Back to Leaderboard</Link>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/ratingUtils';
import './Header.css';

export default function Header({ lastUpdate, stats }) {
  const { account, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore logout errors
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-top">
          <Link to="/" className="header-brand">
            <h1 className="app-title">CP Leaderboard</h1>
          </Link>
          <nav className="header-nav">
            {isAuthenticated() ? (
              <>
                <Link to="/spaces" className="nav-link">My Spaces</Link>
                <span className="nav-user">{account?.username}</span>
                <button onClick={handleLogout} className="nav-link nav-btn">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Sign In</Link>
                <Link to="/register" className="nav-link nav-link-primary">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
        <p className="app-subtitle">
          Competitive Programming Ratings Tracker
        </p>
        <div className="header-meta">
          {stats && (
            <span className="user-count">{stats.totalUsers} users</span>
          )}
          {lastUpdate && (
            <span className="last-update">
              Updated: {formatDate(lastUpdate)}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

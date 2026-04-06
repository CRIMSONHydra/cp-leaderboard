import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { account, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore logout errors
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">CP Leaderboard</Link>
        <div className="navbar-nav">
          {isAuthenticated() ? (
            <>
              <Link to="/spaces" className="nav-link">My Spaces</Link>
              <Link to="/profile" className="nav-link nav-user-link">{account?.username}</Link>
              <button type="button" onClick={handleLogout} className="nav-link nav-btn">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Sign In</Link>
              <Link to="/register" className="nav-link nav-link-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

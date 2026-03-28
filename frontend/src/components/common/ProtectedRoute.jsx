import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import LoginForm from './LoginForm';
import './ProtectedRoute.css';

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, isAuthenticated, getCredentials } = useAuth();

  const handleLogin = async (username, password) => {
    await api.verifyAuth(username, password);
    login(username, password);
  };

  const handleLogout = () => {
    logout();
  };

  if (!isAuthenticated()) {
    return (
      <div className="protected-route-container">
        <LoginForm onLogin={handleLogin} />
      </div>
    );
  }

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

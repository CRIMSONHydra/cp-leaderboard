import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import LoginForm from './LoginForm';
import './ProtectedRoute.css';

export default function AdminProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState(null);

  const handleLogin = async (username, password) => {
    await api.verifyAuth(username, password);
    setCredentials({ username, password });
  };

  const handleLogout = () => {
    setCredentials(null);
  };

  if (!credentials) {
    return (
      <div className="protected-route-container">
        <LoginForm onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="protected-content">
      <div className="protected-header">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn-back-to-leaderboard"
        >
          Back to Leaderboard
        </button>
        <button type="button" onClick={handleLogout} className="btn-logout">
          Logout ({credentials.username})
        </button>
      </div>
      {typeof children === 'function'
        ? children(credentials)
        : children}
    </div>
  );
}

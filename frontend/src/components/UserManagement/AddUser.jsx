import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { PLATFORMS, PLATFORM_NAMES } from '../../constants/platforms';
import './AddUser.css';

const emptyHandles = () => Object.fromEntries(PLATFORMS.map(p => [p, '']));

export default function AddUser({ credentials }) {
  const username = credentials?.username || '';
  const password = credentials?.password || '';

  const [formData, setFormData] = useState({
    name: '',
    handles: emptyHandles()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const successTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setFormData({ ...formData, name: value });
    } else if (name.startsWith('handle-')) {
      const platform = name.replace('handle-', '');
      setFormData({
        ...formData,
        handles: {
          ...formData.handles,
          [platform]: value
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.name.trim()) {
      setError('User name is required');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name.trim(),
        handles: {}
      };

      Object.keys(formData.handles).forEach(platform => {
        const handle = formData.handles[platform].trim();
        if (handle) {
          userData.handles[platform] = handle;
        }
      });

      await api.addUser(userData, username, password);

      setSuccess(true);
      setFormData({
        name: '',
        handles: emptyHandles()
      });

      successTimerRef.current = setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-user-container">
      <div className="add-user-content">
        <div className="add-user-header">
          <h1>Add User to Leaderboard</h1>
          <p>Enter user information and platform handles to add them to the leaderboard</p>
        </div>

        <form className="add-user-form" onSubmit={handleSubmit}>
        <div className="user-section">
          <h2>User Information</h2>
          <div className="form-group">
            <label htmlFor="name">
              Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Enter user's name"
            />
          </div>

          <div className="handles-section">
            <h3>Platform Handles (Optional)</h3>
            {PLATFORMS.map(platform => (
              <div className="form-group" key={platform}>
                <label htmlFor={`handle-${platform}`}>{PLATFORM_NAMES[platform]}</label>
                <input
                  type="text"
                  id={`handle-${platform}`}
                  name={`handle-${platform}`}
                  value={formData.handles[platform]}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="e.g., tourist"
                />
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {success && (
          <div className="success-message">
            User added successfully!
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add User'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}

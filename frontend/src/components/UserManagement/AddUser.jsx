import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './AddUser.css';

export default function AddUser() {
  const navigate = useNavigate();
  // Get credentials from sessionStorage (set by ProtectedRoute)
  const username = sessionStorage.getItem('admin_username') || '';
  const password = sessionStorage.getItem('admin_password') || '';
  
  const [formData, setFormData] = useState({
    name: '',
    handles: {
      codeforces: '',
      atcoder: '',
      codechef: '',
      leetcode: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
      // Prepare user data, removing empty handles
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
      // Reset form
      setFormData({
        name: '',
        handles: {
          codeforces: '',
          atcoder: '',
          codechef: '',
          leetcode: ''
        }
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
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
            <div className="form-group">
              <label htmlFor="handle-codeforces">Codeforces</label>
              <input
                type="text"
                id="handle-codeforces"
                name="handle-codeforces"
                value={formData.handles.codeforces}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="e.g., tourist"
              />
            </div>
            <div className="form-group">
              <label htmlFor="handle-atcoder">AtCoder</label>
              <input
                type="text"
                id="handle-atcoder"
                name="handle-atcoder"
                value={formData.handles.atcoder}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="e.g., tourist"
              />
            </div>
            <div className="form-group">
              <label htmlFor="handle-codechef">CodeChef</label>
              <input
                type="text"
                id="handle-codechef"
                name="handle-codechef"
                value={formData.handles.codechef}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="e.g., tourist"
              />
            </div>
            <div className="form-group">
              <label htmlFor="handle-leetcode">LeetCode</label>
              <input
                type="text"
                id="handle-leetcode"
                name="handle-leetcode"
                value={formData.handles.leetcode}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="e.g., tourist"
              />
            </div>
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
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
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


import { useState } from 'react';
import { spacesApi } from '../../services/api';
import { PLATFORMS, PLATFORM_NAMES } from '../../constants/platforms';
import './Spaces.css';

export default function AddUserToSpace({ spaceId, onAdded }) {
  const [activeTab, setActiveTab] = useState('search');

  return (
    <div className="add-user-to-space">
      <h3>Add User to Space</h3>
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Search Existing
        </button>
        <button
          className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Add New
        </button>
      </div>

      {activeTab === 'search' ? (
        <SearchExistingTab spaceId={spaceId} onAdded={onAdded} />
      ) : (
        <CreateNewTab spaceId={spaceId} onAdded={onAdded} />
      )}
    </div>
  );
}

function SearchExistingTab({ spaceId, onAdded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim().length < 2) return;

    setSearching(true);
    setError(null);

    try {
      const res = await spacesApi.searchUsers(query.trim());
      setResults(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (userId) => {
    setAdding(userId);
    setError(null);

    try {
      await spacesApi.addUserToSpace(spaceId, userId);
      setResults(prev => prev.filter(u => u._id !== userId));
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="tab-content">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or handle..."
          minLength={2}
        />
        <button type="submit" className="btn btn-primary" disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="modal-error">{error}</div>}

      {results.length > 0 && (
        <div className="search-results">
          {results.map(user => (
            <div key={user._id} className="search-result-item">
              <div className="search-result-info">
                <strong>{user.name}</strong>
                <span className="search-result-score">Score: {user.aggregateScore?.toFixed(1) || 'N/A'}</span>
              </div>
              <button
                onClick={() => handleAdd(user._id)}
                className="btn btn-small"
                disabled={adding === user._id}
              >
                {adding === user._id ? 'Adding...' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateNewTab({ spaceId, onAdded }) {
  const [name, setName] = useState('');
  const [handles, setHandles] = useState(
    Object.fromEntries(PLATFORMS.map(p => [p, '']))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const hasAnyHandle = PLATFORMS.some(p => handles[p].trim());
    if (!hasAnyHandle) {
      setError('At least one platform handle is required');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: name.trim(),
        handles: Object.fromEntries(
          PLATFORMS.map(p => [p, handles[p].trim() || null]).filter(([, v]) => v)
        )
      };

      const res = await spacesApi.createAndTrackUser(spaceId, userData);

      if (res.deduplicated) {
        setSuccess(`Found existing user "${res.data.name}" with matching handles — added to space.`);
      } else {
        setSuccess(`Created and added "${res.data.name}" to space. Ratings are being fetched.`);
      }

      setName('');
      setHandles(Object.fromEntries(PLATFORMS.map(p => [p, ''])));
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <form onSubmit={handleSubmit} className="create-user-form">
        <div className="form-group">
          <label htmlFor="new-user-name">Name <span className="required">*</span></label>
          <input
            type="text"
            id="new-user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            placeholder="User's name"
          />
        </div>

        <div className="handles-grid">
          {PLATFORMS.map(platform => (
            <div className="form-group" key={platform}>
              <label htmlFor={`new-handle-${platform}`}>{PLATFORM_NAMES[platform]}</label>
              <input
                type="text"
                id={`new-handle-${platform}`}
                value={handles[platform]}
                onChange={(e) => setHandles({ ...handles, [platform]: e.target.value })}
                disabled={loading}
                placeholder="e.g., tourist"
              />
            </div>
          ))}
        </div>

        {error && <div className="modal-error">{error}</div>}
        {success && <div className="create-success">{success}</div>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Adding...' : 'Add User'}
        </button>
      </form>
    </div>
  );
}

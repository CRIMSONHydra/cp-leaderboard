import { useState } from 'react';
import { spacesApi } from '../../services/api';
import './Spaces.css';

export default function AddUserToSpace({ spaceId, onAdded }) {
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
    <div className="add-user-to-space">
      <h3>Add User to Space</h3>
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

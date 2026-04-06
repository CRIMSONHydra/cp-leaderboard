import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import { PLATFORMS, PLATFORM_NAMES, PLATFORM_URLS, PLATFORM_CHART_COLORS } from '../constants/platforms';
import { getPlatformColor, formatDate } from '../utils/ratingUtils';
import Loading from '../components/common/Loading';
import './AccountProfilePage.css';

export default function AccountProfilePage() {
  const { account, setAccount } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [spacesLoading, setSpacesLoading] = useState(true);

  useEffect(() => {
    authApi.getMySpaces()
      .then(res => setSpaces(res.data))
      .catch(() => setSpaces([]))
      .finally(() => setSpacesLoading(false));
  }, []);

  if (!account) return <Loading message="Loading profile..." />;

  return (
    <div className="profile-page">
      <h1>My Profile</h1>

      <AccountInfoSection account={account} setAccount={setAccount} />
      <CPProfileSection account={account} setAccount={setAccount} />
      <ChangePasswordSection />
      <MySpacesSection spaces={spaces} loading={spacesLoading} />
    </div>
  );
}

function AccountInfoSection({ account, setAccount }) {
  const [editField, setEditField] = useState(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const startEdit = (field) => {
    setEditField(field);
    setValue(account[field]);
    setError(null);
  };

  const cancelEdit = () => {
    setEditField(null);
    setError(null);
  };

  const saveEdit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await authApi.updateProfile({ [editField]: value });
      setAccount(prev => ({ ...prev, ...res.data }));
      setEditField(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="profile-section">
      <h2>Account Info</h2>

      <div className="profile-info-row">
        <span className="profile-label">Username</span>
        {editField === 'username' ? (
          <div className="profile-edit-inline">
            <input value={value} onChange={e => setValue(e.target.value)} disabled={saving} autoFocus />
            <button onClick={saveEdit} className="btn-save-inline" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={cancelEdit} className="btn-cancel-inline" disabled={saving}>Cancel</button>
          </div>
        ) : (
          <div className="profile-value-row">
            <span className="profile-value">{account.username}</span>
            <button onClick={() => startEdit('username')} className="btn-edit-inline">Edit</button>
          </div>
        )}
      </div>

      <div className="profile-info-row">
        <span className="profile-label">Email</span>
        {editField === 'email' ? (
          <div className="profile-edit-inline">
            <input type="email" value={value} onChange={e => setValue(e.target.value)} disabled={saving} autoFocus />
            <button onClick={saveEdit} className="btn-save-inline" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={cancelEdit} className="btn-cancel-inline" disabled={saving}>Cancel</button>
          </div>
        ) : (
          <div className="profile-value-row">
            <span className="profile-value">{account.email}</span>
            <button onClick={() => startEdit('email')} className="btn-edit-inline">Edit</button>
          </div>
        )}
      </div>

      <div className="profile-info-row">
        <span className="profile-label">Member since</span>
        <span className="profile-value">{account.createdAt ? formatDate(account.createdAt) : 'N/A'}</span>
      </div>

      {error && <div className="profile-error">{error}</div>}
    </section>
  );
}

function CPProfileSection({ account, setAccount }) {
  const linkedUser = account.linkedUser;
  const [showForm, setShowForm] = useState(false);
  const [handles, setHandles] = useState(
    Object.fromEntries(PLATFORMS.map(p => [p, linkedUser?.handles?.[p] || '']))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const handlesData = Object.fromEntries(
        PLATFORMS.map(p => [p, handles[p].trim() || null]).filter(([, v]) => v)
      );
      await authApi.linkHandles(handlesData);
      // Refresh account to get updated linkedUser
      const meRes = await authApi.getMe();
      setAccount(meRes.data);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!linkedUser && !showForm) {
    return (
      <section className="profile-section">
        <h2>My CP Profile</h2>
        <p className="profile-hint">Link your competitive programming handles to see your ratings and stats here.</p>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">Add Handles</button>
      </section>
    );
  }

  if (showForm || !linkedUser) {
    return (
      <section className="profile-section">
        <h2>My CP Profile</h2>
        <form onSubmit={handleSave}>
          <div className="handles-form-grid">
            {PLATFORMS.map(platform => (
              <div className="form-group" key={platform}>
                <label htmlFor={`profile-${platform}`}>{PLATFORM_NAMES[platform]}</label>
                <input
                  type="text"
                  id={`profile-${platform}`}
                  value={handles[platform]}
                  onChange={e => setHandles({ ...handles, [platform]: e.target.value })}
                  disabled={saving}
                  placeholder={`Your ${PLATFORM_NAMES[platform]} handle`}
                />
              </div>
            ))}
          </div>
          {error && <div className="profile-error">{error}</div>}
          <div className="profile-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Handles'}
            </button>
            {linkedUser && (
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
            )}
          </div>
        </form>
      </section>
    );
  }

  // Scores <= 10 are already on the 1-10 star scale; scores > 10 are legacy 0-100
  // scale data that needs converting: 1 + (score/100) * 9 maps 0-100 to 1-10
  const score = linkedUser.aggregateScore;
  const displayScore = score > 10 ? (1 + (score / 100) * 9) : score;

  return (
    <section className="profile-section">
      <div className="cp-profile-header">
        <h2>My CP Profile</h2>
        <button onClick={() => {
          setHandles(Object.fromEntries(PLATFORMS.map(p => [p, linkedUser.handles?.[p] || ''])));
          setShowForm(true);
        }} className="btn-edit-inline">Edit Handles</button>
      </div>

      {score > 0 && (
        <div className="aggregate-display">
          <span className="aggregate-star">{displayScore?.toFixed(1)}/10</span>
          <span className="aggregate-label-text">Aggregate Score</span>
        </div>
      )}

      <div className="platform-stats-grid">
        {PLATFORMS.map(platform => {
          const handle = linkedUser.handles?.[platform];
          const rating = linkedUser.ratings?.[platform];
          if (!handle) return null;

          return (
            <div key={platform} className="platform-stat-card">
              <div className="platform-stat-header" style={{ borderLeftColor: PLATFORM_CHART_COLORS[platform] }}>
                <span className="platform-stat-name" style={{ color: PLATFORM_CHART_COLORS[platform] }}>
                  {PLATFORM_NAMES[platform]}
                </span>
                <a
                  href={`${PLATFORM_URLS[platform]}${handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="platform-handle-link"
                >
                  {handle}
                </a>
              </div>
              {rating?.rating ? (
                <div className="platform-stat-body">
                  <div className="stat-row">
                    <span className="stat-label">Current</span>
                    <span className="stat-value" style={{ color: getPlatformColor(platform, rating.rating, rating.rank) }}>
                      {rating.rating}
                    </span>
                    {rating.rank && <span className="stat-rank">{rating.rank}</span>}
                  </div>
                  {rating.maxRating && (
                    <div className="stat-row">
                      <span className="stat-label">Highest</span>
                      <span className="stat-value" style={{ color: getPlatformColor(platform, rating.maxRating, rating.maxRank) }}>
                        {rating.maxRating}
                      </span>
                      {rating.maxRank && <span className="stat-rank">{rating.maxRank}</span>}
                    </div>
                  )}
                  {rating.lastUpdated && (
                    <div className="stat-row">
                      <span className="stat-label">Updated</span>
                      <span className="stat-date">{formatDate(rating.lastUpdated)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="platform-stat-body">
                  <span className="stat-unrated">{rating?.error ? 'Error fetching' : 'Unrated'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      await authApi.updateProfile({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="profile-section">
      <h2>Change Password</h2>
      <form onSubmit={handleSubmit} className="password-form">
        <div className="form-group">
          <label htmlFor="current-pw">Current Password</label>
          <input type="password" id="current-pw" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required disabled={saving} autoComplete="current-password" />
        </div>
        <div className="form-group">
          <label htmlFor="new-pw">New Password</label>
          <input type="password" id="new-pw" value={newPassword} onChange={e => setNewPassword(e.target.value)} required disabled={saving} minLength={8} autoComplete="new-password" />
        </div>
        <div className="form-group">
          <label htmlFor="confirm-pw">Confirm New Password</label>
          <input type="password" id="confirm-pw" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={saving} autoComplete="new-password" />
        </div>
        {error && <div className="profile-error">{error}</div>}
        {success && <div className="profile-success">Password changed successfully.</div>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </section>
  );
}

function MySpacesSection({ spaces, loading }) {
  if (loading) return <Loading message="Loading spaces..." />;

  return (
    <section className="profile-section">
      <h2>My Spaces</h2>
      {spaces.length === 0 ? (
        <p className="profile-hint">You haven&apos;t joined any spaces yet. <Link to="/spaces">Browse spaces</Link></p>
      ) : (
        <div className="spaces-list">
          {spaces.map(space => (
            <Link key={space._id} to={`/spaces/${space._id}`} className="space-list-item">
              <span className="space-list-name">{space.name}</span>
              <span className={`role-badge role-${space.myRole}`}>{space.myRole}</span>
              <span className="space-list-members">{space.memberCount} members</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

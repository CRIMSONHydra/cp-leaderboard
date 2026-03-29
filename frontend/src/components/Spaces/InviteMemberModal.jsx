import { useState, useEffect, useRef } from 'react';
import { spacesApi } from '../../services/api';
import './Spaces.css';

export default function InviteMemberModal({ spaceId, onClose, onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [results, setResults] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleEmailChange = (value) => {
    setEmail(value);
    setSelectedAccount(null);
    setError(null);
    setSuccess(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await spacesApi.searchAccounts(spaceId, value.trim());
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelect = (account) => {
    setSelectedAccount(account);
    setEmail(account.email);
    setResults([]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const targetEmail = selectedAccount?.email || email.trim();
    if (!targetEmail) {
      setError('Email is required');
      return;
    }

    setSending(true);

    try {
      await spacesApi.sendInvitation(spaceId, targetEmail, role);
      setSuccess(`Invitation sent to ${targetEmail}`);
      setEmail('');
      setSelectedAccount(null);
      setResults([]);
      setRole('viewer');
      onInvited();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !sending && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Invite Member</h2>
        <form onSubmit={handleSend}>
          <div className="form-group invite-email-group">
            <label htmlFor="invite-email">Email</label>
            <input
              type="text"
              id="invite-email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="Search by email..."
              disabled={sending}
              autoFocus
            />
            {searching && <div className="search-hint">Searching...</div>}
            {results.length > 0 && !selectedAccount && (
              <div className="account-dropdown">
                {results.map(account => (
                  <button
                    key={account._id}
                    type="button"
                    className="account-option"
                    onClick={() => handleSelect(account)}
                  >
                    <span className="account-username">{account.username}</span>
                    <span className="account-email">{account.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="invite-role">Role</label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={sending}
            >
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <div className="modal-error">{error}</div>}
          {success && <div className="create-success">{success}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={sending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

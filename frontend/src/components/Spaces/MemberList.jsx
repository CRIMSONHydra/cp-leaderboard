import { useState } from 'react';
import './Spaces.css';

export default function MemberList({ members, isAdmin, ownerId, currentAccountId, onRoleChange, onRemove }) {
  const [loading, setLoading] = useState(null);

  const handlePromote = async (accountId) => {
    setLoading(accountId);
    try {
      await onRoleChange(accountId, 'admin');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleRemove = async (accountId, username) => {
    if (!confirm(`Remove ${username} from this space?`)) return;
    setLoading(accountId);
    try {
      await onRemove(accountId);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="member-list">
      <h3>Members ({members.length})</h3>
      <table className="member-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const accountId = member.account._id || member.account;
            const isOwner = accountId === ownerId;
            const isSelf = accountId === currentAccountId;
            const isViewer = member.role === 'viewer';
            const canEdit = isAdmin && !isOwner && !isSelf;

            return (
              <tr key={accountId}>
                <td>
                  {member.account.username}
                  {isOwner && <span className="owner-badge">owner</span>}
                  {isSelf && !isOwner && <span className="self-badge">you</span>}
                </td>
                <td>{member.account.email}</td>
                <td>
                  <span className={`role-badge role-${member.role}`}>{member.role}</span>
                </td>
                {isAdmin && (
                  <td>
                    {canEdit && (
                      <div className="member-actions">
                        {isViewer && (
                          <button
                            onClick={() => handlePromote(accountId)}
                            className="btn-promote"
                            disabled={loading === accountId}
                          >
                            {loading === accountId ? 'Promoting...' : 'Make Admin'}
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(accountId, member.account.username)}
                          className="btn-remove"
                          disabled={loading === accountId}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

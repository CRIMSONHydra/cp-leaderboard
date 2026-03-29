import { useState } from 'react';
import './Spaces.css';

export default function MemberList({ members, isAdmin, ownerId, onRoleChange, onRemove }) {
  const [loading, setLoading] = useState(null);

  const handleRoleChange = async (accountId, newRole) => {
    setLoading(accountId);
    try {
      await onRoleChange(accountId, newRole);
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
            return (
              <tr key={accountId}>
                <td>
                  {member.account.username}
                  {isOwner && <span className="owner-badge">owner</span>}
                </td>
                <td>{member.account.email}</td>
                <td>
                  <span className={`role-badge role-${member.role}`}>{member.role}</span>
                </td>
                {isAdmin && (
                  <td>
                    {!isOwner && (
                      <div className="member-actions">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(accountId, e.target.value)}
                          disabled={loading === accountId}
                        >
                          <option value="admin">Admin</option>
                          <option value="viewer">Viewer</option>
                        </select>
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

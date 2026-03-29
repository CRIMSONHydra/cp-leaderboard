import { useState } from 'react';
import { spacesApi } from '../../services/api';
import { useSpaceInvitations } from '../../hooks/useInvitations';
import './Spaces.css';

export default function SpaceInvitationsList({ spaceId }) {
  const { invitations, loading, refetch } = useSpaceInvitations(spaceId);
  const [cancelling, setCancelling] = useState(null);

  if (loading) return null;

  const pending = invitations.filter(i => i.status === 'pending');
  const resolved = invitations.filter(i => i.status !== 'pending');

  const handleCancel = async (invitationId) => {
    setCancelling(invitationId);
    try {
      await spacesApi.cancelInvitation(spaceId, invitationId);
      refetch();
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(null);
    }
  };

  if (invitations.length === 0) return null;

  return (
    <div className="invitations-list">
      <h3>Invitations</h3>
      <table className="member-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pending.map(inv => (
            <tr key={inv._id}>
              <td>{inv.invitedAccount?.email || 'Unknown'}</td>
              <td><span className={`role-badge role-${inv.role}`}>{inv.role}</span></td>
              <td><span className="status-pending">Pending</span></td>
              <td>
                <button
                  onClick={() => handleCancel(inv._id)}
                  className="btn-remove"
                  disabled={cancelling === inv._id}
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
          {resolved.map(inv => (
            <tr key={inv._id} className="invitation-resolved">
              <td>{inv.invitedAccount?.email || 'Unknown'}</td>
              <td><span className={`role-badge role-${inv.role}`}>{inv.role}</span></td>
              <td><span className={`status-${inv.status}`}>{inv.status}</span></td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

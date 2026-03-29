import { useState } from 'react';
import { spacesApi } from '../../services/api';
import { usePendingInvitations } from '../../hooks/useInvitations';
import './Spaces.css';

export default function PendingInvitations({ onAccepted }) {
  const { invitations, loading, refetch } = usePendingInvitations();
  const [acting, setActing] = useState(null);

  if (loading || invitations.length === 0) return null;

  const handleAccept = async (id) => {
    setActing(id);
    try {
      await spacesApi.acceptInvitation(id);
      refetch();
      onAccepted();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  const handleDecline = async (id) => {
    setActing(id);
    try {
      await spacesApi.declineInvitation(id);
      refetch();
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="pending-invitations">
      <h2>Pending Invitations</h2>
      <div className="invitation-cards">
        {invitations.map(inv => (
          <div key={inv._id} className="invitation-card">
            <div className="invitation-info">
              <strong>{inv.space?.name || 'Unknown Space'}</strong>
              <span className="invitation-detail">
                Invited by {inv.invitedBy?.username || 'someone'} as <span className={`role-badge role-${inv.role}`}>{inv.role}</span>
              </span>
            </div>
            <div className="invitation-actions">
              <button
                onClick={() => handleAccept(inv._id)}
                className="btn btn-small btn-accept"
                disabled={acting === inv._id}
              >
                Accept
              </button>
              <button
                onClick={() => handleDecline(inv._id)}
                className="btn btn-small btn-decline"
                disabled={acting === inv._id}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

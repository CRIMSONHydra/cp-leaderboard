import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSpaces } from '../hooks/useSpaces';
import SpaceCard from '../components/Spaces/SpaceCard';
import CreateSpaceModal from '../components/Spaces/CreateSpaceModal';
import JoinSpaceModal from '../components/Spaces/JoinSpaceModal';
import PendingInvitations from '../components/Spaces/PendingInvitations';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import './SpacesPage.css';

export default function SpacesPage() {
  const { spaces, loading, error, refetch } = useSpaces();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  return (
    <div className="spaces-page">
      <div className="spaces-header">
        <div className="spaces-header-left">
          <h1>My Spaces</h1>
        </div>
        <div className="spaces-header-actions">
          <button onClick={() => setShowJoin(true)} className="btn btn-secondary">
            Join Space
          </button>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            Create Space
          </button>
        </div>
      </div>

      <PendingInvitations onAccepted={refetch} />

      {loading && <Loading message="Loading spaces..." />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && (
        <div className="spaces-grid">
          <Link to="/" className="space-card global-leaderboard-card">
            <h3 className="space-card-name">Global Leaderboard</h3>
            <p className="space-card-desc">View all tracked users across the platform</p>
          </Link>
          {spaces.map(space => (
            <SpaceCard key={space._id} space={space} />
          ))}
        </div>
      )}

      {!loading && !error && spaces.length === 0 && (
        <div className="spaces-empty">
          <p>Create a space to track competitive programmers, or join one with an invite code.</p>
        </div>
      )}

      {showCreate && (
        <CreateSpaceModal
          onClose={() => setShowCreate(false)}
          onCreated={() => refetch()}
        />
      )}
      {showJoin && (
        <JoinSpaceModal
          onClose={() => setShowJoin(false)}
          onJoined={() => refetch()}
        />
      )}
    </div>
  );
}

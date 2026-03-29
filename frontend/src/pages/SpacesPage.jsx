import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSpaces } from '../hooks/useSpaces';
import SpaceCard from '../components/Spaces/SpaceCard';
import CreateSpaceModal from '../components/Spaces/CreateSpaceModal';
import JoinSpaceModal from '../components/Spaces/JoinSpaceModal';
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
          <Link to="/" className="back-link">Back to Leaderboard</Link>
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

      {loading && <Loading />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && spaces.length === 0 && (
        <div className="spaces-empty">
          <h2>No spaces yet</h2>
          <p>Create a space to track competitive programmers, or join one with an invite code.</p>
        </div>
      )}

      {!loading && spaces.length > 0 && (
        <div className="spaces-grid">
          {spaces.map(space => (
            <SpaceCard key={space._id} space={space} />
          ))}
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

import { useParams, Link } from 'react-router-dom';
import { useSpaceLeaderboard } from '../hooks/useSpaceLeaderboard';
import { useSpace } from '../hooks/useSpace';
import LeaderboardTable from '../components/Leaderboard/LeaderboardTable';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import AddUserToSpace from '../components/Spaces/AddUserToSpace';
import './SpaceLeaderboardPage.css';

export default function SpaceLeaderboardPage() {
  const { spaceId } = useParams();
  const { space, loading: spaceLoading, error: spaceError } = useSpace(spaceId);
  const { data, loading, error, sortBy, sortOrder, handleSort, refetch } = useSpaceLeaderboard(spaceId);

  if (spaceLoading) return <Loading />;
  if (spaceError) return <ErrorMessage message={spaceError} />;

  const isAdmin = space?.myRole === 'admin';

  return (
    <div className="space-leaderboard-page">
      <div className="space-lb-header">
        <div className="space-lb-nav">
          <Link to="/spaces" className="back-link">My Spaces</Link>
          {isAdmin && (
            <Link to={`/spaces/${spaceId}/settings`} className="settings-link">Members &amp; Settings</Link>
          )}
        </div>
        <h1>{space?.name}</h1>
        {space?.description && <p className="space-lb-desc">{space.description}</p>}
        <div className="space-lb-meta">
          <span>{space?.members?.length} members</span>
          <span>{data.length} tracked</span>
        </div>
      </div>

      {isAdmin && (
        <AddUserToSpace spaceId={spaceId} onAdded={refetch} />
      )}

      <LeaderboardTable
        data={data}
        loading={loading}
        error={error}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRetry={refetch}
      />
    </div>
  );
}

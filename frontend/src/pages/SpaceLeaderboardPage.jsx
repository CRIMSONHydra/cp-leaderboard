import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { spacesApi } from '../services/api/spaces';
import { useSpaceLeaderboard } from '../hooks/useSpaceLeaderboard';
import { PLATFORMS, PLATFORM_NAMES } from '../constants/platforms';
import LeaderboardRow from '../components/Leaderboard/LeaderboardRow';
import SortButton from '../components/common/SortButton';
import Tooltip from '../components/common/Tooltip';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import InviteCodeDisplay from '../components/Spaces/InviteCodeDisplay';
import AddUserToSpace from '../components/Spaces/AddUserToSpace';
import './SpaceLeaderboardPage.css';

export default function SpaceLeaderboardPage() {
  const { spaceId } = useParams();
  const [space, setSpace] = useState(null);
  const [spaceLoading, setSpaceLoading] = useState(true);
  const [spaceError, setSpaceError] = useState(null);

  const { data, loading, error, sortBy, sortOrder, handleSort, refetch } = useSpaceLeaderboard(spaceId);

  useEffect(() => {
    spacesApi.getSpace(spaceId)
      .then(res => setSpace(res.data))
      .catch(err => setSpaceError(err.message))
      .finally(() => setSpaceLoading(false));
  }, [spaceId]);

  if (spaceLoading) return <Loading />;
  if (spaceError) return <ErrorMessage message={spaceError} />;

  const isAdmin = space?.myRole === 'admin';

  return (
    <div className="space-leaderboard-page">
      <div className="space-lb-header">
        <div className="space-lb-nav">
          <Link to="/spaces" className="back-link">My Spaces</Link>
          {isAdmin && (
            <Link to={`/spaces/${spaceId}/settings`} className="settings-link">Settings</Link>
          )}
        </div>
        <h1>{space?.name}</h1>
        {space?.description && <p className="space-lb-desc">{space.description}</p>}
        <div className="space-lb-meta">
          <span>{space?.members?.length} members</span>
          {isAdmin && space?.inviteCode && (
            <InviteCodeDisplay code={space.inviteCode} />
          )}
        </div>
      </div>

      {isAdmin && (
        <AddUserToSpace spaceId={spaceId} onAdded={refetch} />
      )}

      {loading && <Loading />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && data.length === 0 && (
        <div className="empty-state">
          <p>No tracked users in this space yet.</p>
          {isAdmin && <p>Use the search above to add users.</p>}
        </div>
      )}

      {!loading && data.length > 0 && (
        <div className="leaderboard-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="rank-col">#</th>
                <th className="name-col">
                  <SortButton
                    label="Name"
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortOrder : null}
                    onClick={() => handleSort('name')}
                  />
                </th>
                {PLATFORMS.map(platform => (
                  <th key={platform} className="rating-col">
                    <SortButton
                      label={PLATFORM_NAMES[platform]}
                      active={sortBy === platform}
                      direction={sortBy === platform ? sortOrder : null}
                      onClick={() => handleSort(platform)}
                    />
                  </th>
                ))}
                <th className="aggregate-col">
                  <div className="aggregate-header">
                    <SortButton
                      label="Aggregate"
                      active={sortBy === 'aggregate'}
                      direction={sortBy === 'aggregate' ? sortOrder : null}
                      onClick={() => handleSort('aggregate')}
                    />
                    <Tooltip content="Normalized aggregate score (0-100)">
                      <span className="info-icon" aria-label="Aggregate info">i</span>
                    </Tooltip>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((user, index) => (
                <LeaderboardRow key={user._id} user={user} rank={index + 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

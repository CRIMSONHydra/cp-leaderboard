import { PLATFORMS, PLATFORM_NAMES } from '../../constants/platforms';
import LeaderboardRow from './LeaderboardRow';
import SortButton from '../common/SortButton';
import Tooltip from '../common/Tooltip';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';
import './LeaderboardTable.css';

export default function LeaderboardTable({ data, loading, error, sortBy, sortOrder, onSort, onRetry, onEdit, spaceId }) {
  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={onRetry} />;
  if (data.length === 0) {
    return (
      <div className="empty-state">
        <p>No users in the leaderboard yet.</p>
      </div>
    );
  }

  return (
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
                onClick={() => onSort('name')}
              />
            </th>
            {PLATFORMS.map(platform => (
              <th key={platform} className="rating-col">
                <SortButton
                  label={PLATFORM_NAMES[platform]}
                  active={sortBy === platform}
                  direction={sortBy === platform ? sortOrder : null}
                  onClick={() => onSort(platform)}
                />
              </th>
            ))}
            <th className="aggregate-col">
              <div className="aggregate-header">
                <SortButton
                  label="Aggregate"
                  active={sortBy === 'aggregate'}
                  direction={sortBy === 'aggregate' ? sortOrder : null}
                  onClick={() => onSort('aggregate')}
                />
                <Tooltip content="Normalized aggregate score (0-100) calculated from all platform ratings. Higher ratings on each platform contribute to a higher aggregate score.">
                  <span className="info-icon" aria-label="Information about aggregate score">i</span>
                </Tooltip>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((user, index) => (
            <LeaderboardRow
              key={user._id}
              user={user}
              rank={index + 1}
              onEdit={onEdit}
              spaceId={spaceId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

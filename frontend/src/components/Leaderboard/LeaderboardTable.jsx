import { useLeaderboard } from '../../hooks/useLeaderboard';
import { PLATFORMS } from '../../constants/platforms';
import LeaderboardRow from './LeaderboardRow';
import SortButton from '../common/SortButton';
import Tooltip from '../common/Tooltip';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';
import './LeaderboardTable.css';
const PLATFORM_LABELS = {
  codeforces: 'Codeforces',
  atcoder: 'AtCoder',
  leetcode: 'LeetCode',
  codechef: 'CodeChef',
  aggregate: 'Score'
};

/**
 * Render the sortable leaderboard UI with per-platform and aggregate columns.
 *
 * Renders a Loading component while data is being fetched, an ErrorMessage with retry on error, and an empty-state message when no users exist. When data is available, renders a table showing rank, name, platform-specific ratings (one column per PLATFORMS entry), and a normalized aggregate score column with a tooltip; header buttons allow sorting by name, each platform, or aggregate.
 * @returns {JSX.Element} The leaderboard view: either a loading indicator, an error message, an empty-state message, or the populated sortable leaderboard table.
 */
export default function LeaderboardTable() {
  const { data, loading, error, sortBy, sortOrder, handleSort, refetch } = useLeaderboard();

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
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
                onClick={() => handleSort('name')}
              />
            </th>
            {PLATFORMS.map(platform => (
              <th key={platform} className="rating-col">
                <SortButton
                  label={PLATFORM_LABELS[platform]}
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
                <Tooltip content="Normalized aggregate score (0-100) calculated from all platform ratings. Higher ratings on each platform contribute to a higher aggregate score.">
                  <span className="info-icon">ⓘ</span>
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
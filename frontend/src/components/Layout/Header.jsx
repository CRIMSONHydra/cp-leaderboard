import { formatDate } from '../../utils/ratingUtils';
import './Header.css';

/**
 * Render the application header including title, subtitle, and optional metadata.
 *
 * @param {Object} props - Component props.
 * @param {Date|string} [props.lastUpdate] - Timestamp of the last update; displayed if provided.
 * @param {Object} [props.stats] - Aggregated statistics; if provided, `props.stats.totalUsers` is displayed.
 * @returns {JSX.Element} The header element containing the app title, subtitle, and optional user count and last-update time.
 */
export default function Header({ lastUpdate, stats }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="app-title">CP Leaderboard</h1>
        <p className="app-subtitle">
          Competitive Programming Ratings Tracker
        </p>
        <div className="header-meta">
          {stats && (
            <span className="user-count">{stats.totalUsers} users</span>
          )}
          {lastUpdate && (
            <span className="last-update">
              Updated: {formatDate(lastUpdate)}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
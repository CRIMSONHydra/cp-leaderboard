import { formatDate } from '../../utils/ratingUtils';
import './Header.css';

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

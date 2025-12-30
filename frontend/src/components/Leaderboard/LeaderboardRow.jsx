import { Link } from 'react-router-dom';
import { PLATFORMS } from '../../constants/platforms';
import RatingDisplay from './RatingDisplay';
import './LeaderboardRow.css';

/**
 * Render a table row showing a user's leaderboard entry: rank badge, name link, per-platform ratings, and aggregate score.
 *
 * @param {Object} props
 * @param {Object} props.user - User data used to populate the row.
 * @param {string} props.user._id - User identifier used for the profile link.
 * @param {string} props.user.name - Display name shown as the profile link text.
 * @param {Object<string, {rating?: number, rank?: number}>} [props.user.ratings] - Per-platform rating and rank values keyed by platform.
 * @param {Object<string, string>} [props.user.handles] - Per-platform user handles keyed by platform.
 * @param {number} [props.user.aggregateScore] - Aggregate score shown as `X/100` when present.
 * @param {number} props.rank - The user's overall rank used for the rank badge and styling.
 * @returns {JSX.Element} A table row (<tr>) element representing the leaderboard row for the given user.
 */
export default function LeaderboardRow({ user, rank }) {
  return (
    <tr className="leaderboard-row">
      <td className="rank-cell">
        <span className={`rank-badge rank-${rank <= 3 ? rank : 'default'}`}>
          {rank}
        </span>
      </td>
      <td className="name-cell">
        <Link to={`/user/${user._id}`} className="user-name-link">
          {user.name}
        </Link>
      </td>
      {PLATFORMS.map(platform => (
        <td key={platform} className="rating-cell">
          <RatingDisplay
            platform={platform}
            rating={user.ratings?.[platform]?.rating}
            rank={user.ratings?.[platform]?.rank}
            handle={user.handles?.[platform]}
          />
        </td>
      ))}
      <td className="aggregate-cell">
        <span className="aggregate-score">
          {user.aggregateScore ? `${user.aggregateScore}/100` : '-'}
        </span>
      </td>
    </tr>
  );
}
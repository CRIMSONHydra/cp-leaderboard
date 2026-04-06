import { Link } from 'react-router-dom';
import { PLATFORMS } from '../../constants/platforms';
import RatingDisplay from './RatingDisplay';
import './LeaderboardRow.css';

export default function LeaderboardRow({ user, rank, platforms = PLATFORMS, onEdit, spaceId }) {
  return (
    <tr className="leaderboard-row">
      <td className="rank-cell">
        <span className={`rank-badge rank-${rank <= 3 ? rank : 'default'}`}>
          {rank}
        </span>
      </td>
      <td className="name-cell">
        <Link to={`/user/${user._id}${spaceId ? `?spaceId=${encodeURIComponent(spaceId)}` : ''}`} className="user-name-link">
          {user.name}
        </Link>
      </td>
      {platforms.map(platform => (
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
          {user.aggregateScore
            ? `★ ${(user.aggregateScore > 10 ? (1 + (user.aggregateScore / 100) * 9) : user.aggregateScore).toFixed(1)}/10`
            : '-'}
        </span>
      </td>
      {onEdit && (
        <td className="edit-cell">
          <button
            type="button"
            className="btn-edit-user"
            onClick={() => onEdit(user)}
            aria-label={`Edit ${user.name}`}
          >
            Edit
          </button>
        </td>
      )}
    </tr>
  );
}

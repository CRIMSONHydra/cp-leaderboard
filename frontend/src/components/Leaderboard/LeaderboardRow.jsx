import RatingDisplay from './RatingDisplay';
import './LeaderboardRow.css';

const PLATFORMS = ['codeforces', 'atcoder', 'leetcode', 'codechef'];

export default function LeaderboardRow({ user, rank }) {
  return (
    <tr className="leaderboard-row">
      <td className="rank-cell">
        <span className={`rank-badge rank-${rank <= 3 ? rank : 'default'}`}>
          {rank}
        </span>
      </td>
      <td className="name-cell">
        <span className="user-name">{user.name}</span>
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
          {user.aggregateScore || '-'}
        </span>
      </td>
    </tr>
  );
}

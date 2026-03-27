import { getPlatformColor, getPlatformUrl } from '../../utils/ratingUtils';
import './RatingDisplay.css';

export default function RatingDisplay({ platform, rating, rank, handle }) {
  if (!handle) {
    return <span className="no-handle">-</span>;
  }

  const url = getPlatformUrl(platform, handle);

  if (!rating) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="rating-link unrated"
        title={`${handle} on ${platform}`}
      >
        Unrated
      </a>
    );
  }

  const color = getPlatformColor(platform, rating, rank);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="rating-link"
      style={{ color }}
      title={`${handle} on ${platform}${rank ? ` (${rank})` : ''}`}
    >
      <span className="rating-value">{rating}</span>
      {rank && <span className="rating-rank">{rank}</span>}
    </a>
  );
}

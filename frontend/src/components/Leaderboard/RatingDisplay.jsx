import { getPlatformColor, getPlatformUrl } from '../../utils/ratingUtils';
import './RatingDisplay.css';

/**
 * Render a platform-specific rating link or placeholder based on the provided handle, rating, and rank.
 *
 * @param {{platform: string, rating?: string|number, rank?: string|number, handle?: string}} props
 * @param {string} props.platform - Platform identifier used to construct the profile URL and determine display color.
 * @param {string|number|undefined} props.rating - Numeric or string rating; if missing or falsy, an "Unrated" link is shown.
 * @param {string|number|undefined} props.rank - Optional rank to display alongside the rating.
 * @param {string|undefined} props.handle - User handle; when omitted or falsy a non-clickable placeholder ("-") is rendered.
 * @returns {JSX.Element} A JSX element: a placeholder span when no handle is provided, an "Unrated" link when rating is absent, or a colored rating link showing the rating and optional rank.
 */
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
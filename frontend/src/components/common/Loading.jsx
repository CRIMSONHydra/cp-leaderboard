import './Loading.css';

/**
 * Render a static loading indicator for the leaderboard.
 *
 * @returns {JSX.Element} A container element with a spinner and the text "Loading leaderboard...".
 */
export default function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading leaderboard...</p>
    </div>
  );
}
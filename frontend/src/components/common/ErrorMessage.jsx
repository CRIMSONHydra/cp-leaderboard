import './ErrorMessage.css';

/**
 * Render an error message with an optional "Try Again" button.
 *
 * @param {Object} props - Component props.
 * @param {string} props.message - Text to display as the error message.
 * @param {Function} [props.onRetry] - Optional callback invoked when the "Try Again" button is clicked.
 * @returns {JSX.Element} The rendered error message element.
 */
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-container">
      <div className="error-icon">!</div>
      <p className="error-message">{message}</p>
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
import './Loading.css';

export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-dots">
        <span className="loading-dot"></span>
        <span className="loading-dot"></span>
        <span className="loading-dot"></span>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
}

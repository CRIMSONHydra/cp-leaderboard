import './SortButton.css';

export default function SortButton({ label, active, direction, onClick }) {
  return (
    <button
      className={`sort-button ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <span className="sort-label">{label}</span>
      {active && (
        <span className="sort-indicator">
          {direction === 'desc' ? '▼' : '▲'}
        </span>
      )}
    </button>
  );
}

import './SortButton.css';

export default function SortButton({ label, active, direction, onClick }) {
  return (
    <button
      className={`sort-button ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-label={active ? `Sort by ${label} ${direction === 'desc' ? 'descending' : 'ascending'}` : `Sort by ${label}`}
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

import './SortButton.css';

/**
 * Render a sortable column header button that shows a label and, when active, a directional indicator.
 *
 * @param {Object} props
 * @param {string} props.label - Text displayed inside the button.
 * @param {boolean} props.active - Whether the button is in the active/sorted state.
 * @param {'asc'|'desc'} props.direction - Sort direction when active; 'desc' displays a down arrow, 'asc' (or any other value) displays an up arrow.
 * @param {() => void} props.onClick - Click handler invoked when the button is pressed.
 * @returns {JSX.Element} The button element containing the label and an optional sort direction indicator.
 */
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
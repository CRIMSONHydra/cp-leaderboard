import { useState, useEffect, useRef } from 'react';
import { PLATFORMS, PLATFORM_NAMES } from '../../constants/platforms';
import './EditUserModal.css';

export default function EditUserModal({ user, onSave, onClose, onUpdated }) {
  const [handles, setHandles] = useState(
    Object.fromEntries(PLATFORMS.map(p => [p, user.handles?.[p] || '']))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !saving) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const handlesPayload = Object.fromEntries(
        PLATFORMS.map(p => [p, handles[p].trim() || null])
      );

      await onSave(user._id, handlesPayload);
      setSuccess(true);
      if (onUpdated) onUpdated();
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()} onKeyDown={handleKeyDown}>
      <div
        className="edit-user-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <h2 id="edit-user-title">Edit Handles</h2>
        <p className="edit-user-name">{user.name}</p>

        <form onSubmit={handleSubmit}>
          <div className="edit-handles-grid">
            {PLATFORMS.map(platform => (
              <div className="form-group" key={platform}>
                <label htmlFor={`edit-${platform}`}>{PLATFORM_NAMES[platform]}</label>
                <input
                  type="text"
                  id={`edit-${platform}`}
                  value={handles[platform]}
                  onChange={(e) => setHandles({ ...handles, [platform]: e.target.value })}
                  disabled={saving}
                  placeholder="Leave empty to clear"
                />
              </div>
            ))}
          </div>

          {error && <div className="edit-error">{error}</div>}
          {success && <div className="edit-success">Handles updated. Ratings are being refreshed.</div>}

          <div className="edit-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || success}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

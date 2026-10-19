import React from 'react';

// actions: extra buttons [{ label, icon, variant, onClick, disabled }] shown before Delete.
const BulkActionBar = ({ selectedCount, onClear, onDelete, deleteText = 'Delete Selected', actions = [] }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-action-bar">
      <span className="selected-count">{selectedCount} item{selectedCount > 1 ? 's' : ''} selected</span>

      <button className="btn btn-light" onClick={onClear}>
        Clear Selection
      </button>

      {actions.length > 0 && <div className="bulk-action-divider"></div>}
      {actions.map((a) => (
        <button key={a.label} className={`btn btn-${a.variant || 'light'}`} onClick={a.onClick} disabled={a.disabled}>
          {a.icon && <i className={`bi ${a.icon} me-2`}></i>}{a.label}
        </button>
      ))}

      {onDelete && (
        <>
          <div className="bulk-action-divider"></div>
          <button className="btn btn-danger" onClick={onDelete}>
            <i className="bi bi-trash me-2"></i> {deleteText}
          </button>
        </>
      )}
    </div>
  );
};

export default BulkActionBar;

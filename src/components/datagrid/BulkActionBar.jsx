import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// actions: extra buttons [{ label, icon, variant, onClick, disabled }] shown before Delete.
// Floats at the bottom of the screen (portalled into <body>, so it stays visible while the list
// scrolls and transformed ancestors can't offset its position: fixed).
// Centre of the admin content area (<main>), so the sidebar never covers the bar.
function useContentCentre(active) {
  const [left, setLeft] = useState(null);
  useLayoutEffect(() => {
    if (!active) return undefined;
    const place = () => {
      const main = document.querySelector('main');
      const rect = main?.getBoundingClientRect();
      setLeft(rect && rect.width > 0 ? Math.round(rect.left + rect.width / 2) : null);
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [active]);
  return left;
}

const BulkActionBar = ({ selectedCount, onClear, onDelete, deleteText = 'Delete Selected', actions = [] }) => {
  const left = useContentCentre(selectedCount > 0);
  if (selectedCount === 0) return null;

  return createPortal(
    <div className="bulk-action-bar" role="toolbar" aria-label="Actions for the selected items" style={left != null ? { left } : undefined}>
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
    </div>,
    document.body,
  );
};

export default BulkActionBar;

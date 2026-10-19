import React from 'react';
import { Modal } from 'react-bootstrap';
import './ConfirmDialog.css';

/**
 * Themed confirmation dialog (light / dark), used instead of window.confirm.
 *
 * <ConfirmDialog show title="Delete 3 banners?" message="…" items={['Diwali offer', …]}
 *   tone="danger" | "warning" confirmText="Delete" busy={false}
 *   onConfirm={…} onCancel={…} />
 */
const TONES = {
  danger: { icon: 'bi-trash3', button: 'btn-danger' },
  warning: { icon: 'bi-archive', button: 'btn-warning' },
};

const ConfirmDialog = ({
  show,
  title,
  message,
  items = [],
  note,
  tone = 'danger',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
}) => {
  const style = TONES[tone] || TONES.danger;
  const shown = items.slice(0, 6);
  const more = items.length - shown.length;

  return (
    <Modal show={show} onHide={busy ? undefined : onCancel} centered backdrop={busy ? 'static' : true} contentClassName="confirm-dialog" aria-labelledby="confirm-dialog-title">
      <Modal.Body className="p-4">
        <div className="d-flex gap-3 align-items-start">
          <div className={`confirm-dialog-icon confirm-dialog-${tone}`} aria-hidden>
            <i className={`bi ${style.icon}`}></i>
          </div>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <h5 id="confirm-dialog-title" className="fw-bold mb-1">{title}</h5>
            {message && <p className="text-body-secondary mb-0">{message}</p>}
          </div>
        </div>

        {shown.length > 0 && (
          <ul className="confirm-dialog-list list-unstyled mt-3 mb-0">
            {shown.map((item, index) => (
              <li key={`${item}-${index}`} className="text-truncate">{item}</li>
            ))}
            {more > 0 && <li className="text-body-secondary fst-italic">and {more} more…</li>}
          </ul>
        )}

        {note && (
          <div className={`confirm-dialog-note confirm-dialog-note-${tone} mt-3`}>
            <i className={`bi ${tone === 'danger' ? 'bi-exclamation-triangle' : 'bi-info-circle'} me-2`}></i>{note}
          </div>
        )}

        <div className="d-flex justify-content-end gap-2 mt-4">
          <button type="button" className="btn btn-light border px-4" onClick={onCancel} disabled={busy}>{cancelText}</button>
          <button type="button" className={`btn ${style.button} px-4 fw-semibold`} onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? <><span className="spinner-border spinner-border-sm me-2" aria-hidden></span>Working…</> : confirmText}
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default ConfirmDialog;

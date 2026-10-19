import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { mediaUrl } from '../../utils/mediaUrl';
import { STORAGE_LABELS } from '../../utils/storageLabels';
import './MediaPreviewModal.css';

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

/**
 * Full-size preview of a media file with its details: image (zoom to actual size on click),
 * video, audio, PDF, or a file icon. ← / → move through `items`, Esc closes.
 * Alt text can be edited here; onChanged() refreshes the library after a save or delete.
 */
const MediaPreviewModal = ({ items, index, onIndexChange, onClose, onDelete, onChanged }) => {
  const item = index !== null && index >= 0 ? items[index] : null;
  const [altText, setAltText] = useState('');
  const [saving, setSaving] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setAltText(item?.altText || '');
    setZoomed(false);
  }, [item?.id]);

  useEffect(() => {
    if (!item) return undefined;
    const onKey = (event) => {
      if (event.target.closest('input, textarea')) return;
      if (event.key === 'ArrowRight' && index < items.length - 1) onIndexChange(index + 1);
      if (event.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, index, items.length, onIndexChange]);

  if (!item) return null;

  const url = mediaUrl(item.url);
  const type = item.mimeType || '';
  const isImage = type.startsWith('image/');
  const isVideo = type.startsWith('video/');
  const isAudio = type.startsWith('audio/');
  const isPdf = type === 'application/pdf';

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    toast.info('URL copied');
  };

  const saveAlt = async () => {
    setSaving(true);
    try {
      await api.put(`/media/${item.id}`, { altText });
      toast.success('Alt text saved');
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show onHide={onClose} size="xl" centered contentClassName="media-preview" fullscreen="lg-down">
      <div className="media-preview-body">
        <div className={`media-preview-stage ${zoomed ? 'is-zoomed' : ''}`}>
          {isImage && (
            <img
              src={url}
              alt={item.altText || item.originalName}
              onClick={() => setZoomed((z) => !z)}
              title={zoomed ? 'Fit to screen' : 'View actual size'}
            />
          )}
          {isVideo && <video src={url} controls />}
          {isAudio && <audio src={url} controls />}
          {isPdf && <iframe src={url} title={item.originalName} />}
          {!isImage && !isVideo && !isAudio && !isPdf && (
            <div className="media-preview-file">
              <i className="bi bi-file-earmark"></i>
              <div>{type || 'File'}</div>
            </div>
          )}

          {index > 0 && (
            <button type="button" className="media-preview-nav is-prev" onClick={() => onIndexChange(index - 1)} aria-label="Previous">
              <i className="bi bi-chevron-left"></i>
            </button>
          )}
          {index < items.length - 1 && (
            <button type="button" className="media-preview-nav is-next" onClick={() => onIndexChange(index + 1)} aria-label="Next">
              <i className="bi bi-chevron-right"></i>
            </button>
          )}
          <div className="media-preview-counter">{index + 1} / {items.length}</div>
        </div>

        <aside className="media-preview-info">
          <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
            <h6 className="fw-bold mb-0 text-break">{item.originalName}</h6>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>

          <dl className="media-preview-meta">
            <dt>Type</dt><dd>{type || '—'}</dd>
            <dt>Size</dt><dd>{formatSize(item.size)}</dd>
            {item.dimensions?.width && <><dt>Dimensions</dt><dd>{item.dimensions.width} × {item.dimensions.height} px</dd></>}
            <dt>Uploaded</dt><dd>{item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : '—'}</dd>
            <dt>Stored in</dt><dd>{STORAGE_LABELS[item.storageType] || item.storageType || 'Project folder'}</dd>
          </dl>

          <label className="form-label small fw-semibold mb-1">File URL</label>
          <div className="input-group input-group-sm mb-3">
            <input type="text" className="form-control font-monospace" value={url} readOnly onFocus={(e) => e.target.select()} />
            <button type="button" className="btn btn-outline-primary" onClick={copy} title="Copy URL"><i className="bi bi-clipboard"></i></button>
          </div>

          {isImage && (
            <>
              <label className="form-label small fw-semibold mb-1">Alt text <span className="text-muted fw-normal">(for SEO and screen readers)</span></label>
              <textarea className="form-control form-control-sm mb-2" rows={2} value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Describe the image" />
              <button type="button" className="btn btn-sm btn-primary w-100 mb-3" onClick={saveAlt} disabled={saving || altText === (item.altText || '')}>
                {saving ? 'Saving…' : 'Save alt text'}
              </button>
            </>
          )}

          <div className="d-grid gap-2">
            <a className="btn btn-sm btn-light border" href={url} target="_blank" rel="noreferrer"><i className="bi bi-box-arrow-up-right me-1"></i>Open in new tab</a>
            <a className="btn btn-sm btn-light border" href={url} download={item.originalName}><i className="bi bi-download me-1"></i>Download</a>
            {onDelete && (
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(item)}>
                <i className="bi bi-trash me-1"></i>Move to Trash
              </button>
            )}
          </div>
          <p className="small text-muted mt-3 mb-0"><i className="bi bi-keyboard me-1"></i>← → for previous / next, Esc to close.</p>
        </aside>
      </div>
    </Modal>
  );
};

export default MediaPreviewModal;

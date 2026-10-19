import React, { useState } from 'react';
import MediaPickerModal from './MediaPickerModal';

/**
 * "Choose from Media" button for any image field (also inside a Bootstrap .input-group):
 * opens the Media picker (pick or upload to the active storage) and returns the file URL.
 */
const MediaPickButton = ({ onPick, label = '', title = 'Choose from Media', className = 'btn btn-outline-primary', size, accept = 'image/*' }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={`${className} ${size === 'sm' ? 'btn-sm' : ''}`} onClick={() => setOpen(true)} title={title}>
        <i className={`bi bi-images${label ? ' me-1' : ''}`}></i>{label}
      </button>
      <MediaPickerModal show={open} onClose={() => setOpen(false)} onSelect={(item) => { onPick(item.url, item); setOpen(false); }} title={title} accept={accept} />
    </>
  );
};

export default MediaPickButton;

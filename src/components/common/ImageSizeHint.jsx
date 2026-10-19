import React from 'react';
import { IMAGE_SIZES, imageSizeText } from '../../config/imageSizes';

/** "Recommended size" line under an image field (see config/imageSizes.js). */
const ImageSizeHint = ({ kind, className = 'form-text mt-1' }) => {
  const s = IMAGE_SIZES[kind];
  if (!s) return null;
  return (
    <div className={className}>
      <i className="bi bi-aspect-ratio me-1 text-primary"></i>
      <span className="fw-semibold">Recommended:</span> {imageSizeText(kind)}
      {s.note && <span className="d-block text-muted">{s.note}</span>}
    </div>
  );
};

export default ImageSizeHint;

import React, { useState } from 'react';
import { useMediaLibrary } from '../../context/MediaLibraryContext';
import { toast } from 'react-toastify';
import { confirmDialog } from '../common/confirm';
import { mediaUrl } from '../../utils/mediaUrl';
import MediaPreviewModal from './MediaPreviewModal';
import { STORAGE_LABELS } from '../../utils/storageLabels';

const MediaGrid = () => {
  const { mediaItems, isLoading, selectedItems, setSelectedItems, viewMode, deleteMedia, uploadMedia, fetchMedia } = useMediaLibrary();
  // Index of the file shown in the full-size preview (click a card / row), null = closed.
  const [previewIndex, setPreviewIndex] = useState(null);

  const handleToggleSelect = (id, e) => {
    e.stopPropagation();
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const copyToClipboard = (url, e) => {
    e.stopPropagation();
    const fullUrl = mediaUrl(url);
    navigator.clipboard.writeText(fullUrl);
    toast.info('URL copied to clipboard!');
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if ((await confirmDialog({ title: 'Move this file to the Trash?', message: 'It is removed from the Media library; pages that use it keep their link until the file is deleted forever.', note: 'You can restore it any time from Trash → Media.', tone: 'warning', confirmText: 'Move to Trash' }))) {
      await deleteMedia(id);
      setPreviewIndex(null);
    }
  };

  const preview = (
    <MediaPreviewModal
      items={mediaItems}
      index={previewIndex}
      onIndexChange={setPreviewIndex}
      onClose={() => setPreviewIndex(null)}
      onDelete={(item) => handleDelete(item.id)}
      onChanged={fetchMedia}
    />
  );

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadMedia(e.dataTransfer.files);
    }
  };

  if (isLoading && mediaItems.length === 0) {
    return (
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <div 
        className="flex-grow-1 d-flex flex-column justify-content-center align-items-center bg-body-tertiary h-100"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="text-center text-muted p-5 border border-2 border-dashed rounded-3 bg-white">
          <i className="bi bi-cloud-arrow-up fs-1 mb-2 d-block text-primary opacity-75"></i>
          <h5 className="fw-bold">Drag and drop files here</h5>
          <p className="mb-0">or use the Upload button</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-grow-1 p-4 overflow-y-auto bg-body-tertiary h-100 custom-scrollbar"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {mediaItems.map((item, itemIndex) => {
            const isImage = item.mimeType.startsWith('image/');
            const isSelected = selectedItems.includes(item.id);
            
            return (
              <div 
                key={item.id} 
                className={`card h-100 position-relative overflow-hidden group shadow-sm transition-all cursor-pointer ${isSelected ? 'border-primary ring-2 ring-primary' : 'hover-shadow'}`}
                style={{ border: isSelected ? '2px solid #4f46e5' : '1px solid #e5e7eb' }}
                onClick={() => setPreviewIndex(itemIndex)}
                title="Click to preview"
              >
                {/* Selection Checkbox (Top Left) */}
                <div className="position-absolute top-0 start-0 p-2 z-3">
                  <input 
                    type="checkbox" 
                    className="form-check-input" 
                    checked={isSelected}
                    onChange={(e) => handleToggleSelect(item.id, e)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                  />
                </div>
                {item.storageType && item.storageType !== 'local' && (
                  <span className="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75 z-3" style={{ fontSize: '0.65rem' }} title={`Stored in ${STORAGE_LABELS[item.storageType] || item.storageType}`}>
                    <i className="bi bi-cloud-check me-1"></i>{STORAGE_LABELS[item.storageType] || item.storageType}
                  </span>
                )}

                {/* Preview Area */}
                <div style={{ height: '160px', backgroundColor: '#f9fafb' }} className="d-flex align-items-center justify-content-center">
                  {isImage ? (
                    <img 
                      src={mediaUrl(item.url)} 
                      alt={item.altText || item.originalName} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div className="text-center text-muted">
                      <i className="bi bi-file-earmark-text" style={{ fontSize: '3rem' }}></i>
                      <div className="fw-bold mt-2 text-uppercase" style={{ fontSize: '0.7rem' }}>{item.mimeType.split('/')[1] || 'FILE'}</div>
                    </div>
                  )}
                </div>
                
                {/* File Details */}
                <div className="p-3 border-top bg-white">
                  <p className="mb-1 text-truncate fw-medium" style={{ fontSize: '0.85rem' }} title={item.originalName}>
                    {item.originalName}
                  </p>
                  <p className="mb-0 text-muted d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.75rem' }}>
                    <span>{Math.round(item.size / 1024)} KB</span>
                    {item.dimensions && <span>{item.dimensions.width}x{item.dimensions.height}</span>}
                  </p>
                </div>

                {/* Quick Actions (Hover - Top Right) */}
                <div 
                  className="position-absolute top-0 end-0 p-2 d-flex flex-column gap-2"
                  style={{ background: 'rgba(255,255,255,0.9)', borderBottomLeftRadius: '8px' }}
                >
                  <button 
                    className="btn btn-sm btn-light border-0 shadow-sm text-primary" 
                    style={{ width: '28px', height: '28px', padding: 0 }}
                    onClick={(e) => copyToClipboard(item.url, e)}
                    title="Copy URL"
                  >
                    <i className="bi bi-link-45deg"></i>
                  </button>
                  <button 
                    className="btn btn-sm btn-light border-0 shadow-sm text-danger" 
                    style={{ width: '28px', height: '28px', padding: 0 }}
                    onClick={(e) => handleDelete(item.id, e)}
                    title="Delete File"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-3 shadow-sm border">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th style={{ width: '40px' }} className="ps-3">
                  <input 
                    type="checkbox" 
                    className="form-check-input"
                    checked={selectedItems.length === mediaItems.length && mediaItems.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(mediaItems.map(m => m.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th style={{ width: '80px' }}>Preview</th>
                <th>Name</th>
                <th>Size</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th className="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mediaItems.map((item, itemIndex) => {
                const isSelected = selectedItems.includes(item.id);
                const isImage = item.mimeType.startsWith('image/');
                return (
                  <tr 
                    key={item.id} 
                    className={isSelected ? 'table-primary' : ''} 
                    onClick={() => setPreviewIndex(itemIndex)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="ps-3" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="form-check-input"
                        checked={isSelected}
                        onChange={(e) => handleToggleSelect(item.id, e)}
                      />
                    </td>
                    <td>
                      <div className="rounded overflow-hidden bg-light d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                        {isImage ? (
                          <img src={mediaUrl(item.url)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <i className="bi bi-file-earmark text-muted fs-4"></i>
                        )}
                      </div>
                    </td>
                    <td className="fw-medium">{item.originalName}</td>
                    <td className="text-muted small">{Math.round(item.size / 1024)} KB</td>
                    <td className="text-muted small">{item.mimeType}</td>
                    <td className="text-muted small">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="text-end pe-3">
                      <button className="btn btn-sm btn-light text-primary me-2" onClick={(e) => copyToClipboard(item.url, e)}>
                        <i className="bi bi-link-45deg"></i>
                      </button>
                      <button className="btn btn-sm btn-light text-danger" onClick={(e) => handleDelete(item.id, e)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {preview}
    </div>
  );
};

export default MediaGrid;

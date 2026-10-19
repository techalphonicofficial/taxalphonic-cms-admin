import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { MediaLibraryProvider, useMediaLibrary } from '../../context/MediaLibraryContext';
import MediaSidebar from './MediaSidebar';
import { mediaUrl } from '../../utils/mediaUrl';

/**
 * Pick a file from the Media library, or upload a new one right here: uploads go to the active
 * storage (Media → Media Settings: project folder, S3, ...) into the folder open on the left,
 * and the new file is selected. Double-click a file to insert it at once.
 */
const MediaPickerInner = ({ onSelect, onClose, accept }) => {
  const { mediaItems, isLoading, currentFolderId, fetchMedia, searchQuery, setSearchQuery } = useMediaLibrary();
  const [selectedId, setSelectedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  const insert = (item) => {
    if (!item) return;
    onSelect(item);
    onClose();
  };

  const handleSelect = () => insert(mediaItems.find(m => m.id === selectedId));

  const upload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      let last = null;
      for (const file of files) {
        const body = new FormData();
        body.append('file', file);
        if (currentFolderId) body.append('folderId', currentFolderId);
        const res = await api.post('/media/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } });
        last = res.data?.data || last;
      }
      await fetchMedia();
      if (last) setSelectedId(last.id);
      toast.success(files.length === 1 ? 'Uploaded — click Insert to use it.' : `${files.length} files uploaded.`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <>
      <div className="modal-body p-0 overflow-hidden d-flex bg-body-tertiary">
        <div style={{ width: '250px' }} className="border-end bg-white">
          <MediaSidebar />
        </div>
        
        <div className="flex-grow-1 d-flex flex-column bg-body-tertiary">
          <div className="p-3 border-bottom bg-white d-flex justify-content-between align-items-center gap-2 mb-2">
             <div className="d-flex align-items-center bg-light rounded px-3 py-2 w-50">
               <i className="bi bi-search text-muted me-2"></i>
               <input 
                 type="text" 
                 className="form-control form-control-sm border-0 bg-transparent p-0 shadow-none"
                 placeholder="Search media..."
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
               />
             </div>
             <div>
               <input ref={fileInput} type="file" className="d-none" multiple accept={accept} onChange={e => upload([...e.target.files])} />
               <button type="button" className="btn btn-primary btn-sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
                 {uploading ? <><span className="spinner-border spinner-border-sm me-2"></span>Uploading…</> : <><i className="bi bi-cloud-arrow-up me-1"></i>Upload new</>}
               </button>
             </div>
          </div>
          
          <div className="flex-grow-1 overflow-y-auto p-4 custom-scrollbar">
            {isLoading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
            ) : mediaItems.length === 0 ? (
               <div className="text-center text-muted py-5 mt-5">
                  <i className="bi bi-folder-x display-1 mb-3 opacity-25"></i>
                  <p className="lead">No media found in this folder</p>
               </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                {mediaItems.map(item => {
                  const isImage = item.mimeType.startsWith('image/');
                  const isSelected = selectedId === item.id;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`card h-100 position-relative overflow-hidden cursor-pointer ${isSelected ? 'border-primary ring-2 ring-primary shadow-sm' : 'hover-shadow'}`}
                      style={{ border: isSelected ? '2px solid #4f46e5' : '1px solid #e5e7eb' }}
                      onClick={() => setSelectedId(item.id)}
                      onDoubleClick={() => insert(item)}
                      title="Double-click to insert"
                    >
                      <div style={{ height: '120px', backgroundColor: '#f9fafb' }} className="d-flex align-items-center justify-content-center">
                        {isImage ? (
                          <img src={mediaUrl(item.url)} alt={item.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <i className="bi bi-file-earmark-text fs-1 text-muted"></i>
                        )}
                      </div>
                      <div className="p-2 border-top bg-white text-truncate" style={{ fontSize: '0.75rem' }}>
                        {item.originalName}
                      </div>
                      {isSelected && (
                         <div className="position-absolute top-0 end-0 m-1 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: '24px', height: '24px'}}>
                            <i className="bi bi-check"></i>
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="modal-footer border-top bg-light">
        <button type="button" className="btn btn-light border" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary px-4" disabled={!selectedId} onClick={handleSelect}>
          Insert Selected
        </button>
      </div>
    </>
  );
};

const MediaPickerModal = ({ show, onClose, onSelect, title = "Select Media", accept = 'image/*,video/*,application/pdf' }) => {
  if (!show) return null;

  // Rendered into <body>: the picker opens from inside the Page Builder, whose animated
  // (transformed) containers would otherwise pin this position:fixed modal to themselves.
  return createPortal(
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1070 }}></div>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1075 }} onClick={onClose}>
        <div className="modal-dialog modal-xl modal-dialog-centered" onClick={e => e.stopPropagation()}>
          <div className="modal-content shadow-lg border-0" style={{ height: '80vh' }}>
            <div className="modal-header border-bottom">
              <h5 className="modal-title fw-bold">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            
            <MediaLibraryProvider>
               <MediaPickerInner onSelect={onSelect} onClose={onClose} accept={accept} />
            </MediaLibraryProvider>
            
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default MediaPickerModal;

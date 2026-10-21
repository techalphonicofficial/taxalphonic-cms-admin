import React, { useRef } from 'react';
import { useMediaLibrary } from '../../context/MediaLibraryContext';
import { Dropdown } from 'react-bootstrap';
import { confirmDialog } from '../common/confirm';
import { ACCEPT } from './folderUpload';

const MediaToolbar = () => {
  const { 
    viewMode, 
    setViewMode, 
    searchQuery, 
    setSearchQuery, 
    selectedItems, 
    setSelectedItems,
    deleteMedia,
    uploadMedia,
    isUploading,
    pickFolder,
    uploadProgress,
  } = useMediaLibrary();

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      uploadMedia(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if ((await confirmDialog({ title: `Move ${selectedItems.length} selected files to the Trash?`, message: 'They are removed from the Media library.', note: 'You can restore them any time from Trash → Media.', tone: 'warning', confirmText: 'Move to Trash' }))) {
      selectedItems.forEach(id => deleteMedia(id));
      setSelectedItems([]);
    }
  };

  return (
    <div className="p-3 border-bottom bg-white d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center gap-3">
        {/* Search */}
        <div className="position-relative" style={{ width: '250px' }}>
          <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
          <input 
            type="text" 
            className="form-control form-control-sm bg-body-tertiary border-0 ps-5" 
            placeholder="Search media..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Selection Actions */}
        {selectedItems.length > 0 && (
          <div className="d-flex align-items-center gap-2 border-start ps-3">
            <span className="small text-muted fw-medium">{selectedItems.length} selected</span>
            <button className="btn btn-sm btn-light border shadow-sm text-danger" onClick={handleBulkDelete} title="Delete Selected">
              <i className="bi bi-trash"></i>
            </button>
            <button className="btn btn-sm btn-light border shadow-sm" onClick={() => setSelectedItems([])} title="Clear Selection">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        )}
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* View Toggles */}
        <div className="btn-group shadow-sm">
          <button 
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-secondary' : 'btn-light border'}`}
            onClick={() => setViewMode('grid')}
          >
            <i className="bi bi-grid-fill"></i>
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-secondary' : 'btn-light border'}`}
            onClick={() => setViewMode('list')}
          >
            <i className="bi bi-list-ul"></i>
          </button>
        </div>

        {/* Upload Button */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          multiple 
          accept={ACCEPT}
        />
        <Dropdown align="end">
          <Dropdown.Toggle
            as="button"
            type="button"
            className="premium-btn-primary py-1 px-3"
            style={{ fontSize: '0.875rem' }}
            disabled={isUploading}
          >
            {isUploading ? (
              <><span className="spinner-border spinner-border-sm me-2"></span> {uploadProgress ? `Uploading ${uploadProgress.done}/${uploadProgress.total}` : 'Uploading...'}</>
            ) : (
              <><i className="bi bi-cloud-arrow-up me-2"></i> Upload</>
            )}
          </Dropdown.Toggle>
          <Dropdown.Menu className="shadow-sm small">
            <Dropdown.Item as="button" type="button" onClick={() => fileInputRef.current?.click()}>
              <i className="bi bi-file-earmark-arrow-up me-2"></i>Upload files
            </Dropdown.Item>
            <Dropdown.Item as="button" type="button" onClick={() => pickFolder()}>
              <i className="bi bi-folder-symlink me-2"></i>Upload folder
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Keeps its subfolders</div>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );
};

export default MediaToolbar;

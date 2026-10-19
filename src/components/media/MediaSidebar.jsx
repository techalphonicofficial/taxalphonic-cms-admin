import React, { useState } from 'react';
import { useMediaLibrary } from '../../context/MediaLibraryContext';

const FolderNode = ({ folder, level = 0 }) => {
  const { currentFolderId, setCurrentFolderId, deleteFolder } = useMediaLibrary();
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = folder.children && folder.children.length > 0;
  
  const isSelected = currentFolderId === folder.id;

  return (
    <div className="folder-node">
      <div 
        className={`d-flex align-items-center justify-content-between py-1 px-2 rounded cursor-pointer transition-all ${isSelected ? 'bg-primary-subtle text-primary fw-medium' : 'hover-bg text-secondary'}`}
        style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
      >
        <div className="d-flex align-items-center overflow-hidden flex-grow-1">
          <div 
            className="me-2" 
            style={{ width: '20px', textAlign: 'center' }}
            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          >
            {hasChildren ? (
              <i className={`bi ${isOpen ? 'bi-caret-down-fill' : 'bi-caret-right-fill'} small text-muted`}></i>
            ) : (
              <span style={{ display: 'inline-block', width: '16px' }}></span>
            )}
          </div>
          <div className="d-flex align-items-center flex-grow-1 overflow-hidden" onClick={() => setCurrentFolderId(folder.id)}>
            <i className={`bi ${isOpen ? 'bi-folder2-open' : 'bi-folder'} me-2 ${isSelected ? 'text-primary' : 'text-muted'}`}></i>
            <span className="text-truncate small">{folder.name}</span>
          </div>
        </div>
        
        {isSelected && (
          <button 
            className="btn btn-sm btn-link text-danger p-0 ms-2"
            onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
            title="Delete Folder"
          >
            <i className="bi bi-trash"></i>
          </button>
        )}
      </div>
      
      {isOpen && hasChildren && (
        <div className="folder-children mt-1">
          {folder.children.map(child => (
            <FolderNode key={child.id} folder={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const MediaSidebar = () => {
  const { 
    folders, 
    createFolder, 
    currentFolderId, 
    setCurrentFolderId,
    categories,
    createCategory,
    currentCategoryId,
    setCurrentCategoryId,
    deleteCategory
  } = useMediaLibrary();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      createCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsCreatingCategory(false);
    }
  };

  return (
    <div className="bg-white border-end h-100 d-flex flex-column flex-shrink-0" style={{ width: '260px' }}>
      {/* Folders Section */}
      <div className="p-3 border-bottom d-flex align-items-center justify-content-between text-muted fw-bold small text-uppercase" style={{ letterSpacing: '0.5px' }}>
        Folders
        <button 
          className="btn btn-sm btn-link p-0 text-primary" 
          onClick={() => setIsCreatingFolder(!isCreatingFolder)}
        >
          <i className={`bi ${isCreatingFolder ? 'bi-x-circle' : 'bi-plus-circle'}`}></i>
        </button>
      </div>
      
      <div className="p-2 custom-scrollbar overflow-y-auto flex-grow-1" style={{ flexBasis: '65%' }}>
        <div 
          className={`d-flex align-items-center py-2 px-2 rounded cursor-pointer mb-2 transition-all ${currentFolderId === null && currentCategoryId === null ? 'bg-primary-subtle text-primary fw-medium' : 'hover-bg text-secondary'}`}
          onClick={() => {
            setCurrentFolderId(null);
            setCurrentCategoryId(null);
          }}
        >
          <i className={`bi bi-hdd-network me-2 ${currentFolderId === null && currentCategoryId === null ? 'text-primary' : 'text-muted'}`}></i>
          <span className="small">All Media</span>
        </div>

        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="px-2 mb-3">
            <div className="input-group input-group-sm">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Folder name..." 
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                autoFocus
              />
              <button className="btn btn-primary" type="submit"><i className="bi bi-check"></i></button>
            </div>
          </form>
        )}

        {folders.map(folder => (
          <FolderNode key={folder.id} folder={folder} />
        ))}
      </div>

      {/* Categories Section */}
      <div className="p-3 border-bottom border-top d-flex align-items-center justify-content-between text-muted fw-bold small text-uppercase" style={{ letterSpacing: '0.5px' }}>
        Categories
        <button 
          className="btn btn-sm btn-link p-0 text-primary" 
          onClick={() => setIsCreatingCategory(!isCreatingCategory)}
        >
          <i className={`bi ${isCreatingCategory ? 'bi-x-circle' : 'bi-plus-circle'}`}></i>
        </button>
      </div>

      <div className="p-2 custom-scrollbar overflow-y-auto flex-grow-1" style={{ flexBasis: '35%' }}>
        {isCreatingCategory && (
          <form onSubmit={handleCreateCategory} className="px-2 mb-3 mt-1">
            <div className="input-group input-group-sm">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Category name..." 
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                autoFocus
              />
              <button className="btn btn-primary" type="submit"><i className="bi bi-check"></i></button>
            </div>
          </form>
        )}

        {categories.map(category => (
          <div key={category.id} className="folder-node">
            <div 
              className={`d-flex align-items-center justify-content-between py-1 px-2 rounded cursor-pointer transition-all ${currentCategoryId === category.id ? 'bg-primary-subtle text-primary fw-medium' : 'hover-bg text-secondary'}`}
            >
              <div 
                className="d-flex align-items-center flex-grow-1 overflow-hidden" 
                onClick={() => {
                   setCurrentCategoryId(category.id);
                   setCurrentFolderId(null);
                }}
              >
                <i className={`bi bi-tag me-2 ${currentCategoryId === category.id ? 'text-primary' : 'text-muted'}`}></i>
                <span className="text-truncate small">{category.name}</span>
              </div>
              
              {currentCategoryId === category.id && (
                <button 
                  className="btn btn-sm btn-link text-danger p-0 ms-2"
                  onClick={(e) => { e.stopPropagation(); deleteCategory(category.id); }}
                  title="Delete Category"
                >
                  <i className="bi bi-trash"></i>
                </button>
              )}
            </div>
          </div>
        ))}
        {categories.length === 0 && !isCreatingCategory && (
           <div className="text-center text-muted small py-2">No categories yet</div>
        )}
      </div>
    </div>
  );
};

export default MediaSidebar;

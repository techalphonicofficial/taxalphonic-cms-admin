import React, { useState } from 'react';
import { useMediaLibrary } from '../../context/MediaLibraryContext';
import FolderMenu, { FolderNameInput } from './FolderMenu';

const countFolders = (folder) => (folder.children || []).reduce((n, child) => n + 1 + countFolders(child), 0);

/**
 * Above the files: where you are (All Media / A / B, each part clickable) and the subfolders of
 * the open folder as tiles. A tile opens the folder, has the folder menu (new subfolder, upload
 * folder here, rename, delete) and takes dropped files or folders (onDropInto).
 */
const FolderTiles = ({ onDropInto }) => {
  const { folders, currentFolderId, setCurrentFolderId, setCurrentCategoryId, folderById, renameFolder, createFolder } = useMediaLibrary();
  const [editing, setEditing] = useState(null); // { id, mode: 'rename' | 'subfolder' }
  const [dragOver, setDragOver] = useState(null);

  const current = folderById(currentFolderId);
  const subfolders = current ? current.children || [] : folders;

  const trail = [];
  for (let f = current; f; f = f.parentId ? folderById(f.parentId) : null) trail.unshift(f);

  const open = (id) => {
    setCurrentFolderId(id);
    setCurrentCategoryId(null);
  };

  if (!current && !subfolders.length) return null;

  return (
    <div className="mb-4">
      {current && (
        <nav className="d-flex flex-wrap align-items-center gap-1 small mb-3" aria-label="Folder path">
          <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => open(null)}>
            <i className="bi bi-hdd-network me-1"></i>All Media
          </button>
          {trail.map((f, i) => (
            <React.Fragment key={f.id}>
              <i className="bi bi-chevron-right text-muted" style={{ fontSize: '0.7rem' }}></i>
              {i === trail.length - 1
                ? <span className="fw-semibold text-body">{f.name}</span>
                : <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => open(f.id)}>{f.name}</button>}
            </React.Fragment>
          ))}
        </nav>
      )}

      {subfolders.length > 0 && (
        <>
          <div className="text-muted fw-bold small text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>Folders</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {subfolders.map(folder => {
              const inner = countFolders(folder);
              if (editing?.id === folder.id && editing.mode === 'rename') {
                return (
                  <div key={folder.id} className="card shadow-sm p-2">
                    <FolderNameInput initial={folder.name} onSave={(name) => { renameFolder(folder.id, name); setEditing(null); }} onCancel={() => setEditing(null)} />
                  </div>
                );
              }
              return (
                <div key={folder.id}>
                  <div
                    className={`card shadow-sm d-flex flex-row align-items-center gap-2 px-3 py-2 cursor-pointer hover-shadow ${dragOver === folder.id ? 'border-primary bg-primary-subtle' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => open(folder.id)}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(folder.id); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(null); onDropInto(e, folder.id); }}
                    title={dragOver === folder.id ? `Drop to upload into ${folder.name}` : `Open ${folder.name}`}
                  >
                    <i className="bi bi-folder-fill text-warning fs-4"></i>
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="text-truncate fw-medium small">{folder.name}</div>
                      {inner > 0 && <div className="text-muted" style={{ fontSize: '0.72rem' }}>{inner} subfolder{inner > 1 ? 's' : ''}</div>}
                    </div>
                    <FolderMenu
                      folder={folder}
                      onRename={() => setEditing({ id: folder.id, mode: 'rename' })}
                      onNewSubfolder={() => setEditing({ id: folder.id, mode: 'subfolder' })}
                    />
                  </div>
                  {editing?.id === folder.id && editing.mode === 'subfolder' && (
                    <div className="mt-1">
                      <FolderNameInput placeholder="Subfolder name..." onSave={(name) => { createFolder(name, folder.id); setEditing(null); }} onCancel={() => setEditing(null)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default FolderTiles;

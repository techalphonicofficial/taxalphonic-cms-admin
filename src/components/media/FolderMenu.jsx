import React, { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useMediaLibrary } from '../../context/MediaLibraryContext';

/** Inline text box for a folder name: Enter / ✓ saves, Esc / blur without change cancels. */
export const FolderNameInput = ({ initial = '', placeholder = 'Folder name...', onSave, onCancel }) => {
  const [name, setName] = useState(initial);
  const save = () => {
    const value = name.trim();
    if (value && value !== initial) onSave(value);
    else onCancel();
  };
  return (
    <form
      className="input-group input-group-sm"
      onSubmit={(e) => { e.preventDefault(); save(); }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
        autoFocus
        maxLength={100}
      />
      <button className="btn btn-primary" type="submit" title="Save"><i className="bi bi-check"></i></button>
      <button className="btn btn-light border" type="button" onClick={onCancel} title="Cancel"><i className="bi bi-x"></i></button>
    </form>
  );
};

/**
 * ⋮ menu of a Media folder: new subfolder, upload a local folder into it, rename, delete (Trash).
 * Rename and new subfolder are edited inline by the parent (onRename / onNewSubfolder).
 */
const FolderMenu = ({ folder, onRename, onNewSubfolder, className = '' }) => {
  const { pickFolder, deleteFolder, isUploading } = useMediaLibrary();
  return (
    <Dropdown align="end" onClick={(e) => e.stopPropagation()} className={className}>
      {/* bsPrefix drops Bootstrap's dropdown-toggle class, i.e. the caret. */}
      <Dropdown.Toggle as="button" type="button" bsPrefix="ta-folder-toggle" className="btn btn-sm btn-link text-muted p-0 px-1 border-0" title="Folder actions" aria-label={`Actions for ${folder.name}`}>
        <i className="bi bi-three-dots-vertical"></i>
      </Dropdown.Toggle>
      <Dropdown.Menu popperConfig={{ strategy: 'fixed' }} className="shadow-sm small">
        <Dropdown.Item as="button" type="button" onClick={onNewSubfolder}><i className="bi bi-folder-plus me-2"></i>New subfolder</Dropdown.Item>
        <Dropdown.Item as="button" type="button" onClick={() => pickFolder(folder.id)} disabled={isUploading}><i className="bi bi-folder-symlink me-2"></i>Upload folder here</Dropdown.Item>
        <Dropdown.Item as="button" type="button" onClick={onRename}><i className="bi bi-pencil me-2"></i>Rename</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item as="button" type="button" className="text-danger" onClick={() => deleteFolder(folder.id)}><i className="bi bi-trash me-2"></i>Delete folder</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default FolderMenu;

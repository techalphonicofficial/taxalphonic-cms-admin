import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { confirmDialog, confirmDelete } from '../components/common/confirm';
import { sortEntries, entriesFromFileList } from '../components/media/folderUpload';

// Files per request when uploading a folder (the server takes up to 50).
const FOLDER_BATCH = 10;

// "2 file(s) failed: logo.ico (Input buffer ...), ..." from the bulk upload's errors.
const failedMessage = (failures) =>
  `${failures.length} file(s) failed: ${failures.slice(0, 3).map((f) => `${f.field} (${f.message})`).join(', ')}${failures.length > 3 ? ', …' : ''}`;

const flattenFolders =(tree, parentPath = []) => tree.flatMap((folder) => {
  const path = [...parentPath, folder.name];
  return [{ ...folder, path }, ...flattenFolders(folder.children || [], path)];
});

const MediaLibraryContext = createContext();

export const useMediaLibrary = () => useContext(MediaLibraryContext);

export const MediaLibraryProvider = ({ children }) => {
  const [mediaItems, setMediaItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Folder upload progress: { done, total } while it runs, else null.
  const [uploadProgress, setUploadProgress] = useState(null);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await api.get('/media/folders', { params: { asTree: true } });
      setFolders(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch folders', error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/media/categories', { params: { limit: 100 } });
      setCategories(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  }, []);

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        limit: 200,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      };

      if (currentFolderId) params.folderId = currentFolderId;
      if (currentCategoryId) params.categoryId = currentCategoryId;
      
      if (searchQuery && searchQuery.trim() !== '') {
        params.originalName_like = searchQuery.trim();
      }
      
      const res = await api.get('/media', { params });
      setMediaItems(res.data?.data || res.data || []);
    } catch (error) {
      console.error('Failed to fetch media:', error);
      toast.error('Failed to load media items');
    } finally {
      setIsLoading(false);
    }
  }, [currentFolderId, currentCategoryId, searchQuery]);

  useEffect(() => {
    fetchFolders();
    fetchCategories();
  }, [fetchFolders, fetchCategories]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const uploadMedia = async (files) => {
    setIsUploading(true);
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    if (currentFolderId) formData.append('folderId', currentFolderId);
    if (currentCategoryId) formData.append('categoryId', currentCategoryId);
    
    try {
      const res = await api.post('/media/upload/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const count = res.data?.data?.length || files.length;
      toast.success(`Successfully uploaded ${count} file(s)`);
      if (res.data?.errors?.length) toast.error(failedMessage(res.data.errors), { autoClose: 10000 });
      fetchMedia();
    } catch (error) {
      console.error(error);
      const errors = error.response?.data?.errors || [];
      toast.error(errors.length ? failedMessage(errors) : error.response?.data?.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMedia = async (id) => {
    try {
      await api.delete(`/media/${id}`);
      toast.success('Moved to trash');
      fetchMedia();
    } catch (error) {
      toast.error('Failed to delete media');
    }
  };
  
  // parentId: undefined = inside the open folder, null = top level, or a folder id.
  const createFolder = async (name, parentId) => {
    try {
      await api.post('/media/folders', { name, parentId: parentId === undefined ? currentFolderId : parentId });
      toast.success('Folder created');
      fetchFolders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create folder');
    }
  };

  const renameFolder = async (id, name) => {
    try {
      await api.put(`/media/folders/${id}`, { name });
      toast.success('Folder renamed');
      fetchFolders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to rename folder');
    }
  };

  const flatFolders = flattenFolders(folders);
  const folderById = (id) => flatFolders.find((f) => f.id === id) || null;

  const deleteFolder = async (id) => {
    const folder = folderById(id);
    const subfolders = folder ? flattenFolders(folder.children || []).length : 0;
    const ok = await confirmDialog({
      title: `Move ${folder ? `"${folder.name}"` : 'this folder'} to the Trash?`,
      message: `The folder goes to the Trash with all its files${subfolders ? ` and ${subfolders} subfolder${subfolders > 1 ? 's' : ''}` : ''}.`,
      note: 'Restore it from Trash → Media Folders to bring everything back.',
      tone: 'warning',
      confirmText: 'Move to Trash',
    });
    if (!ok) return;
    try {
      await api.delete(`/media/folders/${id}`);
      toast.success('Folder moved to trash');
      // The open folder was this one or inside it: go to the deleted folder's parent.
      const open = folderById(currentFolderId);
      if (open && folder && open.path.slice(0, folder.path.length).join('/') === folder.path.join('/')) {
        setCurrentFolderId(folder.parentId || null);
      }
      setSelectedItems([]);
      fetchFolders();
      fetchMedia();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete folder');
    }
  };

  /**
   * Uploads a local folder: entries = [{ file, dirs }] (folderUpload.js). Each folder in `dirs` is
   * found or created (same name, case-insensitive, under the same parent) below `parentId`
   * (default: the open folder), then the files go into their folder in batches.
   */
  const uploadFolder = async (entries, parentId = currentFolderId) => {
    const { upload, skipped } = sortEntries(entries);
    if (!upload.length) {
      toast.warning(skipped.length ? `Nothing to upload: ${skipped.length} file(s) skipped (unsupported type or over 50 MB).` : 'The folder is empty.');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ done: 0, total: upload.length });
    let uploaded = 0;
    const failures = [];
    let createdFolders = 0;
    try {
      // Current folders (flat), so existing ones are reused instead of duplicated.
      const res = await api.get('/media/folders', { params: { limit: 1000 } });
      const known = (res.data?.data || []).map((f) => ({ id: f.id, name: f.name, parentId: f.parentId || null }));
      const ids = new Map(); // "a/b" -> folder id

      const ensureFolder = async (dirs) => {
        if (!dirs.length) return parentId || null;
        const key = dirs.join('/');
        if (ids.has(key)) return ids.get(key);
        const parent = await ensureFolder(dirs.slice(0, -1));
        const name = dirs[dirs.length - 1];
        let folder = known.find((f) => f.parentId === parent && f.name.trim().toLowerCase() === name.trim().toLowerCase());
        if (!folder) {
          const created = await api.post('/media/folders', { name, parentId: parent });
          folder = { id: created.data?.data?.id, name, parentId: parent };
          if (!folder.id) throw new Error(`Could not create folder "${name}"`);
          known.push(folder);
          createdFolders += 1;
        }
        ids.set(key, folder.id);
        return folder.id;
      };

      // Group the files by target folder, creating folders parent-first.
      const groups = new Map();
      for (const entry of upload) {
        const folderId = await ensureFolder(entry.dirs);
        if (!groups.has(folderId)) groups.set(folderId, []);
        groups.get(folderId).push(entry.file);
      }

      for (const [folderId, files] of groups) {
        for (let i = 0; i < files.length; i += FOLDER_BATCH) {
          const batch = files.slice(i, i + FOLDER_BATCH);
          const formData = new FormData();
          batch.forEach((file) => formData.append('files', file));
          if (folderId) formData.append('folderId', folderId);
          if (currentCategoryId) formData.append('categoryId', currentCategoryId);
          // The server saves each file on its own: data = saved, errors = [{ field: name, message }].
          try {
            const result = await api.post('/media/upload/bulk', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const errors = result.data?.errors || [];
            uploaded += Array.isArray(result.data?.data) ? result.data.data.length : batch.length - errors.length;
            failures.push(...errors);
          } catch (error) {
            console.error('Folder upload batch failed', error);
            const errors = error.response?.data?.errors || [];
            failures.push(...(errors.length ? errors : batch.map((file) => ({ field: file.name, message: error.response?.data?.message || error.message }))));
          }
          setUploadProgress({ done: Math.min(upload.length, uploaded + failures.length), total: upload.length });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || 'Folder upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      fetchFolders();
      fetchMedia();
    }

    if (uploaded) toast.success(`Uploaded ${uploaded} file(s)${createdFolders ? `, created ${createdFolders} folder(s)` : ''}`);
    if (failures.length) toast.error(failedMessage(failures), { autoClose: 10000 });
    if (skipped.length) {
      toast.info(`Skipped ${skipped.length} file(s): ${skipped.slice(0, 3).map((s) => `${s.file.name} (${s.reason})`).join(', ')}${skipped.length > 3 ? ', …' : ''}`);
    }
  };
  
  const createCategory = async (name) => {
    try {
      await api.post('/media/categories', { name });
      toast.success('Category created');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const deleteCategory = async (id) => {
    if (!(await confirmDelete(null, { what: 'category' }))) return;
    try {
      await api.delete(`/media/categories/${id}`);
      toast.success('Category deleted');
      if (currentCategoryId === id) setCurrentCategoryId(null);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  // One hidden folder picker for the toolbar, the folder menus and the folder tiles:
  // pickFolder(parentId) uploads the chosen local folder into parentId (default: the open folder).
  const folderInputRef = useRef(null);
  const folderTargetRef = useRef(undefined);
  const pickFolder = (parentId) => {
    folderTargetRef.current = parentId;
    folderInputRef.current?.click();
  };
  const onFolderPicked = (e) => {
    const files = e.target.files;
    if (files?.length) {
      const target = folderTargetRef.current;
      uploadFolder(entriesFromFileList(files), target === undefined ? currentFolderId : target);
    }
    e.target.value = '';
  };

  const value = {
    mediaItems,
    folders,
    categories,
    currentFolderId,
    setCurrentFolderId,
    currentCategoryId,
    setCurrentCategoryId,
    selectedItems,
    setSelectedItems,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    isLoading,
    isUploading,
    fetchMedia,
    fetchFolders,
    fetchCategories,
    uploadMedia,
    deleteMedia,
    createFolder,
    renameFolder,
    deleteFolder,
    uploadFolder,
    pickFolder,
    uploadProgress,
    flatFolders,
    folderById,
    createCategory,
    deleteCategory
  };

  return (
    <MediaLibraryContext.Provider value={value}>
      {children}
      <input type="file" ref={folderInputRef} onChange={onFolderPicked} webkitdirectory="" directory="" multiple hidden />
    </MediaLibraryContext.Provider>
  );
};

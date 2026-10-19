import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { confirmDialog, confirmDelete } from '../components/common/confirm';

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
      fetchMedia();
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload files');
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
  
  const createFolder = async (name, parentId = null) => {
    try {
      await api.post('/media/folders', { name, parentId: parentId || currentFolderId });
      toast.success('Folder created');
      fetchFolders();
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  const deleteFolder = async (id) => {
    if (!(await confirmDialog({ title: 'Move this folder to the Trash?', message: 'The folder goes to the Trash with its subfolders and files.', note: 'Restore it from Trash → Media Folders to bring everything back.', confirmText: 'Move to Trash' }))) return;
    try {
      await api.delete(`/media/folders/${id}`);
      toast.success('Folder moved to trash');
      if (currentFolderId === id) setCurrentFolderId(null);
      fetchFolders();
      fetchMedia();
    } catch (error) {
      toast.error('Failed to delete folder');
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
    deleteFolder,
    createCategory,
    deleteCategory
  };

  return (
    <MediaLibraryContext.Provider value={value}>
      {children}
    </MediaLibraryContext.Provider>
  );
};

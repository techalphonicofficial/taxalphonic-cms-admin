import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import { useTheme } from '../context/ThemeContext';
import { useForm, Controller } from 'react-hook-form';
import JoditEditor from 'jodit-react';
import api from '../services/api';
import { toast } from 'react-toastify';
import MediaPickerModal from '../components/media/MediaPickerModal';
import ImageSizeHint from '../components/common/ImageSizeHint';
import { mediaUrl } from '../utils/mediaUrl';

const joditConfig = {
  toolbarAdaptive: false,
  toolbarSticky: false,
  showCharsCounter: false,
  showWordsCounter: false,
  showXPathInStatusbar: false,
  height: 600,
  buttons: [
    'paragraph', '|',
    'bold', 'italic', 'underline', 'brush', '|',
    'ul', 'ol', '|',
    'outdent', 'indent', '|',
    'link', 'image', '|',
    'align', 'undo', 'redo'
  ],
  controls: {
    paragraph: {
      text: 'Format',
      icon: false,
      list: {
        p: 'Normal',
        h1: 'Heading 1',
        h2: 'Heading 2',
        h3: 'Heading 3',
        h4: 'Heading 4',
        h5: 'Heading 5',
        h6: 'Heading 6'
      }
    }
  }
};

const BannerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState(null);

  const editorConfig = useMemo(() => ({
    ...joditConfig,
    theme: theme === 'dark' ? 'dark' : 'default'
  }), [theme]);
  
  // Image states will store the relative URL (e.g. /uploads/image.webp)
  const [imageUrl, setImageUrl] = useState(null);
  const [mobileImageUrl, setMobileImageUrl] = useState(null);
  
  // Media Picker state
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState('desktop'); // 'desktop' or 'mobile'

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      subtitle: '',
      description: '',
      buttonText: '',
      linkUrl: '',
      linkTarget: '_self',
      textAlignment: 'left',
      textColorTheme: 'light',
      startDate: '',
      endDate: '',
      videoUrl: '',
      displayOrder: 0,
      status: 'published'
    }
  });

  useEffect(() => {
    const fetchBanner = async () => {
      if (!isEditMode) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/banners/${id}`);
        const data = res.data.data;
        setInitialData(data);
        reset({
          title: data.title || '',
          subtitle: data.subtitle || '',
          description: data.description || '',
          buttonText: data.buttonText || '',
          linkUrl: data.linkUrl || '',
          linkTarget: data.linkTarget || '_self',
          textAlignment: data.textAlignment || 'left',
          textColorTheme: data.textColorTheme || 'light',
          startDate: data.startDate ? data.startDate.substring(0, 16) : '',
          endDate: data.endDate ? data.endDate.substring(0, 16) : '',
          videoUrl: data.videoUrl || '',
          displayOrder: data.displayOrder || 0,
          status: data.status || 'published'
        });
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
        }
        if (data.mobileImageUrl) {
          setMobileImageUrl(data.mobileImageUrl);
        }
      } catch (error) {
        toast.error('Failed to load banner details.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBanner();
  }, [id, isEditMode, reset]);

  const clearFile = () => {
    setImageUrl(null);
  };

  const clearMobileFile = () => {
    setMobileImageUrl(null);
  };
  
  const handleOpenMediaPicker = (target) => {
    setMediaPickerTarget(target);
    setShowMediaPicker(true);
  };
  
  const handleMediaSelected = (mediaItem) => {
    if (mediaPickerTarget === 'desktop') {
      setImageUrl(mediaItem.url);
    } else {
      setMobileImageUrl(mediaItem.url);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('subtitle', data.subtitle);
      formData.append('description', data.description || '');
      formData.append('buttonText', data.buttonText || '');
      formData.append('linkUrl', data.linkUrl || '');
      formData.append('linkTarget', data.linkTarget);
      formData.append('textAlignment', data.textAlignment);
      formData.append('textColorTheme', data.textColorTheme);
      formData.append('startDate', data.startDate || '');
      formData.append('endDate', data.endDate || '');
      formData.append('videoUrl', data.videoUrl || '');
      formData.append('displayOrder', data.displayOrder);
      formData.append('status', data.status);
      
      if (!imageUrl) {
        toast.error('Please select a main image for the banner.');
        setIsLoading(false);
        return;
      }
      
      formData.append('imageUrl', imageUrl);
      
      if (mobileImageUrl) {
        formData.append('mobileImageUrl', mobileImageUrl);
      } else {
        formData.append('removeMobileImage', 'true'); // Tell backend to clear it
      }

      if (isEditMode) {
        await api.put(`/banners/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Banner updated successfully.');
      } else {
        await api.post('/banners', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Banner created successfully.');
      }
      navigate('/cms/banners');
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while saving the banner.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode && !initialData) {
    return (
      <div className="d-flex justify-content-center p-5">
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-5">
      {/* Page Header */}
      <div className="ta-editor-bar d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div className="w-100">
          <Breadcrumb items={[
            { label: 'Banners', link: '/cms/banners' },
            { label: isEditMode ? 'Edit' : 'New' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>{isEditMode ? 'Edit Banner' : 'Add New Banner'}</h2>
          </div>
        <div className="d-flex gap-2 w-100 justify-content-end justify-content-md-auto" style={{ maxWidth: '100%' }}>
          <Link to="/cms/banners" className="btn btn-light border flex-grow-1 flex-md-grow-0 text-center">Cancel</Link>
          <button 
            type="button" 
            className="premium-btn-primary flex-grow-1 flex-md-grow-0" 
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...</>
            ) : (
              <><i className="bi bi-save me-2"></i> Save</>
            )}
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Main Content */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 mb-2">
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-2">Banner Details</h5>
              
              <div className="mb-2">
                <label className="form-label fw-medium">Title</label>
                <input 
                  type="text" 
                  className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                  placeholder="e.g. Summer Sale 50% Off"
                  {...register('title', { 
                    maxLength: { value: 150, message: 'Title must be at most 150 characters' }
                  })}
                />
                {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
              </div>

              <div className="mb-2">
                <label className="form-label fw-medium">Subtitle</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Hurry, offer ends soon!"
                  {...register('subtitle')}
                />
              </div>

              <div className="mb-2">
                <label className="form-label fw-medium">Description</label>
                <div className="bg-white">
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <JoditEditor
                        value={field.value}
                        config={editorConfig}
                        onBlur={field.onBlur}
                        onChange={(content) => field.onChange(content)}
                      />
                    )}
                  />
                </div>
              </div>
              
              <div className="mb-2">
                <label className="form-label fw-medium">Button Text</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Shop Now, Learn More"
                  {...register('buttonText')}
                />
              </div>

              <div className="mb-2">
                <label className="form-label fw-medium">Button Link URL</label>
                <div className="input-group">
                  <input 
                    type="text" 
                    className={`form-control ${errors.linkUrl ? 'is-invalid' : ''}`}
                    placeholder="e.g. /shop/summer-sale or https://example.com"
                    {...register('linkUrl', {
                      pattern: {
                        value: /^(https?:\/\/[^\s$.?#].[^\s]*|\/[^\s]*)$/i,
                        message: 'Must be a valid URL or path (e.g. /path or https://domain.com)'
                      }
                    })}
                  />
                  <select className="form-select" style={{ maxWidth: '140px' }} {...register('linkTarget')}>
                    <option value="_self">Same Tab</option>
                    <option value="_blank">New Tab</option>
                  </select>
                </div>
                {errors.linkUrl && <div className="text-danger small mt-1">{errors.linkUrl.message}</div>}
                <div className="form-text">Where users will be redirected when they click the button or banner.</div>
              </div>

              <div className="mb-2">
                <label className="form-label fw-medium">Background Video URL (Optional)</label>
                <input 
                  type="text" 
                  className={`form-control ${errors.videoUrl ? 'is-invalid' : ''}`}
                  placeholder="e.g. https://www.youtube.com/watch?v=... or .mp4 link"
                  {...register('videoUrl', {
                    pattern: {
                      value: /^(https?:\/\/[^\s$.?#].[^\s]*)$/i,
                      message: 'Must be a valid absolute URL'
                    }
                  })}
                />
                {errors.videoUrl && <div className="invalid-feedback">{errors.videoUrl.message}</div>}
                <div className="form-text">If provided, this video will play in the background instead of the main image.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 mb-2">
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-2">Banner Image <span className="text-danger">*</span></h5>
              <div className="mb-3">
                {imageUrl ? (
                  <div className="position-relative mb-3 rounded overflow-hidden shadow-sm" style={{ aspectRatio: '16/9', backgroundColor: '#f3f4f6' }}>
                    <img src={mediaUrl(imageUrl)} alt="Preview" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                    <button 
                      type="button" 
                      className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle shadow"
                      onClick={clearFile}
                      style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                ) : (
                  <div className="bg-light rounded d-flex align-items-center justify-content-center mb-3 text-muted" style={{ aspectRatio: '16/9' }}>
                    <div className="text-center">
                      <i className="bi bi-image fs-1 d-block mb-2 text-black-50"></i>
                      <span className="small">No image selected</span>
                    </div>
                  </div>
                )}
                
                <button 
                  type="button" 
                  className="btn btn-outline-primary w-100" 
                  onClick={() => handleOpenMediaPicker('desktop')}
                >
                  <i className="bi bi-collection-play me-2"></i> Choose from Media Library
                </button>
                <ImageSizeHint kind="bannerDesktop" className="form-text mt-2" />
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4 mb-2">
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-2">Mobile Banner Image</h5>
              <div className="mb-3">
                {mobileImageUrl ? (
                  <div className="position-relative mb-3 rounded overflow-hidden shadow-sm" style={{ aspectRatio: '3/4', backgroundColor: '#f3f4f6', maxWidth: '200px', margin: '0 auto' }}>
                    <img src={mediaUrl(mobileImageUrl)} alt="Mobile Preview" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                    <button 
                      type="button" 
                      className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle shadow"
                      onClick={clearMobileFile}
                      style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                ) : (
                  <div className="bg-light rounded d-flex align-items-center justify-content-center mb-3 text-muted mx-auto" style={{ aspectRatio: '3/4', maxWidth: '200px' }}>
                    <div className="text-center">
                      <i className="bi bi-phone fs-1 d-block mb-2 text-black-50"></i>
                      <span className="small">No image</span>
                    </div>
                  </div>
                )}
                
                <button 
                  type="button" 
                  className="btn btn-outline-primary w-100" 
                  onClick={() => handleOpenMediaPicker('mobile')}
                >
                  <i className="bi bi-collection-play me-2"></i> Choose from Media Library
                </button>
                <ImageSizeHint kind="bannerMobile" className="form-text mt-2" />
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4 mb-2">
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-2">Settings</h5>
              
              <div className="mb-2">
                <label className="form-label fw-medium">Status</label>
                <select className="form-select" {...register('status')}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label fw-medium">Text Alignment</label>
                <select className="form-select" {...register('textAlignment')}>
                  <option value="left">Left Align</option>
                  <option value="center">Center Align</option>
                  <option value="right">Right Align</option>
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label fw-medium">Text Color Theme</label>
                <select className="form-select" {...register('textColorTheme')}>
                  <option value="light">Light Text (For Dark Images)</option>
                  <option value="dark">Dark Text (For Light Images)</option>
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label fw-medium">Schedule (Start Date)</label>
                <input 
                  type="datetime-local" 
                  className="form-control"
                  {...register('startDate')}
                />
              </div>

              <div className="mb-2">
                <label className="form-label fw-medium">Schedule (End Date)</label>
                <input 
                  type="datetime-local" 
                  className="form-control"
                  {...register('endDate')}
                />
              </div>

              <div className="mb-0">
                <label className="form-label fw-medium">Display Order</label>
                <input 
                  type="number" 
                  className="form-control"
                  {...register('displayOrder', { valueAsNumber: true })}
                />
                <div className="form-text">Lower numbers appear first in the slider.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <MediaPickerModal 
        show={showMediaPicker} 
        onClose={() => setShowMediaPicker(false)} 
        onSelect={handleMediaSelected} 
        title={`Select ${mediaPickerTarget === 'desktop' ? 'Main' : 'Mobile'} Banner Image`}
      />
    </form>
  );
};

export default BannerForm;


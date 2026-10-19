import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../services/api';
import MediaPickerModal from '../components/media/MediaPickerModal';
import ImageSizeHint from '../components/common/ImageSizeHint';

const TestimonialForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      authorName: '',
      authorRole: '',
      company: '',
      rating: 5,
      content: '',
      avatarUrl: '',
      status: 'published'
    }
  });

  const avatarUrl = watch('avatarUrl');

  useEffect(() => {
    if (isEditMode) {
      fetchTestimonial();
    }
  }, [id]);

  const fetchTestimonial = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/testimonials/${id}`);
      const t = response.data;
      reset({
        authorName: t.authorName,
        authorRole: t.authorRole || '',
        company: t.company || '',
        rating: t.rating,
        content: t.content,
        avatarUrl: t.avatarUrl || '',
        status: t.status
      });
    } catch (error) {
      console.error('Error fetching testimonial:', error);
      toast.error('Failed to load testimonial data.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (isEditMode) {
        await api.put(`/testimonials/${id}`, data);
        toast.success('Testimonial updated successfully.');
      } else {
        await api.post('/testimonials', data);
        toast.success('Testimonial created successfully.');
        navigate('/cms/testimonials');
      }
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast.error(error.response?.data?.message || 'Failed to save testimonial.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div className="w-100">
          <Breadcrumb items={[
            { label: 'Testimonials', link: '/cms/testimonials' },
            { label: isEditMode ? 'Edit' : 'Add' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>{isEditMode ? 'Edit Testimonial' : 'Add New Testimonial'}</h2>
          </div>
        <div className="d-flex gap-2 w-100 justify-content-end justify-content-md-auto" style={{ maxWidth: '100%' }}>
          <Link to="/cms/testimonials" className="btn btn-light border flex-grow-1 flex-md-grow-0 text-center">Cancel</Link>
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

      <div className="row">
        <div className="col-md-8">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white pt-4 pb-0 border-bottom-0">
              <h5 className="fw-bold mb-0">Testimonial Content</h5>
            </div>
            <div className="card-body p-4">
              <form id="testimonialForm" onSubmit={handleSubmit(onSubmit)}>
                
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Author Name <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className={`form-control ${errors.authorName ? 'is-invalid' : ''}`}
                      placeholder="e.g. Jane Doe"
                      {...register('authorName', { 
                        required: 'Author Name is required',
                        maxLength: { value: 100, message: 'Max 100 characters' }
                      })} 
                    />
                    {errors.authorName && <div className="invalid-feedback">{errors.authorName.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Rating (1-5)</label>
                    <select className="form-select" {...register('rating', { valueAsNumber: true, min: 1, max: 5 })}>
                      <option value="5">5 Stars - Excellent</option>
                      <option value="4">4 Stars - Good</option>
                      <option value="3">3 Stars - Average</option>
                      <option value="2">2 Stars - Poor</option>
                      <option value="1">1 Star - Terrible</option>
                    </select>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Author Role</label>
                    <input 
                      type="text" 
                      className={`form-control ${errors.authorRole ? 'is-invalid' : ''}`}
                      placeholder="e.g. CEO"
                      {...register('authorRole', {
                        maxLength: { value: 100, message: 'Max 100 characters' }
                      })} 
                    />
                    {errors.authorRole && <div className="invalid-feedback">{errors.authorRole.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Company</label>
                    <input 
                      type="text" 
                      className={`form-control ${errors.company ? 'is-invalid' : ''}`}
                      placeholder="e.g. Acme Corp"
                      {...register('company', {
                        maxLength: { value: 150, message: 'Max 150 characters' }
                      })} 
                    />
                    {errors.company && <div className="invalid-feedback">{errors.company.message}</div>}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Review Content <span className="text-danger">*</span></label>
                  <textarea 
                    className={`form-control ${errors.content ? 'is-invalid' : ''}`} 
                    rows="5"
                    placeholder="Write the testimonial here..."
                    {...register('content', { 
                      required: 'Content is required',
                      maxLength: { value: 1000, message: 'Max 1000 characters' }
                    })} 
                  ></textarea>
                  {errors.content && <div className="invalid-feedback">{errors.content.message}</div>}
                </div>

              </form>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white pt-4 pb-0 border-bottom-0">
              <h5 className="fw-bold mb-0">Publishing Options</h5>
            </div>
            <div className="card-body p-4">
              <div className="mb-4">
                <label className="form-label fw-medium">Status</label>
                <select className="form-select" {...register('status')}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="form-label fw-medium">Avatar Image</label>
                <ImageSizeHint kind="avatar" className="form-text mt-0 mb-2" />
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="premium-media-preview d-flex flex-column align-items-center justify-content-center bg-light rounded border border-dashed"
                    style={{ width: '120px', height: '120px', flexShrink: 0 }}
                  >
                    {typeof avatarUrl === 'string' && avatarUrl ? (
                      <img src={avatarUrl.startsWith('http') ? avatarUrl : `${import.meta.env.VITE_APP_URL || (import.meta.env.VITE_APP_URL || 'http://192.168.0.166:5000')}${avatarUrl}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <>
                        <i className="bi bi-image text-muted fs-3 mb-1"></i>
                        <span className="small text-muted" style={{ fontSize: '0.75rem' }}>No image selected</span>
                      </>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <input type="hidden" {...register('avatarUrl')} />
                    <button
                      type="button"
                      className="btn btn-outline-primary mb-2 w-100"
                      onClick={() => setShowMediaPicker(true)}
                    >
                      <i className="bi bi-collection-play me-2"></i> Choose from Media Library
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger d-block p-0 text-center w-100"
                        onClick={() => setValue('avatarUrl', '', { shouldDirty: true })}
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MediaPickerModal
        show={showMediaPicker}
        onHide={() => setShowMediaPicker(false)}
        onSelect={(item) => {
          setValue('avatarUrl', item?.url || '', { shouldDirty: true });
          setShowMediaPicker(false);
        }}
      />
    </div>
  );
};

export default TestimonialForm;

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import api from '../services/api';
import { toast } from 'react-toastify';
import MediaPickerModal from '../components/media/MediaPickerModal';
import ImageSizeHint from '../components/common/ImageSizeHint';

import { mediaUrl } from '../utils/mediaUrl';

const PartnerForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      websiteUrl: '',
      description: '',
      displayOrder: 0,
      status: 'active',
    }
  });

  useEffect(() => {
    if (isEditMode) {
      api.get(`/partners/${id}`)
        .then(res => {
          const d = res.data?.data || res.data;
          reset({
            name: d.name || '',
            websiteUrl: d.websiteUrl || '',
            description: d.description || '',
            displayOrder: d.displayOrder || 0,
            status: d.status || 'active',
          });
          if (d.logoUrl) setLogoUrl(d.logoUrl);
        })
        .catch(() => { toast.error('Failed to load partner'); navigate('/cms/partners'); });
    }
  }, [id, isEditMode, reset, navigate]);

  const handleMediaSelected = (mediaItem) => {
    setLogoUrl(mediaItem.url);
  };

  const clearLogo = () => {
    setLogoUrl(null);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('websiteUrl', data.websiteUrl || '');
      formData.append('description', data.description || '');
      formData.append('displayOrder', data.displayOrder || 0);
      formData.append('status', data.status);
      if (logoUrl) formData.append('logoUrl', logoUrl);

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (isEditMode) {
        await api.put(`/partners/${id}`, formData, config);
        toast.success('Partner updated successfully');
      } else {
        await api.post('/partners', formData, config);
        toast.success('Partner added successfully');
      }
      navigate('/cms/partners');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error saving partner');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-4">
      <div className="ta-editor-bar d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <Breadcrumb items={[{ label: 'Partners & Clients', link: '/cms/partners' }, { label: isEditMode ? 'Edit' : 'New' }]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>
            {isEditMode ? 'Edit Partner' : 'Add Partner'}
          </h2>
        </div>
        <div className="d-flex gap-2 flex-shrink-0">
          <Link to="/cms/partners" className="btn btn-light border">Cancel</Link>
          <button type="submit" form="partner-form" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
              : <><i className="bi bi-check-circle me-2"></i>{isEditMode ? 'Update Partner' : 'Save Partner'}</>
            }
          </button>
        </div>
      </div>

      <form id="partner-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="row g-4">
          {/* Main Column */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">
                  <i className="bi bi-people me-2 text-primary"></i>Partner Details
                </h5>

                <div className="mb-4">
                  <label className="form-label fw-medium">Company / Partner Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    {...register('name', { required: 'Name is required' })}
                    placeholder="e.g. Shineops Digital Marketing Partner"
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Website URL</label>
                  <input
                    type="url"
                    className={`form-control ${errors.websiteUrl ? 'is-invalid' : ''}`}
                    {...register('websiteUrl', {
                      pattern: { value: /^https?:\/\/.+/, message: 'Enter a valid URL starting with http:// or https://' }
                    })}
                    placeholder="https://www.example.com"
                  />
                  {errors.websiteUrl && <div className="invalid-feedback">{errors.websiteUrl.message}</div>}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Description <span className="text-muted small">(optional)</span></label>
                  <textarea
                    className="form-control"
                    rows="3"
                    {...register('description')}
                    placeholder="Brief description of the partnership..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="col-12 col-lg-4">
            {/* Logo Upload */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">Company Logo</h5>

                <div className="text-center mb-3">
                  {logoUrl ? (
                    <div className="position-relative d-inline-block">
                      <img
                        src={mediaUrl(logoUrl)}
                        alt="Logo preview"
                        className="img-fluid rounded border mb-3"
                        style={{ maxHeight: '100px', objectFit: 'contain' }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-sm btn-danger position-absolute top-0 start-100 translate-middle rounded-circle"
                        onClick={clearLogo}
                        style={{ width: '24px', height: '24px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-light rounded d-flex align-items-center justify-content-center mx-auto mb-3" style={{ height: '100px' }}>
                      <i className="bi bi-image text-secondary" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                  )}
                  <div>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setShowMediaPicker(true)}>
                      <i className="bi bi-image me-2"></i>Choose from Media
                    </button>
                  </div>
                  <ImageSizeHint kind="clientLogo" className="form-text mt-2" />
                </div>
              </div>
            </div>

            {/* Publishing */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">Publishing</h5>

                <div className="mb-3">
                  <label className="form-label fw-medium">Status</label>
                  <select className="form-select" {...register('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Display Order</label>
                  <input type="number" className="form-control" {...register('displayOrder')} />
                  <div className="form-text">Lower numbers appear first in the slider.</div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </form>

      <MediaPickerModal 
        show={showMediaPicker} 
        onClose={() => setShowMediaPicker(false)} 
        onSelect={handleMediaSelected} 
      />
    </div>
  );
};

export default PartnerForm;

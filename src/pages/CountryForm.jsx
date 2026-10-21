import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import api from '../services/api';
import { toast } from 'react-toastify';
import MediaPickerModal from '../components/media/MediaPickerModal';
import ImageSizeHint from '../components/common/ImageSizeHint';

import { mediaUrl } from '../utils/mediaUrl';

const CountryForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flagUrl, setFlagUrl] = useState(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      displayOrder: 0,
      status: 'active',
    }
  });

  useEffect(() => {
    if (isEditMode) {
      api.get(`/countries/${id}`)
        .then(res => {
          const d = res.data?.data || res.data;
          reset({
            name: d.name || '',
            displayOrder: d.displayOrder || 0,
            status: d.status || 'active',
          });
          if (d.flagUrl) setFlagUrl(d.flagUrl);
        })
        .catch(() => { toast.error('Failed to load country'); navigate('/cms/countries'); });
    }
  }, [id, isEditMode, reset, navigate]);

  const handleMediaSelected = (mediaItem) => {
    setFlagUrl(mediaItem.url);
  };

  const clearFlag = () => {
    setFlagUrl(null);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('displayOrder', data.displayOrder || 0);
      formData.append('status', data.status);
      if (flagUrl) formData.append('flagUrl', flagUrl);

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (isEditMode) {
        await api.put(`/countries/${id}`, formData, config);
        toast.success('Country updated successfully');
      } else {
        await api.post('/countries', formData, config);
        toast.success('Country added successfully');
      }
      navigate('/cms/countries');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error saving country');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-4">
      <div className="ta-editor-bar d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <Breadcrumb items={[{ label: 'Countries', link: '/cms/countries' }, { label: isEditMode ? 'Edit' : 'New' }]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>
            {isEditMode ? 'Edit Country' : 'Add Country'}
          </h2>
        </div>
        <div className="d-flex gap-2 flex-shrink-0">
          <Link to="/cms/countries" className="btn btn-light border">Cancel</Link>
          <button type="submit" form="country-form" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
              : <><i className="bi bi-check-circle me-2"></i>{isEditMode ? 'Update Country' : 'Save Country'}</>
            }
          </button>
        </div>
      </div>

      <form id="country-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="row g-4">
          
          {/* Main Column */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">
                  <i className="bi bi-globe me-2 text-primary"></i>Country Details
                </h5>

                <div className="mb-4">
                  <label className="form-label fw-medium">Country Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    {...register('name', { required: 'Name is required' })}
                    placeholder="e.g. United States, Canada"
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                </div>

                <hr className="my-4 text-muted opacity-25" />

                <h5 className="card-title fw-bold mb-4">Flag Image</h5>
                
                <div className="d-flex align-items-start gap-4">
                  <div className="text-center">
                    {flagUrl ? (
                      <div className="position-relative d-inline-block">
                        <img
                          src={mediaUrl(flagUrl)}
                          alt="Flag preview"
                          className="img-fluid rounded-circle border shadow-sm"
                          style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                        />
                        <button 
                          type="button" 
                          className="btn btn-sm btn-danger position-absolute top-0 start-100 translate-middle rounded-circle shadow"
                          onClick={clearFlag}
                          style={{ width: '28px', height: '28px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <i className="bi bi-x fs-6"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-light rounded-circle border border-dashed d-flex align-items-center justify-content-center shadow-sm" style={{ width: '120px', height: '120px' }}>
                        <i className="bi bi-flag text-secondary" style={{ fontSize: '3rem' }}></i>
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <h6 className="fw-semibold mb-2">Upload Country Flag</h6>
                    <p className="text-muted small mb-1">Select a round or square flag image to represent this country.</p>
                    <ImageSizeHint kind="flag" className="small mb-3" />
                    <button type="button" className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => setShowMediaPicker(true)}>
                      <i className="bi bi-image me-2"></i>Choose from Media
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 mb-4 sticky-top ta-below-bar">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">Publishing</h5>

                <div className="mb-4">
                  <label className="form-label fw-medium">Status</label>
                  <select className="form-select bg-light border-0" {...register('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Display Order</label>
                  <input type="number" className="form-control bg-light border-0" {...register('displayOrder')} />
                  <div className="form-text mt-2">Determines the display position. Lower numbers appear first.</div>
                </div>

                <hr className="my-4 text-muted opacity-25" />

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

export default CountryForm;

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import api from '../services/api';
import { toast } from 'react-toastify';

const BranchForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      phone: '',
      email: '',
      managerName: '',
      latitude: '',
      longitude: '',
      isHeadOffice: false,
      displayOrder: 0,
      status: 'active',
    }
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchBranch = async () => {
        try {
          const res = await api.get(`/branches/${id}`);
          const d = res.data?.data || res.data;
          reset({
            name: d.name || '',
            code: d.code || '',
            address: d.address || '',
            city: d.city || '',
            state: d.state || '',
            country: d.country || '',
            pincode: d.pincode || '',
            phone: d.phone || '',
            email: d.email || '',
            managerName: d.managerName || '',
            latitude: d.latitude || '',
            longitude: d.longitude || '',
            isHeadOffice: d.isHeadOffice || false,
            displayOrder: d.displayOrder || 0,
            status: d.status || 'active',
          });
        } catch (err) {
          toast.error('Failed to load branch');
          navigate('/cms/branches');
        }
      };
      fetchBranch();
    }
  }, [id, isEditMode, reset, navigate]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        latitude: data.latitude !== '' ? parseFloat(data.latitude) : null,
        longitude: data.longitude !== '' ? parseFloat(data.longitude) : null,
        displayOrder: parseInt(data.displayOrder) || 0,
      };

      if (isEditMode) {
        await api.put(`/branches/${id}`, payload);
        toast.success('Branch updated successfully');
      } else {
        await api.post('/branches', payload);
        toast.success('Branch created successfully');
      }
      navigate('/cms/branches');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error saving branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <Breadcrumb items={[
            { label: 'Branches', link: '/cms/branches' },
            { label: isEditMode ? 'Edit' : 'New' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>
            {isEditMode ? 'Edit Branch' : 'Add Branch'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row g-4">
          {/* Main Column */}
          <div className="col-12 col-lg-8">

            {/* Basic Info */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">
                  <i className="bi bi-building me-2 text-primary"></i>Branch Information
                </h5>

                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label fw-medium">Branch Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      {...register('name', { required: 'Branch name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
                      placeholder="e.g. Mumbai Central Branch"
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-medium">Branch Code</label>
                    <input type="text" className="form-control" {...register('code')} placeholder="e.g. MUM-01" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Phone</label>
                    <input type="text" className="form-control" {...register('phone')} placeholder="+91 98765 43210" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Email</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      {...register('email', {
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' }
                      })}
                      placeholder="branch@example.com"
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">Manager Name</label>
                    <input type="text" className="form-control" {...register('managerName')} placeholder="e.g. Rajesh Kumar" />
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">
                  <i className="bi bi-geo-alt me-2 text-primary"></i>Address
                </h5>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-medium">Street Address</label>
                    <textarea className="form-control" rows="2" {...register('address')} placeholder="Street, building, floor..."></textarea>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">City</label>
                    <input type="text" className="form-control" {...register('city')} placeholder="Mumbai" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">State / Province</label>
                    <input type="text" className="form-control" {...register('state')} placeholder="Maharashtra" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Country</label>
                    <input type="text" className="form-control" {...register('country')} placeholder="India" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Pincode / ZIP</label>
                    <input type="text" className="form-control" {...register('pincode')} placeholder="400001" />
                  </div>
                </div>
              </div>
            </div>



          </div>

          {/* Sidebar Column */}
          <div className="col-12 col-lg-4">
            {/* Map Coordinates */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">
                  <i className="bi bi-pin-map me-2 text-primary"></i>Coordinates
                </h5>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-medium">Latitude</label>
                    <input type="number" step="any" className="form-control" {...register('latitude')} placeholder="e.g. 19.0760" />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">Longitude</label>
                    <input type="number" step="any" className="form-control" {...register('longitude')} placeholder="e.g. 72.8777" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">Publishing</h5>

                <div className="mb-3">
                  <label className="form-label fw-medium">Status</label>
                  <select className="form-select" {...register('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="coming_soon">Coming Soon</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-medium">Display Order</label>
                  <input type="number" className="form-control" {...register('displayOrder')} />
                  <div className="form-text">Lower numbers appear first.</div>
                </div>

                <div className="mb-4">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isHeadOffice"
                      {...register('isHeadOffice')}
                    />
                    <label className="form-check-label fw-medium" htmlFor="isHeadOffice">
                      Mark as Head Office
                    </label>
                  </div>
                  <div className="form-text">Only one branch should be the head office.</div>
                </div>

                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting
                      ? <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Saving...</>
                      : <><i className="bi bi-check-circle me-2"></i>{isEditMode ? 'Update Branch' : 'Save Branch'}</>
                    }
                  </button>
                  <Link to="/cms/branches" className="btn btn-light border">Cancel</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BranchForm;

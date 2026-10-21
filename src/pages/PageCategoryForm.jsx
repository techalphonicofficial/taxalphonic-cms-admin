import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import api from '../services/api';
import { toast } from 'react-toastify';

const PageCategoryForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      status: 'active',
    }
  });

  useEffect(() => {
    if (isEditMode) {
      api.get(`/page-categories/${id}`)
        .then(res => {
          const d = res.data?.data || res.data;
          reset({
            name: d.name || '',
            slug: d.slug || '',
            description: d.description || '',
            status: d.status || 'active',
          });
        })
        .catch(() => { toast.error('Failed to load category'); navigate('/pages/categories'); });
    }
  }, [id, isEditMode, reset, navigate]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await api.put(`/page-categories/${id}`, data);
        toast.success('Category updated successfully');
      } else {
        await api.post('/page-categories', data);
        toast.success('Category created successfully');
      }
      navigate('/pages/categories');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error saving category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-4">
      <div className="ta-editor-bar d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <Breadcrumb items={[{ label: 'Pages', link: '/pages' }, { label: 'Categories', link: '/pages/categories' }, { label: isEditMode ? 'Edit' : 'New' }]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>
            {isEditMode ? 'Edit Category' : 'Add Category'}
          </h2>
        </div>
        <div className="d-flex gap-2 flex-shrink-0">
          <Link to="/pages/categories" className="btn btn-light border px-4">Cancel</Link>
          <button type="submit" form="page-category-form" className="btn btn-primary px-4" disabled={isSubmitting}>
            {isSubmitting
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
              : <><i className="bi bi-check-circle me-2"></i>{isEditMode ? 'Update Category' : 'Save Category'}</>
            }
          </button>
        </div>
      </div>

      <form id="page-category-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="row g-4 justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4 p-md-5">
                <h5 className="card-title fw-bold mb-4">
                  <i className="bi bi-tags me-2 text-primary"></i>Category Details
                </h5>

                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Category Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      {...register('name', { required: 'Name is required' })}
                      placeholder="e.g. Legal, Marketing"
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label fw-medium">URL Slug</label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      {...register('slug')}
                      placeholder="Auto-generated if left blank"
                    />
                    <div className="form-text">e.g. legal-pages</div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    {...register('description')}
                    placeholder="Brief description of this category..."
                  ></textarea>
                </div>

                <h5 className="card-title fw-bold mb-4 mt-5">Publishing Options</h5>
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Status</label>
                    <select className="form-select" {...register('status')}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <hr className="my-4 text-muted opacity-25" />


              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PageCategoryForm;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import SlugStatus from '../components/common/SlugStatus';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../services/api';
import SearchableSelect from '../components/common/SearchableSelect';

const PortfolioCategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      parentId: '',
      status: 'published'
    }
  });

  const name = watch('name');

  useEffect(() => {
    if (name) {
      const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug, { shouldValidate: true, shouldDirty: true });
    }
  }, [name, setValue]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [catsRes, catRes] = await Promise.all([
          api.get('/portfolio-categories?limit=1000'),
          isEditMode ? api.get(`/portfolio-categories/${id}`) : Promise.resolve(null)
        ]);
        
        setCategories(catsRes.data.data || []);
        
        if (catRes) {
          const category = catRes.data.data;
          reset({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            parentId: category.parentId || '',
            status: category.status
          });
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        toast.error('Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [id, isEditMode, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = { ...data };
      if (!payload.parentId) payload.parentId = null;

      if (isEditMode) {
        await api.put(`/portfolio-categories/${id}`, payload);
        toast.success('Category updated successfully.');
      } else {
        await api.post('/portfolio-categories', payload);
        toast.success('Category created successfully.');
        navigate('/portfolio-categories');
      }
    } catch (error) {
      console.error('Error saving portfolio category:', error);
      toast.error(error.response?.data?.message || 'Failed to save category.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-4">
      <div className="ta-editor-bar d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div className="w-100">
          <Breadcrumb items={[
            { label: 'Portfolio Categories', link: '/portfolio-categories' },
            { label: isEditMode ? 'Edit' : 'Add' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>{isEditMode ? 'Edit Category' : 'Add New Category'}</h2>
          </div>
        <div className="d-flex gap-2 w-100 justify-content-end justify-content-md-auto" style={{ maxWidth: '100%' }}>
          <Link to="/portfolio-categories" className="btn btn-light border flex-grow-1 flex-md-grow-0 text-center">Cancel</Link>
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
              <h5 className="fw-bold mb-0">Category Details</h5>
            </div>
            <div className="card-body p-4">
              <form id="categoryForm" onSubmit={handleSubmit(onSubmit)}>
                
                <div className="mb-4">
                  <label className="form-label fw-medium">Name <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    placeholder="e.g. Web Development"
                    {...register('name', { 
                      required: 'Name is required',
                      maxLength: { value: 255, message: 'Max 255 characters' }
                    })} 
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Slug <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                    placeholder="web-development"
                    disabled
                    {...register('slug', { 
                      required: 'Slug is required',
                      maxLength: { value: 255, message: 'Max 255 characters' }
                    })} 
                  />
                  <div className="form-text">The URL-friendly version of the name. It is auto-generated.</div>
                  <SlugStatus type="portfolio_category" slug={watch('slug')} id={id} prefix="" onUseSuggestion={(next) => setValue('slug', next, { shouldValidate: true, shouldDirty: true })} />
                  {errors.slug && <div className="invalid-feedback">{errors.slug.message}</div>}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Description</label>
                  <textarea 
                    className={`form-control ${errors.description ? 'is-invalid' : ''}`} 
                    rows="4"
                    placeholder="Brief description of this category..."
                    {...register('description', { maxLength: { value: 500, message: 'Max 500 characters' } })} 
                  ></textarea>
                  {errors.description && <div className="invalid-feedback">{errors.description.message}</div>}
                </div>

              </form>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white pt-4 pb-0 border-bottom-0">
              <h5 className="fw-bold mb-0">Settings</h5>
            </div>
            <div className="card-body p-4">
              <div className="mb-4">
                <label className="form-label fw-medium">Parent Category</label>
                <Controller
                  name="parentId"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={[{ value: '', label: 'None (Top Level)' }, ...categories.filter(c => c.id !== id).map(cat => ({ value: cat.id, label: cat.name }))]}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="None (Top Level)"
                    />
                  )}
                />
              </div>
              <div className="mb-4">
                <label className="form-label fw-medium">Status</label>
                <select className="form-select" {...register('status')}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PortfolioCategoryForm;

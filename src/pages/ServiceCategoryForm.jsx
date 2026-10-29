import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SearchableSelect from '../components/common/SearchableSelect';
import Breadcrumb from '../components/common/Breadcrumb';
import SlugStatus from '../components/common/SlugStatus';
import { ServiceCategoryService } from '../services/serviceCategory.service';
import JoditEditor from 'jodit-react';
import { useTheme } from '../context/ThemeContext';
import { JODIT_CLEAN_PASTE } from '../components/page-builder/cleanPastedHtml';

const simpleJoditConfig = {
  toolbarAdaptive: false,
  toolbarSticky: false,
  showCharsCounter: false,
  showWordsCounter: false,
  showXPathInStatusbar: false,
  height: 250,
  buttons: [
    'bold', 'italic', 'underline', 'brush', '|', 'ul', 'ol', '|',
    'link', '|', 'align', 'undo', 'redo'
  ]
};

const ServiceCategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const { theme } = useTheme();

  const editorConfig = useMemo(() => ({
    ...simpleJoditConfig,
    ...JODIT_CLEAN_PASTE,
    theme: theme === 'dark' ? 'dark' : 'default'
  }), [theme]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    status: 'draft'
  });
  
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchCategory(id);
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await ServiceCategoryService.getAll();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchCategory = async (categoryId) => {
    try {
      setIsLoading(true);
      const res = await ServiceCategoryService.getById(categoryId);
      if (res.success) {
        const cat = res.data;
        setFormData({
          name: cat.name || '',
          slug: cat.slug || '',
          description: cat.description || '',
          parentId: cat.parentId || '',
          status: cat.status || 'draft'
        });
      }
    } catch (err) {
      setError('Failed to fetch category details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate slug if name changes and we are not explicitly editing slug (or if it's new)
      ...(name === 'name' ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        parentId: formData.parentId === '' ? null : formData.parentId
      };

      if (isEditMode) {
        await ServiceCategoryService.update(id, submitData);
      } else {
        await ServiceCategoryService.create(submitData);
      }
      navigate('/service-categories');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode && !formData.name) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div>
      <div className="ta-editor-bar d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div className="w-100">
          <Breadcrumb items={[
            { label: 'Service Categories', link: '/service-categories' },
            { label: isEditMode ? 'Edit' : 'New' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>{isEditMode ? 'Edit Category' : 'New Category'}</h2>
          </div>
        <div className="d-flex gap-2 flex-shrink-0">
          <Link to="/service-categories" className="btn btn-light border">Cancel</Link>
          <button type="submit" form="service-category-form" className="btn btn-primary px-4" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form id="service-category-form" onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label fw-medium">Category Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  maxLength="255"
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label fw-medium">Slug</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="slug" 
                  value={formData.slug} 
                  disabled
                  onChange={handleChange} 
                  required 
                  maxLength="255"
                />
                <SlugStatus type="service_category" slug={formData.slug} id={id} prefix="" onUseSuggestion={(next) => setFormData((f) => ({ ...f, slug: next }))} />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium">Parent Category</label>
                <SearchableSelect
                  spaced={false}
                  value={formData.parentId || ''}
                  onChange={parentId => handleChange({ target: { name: 'parentId', value: parentId } })}
                  placeholder="None (Top Level)"
                  emptyLabel="None (Top Level)"
                  searchPlaceholder="Search categories..."
                  options={categories
                    .filter(cat => !(isEditMode && cat.id === id)) // a category is never its own parent
                    .map(cat => ({ value: cat.id, label: cat.name }))}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium">Status</label>
                <select 
                  className="form-select" 
                  name="status" 
                  value={formData.status} 
                  onChange={handleChange}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label fw-medium">Description</label>
                <JoditEditor 
                  value={formData.description || ''} 
                  config={editorConfig}
                  onBlur={content => setFormData(prev => ({ ...prev, description: content }))}
                />
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceCategoryForm;


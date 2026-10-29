import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import SlugStatus from '../../components/common/SlugStatus';
import { BlogCategoriesService } from '../../services/blogCategory.service';

const BlogCategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    status: 'published'
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
      const res = await BlogCategoriesService.getAll();
      const items = Array.isArray(res) ? res : (res.data?.rows || res.data || res.rows || []);
      setCategories(items);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchCategory = async (categoryId) => {
    try {
      setIsLoading(true);
      const res = await BlogCategoriesService.getById(categoryId);
      const cat = res.data || res;
      if (cat) {
        setFormData({
          name: cat.name || '',
          slug: cat.slug || '',
          description: cat.description || '',
          parentId: cat.parentId || '',
          status: cat.status || 'published'
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
        await BlogCategoriesService.update(id, submitData);
      } else {
        await BlogCategoriesService.create(submitData);
      }
      navigate('/blog-categories');
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
            { label: 'Blog Categories', link: '/blog-categories' },
            { label: isEditMode ? 'Edit' : 'New' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>{isEditMode ? 'Edit Category' : 'New Category'}</h2>
          </div>
        <div className="d-flex gap-2 flex-shrink-0">
          <Link to="/blog-categories" className="btn btn-light border">Cancel</Link>
          <button type="submit" form="blog-category-form" className="btn btn-primary px-4" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form id="blog-category-form" onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-4">
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
              
              <div className="col-md-4">
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
                <SlugStatus type="blog_category" slug={formData.slug} id={id} prefix="" onUseSuggestion={(next) => setFormData((f) => ({ ...f, slug: next }))} />
              </div>

              <div className="col-md-4">
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
                <textarea 
                  className="form-control" 
                  rows="4" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange}
                  maxLength="500"
                ></textarea>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BlogCategoryForm;

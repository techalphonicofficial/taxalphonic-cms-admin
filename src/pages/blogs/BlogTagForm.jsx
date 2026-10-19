import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import { BlogTagsService } from '../../services/blogTag.service';

const BlogTagForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    status: 'published'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchTag(id);
    }
  }, [id]);

  const fetchTag = async (tagId) => {
    try {
      setIsLoading(true);
      const res = await BlogTagsService.getById(tagId);
      const tag = res.data || res;
      if (tag) {
        setFormData({
          name: tag.name || '',
          slug: tag.slug || '',
          status: tag.status || 'published'
        });
      }
    } catch (err) {
      setError('Failed to fetch tag details');
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
      if (isEditMode) {
        await BlogTagsService.update(id, formData);
      } else {
        await BlogTagsService.create(formData);
      }
      navigate('/blog-tags');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save tag');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode && !formData.name) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div className="w-100">
          <Breadcrumb items={[
            { label: 'Blog Tags', link: '/blog-tags' },
            { label: isEditMode ? 'Edit' : 'New' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>{isEditMode ? 'Edit Tag' : 'New Tag'}</h2>
          </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-4">
                <label className="form-label fw-medium">Tag Name</label>
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

              <div className="col-12 mt-5 text-end">
                <Link to="/blog-tags" className="btn btn-light border me-2">Cancel</Link>
                <button type="submit" className="btn btn-primary px-4" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Tag'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BlogTagForm;

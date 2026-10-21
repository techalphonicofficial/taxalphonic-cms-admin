import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import { BlogAuthorsService } from '../../services/blogAuthor.service';
import MediaPickButton from '../../components/media/MediaPickButton';
import { mediaUrl } from '../../utils/mediaUrl';

const BlogAuthorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '',
    twitter: '',
    linkedin: '',
    status: 'published'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchAuthor(id);
    }
  }, [id]);

  const fetchAuthor = async (authorId) => {
    try {
      setIsLoading(true);
      const res = await BlogAuthorsService.getById(authorId);
      const author = res.data || res;
      if (author) {
        setFormData({
          name: author.name || '',
          bio: author.bio || '',
          avatar: author.avatar || '',
          twitter: author.socialLinks?.twitter || '',
          linkedin: author.socialLinks?.linkedin || '',
          status: author.status || 'published'
        });
      }
    } catch (err) {
      setError('Failed to fetch author details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const submitData = {
        name: formData.name,
        bio: formData.bio,
        avatar: formData.avatar,
        status: formData.status,
        socialLinks: {
          twitter: formData.twitter,
          linkedin: formData.linkedin
        }
      };

      if (isEditMode) {
        await BlogAuthorsService.update(id, submitData);
      } else {
        await BlogAuthorsService.create(submitData);
      }
      navigate('/blog-authors');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save author');
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
            { label: 'Blog Authors', link: '/blog-authors' },
            { label: isEditMode ? 'Edit' : 'New' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>{isEditMode ? 'Edit Author' : 'New Author'}</h2>
          </div>
        <div className="d-flex gap-2 flex-shrink-0">
          <Link to="/blog-authors" className="btn btn-light border">Cancel</Link>
          <button type="submit" form="blog-author-form" className="btn btn-primary px-4" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Author'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form id="blog-author-form" onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-4">
                <label className="form-label fw-medium">Name</label>
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
                <label className="form-label fw-medium">Avatar</label>
                <div className="input-group">
                  {formData.avatar && (
                    <span className="input-group-text p-1 bg-body">
                      <img src={mediaUrl(formData.avatar)} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: '50%' }} />
                    </span>
                  )}
                  <input
                    type="text"
                    className="form-control"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleChange}
                    maxLength="255"
                    placeholder="Choose from Media or paste a URL"
                  />
                  <MediaPickButton onPick={url => handleChange({ target: { name: 'avatar', value: url } })} />
                </div>
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

              <div className="col-md-6">
                <label className="form-label fw-medium">Twitter URL</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="twitter" 
                  value={formData.twitter} 
                  onChange={handleChange} 
                  maxLength="255"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium">LinkedIn URL</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="linkedin" 
                  value={formData.linkedin} 
                  onChange={handleChange} 
                  maxLength="255"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-medium">Bio</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  name="bio" 
                  value={formData.bio} 
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

export default BlogAuthorForm;

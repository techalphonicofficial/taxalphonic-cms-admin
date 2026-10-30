import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import SearchableSelect from '../../components/common/SearchableSelect';
import MediaPickButton from '../../components/media/MediaPickButton';
import { BlogService } from '../../services/blog.service';
import { BlogCategoriesService } from '../../services/blogCategory.service';
import { BlogTagsService } from '../../services/blogTag.service';
import { BlogAuthorsService } from '../../services/blogAuthor.service';
import PageBuilder from '../../components/page-builder/PageBuilder';
import MediaPickerModal from '../../components/media/MediaPickerModal';
import ImageSizeHint from '../../components/common/ImageSizeHint';
import SlugStatus from '../../components/common/SlugStatus';
import '../../components/common/PremiumForms.css';

const BlogForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [pageSections, setPageSections] = useState([]);

  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [tags, setTags] = useState([]);

  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      slug: '',
      status: 'draft',
      excerpt: '',
      categoryId: '',
      authorId: '',
      tags: [],
      featuredImage: '',
      gallery: [],
      isFeatured: false,
      isTrending: false,
      isPinned: false,
      readTime: '',
      publishDate: '',
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      canonicalUrl: '',
      ogImage: '',
      ogTitle: '',
      ogDescription: '',
      twitterCard: 'summary_large_image',
      schemaMarkup: ''
    }
  });

  const title = watch('title');
  const featuredImage = watch('featuredImage');
  const selectedTags = watch('tags');

  // Auto-generate slug from title
  useEffect(() => {
    if (title) {
      const generatedSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug, { shouldValidate: true, shouldDirty: true });
    }
  }, [title, setValue]);

  useEffect(() => {
    fetchOptions();
    if (isEditMode) {
      fetchBlog();
    } else {
      reset({
        title: '',
        slug: '',
        status: 'draft',
        excerpt: '',
        categoryId: '',
        authorId: '',
        tags: [],
        featuredImage: '',
        isFeatured: false,
        isTrending: false,
        isPinned: false,
        readTime: '',
        publishDate: '',
        metaTitle: '',
        metaDescription: '',
        keywords: '',
        canonicalUrl: '',
        ogImage: '',
        ogTitle: '',
        ogDescription: '',
        twitterCard: 'summary_large_image',
        schemaMarkup: ''
      });
      setPageSections([]);
    }
  }, [id, isEditMode, reset]);

  const fetchOptions = async () => {
    try {
      const [catsRes, authsRes, tagsRes] = await Promise.all([
        BlogCategoriesService.getAll({}),
        BlogAuthorsService.getAll({}),
        BlogTagsService.getAll({})
      ]);
      setCategories(Array.isArray(catsRes) ? catsRes : catsRes.data || []);
      setAuthors(Array.isArray(authsRes) ? authsRes : authsRes.data || []);
      setTags(Array.isArray(tagsRes) ? tagsRes : tagsRes.data || []);
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const fetchBlog = async () => {
    setIsLoading(true);
    try {
      const response = await BlogService.getById(id);
      const blog = response.data;
      let parsedGallery = [];
      if (blog.gallery) {
        if (typeof blog.gallery === 'string') {
          try {
            parsedGallery = JSON.parse(blog.gallery);
          } catch (e) {
            console.error("Could not parse blog gallery");
          }
        } else if (Array.isArray(blog.gallery)) {
          parsedGallery = blog.gallery;
        }
      }

      reset({
        title: blog.title || '',
        slug: blog.slug || '',
        status: blog.status || 'draft',
        excerpt: blog.excerpt || '',
        categoryId: blog.categoryId || '',
        authorId: blog.authorId || '',
        tags: blog.Tags ? blog.Tags.map(t => t.id) : [],
        featuredImage: blog.featuredImage || '',
        gallery: parsedGallery,
        isFeatured: blog.isFeatured || false,
        isTrending: blog.isTrending || false,
        isPinned: blog.isPinned || false,
        readTime: blog.readTime || '',
        publishDate: blog.publishDate ? blog.publishDate.split('T')[0] : '',
        metaTitle: blog.metaTitle || '',
        metaDescription: blog.metaDescription || '',
        keywords: blog.keywords || '',
        canonicalUrl: blog.canonicalUrl || '',
        ogImage: blog.ogImage || '',
        ogTitle: blog.ogTitle || '',
        ogDescription: blog.ogDescription || '',
        twitterCard: blog.twitterCard || 'summary_large_image',
        schemaMarkup: blog.schemaMarkup ? JSON.stringify(blog.schemaMarkup, null, 2) : ''
      });

      // Parse content as page builder sections if it exists
      if (blog.content) {
        try {
          const sections = JSON.parse(blog.content);
          if (Array.isArray(sections)) {
            setPageSections(sections);
          }
        } catch (e) {
          console.error("Could not parse blog content as page builder sections");
        }
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      toast.error('Failed to load blog data.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        content: JSON.stringify(pageSections) // Save builder sections as stringified JSON
      };

      // Convert empty strings to null for foreign keys to prevent constraint errors
      if (!payload.categoryId) payload.categoryId = null;
      if (!payload.authorId) payload.authorId = null;

      // Parse schema markup if provided
      if (payload.schemaMarkup) {
        try {
          payload.schemaMarkup = JSON.parse(payload.schemaMarkup);
        } catch (e) {
          payload.schemaMarkup = null;
        }
      }

      if (isEditMode) {
        await BlogService.update(id, payload);
        toast.success('Blog post updated successfully.');
      } else {
        await BlogService.create(payload);
        toast.success('Blog post created successfully.');
        navigate('/blogs');
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      toast.error(error.response?.data?.message || 'Failed to save blog post.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setValue('tags', selectedOptions);
  };

  return (
    <div className="pb-4">
      <div className="ta-editor-bar d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div className="w-100">
          <Breadcrumb items={[
            { label: 'Blogs', link: '/blogs' },
            { label: isEditMode ? 'Edit' : 'Create' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>{isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}</h2>
        </div>
        <div className="d-flex gap-2 w-100 justify-content-end justify-content-md-auto" style={{ maxWidth: '100%' }}>
          <Link to="/blogs" className="btn btn-light border flex-grow-1 flex-md-grow-0 text-center">Cancel</Link>
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

      <div className="premium-form-card mb-4">
        {/* Sticky under the editor header (global.scss .ta-sticky-tabs). */}
        <div className="ta-sticky-tabs border-bottom-0 px-4" style={{ borderRadius: '20px 20px 0 0' }}>
          <ul className="nav nav-tabs premium-tabs" role="tablist">
            <li className="nav-item">
              <button className={`nav-link fw-medium ${activeTab === 'general' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('general')}>
                General Info
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link fw-medium ${activeTab === 'builder' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('builder')}>
                <i className="bi bi-layout-wtf me-1"></i> Page Builder
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link fw-medium ${activeTab === 'seo' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('seo')}>
                SEO Settings
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-3 bg-light" style={{ background: 'transparent' }}>
          <form id="blogForm" onSubmit={handleSubmit(onSubmit)}>

            {/* General Tab */}
            <div className={`tab-pane-transition ${activeTab === 'general' ? 'd-block' : 'd-none'}`}>
              <div className="row g-4">
                <div className="col-md-8">
                  <div className="premium-form-card mb-4 border-0 p-3">
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label fw-medium">Post Title <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className={`form-control form-control-lg ${errors.title ? 'is-invalid' : ''}`}
                          placeholder="Enter post title"
                          {...register('title', {
                            required: 'Title is required',
                            maxLength: { value: 255, message: 'Title must be at most 255 characters' }
                          })}
                        />
                        {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-medium">URL Slug <span className="text-danger">*</span></label>
                        <div className="input-group">
                          <span className="input-group-text bg-light text-muted">/blog/</span>
                          <input
                            type="text"
                            className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                            {...register('slug', {
                              required: 'Slug is required',
                              maxLength: { value: 255, message: 'Slug must be at most 255 characters' }
                            })}
                            disabled
                          />
                        </div>
                        {errors.slug && <div className="invalid-feedback d-block">{errors.slug.message}</div>}
                        <SlugStatus
                          type="blog"
                          slug={watch('slug')}
                          id={id}
                          prefix="/blog/"
                          onUseSuggestion={(next) => setValue('slug', next, { shouldValidate: true, shouldDirty: true })}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-medium">Excerpt (Short Description)</label>
                        <textarea
                          className={`form-control ${errors.excerpt ? 'is-invalid' : ''}`}
                          rows="3"
                          {...register('excerpt', {
                            maxLength: { value: 500, message: 'Excerpt must be at most 500 characters' }
                          })}
                        ></textarea>
                        {errors.excerpt && <div className="invalid-feedback">{errors.excerpt.message}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-medium">Featured Image</label>
                        <ImageSizeHint kind="blogFeatured" className="form-text mt-0 mb-2" />
                        <div className="d-flex align-items-start gap-3">
                          <div
                            className="premium-media-preview"
                            style={{ width: '120px', height: '120px', flexShrink: 0 }}
                          >
                            {featuredImage ? (
                              <img src={featuredImage.startsWith('http') ? featuredImage : `${import.meta.env.VITE_APP_URL || (import.meta.env.VITE_APP_URL || 'https://api.taxalphonic.com')}${featuredImage}`} alt="Featured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <i className="bi bi-image text-muted fs-1"></i>
                            )}
                          </div>
                          <div className="flex-grow-1">
                            <input type="hidden" {...register('featuredImage')} />
                            <button
                              type="button"
                              className="btn btn-outline-primary mb-2"
                              onClick={() => setShowMediaPicker(true)}
                            >
                              <i className="bi bi-folder2-open me-2"></i> Choose from Media Library
                            </button>
                            {featuredImage && (
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-danger d-block p-0"
                                onClick={() => setValue('featuredImage', '', { shouldDirty: true })}
                              >
                                Remove Image
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-medium">Gallery Images</label>
                        <ImageSizeHint kind="blogGallery" className="form-text mt-0 mb-2" />
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          {(watch('gallery') || []).map((imgUrl, idx) => (
                            <div key={idx} className="position-relative border rounded overflow-hidden" style={{ width: '80px', height: '80px' }}>
                              <img src={imgUrl.startsWith('http') ? imgUrl : `${import.meta.env.VITE_APP_URL || (import.meta.env.VITE_APP_URL || 'https://api.taxalphonic.com')}${imgUrl}`} alt={`Gallery ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button
                                type="button"
                                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-0 rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: '20px', height: '20px' }}
                                onClick={() => {
                                  const newGallery = [...(watch('gallery') || [])];
                                  newGallery.splice(idx, 1);
                                  setValue('gallery', newGallery, { shouldDirty: true });
                                }}
                              >
                                <i className="bi bi-x" style={{ fontSize: '12px' }}></i>
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="btn btn-outline-dashed d-flex align-items-center justify-content-center text-muted border rounded"
                            style={{ width: '80px', height: '80px', borderStyle: 'dashed' }}
                            onClick={() => setShowGalleryPicker(true)}
                          >
                            <i className="bi bi-plus fs-4"></i>
                          </button>
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-medium">Category <span className="text-danger">*</span></label>
                          <input type="hidden" {...register('categoryId', { required: 'Category is required' })} />
                          <SearchableSelect
                            spaced={false}
                            error={!!errors.categoryId}
                            value={watch('categoryId') || ''}
                            onChange={v => setValue('categoryId', v, { shouldValidate: true, shouldDirty: true })}
                            placeholder="Select Category"
                            searchPlaceholder="Search categories..."
                            options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                          />
                          {errors.categoryId && <div className="text-danger small mt-1">{errors.categoryId.message}</div>}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-medium">Author <span className="text-danger">*</span></label>
                          <input type="hidden" {...register('authorId', { required: 'Author is required' })} />
                          <SearchableSelect
                            spaced={false}
                            error={!!errors.authorId}
                            value={watch('authorId') || ''}
                            onChange={v => setValue('authorId', v, { shouldValidate: true, shouldDirty: true })}
                            placeholder="Select Author"
                            searchPlaceholder="Search authors..."
                            options={authors.map(auth => ({ value: auth.id, label: auth.name }))}
                          />
                          {errors.authorId && <div className="text-danger small mt-1">{errors.authorId.message}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="premium-form-card border-0 p-3">
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label fw-medium">Status</label>
                        <select className="form-select" {...register('status')}>
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-medium">Publish Date</label>
                        <input type="date" className="form-control" {...register('publishDate')} />
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-medium">Reading Time (mins)</label>
                        <input type="number" className="form-control" {...register('readTime')} />
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-medium">Tags</label>
                        <select
                          className="form-select"
                          multiple
                          value={selectedTags}
                          onChange={handleTagChange}
                          style={{ height: '120px' }}
                        >
                          {tags.map(tag => (
                            <option key={tag.id} value={tag.id}>{tag.name}</option>
                          ))}
                        </select>
                        <div className="form-text">Hold Ctrl/Cmd to select multiple</div>
                      </div>

                      <hr />

                      <div className="form-check form-switch mb-2">
                        <input className="form-check-input" type="checkbox" role="switch" id="featuredSwitch" {...register('isFeatured')} />
                        <label className="form-check-label" htmlFor="featuredSwitch">Featured Post</label>
                      </div>
                      <div className="form-check form-switch mb-2">
                        <input className="form-check-input" type="checkbox" role="switch" id="trendingSwitch" {...register('isTrending')} />
                        <label className="form-check-label" htmlFor="trendingSwitch">Trending Post</label>
                      </div>
                      <div className="form-check form-switch mb-2">
                        <input className="form-check-input" type="checkbox" role="switch" id="pinnedSwitch" {...register('isPinned')} />
                        <label className="form-check-label" htmlFor="pinnedSwitch">Pinned to Top</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Builder Tab */}
            <div className={`tab-pane-transition ${activeTab === 'builder' ? 'd-block' : 'd-none'}`}>
              <div style={{ minHeight: '700px' }}>
                <PageBuilder
                  initialSections={pageSections}
                  onChange={(newSections) => setPageSections(newSections)}
                />
              </div>
            </div>

            {/* SEO Tab */}
            <div className={`tab-pane-transition ${activeTab === 'seo' ? 'd-block' : 'd-none'}`}>
              <div className="premium-form-card p-3 border-0">
                <div className="card-body">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3">General SEO</h6>
                      <div className="mb-3">
                        <label className="form-label fw-medium">Meta Title <span className="text-danger">*</span></label>
                        <input type="text" className={`form-control ${errors.metaTitle ? 'is-invalid' : ''}`} {...register('metaTitle', { required: 'Meta Title is required' })} />
                        {errors.metaTitle && <div className="invalid-feedback">{errors.metaTitle.message}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-medium">Meta Description</label>
                        <textarea className={`form-control ${errors.metaDescription ? 'is-invalid' : ''}`} rows="3" {...register('metaDescription', { maxLength: { value: 300, message: 'Max 300 characters' } })}></textarea>
                        {errors.metaDescription && <div className="invalid-feedback">{errors.metaDescription.message}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-medium">Keywords</label>
                        <input type="text" className="form-control" {...register('keywords')} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-medium">Canonical URL</label>
                        <input type="text" className={`form-control ${errors.canonicalUrl ? 'is-invalid' : ''}`} {...register('canonicalUrl', { pattern: { value: /^https?:\/\/[^\s$.?#].[^\s]*$/i, message: 'Must be a valid URL' } })} />
                        {errors.canonicalUrl && <div className="invalid-feedback">{errors.canonicalUrl.message}</div>}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3">Social & Structured Data</h6>
                      <div className="mb-3">
                        <label className="form-label fw-medium">OG Image URL</label>
                        <ImageSizeHint kind="ogImage" className="form-text mt-0 mb-2" />
                        <div className="input-group has-validation">
                          <input type="text" className={`form-control ${errors.ogImage ? 'is-invalid' : ''}`} placeholder="Choose from Media or paste a URL" {...register('ogImage', { pattern: { value: /^(https?:\/\/\S+|\/\S+)$/i, message: 'Use a full URL or pick from Media' } })} />
                          <MediaPickButton onPick={url => setValue('ogImage', url, { shouldDirty: true, shouldValidate: true })} />
                          {errors.ogImage && <div className="invalid-feedback">{errors.ogImage.message}</div>}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-medium">OG Title</label>
                        <input type="text" className="form-control" {...register('ogTitle')} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-medium">OG Description</label>
                        <textarea className="form-control" rows="2" {...register('ogDescription')}></textarea>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-medium">Twitter Card Type</label>
                        <select className="form-select" {...register('twitterCard')}>
                          <option value="summary_large_image">Summary Large Image</option>
                          <option value="summary">Summary</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-medium">Schema Markup (JSON-LD)</label>
                        <textarea className="form-control font-monospace" rows="4" {...register('schemaMarkup')} placeholder='{ "@context": "https://schema.org", "@type": "BlogPosting" }'></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <MediaPickerModal
        show={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(media) => {
          setValue('featuredImage', media.url, { shouldDirty: true });
        }}
        title="Select Featured Image"
      />

      <MediaPickerModal
        show={showGalleryPicker}
        onClose={() => setShowGalleryPicker(false)}
        onSelect={(media) => {
          const currentGallery = watch('gallery') || [];
          setValue('gallery', [...currentGallery, media.url], { shouldDirty: true });
        }}
        title="Add Image to Gallery"
      />
    </div>
  );
};

export default BlogForm;
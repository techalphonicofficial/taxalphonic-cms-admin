import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../services/api';
import PageBuilder from '../components/page-builder/PageBuilder';
import ServicePreviewPane from '../components/page-builder/ServicePreviewPane';
import MediaPickerModal from '../components/media/MediaPickerModal';
import ImageSizeHint from '../components/common/ImageSizeHint';
import SearchableSelect from '../components/common/SearchableSelect';
import MediaPickButton from '../components/media/MediaPickButton';
import '../components/common/PremiumForms.css';

const ServiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [pageSections, setPageSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parentServices, setParentServices] = useState([]);
  const [menusList, setMenusList] = useState([]);
  const [flatMenuItems, setFlatMenuItems] = useState([]);
  const [topLevelMenuItems, setTopLevelMenuItems] = useState([]);
  const [linkToMenu, setLinkToMenu] = useState(false);
  const [menuLinkMode, setMenuLinkMode] = useState('existing'); // 'existing' | 'new'
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [selectedParentItemId, setSelectedParentItemId] = useState('');

  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const { control, register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      slug: '',
      status: 'draft',
      summary: '',
      categoryId: '',
      parentId: '',
      icon: '',
      thumbImage: '',
      featured: false,
      readingTime: '',
      author: '',
      publishDate: '',
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      canonicalUrl: '',
      robots: 'index, follow',
      ogImage: '',
      ogTitle: '',
      ogDescription: '',
      twitterCard: 'summary_large_image',
      schemaMarkup: '',
      otherTags: ''
    }
  });

  const title = watch('title');
  const currentSlug = watch('slug');
  const thumbImage = watch('thumbImage');

  const generateSlug = (val) => {
    if (!val) return '';
    return String(val)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // Auto-generate slug from service title
  useEffect(() => {
    if (title && !isEditMode) {
      setValue('slug', generateSlug(title), { shouldValidate: true, shouldDirty: true });
    }
  }, [title, setValue, isEditMode]);

  useEffect(() => {
    fetchCategories();
    fetchParentServices();
    fetchMenusData();
    if (isEditMode) {
      fetchService();
    }
  }, [id]);

  // Auto-detect if this service is already linked to a menu item when editing
  useEffect(() => {
    if (isEditMode && currentSlug && flatMenuItems.length > 0 && !selectedMenuItemId) {
      const matched = flatMenuItems.find(
        item => item.url === `/services/${currentSlug}` || item.url === `/${currentSlug}` || item.url === currentSlug
      );
      if (matched) {
        setLinkToMenu(true);
        setMenuLinkMode('existing');
        setSelectedMenuItemId(matched.id);
      }
    }
  }, [isEditMode, currentSlug, flatMenuItems, selectedMenuItemId]);

  const fetchMenusData = async () => {
    try {
      const response = await api.get('/menus?limit=100');
      const resData = response.data;

      let menus = [];
      if (Array.isArray(resData)) {
        menus = resData;
      } else if (resData && Array.isArray(resData.data)) {
        menus = resData.data;
      } else if (resData && resData.data && Array.isArray(resData.data.data)) {
        menus = resData.data.data;
      } else if (resData && resData.data && Array.isArray(resData.data.rows)) {
        menus = resData.data.rows;
      } else if (resData && Array.isArray(resData.rows)) {
        menus = resData.rows;
      }

      const fullMenus = [];
      const flatItems = [];
      const topLevel = [];

      for (const m of menus) {
        try {
          const detailRes = await api.get(`/menus/${m.id}`);
          const menuDetail = detailRes.data?.data || detailRes.data || m;
          fullMenus.push(menuDetail);

          if (menuDetail.items && Array.isArray(menuDetail.items)) {
            const traverseItems = (items, prefix = '') => {
              items.forEach(item => {
                const label = prefix ? `${prefix} > ${item.title}` : `${menuDetail.name} > ${item.title}`;
                flatItems.push({
                  id: item.id,
                  menuId: m.id,
                  menuName: menuDetail.name,
                  title: item.title,
                  url: item.url,
                  parentId: item.parentId,
                  label
                });
                if (!item.parentId) {
                  topLevel.push({
                    id: item.id,
                    menuId: m.id,
                    menuName: menuDetail.name,
                    title: item.title
                  });
                }
                if (item.children && Array.isArray(item.children)) {
                  traverseItems(item.children, label);
                }
              });
            };
            traverseItems(menuDetail.items);
          }
        } catch (e) {
          console.error('Error fetching menu details for menu:', m.id, e);
        }
      }

      setMenusList(fullMenus);
      setFlatMenuItems(flatItems);
      setTopLevelMenuItems(topLevel);
    } catch (error) {
      console.error('Error fetching menus for linking:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/service-categories?limit=100');

      // Axios returns { data: ... }
      // Our API returns { success: true, data: [...] }
      const resData = response.data;

      let categoryArray = [];
      if (Array.isArray(resData)) {
        categoryArray = resData;
      } else if (resData && Array.isArray(resData.data)) {
        categoryArray = resData.data;
      } else if (resData && resData.data && Array.isArray(resData.data.rows)) {
        categoryArray = resData.data.rows;
      } else if (resData && Array.isArray(resData.rows)) {
        categoryArray = resData.rows;
      }

      setCategories(categoryArray);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchParentServices = async () => {
    try {
      const response = await api.get('/services?limit=2000&sortBy=title&sortOrder=ASC&categoryId_ne=fd630088-6d13-47eb-a5b9-9de555ec5e82');
      const resData = response.data;

      let servicesArray = [];
      if (Array.isArray(resData)) {
        servicesArray = resData;
      } else if (resData && Array.isArray(resData.data)) {
        servicesArray = resData.data;
      } else if (resData && resData.data && Array.isArray(resData.data.rows)) {
        servicesArray = resData.data.rows;
      } else if (resData && Array.isArray(resData.rows)) {
        servicesArray = resData.rows;
      }

      setParentServices(servicesArray);
    } catch (error) {
      console.error('Error fetching parent services:', error);
    }
  };

  const fetchService = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/services/${id}`);
      const service = response.data;
      reset({
        title: service.title,
        slug: service.slug,
        status: service.status,
        summary: service.summary,
        categoryId: service.categoryId,
        parentId: service.parentId,
        icon: service.icon || '',
        thumbImage: service.thumbImage,
        featured: service.featured,
        readingTime: service.readingTime,
        author: service.author,
        publishDate: service.publishDate ? service.publishDate.split('T')[0] : '',
        metaTitle: service.metaTitle,
        metaDescription: service.metaDescription,
        keywords: service.keywords,
        canonicalUrl: service.canonicalUrl,
        robots: service.robots || 'index, follow',
        ogImage: service.ogImage,
        ogTitle: service.ogTitle,
        ogDescription: service.ogDescription,
        twitterCard: service.twitterCard || 'summary_large_image',
        schemaMarkup: service.schemaMarkup,
        otherTags: service.otherTags || ''
      });

      if (service.sections && service.sections.length > 0) {
        // Map backend format to frontend PageBuilder format
        const sortedSections = [...service.sections].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        const sectionsFormatted = sortedSections.map(sec => {
          let parsedData = sec.data || { payload: {} };
          if (parsedData && typeof parsedData.payload === 'string') {
            try {
              parsedData = { ...parsedData, payload: JSON.parse(parsedData.payload) };
            } catch (e) {
              console.error('Error parsing section payload:', e);
            }
          }

          let parsedConfig = sec.config || {};
          if (typeof parsedConfig === 'string') {
            try {
              parsedConfig = JSON.parse(parsedConfig);
            } catch (e) {
              console.error('Error parsing section config:', e);
            }
          }

          return {
            id: sec.id, // we might need to recreate temp IDs if they don't match, but keeping real IDs is better
            type: sec.type?.componentKey || sec.sectionTypeId, // Assuming type is populated. If not we'd fetch it.
            config: parsedConfig,
            data: parsedData
          };
        });
        setPageSections(sectionsFormatted);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      toast.error('Failed to load service data.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Map frontend PageBuilder format to backend payload
      const sectionsPayload = pageSections.map((sec, index) => ({
        sectionTypeId: sec.type,
        sortOrder: index,
        config: sec.config,
        data: sec.data
      }));

      const payload = {
        ...data,
        sections: sectionsPayload
      };

      if (!payload.categoryId) payload.categoryId = null;
      if (!payload.parentId) payload.parentId = null;
      if (!payload.canonicalUrl) payload.canonicalUrl = null;
      if (!payload.ogImage) payload.ogImage = null;
      if (!payload.thumbImage) payload.thumbImage = null;
      if (!payload.readingTime) payload.readingTime = null;
      if (!payload.publishDate) payload.publishDate = null;

      let savedService = null;
      if (isEditMode) {
        const res = await api.put(`/services/${id}`, payload);
        savedService = res.data?.data || res.data;
        toast.success('Service updated successfully.');
      } else {
        const res = await api.post('/services', payload);
        savedService = res.data?.data || res.data;
        toast.success('Service created successfully.');
      }

      // Handle navigation menu link integration
      if (linkToMenu && data.slug) {
        try {
          const serviceUrl = `/${data.slug}`;
          if (menuLinkMode === 'existing' && selectedMenuItemId) {
            await api.post('/menus/link-item', {
              mode: 'link_existing',
              menuItemId: selectedMenuItemId,
              url: serviceUrl,
              title: data.title
            });
            toast.info(`Navigation menu item linked to /${data.slug}`);
          } else if (menuLinkMode === 'new' && selectedMenuId) {
            await api.post('/menus/link-item', {
              mode: 'add_new',
              menuId: selectedMenuId,
              parentId: selectedParentItemId || null,
              title: data.title,
              url: serviceUrl
            });
            toast.info(`Added new navigation menu link for /${data.slug}`);
          }
        } catch (menuErr) {
          console.error('Error linking service to menu item:', menuErr);
          toast.warn('Service saved, but navigation menu item could not be updated.');
        }
      }

      navigate('/services');
    } catch (error) {
      console.error('Error saving service:', error);
      const errData = error.response?.data;
      if (errData?.errors && errData.errors.length > 0) {
        const messages = errData.errors.map(e => e.message || e).join(' | ');
        toast.error(`Validation Error: ${messages}`);
      } else {
        toast.error(errData?.message || 'Failed to save service.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-4">
      <div className="ta-editor-bar d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div className="w-100">
          <Breadcrumb items={[
            { label: 'Services', link: '/services' },
            { label: isEditMode ? 'Edit' : 'Create' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>{isEditMode ? 'Edit Service' : 'Create New Service'}</h2>
        </div>
        <div className="d-flex gap-2 w-100 justify-content-end justify-content-md-auto" style={{ maxWidth: '100%' }}>
          <Link to="/services" className="btn btn-light border flex-grow-1 flex-md-grow-0 text-center">Cancel</Link>
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
        <div className="bg-white border-bottom-0 pt-3 pb-2 px-4" style={{ background: 'transparent' }}>
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
              <button className={`nav-link fw-medium ${activeTab === 'preview' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('preview')}>
                <i className="bi bi-eye me-1"></i> Live Preview
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
          <form id="serviceForm" onSubmit={handleSubmit(onSubmit)}>

            {/* General Tab */}
            <div className={`tab-pane-transition ${activeTab === 'general' ? 'd-block' : 'd-none'}`}>
              <div className="row g-4">
                <div className="col-md-8">
                  <div className="premium-form-card mb-4 border-0 p-3">
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label fw-medium">Service Title <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                          placeholder="e.g. Mobile App Development"
                          {...register('title', { required: 'Title is required' })}
                        />
                        {errors.title && <div className="text-danger small mt-1">{errors.title.message}</div>}
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label fw-medium mb-0">URL Slug <span className="text-danger">*</span></label>
                          <button
                            type="button"
                            onClick={() => setValue('slug', generateSlug(title), { shouldValidate: true, shouldDirty: true })}
                            className="btn btn-link btn-sm p-0 text-decoration-none text-primary"
                            style={{ fontSize: '0.75rem' }}
                            title="Re-generate slug from service title"
                          >
                            <i className="bi bi-arrow-clockwise me-1"></i>Regenerate from Title
                          </button>
                        </div>
                        <div className="input-group">
                          <span className="input-group-text bg-light text-muted">/</span>
                          <input
                            type="text"
                            className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                            {...register('slug', { required: 'Slug is required' })}
                            placeholder="service-url-slug"
                          />
                        </div>
                        {errors.slug && <div className="invalid-feedback d-block">{errors.slug.message}</div>}
                      </div>

                      {/* Navigation Menu Link Integration Card */}
                      <div className="p-3 border rounded-3 bg-white shadow-xs mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <span className="fw-semibold text-dark">
                              <i className="bi bi-diagram-3 me-1 text-primary"></i> Link with Navigation Menu
                            </span>
                            <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>
                              Connect this service's URL to a website navigation menu item.
                            </small>
                          </div>
                          <div className="form-check form-switch m-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="linkToMenuToggle"
                              checked={linkToMenu}
                              onChange={(e) => setLinkToMenu(e.target.checked)}
                            />
                          </div>
                        </div>

                        {linkToMenu && (
                          <div className="pt-3 border-top mt-2">
                            <div className="d-flex gap-3 mb-3">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="menuLinkMode"
                                  id="linkModeExisting"
                                  checked={menuLinkMode === 'existing'}
                                  onChange={() => setMenuLinkMode('existing')}
                                />
                                <label className="form-check-label small fw-medium" htmlFor="linkModeExisting">
                                  Link to Existing Menu Item
                                </label>
                              </div>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="menuLinkMode"
                                  id="linkModeNew"
                                  checked={menuLinkMode === 'new'}
                                  onChange={() => setMenuLinkMode('new')}
                                />
                                <label className="form-check-label small fw-medium" htmlFor="linkModeNew">
                                  Add as New Menu Item
                                </label>
                              </div>
                            </div>

                            {menuLinkMode === 'existing' ? (
                              <div>
                                <label className="form-label small fw-medium">Select Menu Item to Link</label>
                                <SearchableSelect
                                  size="sm"
                                  spaced={false}
                                  value={selectedMenuItemId}
                                  onChange={setSelectedMenuItemId}
                                  placeholder="-- Choose a Menu Item to link with --"
                                  emptyLabel="-- None --"
                                  searchPlaceholder={`Search ${flatMenuItems.length} menu items...`}
                                  options={flatMenuItems.map((item) => ({ value: item.id, label: item.label, sub: `${item.menuName} · current URL: ${item.url || 'none'}` }))}
                                />
                                <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                                  Upon saving, the selected menu item's URL will be set to: <code>/{watch('slug') || 'slug'}</code>
                                </small>
                              </div>
                            ) : (
                              <div className="row g-2">
                                <div className="col-md-6">
                                  <label className="form-label small fw-medium">Target Menu</label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={selectedMenuId}
                                    onChange={(e) => {
                                      setSelectedMenuId(e.target.value);
                                      setSelectedParentItemId('');
                                    }}
                                  >
                                    <option value="">-- Select Menu --</option>
                                    {menusList.map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.name} ({m.location || 'Navigation'})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label small fw-medium">Parent Section / Item</label>
                                  <SearchableSelect
                                    size="sm"
                                    spaced={false}
                                    value={selectedParentItemId}
                                    onChange={setSelectedParentItemId}
                                    disabled={!selectedMenuId}
                                    placeholder="Top Level (No Parent)"
                                    emptyLabel="Top Level (No Parent)"
                                    searchPlaceholder="Search menu items..."
                                    options={topLevelMenuItems
                                      .filter((item) => String(item.menuId) === String(selectedMenuId))
                                      .map((item) => ({ value: item.id, label: item.title }))}
                                  />
                                </div>
                                <div className="col-12 mt-2">
                                  <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                    A new item <strong>"{watch('title') || 'Service Title'}"</strong> with URL <code>/{watch('slug') || 'slug'}</code> will be added to the selected menu.
                                  </small>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="row g-3 mb-2">
                        <div className="col-md-6">
                          <label className="form-label fw-medium">Category <span className="text-danger">*</span></label>
                          <Controller
                            name="categoryId"
                            control={control}
                            rules={{ required: 'Category is required' }}
                            render={({ field }) => (
                              <SearchableSelect
                                options={[{ value: '', label: 'Select Category' }, ...categories.map(cat => ({ value: cat.id, label: cat.name }))]}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select Category"
                                error={!!errors.categoryId}
                              />
                            )}
                          />
                          {errors.categoryId && <div className="text-danger small mt-1">{errors.categoryId.message}</div>}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-medium">Parent Service</label>
                          <Controller
                            name="parentId"
                            control={control}
                            render={({ field }) => (
                              <SearchableSelect
                                value={field.value || ''}
                                onChange={field.onChange}
                                spaced={false}
                                placeholder="None (Top Level)"
                                emptyLabel="None (Top Level)"
                                searchPlaceholder={`Search ${parentServices.length} services...`}
                                options={parentServices
                                  .filter(service => !isEditMode || service.id !== id) // Prevent self-parenting
                                  .map(service => ({ value: service.id, label: service.title, sub: `/${service.slug}` }))}
                              />
                            )}
                          />
                        </div>
                      </div>

                      <div className="mb-2">
                        <label className="form-label fw-medium">Summary (Short Description)</label>
                        <textarea
                          className={`form-control ${errors.summary ? 'is-invalid' : ''}`}
                          rows="3"
                          {...register('summary', {
                            maxLength: { value: 300, message: 'Max 300 characters' }
                          })}
                        ></textarea>
                        {errors.summary && <div className="invalid-feedback">{errors.summary.message}</div>}
                      </div>

                      <div className="mb-4">
                        <label className="form-label fw-medium">Icon Class / Name (Optional)</label>
                        <div className="input-group">
                          <input
                            type="text"
                            className={`form-control ${errors.icon ? 'is-invalid' : ''}`}
                            placeholder="Emoji (🧾), image from Media, or an icon class"
                            {...register('icon')}
                          />
                          <MediaPickButton onPick={url => setValue('icon', url, { shouldDirty: true })} />
                        </div>
                        <div className="form-text">
                          An emoji, a square image (96 × 96 px) or a font icon class. If provided, this is shown instead of an image.
                        </div>
                      </div>

                      <div className="mb-2">
                        <label className="form-label fw-medium">Thumbnail Image</label>
                        <div className="d-flex align-items-start gap-3">
                          <div
                            className="premium-media-preview"
                            style={{ width: '120px', height: '120px', flexShrink: 0 }}
                          >
                            {thumbImage ? (
                              <img src={thumbImage.startsWith('http') ? thumbImage : `${import.meta.env.VITE_APP_URL || (import.meta.env.VITE_APP_URL || 'https://api.taxalphonic.com')}${thumbImage}`} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <i className="bi bi-image text-muted fs-1"></i>
                            )}
                          </div>
                          <div className="flex-grow-1">
                            <input type="hidden" {...register('thumbImage')} />
                            <button
                              type="button"
                              className="btn btn-outline-primary mb-2"
                              onClick={() => setShowMediaPicker(true)}
                            >
                              <i className="bi bi-folder2-open me-2"></i> Choose from Media Library
                            </button>
                            {thumbImage && (
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-danger d-block p-0"
                                onClick={() => setValue('thumbImage', '', { shouldDirty: true })}
                              >
                                Remove Image
                              </button>
                            )}
                            <ImageSizeHint kind="serviceThumb" className="form-text mt-2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="premium-form-card border-0 p-3">
                    <div className="card-body">
                      <div className="mb-2">
                        <label className="form-label fw-medium">Status</label>
                        <select className="form-select" {...register('status')}>
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>

                      <div className="mb-2">
                        <label className="form-label fw-medium">Publish Date</label>
                        <input type="date" className="form-control" {...register('publishDate')} />
                      </div>

                      <div className="mb-2">
                        <label className="form-label fw-medium">Author</label>
                        <input type="text" className="form-control" {...register('author')} placeholder="e.g. John Doe" />
                      </div>

                      <div className="mb-2">
                        <label className="form-label fw-medium">Reading Time (mins)</label>
                        <input type="number" className="form-control" {...register('readingTime')} />
                      </div>

                      <div className="form-check form-switch mb-3">
                        <input className="form-check-input" type="checkbox" role="switch" id="featuredSwitch" {...register('featured')} />
                        <label className="form-check-label" htmlFor="featuredSwitch">Featured Service</label>
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
                  layoutSettings
                  blockSet="service"
                />
              </div>
            </div>

            {/* Live Preview Tab: mounted once so it keeps updating while you edit other tabs */}
            <div className={`tab-pane-transition ${activeTab === 'preview' ? 'd-block' : 'd-none'}`}>
              <ServicePreviewPane
                draft={{
                  title: watch('title'),
                  slug: watch('slug'),
                  summary: watch('summary'),
                  categoryId: watch('categoryId') || null,
                  thumbImage: watch('thumbImage'),
                  readingTime: watch('readingTime'),
                  sections: pageSections.map(sec => ({
                    id: sec.id,
                    type: sec.type,
                    config: sec.config || {},
                    payload: sec.data?.payload || {}
                  }))
                }}
              />
            </div>

            {/* SEO Tab */}
            <div className={`tab-pane-transition ${activeTab === 'seo' ? 'd-block' : 'd-none'}`}>
              <div className="premium-form-card border-0 p-3">
                <div className="card-body">
                  <div className="row g-4">
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3">General SEO</h6>
                      <div className="mb-3">
                        <label className="form-label fw-medium">Meta Title</label>
                        <input type="text" className="form-control" {...register('metaTitle')} />
                        <div className="form-text">Optimal length is 50-60 characters.</div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-medium">Meta Description</label>
                        <textarea className="form-control" rows="3" {...register('metaDescription')}></textarea>
                        <div className="form-text">Optimal length is 150-160 characters.</div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-medium">Keywords</label>
                        <input type="text" className="form-control" {...register('keywords')} placeholder="e.g. SEO, consulting, business" />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-medium">Canonical URL</label>
                        <input
                          type="text"
                          className={`form-control ${errors.canonicalUrl ? 'is-invalid' : ''}`}
                          {...register('canonicalUrl', {
                            pattern: { value: /^https?:\/\/[^\s$.?#].[^\s]*$/i, message: 'Must be a valid URL' }
                          })}
                          placeholder="https://example.com/services/..."
                        />
                        {errors.canonicalUrl && <div className="invalid-feedback">{errors.canonicalUrl.message}</div>}
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-medium">Robots Tag</label>
                        <select className="form-select" {...register('robots')}>
                          <option value="index, follow">Index, Follow</option>
                          <option value="noindex, follow">NoIndex, Follow</option>
                          <option value="index, nofollow">Index, NoFollow</option>
                          <option value="noindex, nofollow">NoIndex, NoFollow</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3">Social & Structured Data</h6>
                      <div className="mb-3">
                        <label className="form-label fw-medium">OG Image URL</label>
                        <ImageSizeHint kind="ogImage" className="form-text mt-0 mb-2" />
                        <div className="input-group has-validation">
                          <input
                            type="text"
                            className={`form-control ${errors.ogImage ? 'is-invalid' : ''}`}
                            placeholder="Choose from Media or paste a URL"
                            {...register('ogImage', { pattern: { value: /^(https?:\/\/\S+|\/\S+)$/i, message: 'Use a full URL or pick from Media' } })}
                          />
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
                        <textarea className="form-control font-monospace" rows="4" {...register('schemaMarkup')} placeholder='{ "@context": "https://schema.org", "@type": "Service" }'></textarea>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-medium">Other Tags (Custom Meta Data)</label>
                        <textarea className="form-control font-monospace" rows="4" {...register('otherTags')} placeholder='<meta name="custom" content="value">\n<link rel="author" href="...">\n<!-- Add any valid HTML meta/link tags here -->'></textarea>
                        <small className="text-muted">Will be injected directly into the document head.</small>
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
          setValue('thumbImage', media.url, { shouldDirty: true });
        }}
        title="Select Thumbnail Image"
      />
    </div>
  );
};

export default ServiceForm;

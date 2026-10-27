import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../services/api';
import MediaPickerModal from '../components/media/MediaPickerModal';
import ImageSizeHint from '../components/common/ImageSizeHint';
import JoditEditor from 'jodit-react';
import { useTheme } from '../context/ThemeContext';
import SearchableSelect from '../components/common/SearchableSelect';
import { mediaUrl } from '../utils/mediaUrl';
import { JODIT_CLEAN_PASTE } from '../components/page-builder/cleanPastedHtml';

const joditConfig = {
  toolbarAdaptive: false,
  toolbarSticky: false,
  showCharsCounter: false,
  showWordsCounter: false,
  showXPathInStatusbar: false,
  height: 400,
  buttons: [
    'paragraph', '|', 'bold', 'italic', 'underline', 'brush', '|', 'ul', 'ol', '|',
    'outdent', 'indent', '|', 'link', 'image', '|', 'align', 'undo', 'redo'
  ]
};

const PortfolioItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [editorMode, setEditorMode] = useState('rich_text'); // 'rich_text' | 'seo_table'
  const [seoTable, setSeoTable] = useState({
    keywordsHeader: 'Keywords',
    initialHeader: 'Rank (OCT - 2023)',
    currentHeader: 'Ranking As of Dec 2024',
    rows: [
      { keyword: '', initialRank: '>Not in 50', currentRank: '1' }
    ]
  });
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const editorConfig = useMemo(() => ({
    ...joditConfig,
    ...JODIT_CLEAN_PASTE,
    theme: theme === 'dark' ? 'dark' : 'default'
  }), [theme]);

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      slug: '',
      clientName: '',
      websiteUrl: '',
      image: '',
      description: '',
      categoryId: '',
      status: 'published',
      sortOrder: 0
    }
  });

  const title = watch('title');
  const image = watch('image');
  const categoryId = watch('categoryId');

  const selectedCategory = useMemo(() => {
    return categories.find(c => String(c.id) === String(categoryId));
  }, [categories, categoryId]);

  const isSeoCategory = useMemo(() => {
    if (!selectedCategory) return false;
    const name = (selectedCategory.name || '').toLowerCase();
    const slug = (selectedCategory.slug || '').toLowerCase();
    return name.includes('seo') || name.includes('search engine') || slug.includes('seo') || slug.includes('search-engine');
  }, [selectedCategory]);

  useEffect(() => {
    if (isSeoCategory && !isEditMode && editorMode === 'rich_text') {
      setEditorMode('seo_table');
    }
  }, [isSeoCategory, isEditMode]);

  useEffect(() => {
    if (title) {
      const generatedSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug, { shouldValidate: true, shouldDirty: true });
    }
  }, [title, setValue]);

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchItem();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/portfolio-categories?limit=1000');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchItem = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/portfolio-items/${id}`);
      const item = response.data.data;
      reset({
        title: item.title,
        slug: item.slug,
        clientName: item.clientName || '',
        websiteUrl: item.websiteUrl || '',
        image: item.image || '',
        description: item.description || '',
        categoryId: item.categoryId || '',
        status: item.status,
        sortOrder: item.sortOrder || 0
      });

      let detectedSeo = false;
      if (item.description) {
        try {
          const parsed = JSON.parse(item.description);
          if (parsed && (parsed.type === 'seo_ranking' || parsed.tables || parsed.rows)) {
            detectedSeo = true;
            const data = parsed.tables && parsed.tables.length > 0 ? parsed.tables[0] : parsed;
            setSeoTable({
              keywordsHeader: data.keywordsHeader || 'Keywords',
              initialHeader: data.initialHeader || 'Rank (OCT - 2023)',
              currentHeader: data.currentHeader || 'Ranking As of Dec 2024',
              rows: Array.isArray(data.rows) && data.rows.length > 0
                ? data.rows
                : [{ keyword: '', initialRank: '>Not in 50', currentRank: '1' }]
            });
            setEditorMode('seo_table');
          }
        } catch (e) {
          // Not JSON (regular rich text description)
        }
      }

      if (!detectedSeo && item.categoryId) {
        const cat = categories.find(c => String(c.id) === String(item.categoryId));
        if (cat && (cat.slug?.includes('seo') || cat.slug?.includes('search-engine-optimization') || cat.name?.toLowerCase().includes('seo'))) {
          setEditorMode('seo_table');
        }
      }
    } catch (error) {
      console.error('Error fetching portfolio item:', error);
      toast.error('Failed to load portfolio item data.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateHeader = (field, value) => {
    setSeoTable(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addRow = () => {
    setSeoTable(prev => ({
      ...prev,
      rows: [...prev.rows, { keyword: '', initialRank: '>Not in 50', currentRank: '1' }]
    }));
  };

  const removeRow = (rIdx) => {
    setSeoTable(prev => {
      const nextRows = prev.rows.filter((_, idx) => idx !== rIdx);
      return {
        ...prev,
        rows: nextRows.length > 0 ? nextRows : [{ keyword: '', initialRank: '', currentRank: '' }]
      };
    });
  };

  const updateRow = (rIdx, field, value) => {
    setSeoTable(prev => {
      const nextRows = [...prev.rows];
      nextRows[rIdx] = { ...nextRows[rIdx], [field]: value };
      return { ...prev, rows: nextRows };
    });
  };

  const openBulkPaste = () => {
    setBulkText('');
    setBulkModalOpen(true);
  };

  const applyBulkPaste = () => {
    if (!bulkText.trim()) {
      setBulkModalOpen(false);
      return;
    }

    const lines = bulkText.trim().split(/\r?\n/);
    const newRows = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      let parts = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(',') && !line.includes('Not in')) {
        parts = line.split(',');
      } else {
        parts = [line];
      }

      const keyword = parts[0]?.trim() || '';
      const initialRank = parts[1]?.trim() || '>Not in 50';
      const currentRank = parts[2]?.trim() || '1';

      if (keyword) {
        newRows.push({ keyword, initialRank, currentRank });
      }
    }

    if (newRows.length > 0) {
      setSeoTable(prev => {
        const existing = prev.rows.filter(r => r.keyword && r.keyword.trim() !== '');
        return {
          ...prev,
          rows: [...existing, ...newRows]
        };
      });
      toast.success(`Added ${newRows.length} keyword rows.`);
    }

    setBulkModalOpen(false);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = { ...data };
      if (!payload.categoryId) payload.categoryId = null;
      if (!payload.websiteUrl) payload.websiteUrl = null;
      if (!payload.image) payload.image = null;

      if (editorMode === 'seo_table') {
        const cleanedRows = (seoTable.rows || []).filter(r => r.keyword && r.keyword.trim() !== '');
        payload.description = JSON.stringify({
          type: 'seo_ranking',
          keywordsHeader: seoTable.keywordsHeader || 'Keywords',
          initialHeader: seoTable.initialHeader,
          currentHeader: seoTable.currentHeader,
          rows: cleanedRows
        });
      }

      if (isEditMode) {
        await api.put(`/portfolio-items/${id}`, payload);
        toast.success('Item updated successfully.');
      } else {
        await api.post('/portfolio-items', payload);
        toast.success('Item created successfully.');
        navigate('/portfolio-items');
      }
    } catch (error) {
      console.error('Error saving portfolio item:', error);
      toast.error(error.response?.data?.message || 'Failed to save item.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-4">
      <div className="ta-editor-bar d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div className="w-100">
          <Breadcrumb items={[
            { label: 'Portfolio Items', link: '/portfolio-items' },
            { label: isEditMode ? 'Edit' : 'Add' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>{isEditMode ? 'Edit Item' : 'Add New Item'}</h2>
        </div>
        <div className="d-flex gap-2 w-100 justify-content-end justify-content-md-auto" style={{ maxWidth: '100%' }}>
          <Link to="/portfolio-items" className="btn btn-light border flex-grow-1 flex-md-grow-0 text-center">Cancel</Link>
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
            <div className="card-header pt-4 pb-0 border-bottom-0">
              <h5 className="fw-bold mb-0">Item Details</h5>
            </div>
            <div className="card-body p-4">
              <form id="itemForm" onSubmit={handleSubmit(onSubmit)}>

                <div className="mb-4">
                  <label className="form-label fw-medium">Title <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                    placeholder="e.g. E-Commerce Redesign"
                    {...register('title', {
                      required: 'Title is required',
                      maxLength: { value: 255, message: 'Max 255 characters' }
                    })}
                  />
                  {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Slug <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                    placeholder="e-commerce-redesign"
                    disabled
                    {...register('slug', {
                      required: 'Slug is required',
                      maxLength: { value: 255, message: 'Max 255 characters' }
                    })}
                  />
                  <div className="form-text">The URL-friendly version of the title. It is auto-generated.</div>
                  {errors.slug && <div className="invalid-feedback d-block">{errors.slug.message}</div>}
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Client Name</label>
                    <input
                      type="text"
                      className={`form-control ${errors.clientName ? 'is-invalid' : ''}`}
                      placeholder="e.g. Acme Corp"
                      {...register('clientName', { maxLength: { value: 255, message: 'Max 255 characters' } })}
                    />
                    {errors.clientName && <div className="invalid-feedback">{errors.clientName.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Website URL</label>
                    <input
                      type="url"
                      className={`form-control ${errors.websiteUrl ? 'is-invalid' : ''}`}
                      placeholder="https://www.example.com"
                      {...register('websiteUrl', {
                        pattern: { value: /^https?:\/\/[^\s$.?#].[^\s]*$/i, message: 'Must be a valid URL' }
                      })}
                    />
                    {errors.websiteUrl && <div className="invalid-feedback">{errors.websiteUrl.message}</div>}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
                    <div>
                      <label className="form-label fw-bold mb-0">
                        {editorMode === 'seo_table' ? 'SEO Keyword Ranking Table' : 'Description (Case Study)'}
                      </label>
                      <div className="text-muted small">
                        {editorMode === 'seo_table'
                          ? 'Manage 3-column keyword ranking comparison table dynamically'
                          : 'Rich text content or case study description'}
                      </div>
                    </div>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn ${editorMode === 'seo_table' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setEditorMode('seo_table')}
                      >
                        <i className="bi bi-table me-1"></i> SEO Ranking Table
                      </button>
                      <button
                        type="button"
                        className={`btn ${editorMode === 'rich_text' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setEditorMode('rich_text')}
                      >
                        <i className="bi bi-file-text me-1"></i> Rich Text Editor
                      </button>
                    </div>
                  </div>

                  {editorMode === 'rich_text' ? (
                    <div className="rounded border">
                      <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                          <JoditEditor
                            value={field.value}
                            config={editorConfig}
                            onBlur={field.onBlur}
                            onChange={(content) => field.onChange(content)}
                          />
                        )}
                      />
                    </div>
                  ) : (
                    <div className="card border shadow-sm">
                      <div className="card-body p-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-muted small">
                            <i className="bi bi-pencil-square text-primary me-1"></i>
                            <strong>Table Headers:</strong> Click and edit column names directly inside the header boxes below:
                          </span>
                          <span className="badge bg-light text-dark border">
                            {seoTable.rows?.length || 0} keyword{(seoTable.rows?.length || 0) === 1 ? '' : 's'}
                          </span>
                        </div>

                        {/* Keyword Rows Table with Directly Editable Headers */}
                        <div className="table-responsive rounded border mb-2">
                          <table className="table table-sm table-bordered table-hover align-middle mb-0">
                            <thead>
                              <tr>
                                <th style={{ width: '38px', textAlign: 'center', background: 'var(--bs-tertiary-bg)', verticalAlign: 'middle' }}>#</th>

                                {/* Column 1 Header (Orange) - Directly Editable */}
                                <th style={{ minWidth: '220px', background: '#da9748', borderBottom: '2px solid #c58236', padding: '6px 8px' }}>
                                  <div className="input-group input-group-sm">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-white fw-bold shadow-none"
                                      style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                        borderColor: 'rgba(255, 255, 255, 0.4)',
                                        fontSize: '14px',
                                        color: '#ffffff'
                                      }}
                                      title="Edit Keywords Column Header"
                                      placeholder="Keywords"
                                      value={seoTable.keywordsHeader ?? 'Keywords'}
                                      onChange={(e) => updateHeader('keywordsHeader', e.target.value)}
                                    />
                                    <span className="input-group-text bg-transparent border-0 text-white-50 p-1" title="Editable Header">
                                      <i className="bi bi-pencil-fill" style={{ fontSize: '11px' }}></i>
                                    </span>
                                  </div>
                                </th>

                                {/* Column 2 Header (Grey) - Directly Editable */}
                                <th style={{ width: '210px', background: '#6b6b6b', borderBottom: '2px solid #545454', padding: '6px 8px' }}>
                                  <div className="input-group input-group-sm">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-white fw-bold text-center shadow-none"
                                      style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                                        borderColor: 'rgba(255, 255, 255, 0.4)',
                                        fontSize: '14px',
                                        color: '#ffffff'
                                      }}
                                      title="Edit Initial Rank Column Header"
                                      placeholder="Rank (OCT - 2023)"
                                      value={seoTable.initialHeader}
                                      onChange={(e) => updateHeader('initialHeader', e.target.value)}
                                    />
                                    <span className="input-group-text bg-transparent border-0 text-white-50 p-1" title="Editable Header">
                                      <i className="bi bi-pencil-fill" style={{ fontSize: '11px' }}></i>
                                    </span>
                                  </div>
                                </th>

                                {/* Column 3 Header (Grey) - Directly Editable */}
                                <th style={{ width: '210px', background: '#6b6b6b', borderBottom: '2px solid #545454', padding: '6px 8px' }}>
                                  <div className="input-group input-group-sm">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-white fw-bold text-center shadow-none"
                                      style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                                        borderColor: 'rgba(255, 255, 255, 0.4)',
                                        fontSize: '14px',
                                        color: '#ffffff'
                                      }}
                                      title="Edit Current Rank Column Header"
                                      placeholder="Ranking As of Dec 2024"
                                      value={seoTable.currentHeader}
                                      onChange={(e) => updateHeader('currentHeader', e.target.value)}
                                    />
                                    <span className="input-group-text bg-transparent border-0 text-white-50 p-1" title="Editable Header">
                                      <i className="bi bi-pencil-fill" style={{ fontSize: '11px' }}></i>
                                    </span>
                                  </div>
                                </th>

                                <th style={{ width: '45px', textAlign: 'center', background: 'var(--bs-tertiary-bg)' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {seoTable.rows && seoTable.rows.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  <td className="text-center text-muted small">{rIdx + 1}</td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      placeholder="e.g. safa in mumbai"
                                      value={row.keyword}
                                      onChange={(e) => updateRow(rIdx, 'keyword', e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-center"
                                      placeholder=">Not in 50"
                                      value={row.initialRank}
                                      onChange={(e) => updateRow(rIdx, 'initialRank', e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm text-center"
                                      placeholder="3"
                                      value={row.currentRank}
                                      onChange={(e) => updateRow(rIdx, 'currentRank', e.target.value)}
                                    />
                                  </td>
                                  <td className="text-center">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-link text-danger p-0"
                                      onClick={() => removeRow(rIdx)}
                                      title="Delete Row"
                                    >
                                      <i className="bi bi-trash fs-6"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Row Actions */}
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={addRow}
                            >
                              <i className="bi bi-plus-lg me-1"></i> Add Keyword Row
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={openBulkPaste}
                            >
                              <i className="bi bi-clipboard-plus me-1"></i> Bulk Paste
                            </button>
                          </div>
                          <span className="text-muted small">
                            {seoTable.rows?.length || 0} keyword{(seoTable.rows?.length || 0) === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </form>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header pt-4 pb-0 border-bottom-0">
              <h5 className="fw-bold mb-0">Settings & Media</h5>
            </div>
            <div className="card-body p-4">
              <div className="mb-4">
                <label className="form-label fw-medium">Category <span className="text-danger">*</span></label>
                <Controller
                  name="categoryId"
                  control={control}
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <SearchableSelect
                      options={categories.map(c => {
                        if (c.parentId) {
                          const parent = categories.find(p => p.id === c.parentId);
                          return { value: c.id, label: parent ? `${parent.name} > ${c.name}` : c.name };
                        }
                        return { value: c.id, label: c.name };
                      }).sort((a, b) => a.label.localeCompare(b.label))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select a Category"
                      error={!!errors.categoryId}
                    />
                  )}
                />
                {errors.categoryId && <div className="text-danger small mt-1">{errors.categoryId.message}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label fw-medium">Image (Mockup/Thumbnail) <span className="text-danger">*</span></label>
                <ImageSizeHint kind="portfolio" className="form-text mt-0 mb-2" />
                <input type="hidden" {...register('image', { required: 'Image is required' })} />

                {image ? (
                  <div className="position-relative mb-2 rounded border overflow-hidden" style={{ height: '160px', backgroundColor: 'var(--cms-table-header-bg)' }}>
                    <img
                      src={mediaUrl(image)}
                      alt="Portfolio"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div className="position-absolute top-0 end-0 p-2 d-flex gap-2 rounded-bottom-start" style={{ backgroundColor: 'var(--cms-card-bg)', opacity: 0.9 }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setShowMediaPicker(true)}
                        title="Change Image"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setValue('image', '', { shouldDirty: true })}
                        title="Remove Image"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="d-flex flex-column align-items-center justify-content-center p-4 rounded mb-2 cursor-pointer border"
                    style={{ borderStyle: 'dashed !important', backgroundColor: 'var(--cms-table-header-bg)', height: '160px', transition: 'all 0.2s' }}
                    onClick={() => setShowMediaPicker(true)}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--bs-primary)'; e.currentTarget.style.opacity = '0.8'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.opacity = '1'; }}
                  >
                    <i className="bi bi-image text-muted fs-2 mb-2"></i>
                    <span className="text-primary fw-medium small">Select Image</span>
                  </div>
                )}
                {errors.image && <div className="text-danger small mt-1">{errors.image.message}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label fw-medium">Sort Order</label>
                <input
                  type="number"
                  className="form-control"
                  {...register('sortOrder', { valueAsNumber: true })}
                />
                <div className="form-text">Lower numbers appear first.</div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-medium">Status</label>
                <select className="form-select" {...register('status')}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MediaPickerModal
        show={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(media) => {
          setValue('image', media.url, { shouldDirty: true, shouldValidate: true });
          setShowMediaPicker(false);
        }}
        title="Select Portfolio Image"
      />

      {bulkModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fs-6 fw-bold">Bulk Paste Keywords</h5>
                <button type="button" className="btn-close" onClick={() => setBulkModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <p className="small text-muted mb-2">
                  Paste rows directly from Excel / Sheets or text.
                  <br />
                  Supports tab-separated lines: <code>Keyword [Tab] Initial Rank [Tab] Current Rank</code> or simply one keyword per line:
                </p>
                <textarea
                  className="form-control font-monospace small"
                  rows="8"
                  placeholder={`safa in mumbai\t>Not in 50\t3\nsafa wala mumbai\t>Not in 50\t1\nwedding safa in mumbai\t>Not in 50\t3`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                ></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setBulkModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-sm btn-primary" onClick={applyBulkPaste}>
                  Import Keywords
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioItemForm;


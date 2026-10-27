import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import { useTheme } from '../context/ThemeContext';
import JoditEditor from 'jodit-react';
import PageBuilder from '../components/page-builder/PageBuilder';
import ServicePreviewPane from '../components/page-builder/ServicePreviewPane';
import { HOME_PAGE_SLUG, defaultHomeSections } from '../components/page-builder/homeBlocks';
import { JOURNEY_REFERENCE_STAGES, JOURNEY_SLUG_PREFIX, isJourneyPage, journeyStageSections } from '../components/page-builder/journeyBlocks';
import { TOOL_REFERENCE, TOOL_SLUG_PREFIX, TOOLS_HUB_SLUG, isToolPage, toolPageSections, toolsHubSections } from '../components/page-builder/toolBlocks';
import api from '../services/api';
import { toast } from 'react-toastify';
import { JODIT_CLEAN_PASTE } from '../components/page-builder/cleanPastedHtml';

const joditConfig = {
  toolbarAdaptive: false,
  toolbarSticky: false,
  showCharsCounter: false,
  showWordsCounter: false,
  showXPathInStatusbar: false,
  height: 600,
  buttons: [
    'paragraph', '|', 'bold', 'italic', 'underline', 'brush', '|', 'ul', 'ol', '|',
    'outdent', 'indent', '|', 'link', 'image', '|', 'align', 'undo', 'redo'
  ],
  controls: {
    paragraph: {
      text: 'Format',
      icon: false,
      list: {
        p: 'Normal', h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3',
        h4: 'Heading 4', h5: 'Heading 5', h6: 'Heading 6'
      }
    }
  }
};

const PageForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState(null);
  // Home mode: the page with slug "home" is the website homepage (Home Page Builder).
  const [isHome, setIsHome] = useState(!isEditing && searchParams.get('template') === 'home');
  // Journey mode: a Journey Stage page (slug "journey/<stage>", built from Journey blocks).
  // New ones open with the template, or a reference stage with ?template=journey&stage=idea.
  const [isJourney, setIsJourney] = useState(!isEditing && searchParams.get('template') === 'journey');
  const startStage = !isEditing && isJourney ? JOURNEY_REFERENCE_STAGES.find(s => s.key === searchParams.get('stage')) : null;
  // Tool mode: a free tool page (slug "tool/<key>") or the tools hub (slug "tools"), built from Tool blocks.
  // New ones: ?template=tool (empty), &tool=<reference key> or &tool=hub.
  const [isTool, setIsTool] = useState(!isEditing && searchParams.get('template') === 'tool');
  const startToolKey = !isEditing && isTool ? searchParams.get('tool') : null;
  const startTool = TOOL_REFERENCE.find(t => t.key === startToolKey) || null;
  const startHub = startToolKey === 'hub';
  const [pageSections, setPageSections] = useState(() => (isHome ? defaultHomeSections()
    : isJourney ? journeyStageSections(startStage)
    : isTool ? (startHub ? toolsHubSections() : toolPageSections(startTool))
    : []));
  // A tool page's whole URL path ("tool/gst-calculator", or "tools" for the hub); follows the title until edited.
  const [toolSlug, setToolSlug] = useState(startHub ? TOOLS_HUB_SLUG : startTool ? `${TOOL_SLUG_PREFIX}${startTool.key}` : '');
  const [toolSlugTouched, setToolSlugTouched] = useState(Boolean(startHub || startTool));
  // The /journey/<key> part of a journey page's URL; follows the title until edited by hand.
  const [stageKey, setStageKey] = useState(startStage?.key || '');
  const [stageKeyTouched, setStageKeyTouched] = useState(Boolean(startStage));
  // Page Builder card: show the blocks or the live preview of the unsaved draft.
  const [homeView, setHomeView] = useState('builder');
  const [previewMounted, setPreviewMounted] = useState(false);

  const editorConfig = useMemo(() => ({
    ...joditConfig,
    ...JODIT_CLEAN_PASTE,
    theme: theme === 'dark' ? 'dark' : 'default'
  }), [theme]);

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: isHome ? 'Home' : startStage ? startStage.title : startHub ? 'Free Tools & Calculators' : startTool ? startTool.title : '',
      slug: isHome ? HOME_PAGE_SLUG : startStage ? `${JOURNEY_SLUG_PREFIX}${startStage.key}` : startHub ? TOOLS_HUB_SLUG : startTool ? `${TOOL_SLUG_PREFIX}${startTool.key}` : '',
      content: '',
      status: 'draft',
      metaTitle: '',
      metaDescription: ''
    }
  });

  const title = watch('title');

  const slugify = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  // Auto-generate slug from title (the homepage keeps its fixed slug; a journey page is journey/<key>)
  useEffect(() => {
    if (isHome) {
      setValue('slug', HOME_PAGE_SLUG);
    } else if (isJourney) {
      const key = stageKeyTouched ? stageKey : slugify(title);
      if (!stageKeyTouched) setStageKey(key);
      if (key) setValue('slug', `${JOURNEY_SLUG_PREFIX}${key}`, { shouldValidate: true, shouldDirty: true });
    } else if (isTool) {
      const path = toolSlugTouched ? toolSlug : (title ? `${TOOL_SLUG_PREFIX}${slugify(title)}` : '');
      if (!toolSlugTouched) setToolSlug(path);
      if (path) setValue('slug', path, { shouldValidate: true, shouldDirty: true });
    } else if (title) {
      setValue('slug', slugify(title), { shouldValidate: true, shouldDirty: true });
    }
  }, [title, setValue, isHome, isJourney, stageKey, stageKeyTouched, isTool, toolSlug, toolSlugTouched]);

  // A journey / tool page with no title yet takes its hero's title.
  const onSectionsChange = (newSections) => {
    setPageSections(newSections);
    if ((isJourney || isTool) && !String(watch('title') || '').trim()) {
      const heroTitle = newSections.find(s => s.type === (isTool ? 'ToolHero' : 'JourneyHero'))?.data?.payload?.title;
      if (heroTitle) setValue('title', heroTitle, { shouldValidate: true, shouldDirty: true });
    }
  };

  useEffect(() => {
    const fetchPage = async () => {
      if (!isEditing) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/pages/${id}`);
        const data = res.data.data;
        setInitialData(data);
        setIsHome(data.slug === HOME_PAGE_SLUG);
        if (isJourneyPage(data)) {
          setIsJourney(true);
          setStageKey(String(data.slug || '').replace(JOURNEY_SLUG_PREFIX, ''));
          setStageKeyTouched(true);
        } else if (isToolPage(data)) {
          setIsTool(true);
          setToolSlug(String(data.slug || ''));
          setToolSlugTouched(true);
        }
        reset({
          title: data.title || '',
          slug: data.slug || '',
          content: data.content || '',
          status: data.status || 'draft',
          metaTitle: data.metaTitle || '',
          metaDescription: data.metaDescription || ''
        });
        setPageSections(Array.isArray(data.sections) ? data.sections : []);
      } catch (error) {
        toast.error('Failed to load page details.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPage();
  }, [id, isEditing, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = { ...data, sections: pageSections };
      if (isEditing) {
        await api.put(`/pages/${id}`, payload);
        toast.success('Page updated successfully.');
      } else {
        await api.post('/pages', payload);
        toast.success('Page created successfully.');
      }
      navigate('/pages');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'An error occurred while saving.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-5">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Sticky editor header (Save / Discard), .ta-editor-bar */}
        <div className="ta-editor-bar d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div className="w-100">
          <Breadcrumb items={[
            { label: 'Pages', link: '/pages' },
            { label: isHome ? 'Home Page' : isJourney ? 'Journey Stage' : isTool ? 'Free Tool' : isEditing ? 'Edit' : 'New' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>{isHome ? 'Home Page' : isJourney ? (isEditing ? 'Edit Journey Stage' : 'New Journey Stage') : isTool ? (isEditing ? 'Edit Free Tool Page' : 'New Free Tool Page') : isEditing ? 'Edit Page' : 'Create New Page'}</h2>
          {isHome && (
            <p className="text-muted small mb-0">
              The website homepage. While this page is not published, the website keeps showing its built-in homepage.
            </p>
          )}
          </div>
          <div className="d-flex gap-2 w-100 justify-content-end justify-content-md-auto" style={{ maxWidth: '100%' }}>
            <button type="button" className="btn btn-outline-secondary shadow-sm flex-grow-1 flex-md-grow-0" onClick={() => navigate('/pages')} disabled={isLoading}>
              Discard
            </button>
            <button type="submit" className="btn btn-primary shadow-sm flex-grow-1 flex-md-grow-0" disabled={isLoading}>
              {isLoading ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...</>
              ) : (
                <><i className="bi bi-save me-1"></i> {isEditing ? 'Save' : 'Publish'}</>
              )}
            </button>
          </div>
        </div>

        <div className="row g-4">
          {/* Main Content Column */}
          <div className="col-lg-8">
            {/* General Info Card */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent border-bottom-0 pb-0 pt-4">
                <h5 className="fw-bold mb-0">General Information</h5>
              </div>
              <div className="card-body">
                <div className="mb-4">
                  <label className="form-label fw-semibold">Page Title <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                    placeholder="Enter a descriptive title" 
                    {...register('title', { 
                      required: 'Title is required',
                      maxLength: { value: 255, message: 'Max 255 characters' }
                    })}
                  />
                  {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                </div>
                
                {isTool && (
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Page URL <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted">/</span>
                      <input
                        type="text"
                        className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                        placeholder={`${TOOL_SLUG_PREFIX}gst-calculator`}
                        value={toolSlug}
                        onChange={e => { setToolSlugTouched(true); setToolSlug(e.target.value.toLowerCase().replace(/[^a-z0-9/-]+/g, '-').replace(/\/{2,}/g, '/').replace(/^\//, '')); }}
                      />
                    </div>
                    <div className="form-text">
                      A tool is <code>{TOOL_SLUG_PREFIX}&lt;name&gt;</code> (the homepage Free Tools block links to <code>/tool/gst-calculator</code>, …); the hub listing every tool is <code>{TOOLS_HUB_SLUG}</code>.
                    </div>
                    {errors.slug && <div className="text-danger small mt-1">{errors.slug.message}</div>}
                  </div>
                )}

                {isJourney && (
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Stage URL <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted">/{JOURNEY_SLUG_PREFIX}</span>
                      <input
                        type="text"
                        className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                        placeholder="idea"
                        value={stageKey}
                        onChange={e => { setStageKeyTouched(true); setStageKey(slugify(e.target.value) + (e.target.value.endsWith('-') ? '-' : '')); }}
                      />
                    </div>
                    <div className="form-text">
                      The homepage "Idea to Revenue" cards link to <code>/journey/idea</code>, <code>/journey/register</code>, … — use the same name for those stages.
                    </div>
                  </div>
                )}

                <div className="mb-4" hidden={isJourney || isTool}>
                  <label className="form-label fw-semibold">URL Slug <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0">https://yoursite.com/</span>
                    <input 
                      type="text" 
                      className={`form-control border-start-0 ${errors.slug ? 'is-invalid' : ''}`}
                      placeholder="page-slug" 
                      {...register('slug', { required: 'Slug is required', pattern: { value: /^((journey|tool)\/)?[a-z0-9-]+$/, message: 'Only lowercase letters, numbers, and hyphens (tool pages: tool/<name>)' } })}
                      disabled
                    />
                  </div>
                  {errors.slug && <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>{errors.slug.message}</div>}
                  {isHome && <div className="form-text">Fixed to <code>home</code>: this page is served at the site root (/).</div>}
                </div>
              </div>
            </div>

            {/* Content Editor Card (the homepage and journey stages are built from blocks only) */}
            <div className="card border-0 shadow-sm mb-4" hidden={isHome || isJourney || isTool}>
              <div className="card-header bg-transparent border-bottom-0 pb-0 pt-4 d-flex justify-content-between align-items-center mb-2">
                <h5 className="fw-bold mb-0">Content</h5>
              </div>
              <div className="card-body">
                <div className="bg-white">
                  <Controller
                    name="content"
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
              </div>
            </div>

            {/* SEO Settings Card */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom-0 pb-0 pt-4">
                <h5 className="fw-bold mb-0">Search Engine Optimization</h5>
                <p className="text-muted small mb-0">Optimize how this page appears in search results.</p>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold d-flex justify-content-between">
                    Meta Title
                    <span className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>Optimal: 50-60 chars</span>
                  </label>
                  <input type="text" className="form-control" placeholder="SEO optimized title" {...register('metaTitle', { maxLength: { value: 255, message: 'Max 255 characters' } })} />
                </div>
                <div className="mb-0">
                  <label className="form-label fw-semibold d-flex justify-content-between">
                    Meta Description
                    <span className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>Optimal: 150-160 chars</span>
                  </label>
                  <textarea className="form-control" rows="3" placeholder="Brief summary of the page for search engines" {...register('metaDescription', { maxLength: { value: 300, message: 'Max 300 characters' } })}></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="col-lg-4">
            {/* Publishing Card */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent border-bottom pb-3 pt-4">
                <h6 className="fw-bold text-uppercase mb-0 text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Publishing</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Status</label>
                  <select className="form-select" {...register('status')}>
                    <option value="draft">Draft (Not Visible)</option>
                    <option value="published">Published (Live)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-3 text-muted small">
                  <span>Visibility:</span>
                  <span className="fw-semibold text-dark">Public</span>
                </div>
              </div>
            </div>
          </div>

          {/* Page Builder: blocks rendered after the main content (Hero, FAQ, Form, ...) */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom-0 pb-0 pt-4 d-flex flex-wrap justify-content-between align-items-start gap-2">
                <div>
                  <h5 className="fw-bold mb-0">{isHome ? 'Home Page Builder' : isJourney ? 'Journey Stage Builder' : isTool ? 'Free Tool Builder' : 'Page Builder'}</h5>
                  <p className="text-muted small mb-0">
                    {isHome
                      ? 'Each block is one homepage section, in the same design as the live site. Drag blocks between full-width rows, main content and the right sidebar; empty fields are hidden.'
                      : isJourney
                        ? 'Each block is one section of the journey stage page, full width, top to bottom. Set the stage in the Stage Hero (number, title, icon, colour): every block uses it. Progress, roadmap, flow and next / previous build themselves from the published journey stages.'
                        : isTool
                          ? 'A working calculator page: choose the calculator in the Calculator block (its rates and defaults are editable there), then the texts around it. The Tool Hero\'s icon, title and tag make the card on the tools hub. Try it in Live Preview.'
                          : 'Add blocks such as Hero Banner, FAQ, a Form or Packages, and drag them into main content or the right sidebar. With blocks, the page uses the service-page layout (the content above becomes its first section).'}
                  </p>
                </div>
                <div className="btn-group btn-group-sm">
                  <button type="button" className={`btn ${homeView === 'builder' ? 'btn-primary' : 'btn-light border'}`} onClick={() => setHomeView('builder')}>
                    <i className="bi bi-grid-1x2 me-1"></i> Builder
                  </button>
                  <button type="button" className={`btn ${homeView === 'preview' ? 'btn-primary' : 'btn-light border'}`} onClick={() => { setHomeView('preview'); setPreviewMounted(true); }}>
                    <i className="bi bi-eye me-1"></i> Live Preview
                  </button>
                </div>
              </div>
              <div className="card-body">
                {/* Pages use the service-page layout (areas, sidebar and extra blocks); the homepage its own. */}
                <div className={homeView === 'builder' ? 'd-block' : 'd-none'}>
                  <PageBuilder
                    key={isHome ? 'home' : isJourney ? 'journey' : isTool ? 'tool' : 'page'}
                    initialSections={pageSections}
                    onChange={onSectionsChange}
                    blockSet={isHome ? 'home' : isJourney ? 'journey' : isTool ? 'tool' : 'default'}
                    layoutSettings={!isHome && !isJourney && !isTool}
                  />
                </div>
                {/* Mounted on first open, then kept so it follows every edit (unsaved changes included). */}
                {previewMounted && (
                  <div className={homeView === 'preview' ? 'd-block' : 'd-none'}>
                    <ServicePreviewPane
                      kind={isHome ? 'home' : isJourney ? 'journey' : isTool ? 'tool' : 'page'}
                      draft={isHome ? { sections: pageSections }
                        : (isJourney || isTool) ? { title: watch('title'), slug: watch('slug'), sections: pageSections }
                        : { title: watch('title'), content: watch('content'), sections: pageSections }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

// A new page starts over when its template changes (e.g. sidebar "New Journey Stage" while on /pages/new).
const PageFormRoute = () => {
  const [searchParams] = useSearchParams();
  return <PageForm key={`${searchParams.get('template') || ''}:${searchParams.get('stage') || ''}:${searchParams.get('tool') || ''}`} />;
};

export default PageFormRoute;


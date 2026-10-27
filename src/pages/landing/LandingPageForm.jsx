import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import EditorBar from '../../components/common/EditorBar';
import SearchableSelect from '../../components/common/SearchableSelect';
import ImageSizeHint from '../../components/common/ImageSizeHint';
import MediaPickButton from '../../components/media/MediaPickButton';
import { confirmDelete, confirmDialog } from '../../components/common/confirm';
import PageBuilder from '../../components/page-builder/PageBuilder';
import ServicePreviewPane from '../../components/page-builder/ServicePreviewPane';
import { applyLayout, landingTemplate } from '../../components/page-builder/landingLayouts';
import { ChangeLayoutModal, LayoutPicker } from './LandingLayoutPicker';
import { pageThemeOfSections, withTheme } from '../../components/page-builder/landingThemes';
import { ThemeDots, ThemePicker, themeName } from './CustomThemes';
import { LandingPageService, apiErrorText, canLanding } from '../../services/landingPage.service';
import { FormService } from '../../services/form.service';
import { StatusPill } from './LandingPagesList';
import './landing.css';

/*
 * Landing page editor (/landing-pages/new, /landing-pages/edit/:id).
 * - New: service, title, URL name /lp/<name> (checked live against GET /landing-pages/check-slug), SEO,
 *   start from the template or the service's own blocks → POST /landing-pages.
 * - Edit: the existing Page Builder (blockSet="landing": Header area, the service-page body areas,
 *   Footer area) and Live Preview (same website components, unsaved changes included);
 *   Save draft → PUT /:id/draft (the live page is untouched), Publish → POST /:id/publish
 *   (immutable version), Unpublish / Archive / Restore, Settings and Versions tabs.
 */

const SEO_FIELDS = ['metaTitle', 'metaDescription', 'keywords', 'ogImage', 'robots'];
const EMPTY = { title: '', slug: '', serviceId: '', metaTitle: '', metaDescription: '', keywords: '', ogImage: '', robots: '' };
const slugify = (value) => String(value || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '').slice(0, 63).replace(/-+$/g, '');

const fieldErrors = (error) => Object.fromEntries((error?.response?.data?.errors || []).filter((e) => e.field).map((e) => [e.field, e.message || e.msg]));

/** The form "Enquire Now" and the other "#form" buttons open in a popup (the template's Form block). */
const EnquiryFormPicker = ({ value, onChange }) => {
  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['forms', 'active'],
    queryFn: async () => (await FormService.getAll({ status: 'active', limit: 1000, sortBy: 'name', sortOrder: 'ASC' })).data || [],
  });
  return (
    <div className="col-md-6">
      <label className="form-label fw-semibold">Enquiry form</label>
      <SearchableSelect
        value={value}
        onChange={(v) => onChange(v || '')}
        loading={isLoading}
        spaced={false}
        placeholder="Pick a form"
        emptyLabel="— Choose later —"
        searchPlaceholder="Search forms..."
        options={forms.map((f) => ({ value: f.id, label: f.name, sub: `${(f.fields || []).length} fields · ${f.slug}` }))}
      />
      <div className="form-text">Shown in the sidebar and opened in a popup by "Enquire Now" (header, hero, process). Leads go to CRM. Any button can open another form.</div>
    </div>
  );
};

/** Settings fields shared by the create form and the Settings tab. */
const SettingsFields = ({ value, onChange, errors, services, slugState, slugLocked, showStart, start, setStart, formId, setFormId }) => {
  const set = (key) => (e) => onChange({ ...value, [key]: e?.target ? e.target.value : e });
  const service = services.find((s) => s.id === value.serviceId);
  return (
    <div className="row g-3">
      <div className="col-md-6">
        <label className="form-label fw-semibold">Service</label>
        <SearchableSelect
          value={value.serviceId}
          onChange={(id) => {
            const picked = services.find((s) => s.id === id);
            const next = { ...value, serviceId: id || '' };
            // Suggest the title and URL name from the service until the editor types their own.
            if (picked && !value.title) next.title = `${picked.title}`;
            if (picked && !value.slug && !slugLocked) next.slug = slugify(picked.slug || picked.title);
            onChange(next);
          }}
          placeholder="Pick a service (optional)"
          emptyLabel="No service"
          searchPlaceholder={`Search ${services.length} services...`}
          options={services.map((s) => ({ value: s.id, label: s.title, sub: s.status === 'published' ? '' : s.status }))}
        />
        <div className="form-text">Links the page to the service master. Several landing pages per service are allowed (campaigns).</div>
        {errors.serviceId && <div className="text-danger small">{errors.serviceId}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label fw-semibold">Page title <span className="text-danger">*</span></label>
        <input className={`form-control ${errors.title ? 'is-invalid' : ''}`} value={value.title} onChange={set('title')} placeholder="e.g. CBDT Compliance Services" maxLength={255} />
        {errors.title && <div className="invalid-feedback">{errors.title}</div>}
      </div>
      <div className="col-md-6">
        <label className="form-label fw-semibold">Page URL <span className="text-danger">*</span></label>
        <div className="input-group">
          {/* Landing pages live at <main site>/lp/<name> (backend landingUrl). */}
          <span className="input-group-text">{(slugState?.url || 'https://services.taxalphonic.com/lp/x').replace(/[^/]*$/, '')}</span>
          <input
            className={`form-control ${errors.slug || slugState?.available === false ? 'is-invalid' : slugState?.available ? 'is-valid' : ''}`}
            value={value.slug}
            onChange={(e) => onChange({ ...value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            onBlur={() => onChange({ ...value, slug: slugify(value.slug) })}
            placeholder="cbdt"
            maxLength={63}
            disabled={slugLocked}
          />
        </div>
        {slugLocked
          ? <div className="form-text">Unpublish the page to change its URL (the live address would break).</div>
          : <div className={`small mt-1 ${slugState?.available === false || errors.slug ? 'text-danger' : slugState?.available ? 'text-success' : 'text-muted'}`}>
            {errors.slug || slugState?.message || 'Lowercase letters, digits and hyphens. Reserved: www, admin, api, mail and other system names.'}
          </div>}
      </div>
      {showStart && (
        <div className="col-md-6">
          <label className="form-label fw-semibold">Start with</label>
          <div className="d-flex flex-column gap-1">
            <label className="form-check">
              <input type="radio" className="form-check-input" checked={start === 'template'} onChange={() => setStart('template')} />
              <span className="form-check-label">A ready-made layout (pick it below)</span>
            </label>
            <label className={`form-check ${service ? '' : 'text-muted'}`}>
              <input type="radio" className="form-check-input" checked={start === 'service'} disabled={!service} onChange={() => setStart('service')} />
              <span className="form-check-label">Copy the blocks of the service page{service ? ` "${service.title}"` : ' (pick a service)'} between the header and footer</span>
            </label>
          </div>
        </div>
      )}
      {showStart && <EnquiryFormPicker value={formId} onChange={setFormId} />}

      <div className="col-12">
        <details className="lp-seo" open={Boolean(value.metaTitle || value.metaDescription)}>
          <summary className="fw-semibold">SEO (optional)</summary>
          <div className="form-text mt-2">
            <i className="bi bi-info-circle me-1"></i>
            If this landing page has an SEO Config (SEO Management → SEO Configs → Landing Page), every field filled there replaces the one here; empty fields keep these values.
          </div>
          <div className="row g-3 mt-1">
            <div className="col-md-6">
              <label className="form-label">Meta title</label>
              <input className={`form-control ${errors.metaTitle ? 'is-invalid' : ''}`} value={value.metaTitle} onChange={set('metaTitle')} maxLength={255} placeholder={value.title || 'Page title'} />
              <div className="form-text">{(value.metaTitle || '').length}/60 recommended</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Robots</label>
              <select className="form-select" value={value.robots || ''} onChange={set('robots')}>
                <option value="">index, follow (default)</option>
                <option value="noindex, follow">noindex, follow</option>
                <option value="noindex, nofollow">noindex, nofollow (ads-only page)</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Meta description</label>
              <textarea className="form-control" rows={2} value={value.metaDescription} onChange={set('metaDescription')} maxLength={2000} />
              <div className="form-text">{(value.metaDescription || '').length}/160 recommended</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Keywords</label>
              <input className="form-control" value={value.keywords} onChange={set('keywords')} maxLength={500} placeholder="cbdt notice, income tax reply" />
            </div>
            <div className="col-md-6">
              <label className="form-label">Share image</label>
              <div className="input-group">
                <input className={`form-control ${errors.ogImage ? 'is-invalid' : ''}`} value={value.ogImage} onChange={set('ogImage')} placeholder="Choose from Media or paste a URL" />
                <MediaPickButton onPick={(url) => onChange({ ...value, ogImage: url })} />
              </div>
              {errors.ogImage && <div className="text-danger small">{errors.ogImage}</div>}
              <ImageSizeHint kind="ogImage" />
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

/** Live URL name check (debounced). */
function useSlugCheck(slug, exceptId) {
  const [state, setState] = useState(null);
  useEffect(() => {
    if (!slug) { setState(null); return undefined; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await LandingPageService.checkSlug(slug, exceptId);
        if (!cancelled) setState(result);
      } catch {
        if (!cancelled) setState(null);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [slug, exceptId]);
  return state;
}

const LandingPageForm = () => {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [settings, setSettings] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [start, setStart] = useState('template');
  const [formId, setFormId] = useState('');
  const [newTheme, setNewTheme] = useState({ key: 'default', custom: null });
  const [newLayout, setNewLayout] = useState('classic');
  const [layoutModal, setLayoutModal] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState('');
  const [tab, setTab] = useState('builder');
  const [previewMounted, setPreviewMounted] = useState(false);
  // The builder keeps its own copy; initialSections changes only when a record is (re)loaded.
  const [initialSections, setInitialSections] = useState([]);
  const sectionsRef = useRef([]);
  const [sectionsVersion, setSectionsVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [publishErrors, setPublishErrors] = useState([]);
  const [pickedVersions, setPickedVersions] = useState(() => new Set());

  const { data: services = [] } = useQuery({ queryKey: ['landing-service-options'], queryFn: LandingPageService.serviceOptions, staleTime: 5 * 60 * 1000 });
  const { data: versions = [], refetch: refetchVersions } = useQuery({
    queryKey: ['landing-versions', id],
    queryFn: () => LandingPageService.versions(id),
    enabled: !isNew && tab === 'versions',
  });

  const slugLocked = record?.status === 'published';
  const slugState = useSlugCheck(slugLocked ? '' : slugify(settings.slug), id);

  const applyRecord = useCallback((data, { resetSections = true } = {}) => {
    setRecord(data);
    setSettings({
      title: data.title || '', slug: data.slug || '', serviceId: data.serviceId || '',
      ...Object.fromEntries(SEO_FIELDS.map((k) => [k, data[k] || ''])),
    });
    if (resetSections) {
      sectionsRef.current = data.sections || [];
      setInitialSections(data.sections || []);
      setDirty(false);
    }
  }, []);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    setLoading(true);
    LandingPageService.get(id)
      .then((data) => { if (!cancelled) applyRecord(data); })
      .catch((error) => { if (!cancelled) setLoadError(apiErrorText(error, 'Landing page not found')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, isNew, applyRecord]);

  // Unsaved builder changes: warn before closing the tab.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const onSectionsChange = useCallback((sections) => {
    sectionsRef.current = sections;
    setSectionsVersion((v) => v + 1);
    setDirty(true);
  }, []);

  // The theme lives on the Header block (payload.pageTheme): the builder is reloaded with it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pageTheme = useMemo(() => pageThemeOfSections(sectionsRef.current), [sectionsVersion, initialSections]);
  // value: { key, custom } (custom = the colours of a "Create your own" theme, CustomThemes.jsx).
  const changeTheme = useCallback((value) => {
    const next = withTheme(sectionsRef.current, value.key, value.custom);
    sectionsRef.current = next;
    setInitialSections(next);
    setSectionsVersion((v) => v + 1);
    setDirty(true);
  }, []);

  const pickLayout = useCallback(async (layout, alsoTheme) => {
    setLayoutModal(false);
    const ok = await confirmDialog({
      title: `Use the "${layout.name}" layout?`,
      message: 'The blocks between the Header and the Footer are replaced by this layout. Header, Footer and the enquiry form are kept.',
      note: 'Nothing is saved until you click Save draft; leaving without saving keeps the current draft.',
      tone: 'warning',
      confirmText: 'Use layout',
    });
    if (!ok) return;
    const service = services.find((sv) => sv.id === settings.serviceId);
    let next = applyLayout(sectionsRef.current, layout.key, { title: settings.title, serviceTitle: service?.title });
    if (alsoTheme) next = withTheme(next, layout.theme);
    sectionsRef.current = next;
    setInitialSections(next);
    setSectionsVersion((v) => v + 1);
    setDirty(true);
  }, [services, settings.serviceId, settings.title]);

  const previewDraft = useMemo(() => ({ title: settings.title, sections: sectionsRef.current }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.title, sectionsVersion, initialSections]);

  const create = async () => {
    setErrors({});
    const service = services.find((s) => s.id === settings.serviceId);
    if (start === 'service' && !service) {
      setErrors({ serviceId: 'Pick a service to copy its blocks' });
      return;
    }
    setBusy('create');
    try {
      const created = await LandingPageService.create({
        ...settings,
        slug: slugify(settings.slug),
        serviceId: settings.serviceId || null,
        copyServiceBlocks: start === 'service',
        sections: landingTemplate({ layout: newLayout, title: settings.title, serviceTitle: service?.title, formId, theme: newTheme.key, customTheme: newTheme.custom }),
      });
      toast.success('Landing page created as a draft. Build it, then publish.');
      navigate(`/landing-pages/edit/${created.id}`, { replace: true });
    } catch (error) {
      setErrors(fieldErrors(error));
      toast.error(apiErrorText(error));
    } finally {
      setBusy('');
    }
  };

  const saveSettings = async () => {
    setErrors({});
    setBusy('settings');
    try {
      const data = await LandingPageService.updateSettings(id, { ...settings, slug: slugify(settings.slug), serviceId: settings.serviceId || null });
      applyRecord(data, { resetSections: false });
      toast.success('Settings saved.');
    } catch (error) {
      setErrors(fieldErrors(error));
      toast.error(apiErrorText(error));
    } finally {
      setBusy('');
    }
  };

  const saveDraft = async ({ quiet = false } = {}) => {
    setBusy('draft');
    try {
      const data = await LandingPageService.saveDraft(id, sectionsRef.current);
      applyRecord(data, { resetSections: false });
      setDirty(false);
      if (!quiet) toast.success(record?.isLive ? 'Draft saved. The live page is unchanged until you publish.' : 'Draft saved.');
      return true;
    } catch (error) {
      toast.error(apiErrorText(error), { autoClose: 9000 });
      return false;
    } finally {
      setBusy('');
    }
  };

  const publish = async () => {
    setPublishErrors([]);
    if (dirty && !(await saveDraft({ quiet: true }))) return;
    setBusy('publish');
    try {
      const check = await LandingPageService.validate(id);
      if (!check.ready) {
        setPublishErrors(check.errors || []);
        toast.error('Fix the issues listed above the builder before publishing.');
        return;
      }
      setBusy('');
      const ok = await confirmDialog({
        title: record.isLive ? 'Publish the changes?' : `Publish "${settings.title}"?`,
        message: `${record.url} will show this version${record.isLive ? ' instead of the current one' : ''}. It is saved as version ${(record.versionCount || 0) + 1}.`,
        tone: 'warning',
        confirmText: 'Publish',
      });
      if (!ok) return;
      setBusy('publish');
      const data = await LandingPageService.publish(id);
      applyRecord(data, { resetSections: false });
      toast.success(`Published: ${data.url}`);
      refetchVersions();
    } catch (error) {
      const list = error?.response?.data?.errors;
      if (Array.isArray(list) && list.length) setPublishErrors(list);
      toast.error(apiErrorText(error), { autoClose: 9000 });
    } finally {
      setBusy('');
    }
  };

  const lifecycle = async (action) => {
    const steps = {
      unpublish: { title: 'Unpublish this landing page?', message: `${record.url} will show "page not found" until it is published again. The draft and versions are kept.`, confirmText: 'Unpublish', done: 'Unpublished' },
      archive: { title: 'Archive this landing page?', message: 'It goes offline (if live) and leaves the active list. Its URL stays reserved for it.', confirmText: 'Archive', tone: 'danger', done: 'Archived' },
      unarchive: { title: 'Restore as a draft?', message: 'You can edit and publish it again.', confirmText: 'Restore', done: 'Restored as a draft' },
    }[action];
    if (dirty && action !== 'unarchive') {
      if (!(await confirmDialog({ title: 'Unsaved changes', message: 'Save the draft first? Unsaved builder changes are kept in the draft.', tone: 'warning', confirmText: 'Save draft' }))) return;
      if (!(await saveDraft({ quiet: true }))) return;
    }
    if (!(await confirmDialog({ title: steps.title, message: steps.message, tone: steps.tone || 'warning', confirmText: steps.confirmText }))) return;
    setBusy(action);
    try {
      const data = await LandingPageService[action](id);
      applyRecord(data, { resetSections: false });
      toast.success(steps.done);
    } catch (error) {
      toast.error(apiErrorText(error));
    } finally {
      setBusy('');
    }
  };

  const restoreVersion = async (version) => {
    const ok = await confirmDialog({
      title: `Copy version ${version.version} into the draft?`,
      message: 'The builder is replaced with that version\'s blocks. The live page does not change until you publish.',
      note: dirty ? 'Your unsaved builder changes will be lost.' : undefined,
      tone: 'warning',
      confirmText: 'Copy into draft',
    });
    if (!ok) return;
    setBusy(`version:${version.id}`);
    try {
      const data = await LandingPageService.restoreVersion(id, version.id);
      applyRecord(data);
      setTab('builder');
      toast.success(`Version ${version.version} copied into the draft.`);
    } catch (error) {
      toast.error(apiErrorText(error));
    } finally {
      setBusy('');
    }
  };

  // Old versions can be deleted for good; the live one is refused by the API as well.
  const deleteVersion = async (version) => {
    const ok = await confirmDelete(`version ${version.version}`, {
      what: 'version',
      extra: 'The published snapshot is removed for good. The live page and the draft do not change.',
    });
    if (!ok) return;
    setBusy(`delete:${version.id}`);
    try {
      await LandingPageService.deleteVersion(id, version.id);
      toast.success(`Version ${version.version} deleted.`);
      setRecord((r) => ({ ...r, versionCount: Math.max(0, (r.versionCount || 1) - 1) }));
      refetchVersions();
    } catch (error) {
      toast.error(apiErrorText(error));
    } finally {
      setBusy('');
    }
  };

  // Several old versions at once (the live one can't be picked). One DELETE per version.
  const deleteVersions = async () => {
    const chosen = versions.filter((v) => pickedVersions.has(v.id) && record.publishedVersion?.id !== v.id);
    if (!chosen.length) return;
    const ok = await confirmDialog({
      title: `Delete ${chosen.length} version${chosen.length > 1 ? 's' : ''}?`,
      message: 'These published snapshots are removed for good. The live page and the draft do not change.',
      items: chosen.map((v) => `v${v.version} · ${v.title} · ${new Date(v.createdAt).toLocaleString('en-IN')}`),
      tone: 'danger',
      confirmText: 'Delete',
    });
    if (!ok) return;
    setBusy('delete:bulk');
    let done = 0;
    const failed = [];
    for (const v of chosen) {
      try {
        await LandingPageService.deleteVersion(id, v.id);
        done += 1;
      } catch (error) {
        failed.push(`v${v.version}: ${apiErrorText(error)}`);
      }
    }
    setBusy('');
    setPickedVersions(new Set());
    if (done) {
      toast.success(`${done} version${done > 1 ? 's' : ''} deleted.`);
      setRecord((r) => ({ ...r, versionCount: Math.max(0, (r.versionCount || done) - done) }));
    }
    if (failed.length) toast.error(`Not deleted: ${failed.join('; ')}`);
    refetchVersions();
  };

  const spinner = (name) => (busy === name ? <span className="spinner-border spinner-border-sm me-1"></span> : null);
  const breadcrumb = [{ label: 'Landing Pages', link: '/landing-pages' }, { label: isNew ? 'New' : settings.title || 'Edit' }];

  if (isNew) {
    return (
      <div className="container-fluid p-0">
        <EditorBar title="New Landing Page" breadcrumb={breadcrumb} subtitle="Pick the service and its page URL. You build the page next.">
          <Link to="/landing-pages" className="btn btn-light border">Cancel</Link>
          <button type="button" className="btn btn-primary" onClick={create} disabled={Boolean(busy) || !settings.title.trim() || !slugify(settings.slug) || slugState?.available === false}>
            {spinner('create')}Create &amp; open builder
          </button>
        </EditorBar>
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            <SettingsFields value={settings} onChange={setSettings} errors={errors} services={services} slugState={slugState} showStart start={start} setStart={setStart} formId={formId} setFormId={setFormId} />
            {start === 'template' && (
              <div className="mt-3">
                <label className="form-label fw-semibold mb-1">Layout</label>
                <div className="form-text mt-0 mb-2">Blocks, order and placement ready to fill in. Every block can still be edited, moved, removed or added later; "Change layout" in the Builder switches it.</div>
                <LayoutPicker value={newLayout} onChange={(layout) => { setNewLayout(layout.key); setNewTheme({ key: layout.theme, custom: null }); }} />
              </div>
            )}
            <div className="mt-3">
              <label className="form-label fw-semibold mb-1">Colour theme</label>
              <div className="form-text mt-0 mb-2">Colours of every block on the page. You can change it any time in the Builder.</div>
              <ThemePicker value={newTheme} onChange={setNewTheme} />
            </div>
          </div>
        </div>
        <p className="small text-muted mt-3">
          <i className="bi bi-info-circle me-1"></i>
          The page opens at services.taxalphonic.com/lp/&lt;URL name&gt; once it is published. Old links (cbdt.taxalphonic.com, taxalphonic.com/lp/cbdt) redirect there.
        </p>
      </div>
    );
  }

  if (loading) return <div className="text-center py-5"><span className="spinner-border text-primary"></span></div>;
  if (loadError) {
    return (
      <div className="alert alert-danger d-flex justify-content-between align-items-center">
        <span><i className="bi bi-exclamation-triangle me-2"></i>{loadError}</span>
        <Link to="/landing-pages" className="btn btn-sm btn-light">Back to Landing Pages</Link>
      </div>
    );
  }

  const archived = record.status === 'archived';
  const canUpdate = canLanding('update') && !archived;

  return (
    <div className="container-fluid p-0">
      <EditorBar
        title={settings.title || 'Landing page'}
        breadcrumb={breadcrumb}
        subtitle={(
          <span className="d-inline-flex flex-wrap align-items-center gap-2">
            <StatusPill row={record} />
            {record.isLive
              ? <a href={record.url} target="_blank" rel="noreferrer">{record.url} <i className="bi bi-box-arrow-up-right"></i></a>
              : <span>{record.url}</span>}
            {record.publishedVersion && <span>· live version {record.publishedVersion.version}</span>}
            {dirty && <span className="text-warning-emphasis fw-semibold">· unsaved changes</span>}
          </span>
        )}
      >
        {record.isLive && canLanding('unpublish') && (
          <button type="button" className="btn btn-outline-warning" onClick={() => lifecycle('unpublish')} disabled={Boolean(busy)}>{spinner('unpublish')}Unpublish</button>
        )}
        {!archived && canLanding('archive') && (
          <button type="button" className="btn btn-outline-danger" onClick={() => lifecycle('archive')} disabled={Boolean(busy)} title="Take it offline and out of the list">{spinner('archive')}Archive</button>
        )}
        {archived && canLanding('archive') && (
          <button type="button" className="btn btn-outline-secondary" onClick={() => lifecycle('unarchive')} disabled={Boolean(busy)}>{spinner('unarchive')}Restore as draft</button>
        )}
        {canUpdate && (
          <button type="button" className="btn btn-light border" onClick={() => saveDraft()} disabled={Boolean(busy) || !dirty}>{spinner('draft')}Save draft</button>
        )}
        {!archived && canLanding('publish') && (
          <button type="button" className="btn btn-primary" onClick={publish} disabled={Boolean(busy) || (record.isLive && !dirty && !record.hasUnpublishedChanges)}>
            {spinner('publish')}<i className="bi bi-rocket-takeoff me-1"></i>{record.isLive ? 'Publish changes' : 'Publish'}
          </button>
        )}
      </EditorBar>

      {archived && <div className="alert alert-secondary"><i className="bi bi-archive me-2"></i>This landing page is archived: it is offline and read-only. Restore it to edit or publish.</div>}
      {publishErrors.length > 0 && (
        <div className="alert alert-danger">
          <div className="fw-semibold mb-1"><i className="bi bi-exclamation-octagon me-2"></i>Not published. Fix these first:</div>
          <ul className="mb-0 small">{publishErrors.map((e, i) => <li key={i}>{e.message}{e.field && e.field !== 'sections' ? <span className="text-muted"> ({e.field})</span> : null}</li>)}</ul>
        </div>
      )}

      <ul className="nav nav-tabs mb-3">
        {[
          ['builder', 'bi-grid-1x2', 'Builder'],
          ['preview', 'bi-eye', 'Live Preview'],
          ['settings', 'bi-gear', 'Settings & SEO'],
          ['versions', 'bi-clock-history', `Versions${record.versionCount ? ` (${record.versionCount})` : ''}`],
        ].map(([key, icon, label]) => (
          <li className="nav-item" key={key}>
            <button type="button" className={`nav-link ${tab === key ? 'active' : ''}`} onClick={() => { setTab(key); if (key === 'preview') setPreviewMounted(true); }}>
              <i className={`bi ${icon} me-1`}></i>{label}
            </button>
          </li>
        ))}
      </ul>

      <div className={tab === 'builder' ? 'd-block' : 'd-none'}>
        <div className="small text-muted mb-2">
          Header and Footer have their own areas: choose the website header / footer, a landing-page one, or none. The body works like a service page: hero, main content, right sidebar (forms), full-width blocks.
          {record.isLive && ' Changes stay in the draft until you publish.'}
        </div>
        <div className="lp-theme-bar">
          <div className="d-flex align-items-baseline gap-2 flex-wrap mb-2">
            <span className="fw-semibold"><i className="bi bi-palette me-1 text-primary"></i>Page theme</span>
            <span className="small text-muted">Changes the colours of every block (buttons, headings, icons, cards, form, popup, header and footer). Block backgrounds you set stay as they are. See it in Live Preview.</span>
          </div>
          <ThemePicker value={pageTheme} onChange={changeTheme} disabled={!canUpdate} canManage={canUpdate} />
          <div className="d-flex align-items-center gap-2 flex-wrap mt-3 pt-3 border-top">
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setLayoutModal(true)} disabled={!canUpdate}>
              <i className="bi bi-layout-text-window-reverse me-1"></i>Change layout
            </button>
            <span className="small text-muted">7 ready-made layouts: the page body is rebuilt in one click, Header, Footer and the enquiry form stay.</span>
          </div>
        </div>
        <fieldset disabled={!canUpdate} className={canUpdate ? '' : 'opacity-75'}>
          <PageBuilder key={record.id} initialSections={initialSections} onChange={onSectionsChange} blockSet="landing" layoutSettings />
        </fieldset>
      </div>

      <ChangeLayoutModal show={layoutModal} onHide={() => setLayoutModal(false)} onApply={pickLayout} />

      {previewMounted && (
        <div className={tab === 'preview' ? 'd-block' : 'd-none'}>
          {/* Theme and layout here too, so the change shows in the preview straight away. */}
          <div className="lp-preview-design">
            <span className="fw-semibold small text-nowrap"><i className="bi bi-palette me-1 text-primary"></i>Theme</span>
            <ThemeDots value={pageTheme} onChange={changeTheme} disabled={!canUpdate} canManage={canUpdate} />
            <span className="small text-muted text-nowrap lp-preview-theme-name">{themeName(pageTheme)}</span>
            <button type="button" className="btn btn-sm btn-outline-primary ms-md-auto text-nowrap" onClick={() => setLayoutModal(true)} disabled={!canUpdate}>
              <i className="bi bi-layout-text-window-reverse me-1"></i>Change layout
            </button>
            {dirty && <span className="small text-warning-emphasis text-nowrap"><i className="bi bi-dot"></i>Unsaved: Save draft keeps it</span>}
          </div>
          <ServicePreviewPane kind="landing" draft={previewDraft} />
        </div>
      )}

      {tab === 'settings' && (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            <SettingsFields value={settings} onChange={setSettings} errors={errors} services={services} slugState={slugState} slugLocked={slugLocked} />
            <div className="d-flex justify-content-between align-items-center mt-4">
              <span className="small text-muted">
                Created {new Date(record.createdAt).toLocaleString('en-IN')}{record.createdByName ? ` by ${record.createdByName}` : ''}
                {record.updatedByName ? ` · last change by ${record.updatedByName}` : ''}.
                {record.isLive && ' Title and SEO changes go live with the next publish.'}
              </span>
              {canUpdate && <button type="button" className="btn btn-primary" onClick={saveSettings} disabled={Boolean(busy)}>{spinner('settings')}Save settings</button>}
            </div>
          </div>
        </div>
      )}

      {tab === 'versions' && (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-0">
            {versions.length === 0 ? (
              <div className="text-center text-muted py-5"><i className="bi bi-clock-history fs-3 d-block mb-2"></i>Nothing published yet. Each publish keeps a version here.</div>
            ) : (
              <>
              {canLanding('publish') && pickedVersions.size > 0 && (
                <div className="d-flex align-items-center gap-2 flex-wrap px-3 py-2 border-bottom bg-body-tertiary">
                  <span className="small fw-semibold">{pickedVersions.size} selected</span>
                  <button type="button" className="btn btn-sm btn-danger" onClick={deleteVersions} disabled={Boolean(busy)}>
                    {busy === 'delete:bulk' ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-trash me-1"></i>}Delete selected
                  </button>
                  <button type="button" className="btn btn-sm btn-light" onClick={() => setPickedVersions(new Set())} disabled={Boolean(busy)}>Clear</button>
                </div>
              )}
              <table className="table align-middle mb-0">
                <thead><tr>{canLanding('publish') && (() => {
                  const deletable = versions.filter((v) => record.publishedVersion?.id !== v.id);
                  const all = deletable.length > 0 && deletable.every((v) => pickedVersions.has(v.id));
                  return (
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        aria-label="Select all old versions"
                        title="Select all versions except the live one"
                        checked={all}
                        disabled={!deletable.length || Boolean(busy)}
                        onChange={() => setPickedVersions(all ? new Set() : new Set(deletable.map((v) => v.id)))}
                      />
                    </th>
                  );
                })()}<th>Version</th><th>Title</th><th>Published</th><th>By</th><th className="text-end sticky-actions">Actions</th></tr></thead>
                <tbody>
                  {versions.map((v) => (
                    <tr key={v.id} className={pickedVersions.has(v.id) ? 'table-active' : undefined}>
                      {canLanding('publish') && (
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            aria-label={`Select version ${v.version}`}
                            checked={pickedVersions.has(v.id)}
                            disabled={record.publishedVersion?.id === v.id || Boolean(busy)}
                            title={record.publishedVersion?.id === v.id ? 'The live version cannot be deleted' : undefined}
                            onChange={() => setPickedVersions((prev) => {
                              const next = new Set(prev);
                              if (next.has(v.id)) next.delete(v.id); else next.add(v.id);
                              return next;
                            })}
                          />
                        </td>
                      )}
                      <td>
                        <b>v{v.version}</b>
                        {record.publishedVersion?.id === v.id && <span className="lp-pill live ms-2"><i className="bi bi-broadcast"></i>Live</span>}
                      </td>
                      <td>{v.title}</td>
                      <td>{new Date(v.createdAt).toLocaleString('en-IN')}</td>
                      <td>{v.publishedByName || '-'}</td>
                      <td className="text-end sticky-actions">
                        <div className="d-inline-flex gap-1">
                          {canUpdate && (
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => restoreVersion(v)} disabled={Boolean(busy)}>
                              {spinner(`version:${v.id}`)}Copy into draft
                            </button>
                          )}
                          {canLanding('publish') && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteVersion(v)}
                              disabled={Boolean(busy) || record.publishedVersion?.id === v.id}
                              title={record.publishedVersion?.id === v.id ? 'The live version cannot be deleted. Publish another version or unpublish first.' : 'Delete this version'}
                            >
                              {busy === `delete:${v.id}` ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-trash"></i>}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPageForm;

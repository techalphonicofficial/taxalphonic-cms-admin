import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import DataGrid from '../components/datagrid/DataGrid';
import { HistoryButton, recordTitle } from '../components/datagrid/RecordHistory';
import useServerList from '../components/datagrid/useServerList';
import SearchableSelect from '../components/common/SearchableSelect';
import { confirmDialog } from '../components/common/confirm';
import api from '../services/api';
import AiGenerationModal from '../components/seo/AiGenerationModal';
import { siteUrl } from '../config/siteUrl';
import './SeoPagesList.css';

// pSEO pages (/seo-pages): server-side list from GET /seo-pages/admin-list (no page bodies),
// summary cards that double as filters, type / service filters, and bulk publish / draft /
// archive (POST /seo-pages/bulk-status), AI content for the selected pages and move to Trash.

const TYPES = {
  SERVICE_LOCATION: { label: 'Location', icon: 'bi-geo-alt', cls: 't-location', target: (r) => r.location?.name },
  SERVICE_INDUSTRY: { label: 'Industry', icon: 'bi-buildings', cls: 't-industry', target: (r) => r.industry?.name },
  SERVICE_TECHNOLOGY: { label: 'Technology', icon: 'bi-cpu', cls: 't-technology', target: (r) => r.technology?.name },
  PROBLEM: { label: 'Problem', icon: 'bi-exclamation-octagon', cls: 't-problem', target: (r) => r.problem?.name },
};

const VIEWS = [
  { key: 'all', label: 'All pages', icon: 'bi-collection', count: (c) => c.total, params: {} },
  { key: 'live', label: 'Live on website', icon: 'bi-globe2', count: (c) => c.live, params: { live: '1' }, tone: 'success' },
  { key: 'draft', label: 'Drafts', icon: 'bi-pencil-square', count: (c) => c.DRAFT, params: { status: 'DRAFT' }, tone: 'secondary' },
  { key: 'needs', label: 'Need AI content', icon: 'bi-robot', count: (c) => c.pending, params: { ai: 'NOT_GENERATED' }, tone: 'warning' },
  { key: 'written', label: 'AI written', icon: 'bi-stars', count: (c) => c.generated, params: { ai: 'GENERATED' }, tone: 'info' },
  { key: 'archived', label: 'Archived', icon: 'bi-archive', count: (c) => c.ARCHIVED, params: { status: 'ARCHIVED' }, tone: 'dark' },
];

const timeAgo = (value) => {
  if (!value) return '-';
  const s = (Date.now() - new Date(value).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`;
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const SeoPagesList = () => {
  const [view, setView] = useState('all');
  const [pageType, setPageType] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [modal, setModal] = useState(null); // { target } single page, or { ids } selected pages, or { queue: true }

  const params = { ...VIEWS.find((v) => v.key === view).params, pageType, serviceId };
  const list = useServerList('/seo-pages/admin-list', { searchParam: 'search', defaultSort: 'updatedAt', defaultOrder: 'DESC', params });
  const counts = list.meta.counts || { total: 0, live: 0, DRAFT: 0, ARCHIVED: 0, generated: 0, pending: 0 };

  const { data: services = [] } = useQuery({
    queryKey: ['services', 'seo-filter'],
    queryFn: async () => {
      const res = await api.get('/services', { params: { limit: 2000, sortBy: 'title', sortOrder: 'ASC' } });
      return res.data?.data || [];
    },
  });

  const generateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.post(`/seo-pages/generate-ai/${id}`, payload),
    onSuccess: (res) => {
      toast.success(res.data.message || 'AI content generated');
      setModal(null);
      list.reload();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'AI engine failed.'),
  });

  const bulkMutation = useMutation({
    mutationFn: (payload) => api.post('/seo-pages/bulk-generate-ai', payload),
    onSuccess: (res) => {
      const d = res.data.data || {};
      toast.success(`AI content written for ${d.processed || 0} of ${d.totalAttempted ?? d.processed ?? 0} page(s).`);
      setModal(null);
      list.reload();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Bulk generation blocked.'),
  });

  const runGeneration = (config) => {
    if (modal?.target) generateMutation.mutate({ id: modal.target.id, payload: config });
    else if (modal?.ids) bulkMutation.mutate({ ...config, ids: modal.ids, limit: modal.ids.length });
    else bulkMutation.mutate(config);
  };

  const setStatus = async (rows, clear, status) => {
    const labels = { PUBLISHED: 'Publish', DRAFT: 'Move to drafts', ARCHIVED: 'Archive' };
    const empty = status === 'PUBLISHED' ? rows.filter((r) => !r.hasContent).length : 0;
    const ok = await confirmDialog({
      title: `${labels[status]} ${rows.length} page${rows.length === 1 ? '' : 's'}?`,
      message: status === 'PUBLISHED'
        ? 'Published pages with content go live on the website.'
        : status === 'DRAFT' ? 'They are taken off the website until published again.' : 'Archived pages are hidden from the website and from the matrix work queue.',
      note: empty ? `${empty} of them have no content yet and will stay as they are.` : undefined,
      tone: status === 'PUBLISHED' ? 'warning' : 'danger',
      confirmText: labels[status],
    });
    if (!ok) return;
    try {
      const res = await api.post('/seo-pages/bulk-status', { ids: rows.map((r) => r.id), status });
      toast.success(res.data.message);
      clear();
      list.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update the pages.');
    }
  };

  const columns = React.useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input type="checkbox" className="grid-checkbox" aria-label="Select all on this page" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />
      ),
      cell: ({ row }) => (
        <input type="checkbox" className="grid-checkbox" aria-label="Select page" checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} />
      ),
      size: 50,
      enableSorting: false,
    },
    {
      accessorKey: 'title',
      header: 'Page',
      cell: ({ row }) => {
        const r = row.original;
        const live = r.status === 'PUBLISHED' && r.hasContent;
        return (
          <div className="sp-page">
            <Link to={`/seo-pages/edit/${r.id}`} className="sp-title">{r.title}</Link>
            {live
              ? <a href={siteUrl(r.slug)} target="_blank" rel="noreferrer" className="sp-slug">/{r.slug} <i className="bi bi-box-arrow-up-right"></i></a>
              : <span className="sp-slug">/{r.slug}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'pageType',
      header: 'Type',
      cell: ({ row }) => {
        const t = TYPES[row.original.pageType];
        if (!t) return <span className="text-muted">{row.original.pageType || '-'}</span>;
        return (
          <div className="sp-type-cell">
            <span className={`sp-type ${t.cls}`}><i className={`bi ${t.icon}`}></i>{t.label}</span>
            {t.target(row.original) && <small>{t.target(row.original)}</small>}
          </div>
        );
      },
    },
    {
      id: 'service',
      header: 'Service',
      enableSorting: false,
      accessorFn: (r) => r.service?.title || '',
      cell: ({ row }) => (row.original.service ? <span className="sp-service" title={row.original.service.title}>{row.original.service.title}</span> : <span className="text-muted small">Independent</span>),
    },
    {
      accessorKey: 'aiGenerationStatus',
      header: 'Content',
      cell: ({ row }) => {
        const r = row.original;
        if (!r.hasContent) return <span className="sp-pill warn"><i className="bi bi-hourglass"></i>No content</span>;
        return (
          <div className="sp-content">
            <span className="sp-pill ok"><i className={`bi ${r.contentSource === 'AI' ? 'bi-robot' : 'bi-pencil'}`}></i>{r.contentSource === 'AI' ? 'AI written' : 'Written'}</span>
            {/* ~16 characters of HTML per word in the AI output */}
            <small>~{Math.max(10, Math.round(r.contentLength / 16 / 10) * 10).toLocaleString('en-IN')} words{r.qualityScore > 0 ? ` · ${r.qualityScore}% quality` : ''}</small>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const r = row.original;
        const live = r.status === 'PUBLISHED' && r.hasContent;
        return (
          <div className="sp-status">
            <span className={`sp-dot ${live ? 'live' : r.status === 'ARCHIVED' ? 'archived' : 'draft'}`}>
              {live ? 'Live' : r.status === 'PUBLISHED' ? 'Published (empty)' : r.status === 'ARCHIVED' ? 'Archived' : 'Draft'}
            </span>
            {r.status === 'PUBLISHED' && !r.indexable && <small title="Search engines are asked not to index this page">noindex</small>}
          </div>
        );
      },
    },
    { accessorKey: 'updatedAt', header: 'Updated', cell: ({ row }) => <span className="small text-muted" title={new Date(row.original.updatedAt).toLocaleString('en-IN')}>{timeAgo(row.original.updatedAt)}</span> },
    {
      id: 'actions',
      header: 'Actions',
      pinned: 'right',
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        const busy = generateMutation.isPending && generateMutation.variables?.id === r.id;
        return (
          <div className="d-flex gap-2">
            <button type="button" onClick={() => setModal({ target: r })} className="btn btn-sm btn-outline-dark" title={r.hasContent ? 'Rewrite content with AI' : 'Write content with AI'} disabled={busy}>
              {busy ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-magic"></i>}
            </button>
            <Link to={`/seo-pages/edit/${r.id}`} className="btn btn-sm btn-outline-primary" title="Edit"><i className="bi bi-pencil"></i></Link>
            {r.status === 'PUBLISHED' && r.hasContent && (
              <a href={siteUrl(r.slug)} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success" title="View on website"><i className="bi bi-box-arrow-up-right"></i></a>
            )}
            <HistoryButton recordId={r.id} title={recordTitle(r)} className="btn btn-sm btn-outline-secondary" />
          </div>
        );
      },
    },
  ], [generateMutation.isPending, generateMutation.variables]);

  const bulkActions = [
    { label: 'Publish', icon: 'bi-globe2', variant: 'success', onClick: (rows, clear) => setStatus(rows, clear, 'PUBLISHED') },
    { label: 'Draft', icon: 'bi-eye-slash', variant: 'light', onClick: (rows, clear) => setStatus(rows, clear, 'DRAFT') },
    { label: 'Archive', icon: 'bi-archive', variant: 'light', onClick: (rows, clear) => setStatus(rows, clear, 'ARCHIVED') },
    {
      label: 'Write with AI',
      icon: 'bi-robot',
      variant: 'dark',
      onClick: (rows, clear) => {
        if (rows.length > 20) {
          toast.info('AI can write up to 20 pages at a time. Select 20 or fewer.');
          return;
        }
        setModal({ ids: rows.map((r) => r.id) });
        clear();
      },
    },
  ];

  const filtersOn = Boolean(pageType || serviceId);

  return (
    <div className="container-fluid p-0 sp-page-wrap">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="mb-1 fw-bold">pSEO Matrix Pages</h4>
          <p className="text-muted mb-0">Landing pages for service × location / industry / technology, and problem pages. Write their content with AI, then publish.</p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" onClick={() => setModal({ queue: true })} disabled={bulkMutation.isPending} className="btn btn-dark rounded-pill px-4 shadow-sm fw-medium" title="Write content for the next drafts that have none">
            {bulkMutation.isPending ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cpu me-2"></i>}
            Process AI Queue
          </button>
          <Link to="/seo-pages/new" className="btn btn-primary rounded-pill px-4 shadow-sm fw-medium">
            <i className="bi bi-diagram-3 me-2"></i> Matrix Generator
          </Link>
        </div>
      </div>

      <div className="sp-views">
        {VIEWS.map((v) => (
          <button key={v.key} type="button" className={`sp-view ${v.tone ? `tone-${v.tone}` : ''}${view === v.key ? ' active' : ''}`} onClick={() => setView(v.key)}>
            <i className={`bi ${v.icon}`}></i>
            <span className="sp-view-num">{Number(v.count(counts) || 0).toLocaleString('en-IN')}</span>
            <span className="sp-view-label">{v.label}</span>
          </button>
        ))}
      </div>

      <div className="sp-filters">
        <select className="form-select form-select-sm" value={pageType} onChange={(e) => setPageType(e.target.value)} aria-label="Page type">
          <option value="">All types</option>
          {Object.entries(TYPES).map(([k, t]) => <option key={k} value={k}>{t.label} pages</option>)}
        </select>
        <div className="sp-service-filter">
          <SearchableSelect
            spaced={false}
            size="sm"
            value={serviceId}
            onChange={setServiceId}
            placeholder="All services"
            emptyLabel="All services"
            searchPlaceholder={`Search ${services.length} services...`}
            options={services.map((s) => ({ value: s.id, label: s.title }))}
          />
        </div>
        {filtersOn && (
          <button type="button" className="btn btn-sm btn-link text-decoration-none" onClick={() => { setPageType(''); setServiceId(''); }}>
            <i className="bi bi-x-circle me-1"></i>Clear filters
          </button>
        )}
        <span className="ms-auto small text-muted">Tick pages to publish, unpublish, archive or write them with AI together.</span>
      </div>

      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-0">
          <DataGrid
            key={`${view}-${pageType}-${serviceId}`}
            {...list.gridProps}
            columns={columns}
            title={VIEWS.find((v) => v.key === view).label}
            deleteUrl="/seo-pages"
            deleteMode="trash"
            itemLabel="SEO page"
            bulkActions={bulkActions}
          />
          {!list.gridProps.isLoading && list.total === 0 && view === 'all' && !filtersOn && (
            <div className="text-center py-5">
              <i className="bi bi-diagram-3 fs-1 text-muted d-block mb-2"></i>
              <p className="text-muted mb-3">No SEO pages yet.</p>
              <Link to="/seo-pages/new" className="btn btn-primary rounded-pill px-4">Open the Matrix Generator</Link>
            </div>
          )}
        </div>
      </div>

      <AiGenerationModal
        show={Boolean(modal)}
        onClose={() => setModal(null)}
        onGenerate={runGeneration}
        isPending={generateMutation.isPending || bulkMutation.isPending}
        targetItem={modal?.target || null}
        selectedCount={modal?.ids?.length || 0}
      />
    </div>
  );
};

export default SeoPagesList;

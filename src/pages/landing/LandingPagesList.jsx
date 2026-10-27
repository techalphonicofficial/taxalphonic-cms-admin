import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import DataGrid from '../../components/datagrid/DataGrid';
import { runBulk } from '../../components/datagrid/bulkStatus';
import useServerList from '../../components/datagrid/useServerList';
import { HistoryButton } from '../../components/datagrid/RecordHistory';
import SearchableSelect from '../../components/common/SearchableSelect';
import { confirmDialog } from '../../components/common/confirm';
import { LandingPageService, apiErrorText, canLanding } from '../../services/landingPage.service';
import './landing.css';

// Landing Pages (/landing-pages): one address each (services.taxalphonic.com/lp/cbdt). Server-side list from
// GET /landing-pages (search on title / URL name, status and service filters, `counts` for the views).

const VIEWS = [
  { key: '', label: 'Active', icon: 'bi-collection', count: (c) => c.all },
  { key: 'published', label: 'Live', icon: 'bi-globe2', count: (c) => c.published, tone: 'success' },
  { key: 'draft', label: 'Drafts', icon: 'bi-pencil-square', count: (c) => c.draft, tone: 'secondary' },
  { key: 'archived', label: 'Archived', icon: 'bi-archive', count: (c) => c.archived, tone: 'dark' },
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

export const StatusPill = ({ row }) => {
  if (row.status === 'archived') return <span className="lp-pill archived"><i className="bi bi-archive"></i>Archived</span>;
  if (row.isLive) {
    return (
      <span className="d-inline-flex flex-column gap-1">
        <span className="lp-pill live"><i className="bi bi-broadcast"></i>Live</span>
        {row.hasUnpublishedChanges && <small className="text-warning-emphasis">Unpublished changes</small>}
      </span>
    );
  }
  return <span className="lp-pill draft"><i className="bi bi-pencil"></i>Draft</span>;
};

const LandingPagesList = () => {
  const [view, setView] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [busy, setBusy] = useState(null);
  const params = useMemo(() => ({ status: view || undefined, serviceId: serviceId || undefined }), [view, serviceId]);
  const list = useServerList('/landing-pages', { searchParam: 'search', defaultSort: 'updatedAt', defaultOrder: 'DESC', params });
  const counts = list.meta.counts || { all: 0, published: 0, draft: 0, archived: 0 };

  const { data: services = [] } = useQuery({ queryKey: ['landing-service-options'], queryFn: LandingPageService.serviceOptions, staleTime: 5 * 60 * 1000 });

  const run = async (row, action) => {
    const steps = {
      publish: { title: `Publish "${row.title}"?`, message: `The current draft goes live at ${row.url}`, confirmText: 'Publish', tone: 'warning', done: 'Published' },
      unpublish: { title: `Unpublish "${row.title}"?`, message: `${row.url} will show "page not found" until it is published again. The draft and versions are kept.`, confirmText: 'Unpublish', tone: 'warning', done: 'Unpublished' },
      archive: { title: `Archive "${row.title}"?`, message: 'It goes offline (if live) and leaves the active list. The URL stays reserved for it; restore it any time.', confirmText: 'Archive', tone: 'danger', done: 'Archived' },
      unarchive: { title: `Restore "${row.title}"?`, message: 'It comes back as a draft (not live until you publish it).', confirmText: 'Restore', tone: 'warning', done: 'Restored as a draft' },
    }[action];
    if (!(await confirmDialog({ title: steps.title, message: steps.message, confirmText: steps.confirmText, tone: steps.tone }))) return;
    setBusy(`${row.id}:${action}`);
    try {
      await LandingPageService[action](row.id);
      toast.success(`${steps.done}: ${row.title}`);
      list.reload();
    } catch (error) {
      toast.error(apiErrorText(error), { autoClose: 9000 });
    } finally {
      setBusy(null);
    }
  };

  const columns = [
    // Row checkboxes for the bulk bar (Publish / Unpublish), only when the user may do either.
    ...(canLanding('publish') || canLanding('unpublish') ? [{
      id: 'select',
      header: ({ table }) => (
        <input type="checkbox" className="grid-checkbox" aria-label="Select all" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />
      ),
      cell: ({ row }) => (
        <input type="checkbox" className="grid-checkbox" aria-label={`Select ${row.original.title}`} checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
      ),
      size: 50,
      enableSorting: false,
    }] : []),
    {
      accessorKey: 'title',
      header: 'Landing page',
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="lp-cell-title">
            <Link to={`/landing-pages/edit/${r.id}`} className="fw-semibold text-decoration-none">{r.title}</Link>
            {r.isLive
              ? <a href={r.url} target="_blank" rel="noreferrer" className="lp-url">{r.url.replace(/^https?:\/\//, '').replace(/\/$/, '')} <i className="bi bi-box-arrow-up-right"></i></a>
              : <span className="lp-url text-muted">{r.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'slug',
      header: 'URL name',
      cell: ({ row }) => <code className="lp-slug">{row.original.slug}</code>,
    },
    {
      id: 'service',
      header: 'Service',
      enableSorting: false,
      accessorFn: (r) => r.service?.title || '',
      cell: ({ row }) => (row.original.service ? <span>{row.original.service.title}</span> : <span className="text-muted small">No service</span>),
    },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusPill row={row.original} /> },
    {
      accessorKey: 'updatedAt',
      header: 'Updated',
      cell: ({ row }) => (
        <span className="d-inline-flex flex-column" title={new Date(row.original.updatedAt).toLocaleString('en-IN')}>
          <span>{timeAgo(row.original.updatedAt)}</span>
          {row.original.updatedByName && <small className="text-muted">by {row.original.updatedByName}</small>}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        const working = (action) => busy === `${r.id}:${action}`;
        const button = (action, icon, title, variant) => (
          <button type="button" className={`btn btn-sm btn-outline-${variant}`} title={title} disabled={Boolean(busy)} onClick={() => run(r, action)}>
            {working(action) ? <span className="spinner-border spinner-border-sm"></span> : <i className={`bi ${icon}`}></i>}
          </button>
        );
        return (
          <div className="d-flex gap-1 justify-content-end">
            <Link to={`/landing-pages/edit/${r.id}`} className="btn btn-sm btn-outline-primary" title="Edit"><i className="bi bi-pencil"></i></Link>
            {r.isLive && <a href={r.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary" title="Open the live page"><i className="bi bi-box-arrow-up-right"></i></a>}
            {r.status !== 'archived' && !r.isLive && canLanding('publish') && button('publish', 'bi-rocket-takeoff', 'Publish', 'success')}
            {r.isLive && canLanding('unpublish') && button('unpublish', 'bi-cloud-slash', 'Unpublish', 'warning')}
            {r.status !== 'archived' && canLanding('archive') && button('archive', 'bi-archive', 'Archive', 'danger')}
            {r.status === 'archived' && canLanding('archive') && button('unarchive', 'bi-arrow-counterclockwise', 'Restore as draft', 'secondary')}
            <HistoryButton recordId={r.id} title={r.title} className="btn btn-sm btn-outline-secondary" />
          </div>
        );
      },
    },
  ];

  // Bulk bar: publish (current draft goes live as a new version, checked like a single publish) or
  // unpublish the selected landing pages, one request each.
  const bulkActions = [
    ...(canLanding('publish') ? [{
      label: 'Publish', icon: 'bi-rocket-takeoff', variant: 'success',
      onClick: async (rows, clear) => {
        const ran = await runBulk(rows, {
          title: (n) => `Publish ${n} landing page${n > 1 ? 's' : ''}?`,
          message: 'Each current draft goes live at its URL as a new version.',
          note: 'Pages that fail the publish checks (e.g. a Form block without a form) are skipped and listed afterwards.',
          confirmText: 'Publish',
          skip: (r) => (r.status === 'archived' ? 'archived (restore it first)' : r.isLive && !r.hasUnpublishedChanges ? 'already live with no changes' : ''),
          run: (r) => LandingPageService.publish(r.id),
          done: 'published',
        });
        if (ran) { clear(); list.reload(); }
      },
    }] : []),
    ...(canLanding('unpublish') ? [{
      label: 'Unpublish', icon: 'bi-cloud-slash', variant: 'light',
      onClick: async (rows, clear) => {
        const ran = await runBulk(rows, {
          title: (n) => `Unpublish ${n} landing page${n > 1 ? 's' : ''}?`,
          message: 'Their URLs show "page not found" until published again. Drafts and versions are kept.',
          confirmText: 'Unpublish',
          tone: 'danger',
          skip: (r) => (!r.isLive ? 'not live' : ''),
          run: (r) => LandingPageService.unpublish(r.id),
          done: 'unpublished',
        });
        if (ran) { clear(); list.reload(); }
      },
    }] : []),
  ];

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="mb-1 fw-bold">Landing Pages</h4>
          <p className="text-muted mb-0">Service landing pages at services.taxalphonic.com/lp/&lt;name&gt;, built with the Page Builder.</p>
        </div>
        {canLanding('create') && (
          <Link to="/landing-pages/new" className="btn btn-primary rounded-pill px-4 shadow-sm fw-medium">
            <i className="bi bi-plus-lg me-2"></i>New Landing Page
          </Link>
        )}
      </div>

      <div className="lp-views">
        {VIEWS.map((v) => (
          <button key={v.key || 'all'} type="button" className={`lp-view ${v.tone ? `tone-${v.tone}` : ''}${view === v.key ? ' active' : ''}`} onClick={() => setView(v.key)}>
            <i className={`bi ${v.icon}`}></i>
            <span className="lp-view-num">{Number(v.count(counts) || 0).toLocaleString('en-IN')}</span>
            <span className="lp-view-label">{v.label}</span>
          </button>
        ))}
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div style={{ minWidth: 260 }}>
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
        {serviceId && (
          <button type="button" className="btn btn-sm btn-link text-decoration-none" onClick={() => setServiceId('')}>
            <i className="bi bi-x-circle me-1"></i>Clear filter
          </button>
        )}
      </div>

      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-0">
          <DataGrid key={`${view}-${serviceId}`} {...list.gridProps} columns={columns} title={VIEWS.find((v) => v.key === view).label} itemLabel="landing page" bulkActions={bulkActions} />
        </div>
      </div>
      {!list.gridProps.isLoading && !list.gridProps.error && list.total === 0 && (
        <div className="text-center text-muted py-4">
          <i className="bi bi-window-stack fs-2 d-block mb-2"></i>
          {view === 'archived' ? 'No archived landing pages.' : 'No landing pages yet. Create one for a service, e.g. CBDT → services.taxalphonic.com/lp/cbdt.'}
        </div>
      )}
    </div>
  );
};

export default LandingPagesList;

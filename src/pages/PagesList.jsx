import React, { useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import DataGrid from '../components/datagrid/DataGrid';
import { StatusBadge, DateCell } from '../components/datagrid/CellRenderers';
import ActionColumn from '../components/datagrid/ActionColumn';
import GridFilterDrawer from '../components/datagrid/GridFilterDrawer';
import api from '../services/api';
import { toast } from 'react-toastify';
import { confirmDelete, confirmDialog } from '../components/common/confirm';
import { canDo, runBulk } from '../components/datagrid/bulkStatus';
import { M } from '../utils/permissions';
import { Dropdown } from 'react-bootstrap';
import { siteUrl } from '../config/siteUrl';
import { JOURNEY_REFERENCE_STAGES, JOURNEY_SLUG_PREFIX, journeyReferencePage } from '../components/page-builder/journeyBlocks';
import { TOOL_REFERENCE, TOOLS_HUB, TOOLS_HUB_SLUG, TOOL_SLUG_PREFIX, toolReferencePage } from '../components/page-builder/toolBlocks';
import PermLink from '../components/common/PermLink';
import { canClonePage, cloneRecord } from '../utils/cloneRecord';

const PagesList = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter state
  const [filterForm, setFilterForm] = useState({ status: '' });
  const [appliedFilters, setAppliedFilters] = useState({});

  const handleApplyFilters = () => {
    const cleanedFilters = Object.fromEntries(
      Object.entries(filterForm).filter(([_, v]) => v !== '')
    );
    setAppliedFilters(cleanedFilters);
  };

  const handleResetFilters = () => {
    setFilterForm({ status: '' });
    setAppliedFilters({});
  };

  const fetchData = useCallback(async (params) => {
    setIsLoading(true);
    setError(null);
    try {
      let finalSortBy = params.sorting?.[0]?.id || 'createdAt';

      const apiParams = {
        page: params.pageIndex + 1,
        limit: params.pageSize,
        sortBy: finalSortBy,
        sortOrder: params.sorting?.[0]?.desc ? 'DESC' : 'ASC',
        ...appliedFilters
      };
      
      if (params.globalFilter) {
        apiParams.title_like = params.globalFilter;
      }
      
      const res = await api.get('/pages', { params: apiParams });
      const resData = res.data;
      
      let items = [];
      let total = 0;
      
      if (Array.isArray(resData)) {
        items = resData;
        total = resData.length;
      } else if (resData && Array.isArray(resData.data)) {
        items = resData.data;
        total = resData.pagination?.totalItems || resData.data.length;
      } else if (resData && resData.data && Array.isArray(resData.data.rows)) {
        items = resData.data.rows;
        total = resData.data.count || resData.data.rows.length;
      } else if (resData && Array.isArray(resData.rows)) {
        items = resData.rows;
        total = resData.count || resData.rows.length;
      }
      
      setData(items);
      setTotalRows(total);
    } catch (err) {
      console.error('Failed to fetch pages:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  const handleDelete = async (row) => {
    if ((await confirmDelete(row.title, { trash: true }))) {
      try {
        await api.delete(`/pages/${row.id}`);
        toast.success('Page deleted successfully.');
        fetchData({ pageIndex: 0, pageSize: 50, sorting: [] });
      } catch (err) {
        console.error('Failed to delete page:', err);
        toast.error('Failed to delete page.');
      }
    }
  };

  // Creates the reference journey stages (journey/idea … journey/revenue) as drafts; existing ones are skipped.
  const [creatingStages, setCreatingStages] = useState(false);
  const createReferenceStages = async () => {
    let existing = [];
    try {
      const res = await api.get('/pages', { params: { slug_like: JOURNEY_SLUG_PREFIX, limit: 100 } });
      existing = (res.data?.data || []).map(p => p.slug);
    } catch {
      toast.error('Could not check the existing journey pages.');
      return;
    }
    const missing = JOURNEY_REFERENCE_STAGES.filter(s => !existing.includes(`${JOURNEY_SLUG_PREFIX}${s.key}`));
    if (!missing.length) {
      toast.info(`All ${JOURNEY_REFERENCE_STAGES.length} reference stages already exist.`);
      return;
    }
    const ok = await confirmDialog({
      title: `Create ${missing.length} journey stage page${missing.length > 1 ? 's' : ''}?`,
      message: 'Each one is created as a Draft with the reference content (Idea → Revenue). Check the texts, then publish them one by one.',
      items: missing.map(s => `${s.number} · ${s.title}  —  /${JOURNEY_SLUG_PREFIX}${s.key}`),
      note: existing.length ? `${JOURNEY_REFERENCE_STAGES.length - missing.length} already exist and are left as they are.` : undefined,
      tone: 'warning',
      confirmText: 'Create drafts',
    });
    if (!ok) return;
    setCreatingStages(true);
    let created = 0;
    const failed = [];
    for (const stage of missing) {
      try {
        await api.post('/pages', journeyReferencePage(stage));
        created += 1;
      } catch (err) {
        failed.push(`${stage.title} (${err.response?.data?.message || err.message})`);
      }
    }
    setCreatingStages(false);
    if (created) toast.success(`Created ${created} journey stage draft${created > 1 ? 's' : ''}.`);
    if (failed.length) toast.error(`Failed: ${failed.join(', ')}`, { autoClose: 10000 });
    fetchData({ pageIndex: 0, pageSize: 50, sorting: [] });
  };

  // Creates the tools hub (/tools) and the reference tool pages (/tool/<key>) as drafts; existing slugs are skipped.
  const [creatingTools, setCreatingTools] = useState(false);
  const createReferenceTools = async () => {
    let existing = [];
    try {
      const res = await api.get('/pages', { params: { slug_like: 'tool', limit: 200 } });
      existing = (res.data?.data || []).map(p => p.slug);
    } catch {
      toast.error('Could not check the existing tool pages.');
      return;
    }
    const all = [TOOLS_HUB, ...TOOL_REFERENCE];
    const slugOf = (t) => (t === TOOLS_HUB ? TOOLS_HUB_SLUG : `${TOOL_SLUG_PREFIX}${t.key}`);
    const missing = all.filter(t => !existing.includes(slugOf(t)));
    if (!missing.length) {
      toast.info('The tools hub and all reference tools already exist.');
      return;
    }
    const ok = await confirmDialog({
      title: `Create ${missing.length} free tool page${missing.length > 1 ? 's' : ''}?`,
      message: 'Each one is created as a Draft with a working calculator, its default rates and the reference texts. Check the rates (e.g. GST and HSN), then publish.',
      items: missing.map(t => `${t === TOOLS_HUB ? '🧰 Tools hub' : `${t.icon} ${t.title}`}  —  /${slugOf(t)}`),
      note: existing.length ? 'Pages that already exist are left as they are.' : undefined,
      tone: 'warning',
      confirmText: 'Create drafts',
    });
    if (!ok) return;
    setCreatingTools(true);
    let created = 0;
    const failed = [];
    for (const tool of missing) {
      try {
        await api.post('/pages', toolReferencePage(tool));
        created += 1;
      } catch (err) {
        failed.push(`${tool.title} (${err.response?.data?.message || err.message})`);
      }
    }
    setCreatingTools(false);
    if (created) toast.success(`Created ${created} free tool draft${created > 1 ? 's' : ''}.`);
    if (failed.length) toast.error(`Failed: ${failed.join(', ')}`, { autoClose: 10000 });
    fetchData({ pageIndex: 0, pageSize: 50, sorting: [] });
  };

  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="grid-checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="grid-checkbox"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      size: 50,
      enableSorting: false,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <span>
          {row.original.title}
          {String(row.original.slug || '').startsWith(JOURNEY_SLUG_PREFIX) && <span className="badge rounded-pill bg-info-subtle text-info-emphasis ms-2">Journey</span>}
          {(String(row.original.slug || '').startsWith(TOOL_SLUG_PREFIX) || row.original.slug === TOOLS_HUB_SLUG) && <span className="badge rounded-pill bg-success-subtle text-success-emphasis ms-2">{row.original.slug === TOOLS_HUB_SLUG ? 'Tools hub' : 'Tool'}</span>}
          {row.original.slug === 'home' && <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis ms-2">Homepage</span>}
        </span>
      ),
      size: 250,
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: info => <span className="text-muted">/{info.getValue()}</span>,
      size: 200,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue()} />,
      size: 150,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Modified',
      cell: info => <DateCell date={info.getValue()} />,
      size: 200,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const page = row.original;
        const live = page.status === 'published';
        const url = siteUrl(page.slug === 'home' ? '' : page.slug);
        return (
          <div className="d-flex align-items-center justify-content-end gap-1">
            {/* Opens the page on the website (VITE_SITE_URL); only published pages are visible there. */}
            <a
              href={live ? url : undefined}
              target="_blank"
              rel="noreferrer"
              className={`btn btn-sm ${live ? 'text-success' : 'text-muted opacity-50'}`}
              style={live ? undefined : { cursor: 'not-allowed' }}
              title={live ? `View on website: ${url}` : `Not on the website yet (${page.status}). Publish it to view it.`}
              onClick={(e) => { e.stopPropagation(); if (!live) e.preventDefault(); }}
              aria-disabled={!live}
            >
              <i className="bi bi-box-arrow-up-right"></i>
            </a>
            <ActionColumn
              row={page}
              onEdit={(r) => navigate(`/pages/edit/${r.id}`)}
              onDuplicate={canClonePage(page) ? (r) => cloneRecord('page', r, navigate) : undefined}
              onDelete={handleDelete}
            />
          </div>
        );
      },
      size: 185,
      enableSorting: false,
      pinned: 'right', // Handled custom in our CSS
    }
  ], [navigate]);

  // Bulk bar: publish / move to draft the selected pages (PUT /pages/:id { status }).
  const bulkActions = !canDo('update', M.pages) ? [] : ['published', 'draft'].map((status) => {
    const publish = status === 'published';
    return {
      label: publish ? 'Publish' : 'Move to draft',
      icon: publish ? 'bi-globe2' : 'bi-eye-slash',
      variant: publish ? 'success' : 'light',
      onClick: async (rows, clear) => {
        const ran = await runBulk(rows, {
          title: (n) => `${publish ? 'Publish' : 'Move to draft'} ${n} page${n > 1 ? 's' : ''}?`,
          message: publish ? 'They go live on the website at their own URLs.' : 'They are taken off the website (the content is kept).',
          confirmText: publish ? 'Publish' : 'Move to draft',
          tone: publish ? 'warning' : 'danger',
          skip: (r) => (r.status === status ? `already ${status}` : ''),
          run: (r) => api.put(`/pages/${r.id}`, { status }),
          done: publish ? 'published' : 'moved to draft',
        });
        if (ran) { clear(); fetchData({ pageIndex: 0, pageSize: 50, sorting: [] }); }
      },
    };
  });

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <Breadcrumb items={[{ label: 'Pages' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Pages</h2>
        </div>
        
        <div className="d-flex gap-2">
          <PermLink to="/trash?module=pages" className="btn btn-sm btn-light border d-inline-flex align-items-center fw-semibold" title="Deleted pages (restore)">
            <i className="bi bi-trash3 me-2"></i> Trash
          </PermLink>
          <PermLink to="/pages/home" className="btn btn-sm btn-light border d-inline-flex align-items-center fw-semibold">
            <i className="bi bi-house-door me-2"></i> Home Page Builder
          </PermLink>
          {/* Journey stages and free tools create pages: only with create permission. */}
          {canDo('create', M.pages) && (<>
          <Dropdown align="end">
            <Dropdown.Toggle as="button" type="button" className="btn btn-sm btn-light border d-inline-flex align-items-center fw-semibold h-100" disabled={creatingStages}>
              {creatingStages ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-signpost-split me-2"></i>}
              Journey Stages
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow-sm" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <Dropdown.Item as={Link} to="/pages/new?template=journey"><i className="bi bi-plus-circle me-2"></i>New Journey Stage (template)</Dropdown.Item>
              <Dropdown.Item as="button" type="button" onClick={createReferenceStages}>
                <i className="bi bi-magic me-2"></i>Create the {JOURNEY_REFERENCE_STAGES.length} reference stages (drafts)
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Header>New stage from a reference stage</Dropdown.Header>
              {JOURNEY_REFERENCE_STAGES.map(s => (
                <Dropdown.Item key={s.key} as={Link} to={`/pages/new?template=journey&stage=${s.key}`}>{s.icon} {s.number} · {s.title}</Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <Dropdown align="end">
            <Dropdown.Toggle as="button" type="button" className="btn btn-sm btn-light border d-inline-flex align-items-center fw-semibold h-100" disabled={creatingTools}>
              {creatingTools ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-calculator me-2"></i>}
              Free Tools
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow-sm" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <Dropdown.Item as={Link} to="/pages/new?template=tool"><i className="bi bi-plus-circle me-2"></i>New tool page (template)</Dropdown.Item>
              <Dropdown.Item as={Link} to="/pages/new?template=tool&tool=hub"><i className="bi bi-grid-3x3-gap me-2"></i>New tools hub (/tools)</Dropdown.Item>
              <Dropdown.Item as="button" type="button" onClick={createReferenceTools}>
                <i className="bi bi-magic me-2"></i>Create the hub + {TOOL_REFERENCE.length} tools (drafts)
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Header>New tool page from</Dropdown.Header>
              {TOOL_REFERENCE.map(t => (
                <Dropdown.Item key={t.key} as={Link} to={`/pages/new?template=tool&tool=${t.key}`}>{t.icon} {t.title}</Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          </>)}
          <PermLink to="/pages/new" className="premium-btn-primary">
            <i className="bi bi-plus-lg me-2"></i> Add Page
          </PermLink>
        </div>
      </div>

      <DataGrid 
        deleteUrl="/pages"
        deleteMode="trash"
        itemLabel="page"
        bulkActions={bulkActions}
        columns={columns}
        data={data}
        totalRows={totalRows}
        pageCount={Math.ceil(totalRows / 50)} 
        fetchData={fetchData}
        isLoading={isLoading}
        error={error}
        title="All Pages"
      />

      <GridFilterDrawer 
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      >
        <div className="mb-4">
          <label className="form-label fw-medium text-muted small text-uppercase">Status</label>
          <select 
            className="form-select"
            value={filterForm.status}
            onChange={(e) => setFilterForm(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </GridFilterDrawer>
    </div>
  );
};

export default PagesList;

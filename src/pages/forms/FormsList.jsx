import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import DataGrid from '../../components/datagrid/DataGrid';
import { StatusBadge, DateCell } from '../../components/datagrid/CellRenderers';
import ActionColumn from '../../components/datagrid/ActionColumn';
import GridFilterDrawer from '../../components/datagrid/GridFilterDrawer';
import FormPreview from '../../components/forms/FormPreview';
import FormPreviewModal from '../../components/forms/FormPreviewModal';
import { FormService } from '../../services/form.service';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { confirmDialog, confirmDelete } from '../../components/common/confirm';
import PermLink from '../../components/common/PermLink';

const PAGE_SIZE = 50;
const VIEW_KEY = 'formsListView';

const readView = () => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'cards' ? 'cards' : 'table';
  } catch {
    return 'table';
  }
};

// Gallery of every form rendered the way the website shows it
const FormCards = ({ reloadKey, onPreview, onDuplicate, onDelete }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data: forms = [], isLoading, isError } = useQuery({
    queryKey: ['forms', 'cards', search, status, reloadKey],
    queryFn: async () => (await FormService.getAll({ limit: 200, search: search || undefined, status: status || undefined })).data || [],
  });

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-md-row gap-2 justify-content-between align-items-md-center mb-4">
          <h5 className="fw-bold mb-0">All Forms</h5>
          <div className="d-flex gap-2">
            <div className="position-relative">
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
              <input type="search" className="form-control ps-5" placeholder="Search forms..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: 150 }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {isLoading && <div className="text-center text-muted py-5"><span className="spinner-border spinner-border-sm me-2"></span>Loading forms...</div>}
        {isError && <div className="alert alert-danger mb-0">Could not load forms.</div>}
        {!isLoading && !isError && forms.length === 0 && (
          <div className="text-center py-5 text-muted border border-dashed rounded">
            <i className="bi bi-ui-checks display-5"></i>
            <p className="mt-3 mb-3">{search || status ? 'No forms match your filters.' : 'No forms yet.'}</p>
            <PermLink to="/forms/new" className="premium-btn-primary"><i className="bi bi-plus-lg me-2"></i> Create Form</PermLink>
          </div>
        )}

        <div className="row g-4">
          {forms.map(form => (
            <div className="col-md-6 col-xxl-4" key={form.id}>
              <div className="card h-100 border shadow-sm rounded-4 overflow-hidden">
                <div className="card-header bg-transparent d-flex justify-content-between align-items-start gap-2 py-3">
                  <div style={{ minWidth: 0 }}>
                    <PermLink asText to={`/forms/edit/${form.id}`} className="fw-bold text-decoration-none d-block text-truncate">{form.name}</PermLink>
                    <code className="small text-muted">{form.slug}</code>
                  </div>
                  <StatusBadge status={form.status} />
                </div>
                {/* Scaled-down, non-interactive preview; click opens the full preview */}
                <div
                  role="button"
                  tabIndex={0}
                  className="card-body position-relative bg-body-tertiary"
                  style={{ height: 260, overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => onPreview(form)}
                  onKeyDown={e => { if (e.key === 'Enter') onPreview(form); }}
                  title="Open preview"
                >
                  <div style={{ pointerEvents: 'none', fontSize: '0.85rem' }}>
                    <FormPreview form={form} compact />
                  </div>
                  <div className="position-absolute bottom-0 start-0 end-0" style={{ height: 70, background: 'linear-gradient(transparent, var(--bs-tertiary-bg))' }}></div>
                </div>
                <div className="card-footer bg-transparent d-flex align-items-center gap-3 py-2 small">
                  <span className="text-muted"><i className="bi bi-list-ul me-1"></i>{(form.fields || []).length} fields</span>
                  <Link to={`/crm/leads?formId=${form.id}`} className="text-decoration-none"><i className="bi bi-inbox me-1"></i>{form.submissionCount || 0} leads</Link>
                  <div className="ms-auto d-flex gap-1">
                    <button type="button" className="btn btn-sm btn-light" title="Preview" onClick={() => onPreview(form)}><i className="bi bi-eye"></i></button>
                    <PermLink to={`/forms/edit/${form.id}`} className="btn btn-sm btn-light" title="Edit"><i className="bi bi-pencil"></i></PermLink>
                    <button type="button" className="btn btn-sm btn-light" title="Duplicate" onClick={() => onDuplicate(form)}><i className="bi bi-files"></i></button>
                    <button type="button" className="btn btn-sm btn-light text-danger" title="Delete" onClick={() => onDelete(form)}><i className="bi bi-trash"></i></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FormsList = () => {
  const navigate = useNavigate();
  const [view, setView] = useState(readView);
  const [previewForm, setPreviewForm] = useState(null);

  const changeView = (next) => {
    setView(next);
    try { localStorage.setItem(VIEW_KEY, next); } catch { /* storage unavailable */ }
  };

  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Filter state
  const [filterForm, setFilterForm] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});

  const handleApplyFilters = () => {
    const cleanedFilters = Object.fromEntries(
      Object.entries(filterForm).filter(([_, v]) => v !== '')
    );
    setAppliedFilters(cleanedFilters);
  };

  const handleResetFilters = () => {
    setFilterForm({});
    setAppliedFilters({});
  };

  const fetchData = React.useCallback(async (params) => {
    setIsLoading(true);
    setError(null);
    try {
      const apiParams = {
        page: params.pageIndex + 1,
        limit: params.pageSize,
        sortBy: params.sorting?.[0]?.id || 'createdAt',
        sortOrder: params.sorting?.[0]?.desc === false ? 'ASC' : 'DESC',
        ...appliedFilters
      };
      if (params.globalFilter) {
        apiParams.search = params.globalFilter;
      }

      const res = await FormService.getAll(apiParams);
      setData(res.data || []);
      setTotalRows(res.pagination?.totalItems || (res.data || []).length);
    } catch (err) {
      console.error('Failed to fetch forms:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
    // reloadKey forces a refetch after duplicate/delete
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, reloadKey]);

  const handleDuplicate = React.useCallback(async (row) => {
    try {
      const res = await FormService.duplicate(row.id);
      toast.success(`Form duplicated as "${res.data?.name}" (inactive).`);
      setReloadKey(k => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to duplicate form.');
    }
  }, []);

  const handleDelete = React.useCallback(async (row) => {
    if (!(await confirmDelete(row.name, { trash: true, extra: 'Existing leads from this form are kept.' }))) return;
    try {
      await FormService.delete(row.id);
      toast.success('Form deleted successfully.');
      setReloadKey(k => k + 1);
    } catch (err) {
      const res = err.response?.data;
      if (err.response?.status === 409) {
        // Form is attached to pages/services/blogs
        if ((await confirmDialog({ title: 'This form is in use', message: res.message, note: 'Delete anyway? The form block will stop rendering on those pages.', tone: 'warning', confirmText: 'Delete anyway' }))) {
          try {
            await FormService.delete(row.id, true);
            toast.success('Form deleted successfully.');
            setReloadKey(k => k + 1);
          } catch (forceErr) {
            toast.error(forceErr.response?.data?.message || 'Failed to delete form.');
          }
        }
        return;
      }
      toast.error(res?.message || 'Failed to delete form.');
    }
  }, []);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Form Name',
      cell: ({ row }) => (
        <div>
          <PermLink asText to={`/forms/edit/${row.original.id}`} className="fw-semibold text-decoration-none">{row.original.name}</PermLink>
          {row.original.description && <div className="text-muted small text-truncate" style={{ maxWidth: 320 }}>{row.original.description}</div>}
        </div>
      ),
      size: 300,
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: info => <code className="text-muted">{info.getValue()}</code>,
      size: 200,
    },
    {
      id: 'fieldsCount',
      header: 'Fields',
      cell: ({ row }) => <span className="badge bg-light text-dark border">{(row.original.fields || []).length}</span>,
      size: 90,
      enableSorting: false,
    },
    {
      accessorKey: 'submissionCount',
      header: 'Submissions',
      cell: ({ row }) => (
        <Link to={`/crm/leads?formId=${row.original.id}`} className="text-decoration-none" title="View leads from this form">
          <i className="bi bi-inbox me-1"></i>{row.original.submissionCount || 0}
        </Link>
      ),
      size: 130,
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue()} />,
      size: 120,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: info => <DateCell date={info.getValue()} />,
      size: 180,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <ActionColumn
          row={row.original}
          onView={setPreviewForm}
          onEdit={(r) => navigate(`/forms/edit/${r.id}`)}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      ),
      size: 150,
      enableSorting: false,
      pinned: 'right',
    }
  ], [navigate, handleDuplicate, handleDelete]);

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <Breadcrumb items={[{ label: 'Services', link: '/services' }, { label: 'Forms' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Forms</h2>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <div className="btn-group" role="group" aria-label="View">
            <button type="button" className={`btn btn-sm ${view === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => changeView('table')} title="Table view">
              <i className="bi bi-list-ul"></i>
            </button>
            <button type="button" className={`btn btn-sm ${view === 'cards' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => changeView('cards')} title="Preview cards">
              <i className="bi bi-grid-3x2-gap"></i>
            </button>
          </div>
          <PermLink to="/forms/new" className="premium-btn-primary">
            <i className="bi bi-plus-lg me-2"></i> Create Form
          </PermLink>
        </div>
      </div>

      <FormPreviewModal form={previewForm} show={Boolean(previewForm)} onHide={() => setPreviewForm(null)} />

      {view === 'cards' ? (
        <FormCards reloadKey={reloadKey} onPreview={setPreviewForm} onDuplicate={handleDuplicate} onDelete={handleDelete} />
      ) : (
      <DataGrid
        columns={columns}
        data={data}
        totalRows={totalRows}
        pageCount={Math.ceil(totalRows / PAGE_SIZE)}
        fetchData={fetchData}
        isLoading={isLoading}
        error={error}
        title="All Forms"
      />
      )}

      <GridFilterDrawer
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      >
        <div className="mb-4">
          <label className="form-label fw-medium text-muted small text-uppercase">Status</label>
          <select
            className="form-select"
            value={filterForm.status || ''}
            onChange={(e) => setFilterForm(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </GridFilterDrawer>
    </div>
  );
};

export default FormsList;

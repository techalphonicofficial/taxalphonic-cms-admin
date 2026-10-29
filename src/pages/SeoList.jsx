import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import DataGrid from '../components/datagrid/DataGrid';
import { StatusBadge, DateCell } from '../components/datagrid/CellRenderers';
import ActionColumn from '../components/datagrid/ActionColumn';
import GridFilterDrawer from '../components/datagrid/GridFilterDrawer';
import api from '../services/api';
import { toast } from 'react-toastify';
import { confirmDelete } from '../components/common/confirm';
import PermLink from '../components/common/PermLink';

// What each config is for (SeoForm "Apply to"). Rows without a type predate page picking and
// are ignored by the website until edited.
const TARGET_BADGES = {
  service: { label: 'Service', className: 'bg-primary-subtle text-primary-emphasis border' },
  page: { label: 'CMS Page', className: 'bg-info-subtle text-info-emphasis border' },
  seo_page: { label: 'pSEO', className: 'bg-success-subtle text-success-emphasis border' },
  landing: { label: 'Landing', className: 'bg-warning-subtle text-warning-emphasis border' },
  static: { label: 'Website', className: 'bg-secondary-subtle text-secondary-emphasis border' },
  custom: { label: 'Custom URL', className: 'bg-light text-dark border' },
};

const SeoList = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
        apiParams.route_like = params.globalFilter;
      }

      const res = await api.get('/seo', { params: apiParams });
      const resData = res.data;

      let items = [];
      let total = 0;

      if (Array.isArray(resData)) {
        items = resData;
        total = resData.length;
      } else if (resData && Array.isArray(resData.data)) {
        items = resData.data;
        total = resData.pagination?.totalItems || resData.data.length;
      }

      setData(items);
      setTotalRows(total);
    } catch (err) {
      console.error('Failed to fetch SEO config:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  const handleDelete = async (row) => {
    if ((await confirmDelete(row.targetLabel || row.route, { trash: true }))) {
      try {
        await api.delete(`/seo/${row.id}`);
        toast.success('SEO configuration deleted successfully.');
        fetchData({ pageIndex: 0, pageSize: 50, sorting: [] });
      } catch (err) {
        console.error('Failed to delete SEO:', err);
        toast.error('Failed to delete SEO configuration.');
      }
    }
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
      accessorKey: 'route',
      header: 'Page',
      size: 300,
      cell: ({ row }) => {
        const r = row.original;
        const type = TARGET_BADGES[r.targetType];
        return (
          <div style={{ minWidth: 0 }}>
            <div className="d-flex align-items-center gap-2">
              {type
                ? <span className={`badge ${type.className}`}>{type.label}</span>
                : <span className="badge bg-danger-subtle text-danger-emphasis border" title="Not used by the website. Edit it and choose the page it is for.">Not linked</span>}
              <span className="fw-semibold text-truncate d-inline-block" style={{ maxWidth: 200 }}>{r.targetLabel || r.route}</span>
            </div>
            <span className="small text-muted font-monospace">{r.route}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'metaTitle',
      header: 'Meta Title',
      size: 250,
      cell: info => <span className="fw-medium text-truncate d-inline-block" style={{ maxWidth: '230px' }}>{info.getValue() || '-'}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue()} />,
      size: 120,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created On',
      cell: info => <DateCell date={info.getValue()} />,
      size: 150,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <ActionColumn
          row={row.original}
          onEdit={(r) => navigate(`/cms/seo/edit/${r.id}`)}
          onDelete={handleDelete}
        />
      ),
      size: 120,
      enableSorting: false,
      pinned: 'right',
    }
  ], [navigate]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <Breadcrumb items={[{ label: 'SEO Management' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>SEO Configs</h2>
        </div>

        <div className="d-flex gap-2">
          <PermLink to="/cms/seo/new" className="premium-btn-primary">
            <i className="bi bi-plus-lg me-2"></i> Add SEO Config
          </PermLink>
        </div>
      </div>

      <DataGrid
        deleteUrl="/seo"
        deleteMode="trash"
        itemLabel="SEO config"
        columns={columns}
        data={data}
        totalRows={totalRows}
        pageCount={Math.ceil(totalRows / 50)}
        fetchData={fetchData}
        isLoading={isLoading}
        error={error}
        title="All Routes"
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </GridFilterDrawer>
    </div>
  );
};

export default SeoList;

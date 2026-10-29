import React, { useMemo, useState } from 'react';
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

const BranchesList = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filterForm, setFilterForm] = useState({ status: '', city: '' });
  const [appliedFilters, setAppliedFilters] = useState({});

  const handleApplyFilters = () => {
    const cleaned = Object.fromEntries(Object.entries(filterForm).filter(([_, v]) => v !== ''));
    setAppliedFilters(cleaned);
  };

  const handleResetFilters = () => {
    setFilterForm({ status: '', city: '' });
    setAppliedFilters({});
  };

  const fetchData = React.useCallback(async (params) => {
    setIsLoading(true);
    setError(null);
    try {
      const apiParams = {
        page: params.pageIndex + 1,
        limit: params.pageSize,
        sortBy: params.sorting?.[0]?.id || 'displayOrder',
        sortOrder: params.sorting?.[0]?.desc ? 'DESC' : 'ASC',
        ...appliedFilters,
      };
      if (params.globalFilter) apiParams.name_like = params.globalFilter;

      const res = await api.get('/branches', { params: apiParams });
      const resData = res.data;

      let items = [], total = 0;
      if (Array.isArray(resData)) {
        // plain array
        items = resData; total = resData.length;
      } else if (resData?.data?.data && Array.isArray(resData.data.data)) {
        // successResponse wraps: { data: { data: [...], pagination: {} } }
        items = resData.data.data;
        total = resData.data.pagination?.totalItems || items.length;
      } else if (resData?.data && Array.isArray(resData.data)) {
        // flat: { data: [...] }
        items = resData.data;
        total = resData.pagination?.totalItems || items.length;
      }

      setData(items);
      setTotalRows(total);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  const handleDelete = React.useCallback(async (row) => {
    if ((await confirmDelete(row.name, { what: 'branch' }))) {
      try {
        await api.delete(`/branches/${row.id}`);
        toast.success('Branch deleted successfully.');
        fetchData({ pageIndex: 0, pageSize: 50, sorting: [] });
      } catch (err) {
        toast.error('Failed to delete branch.');
      }
    }
  }, [fetchData]);

  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input type="checkbox" className="grid-checkbox" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />
      ),
      cell: ({ row }) => (
        <input type="checkbox" className="grid-checkbox" checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} />
      ),
      size: 50, enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Branch Name',
      cell: info => (
        <div>
          <div className="fw-semibold">{info.getValue()}</div>
          {info.row.original.code && <div className="text-muted small">Code: {info.row.original.code}</div>}
          {info.row.original.isHeadOffice && <span className="badge bg-warning text-dark mt-1">Head Office</span>}
        </div>
      ),
      size: 220,
    },
    {
      accessorKey: 'city',
      header: 'Location',
      cell: info => {
        const { city, state, country } = info.row.original;
        const parts = [city, state, country].filter(Boolean);
        return parts.length ? parts.join(', ') : <span className="text-muted">—</span>;
      },
      size: 200,
    },
    {
      accessorKey: 'phone',
      header: 'Contact',
      cell: info => (
        <div>
          {info.getValue() && <div><i className="bi bi-telephone me-1 text-muted"></i>{info.getValue()}</div>}
          {info.row.original.email && <div className="text-muted small"><i className="bi bi-envelope me-1"></i>{info.row.original.email}</div>}
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: 'managerName',
      header: 'Manager',
      cell: info => info.getValue() || <span className="text-muted">—</span>,
      size: 150,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => {
        const s = info.getValue();
        const map = { active: 'published', inactive: 'draft', coming_soon: 'archived' };
        return <StatusBadge status={map[s] || s} label={s === 'coming_soon' ? 'Coming Soon' : s?.charAt(0).toUpperCase() + s?.slice(1)} />;
      },
      size: 140,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <ActionColumn
          row={row.original}
          onEdit={(r) => navigate(`/cms/branches/edit/${r.id}`)}
          onDelete={handleDelete}
        />
      ),
      size: 120, enableSorting: false, pinned: 'right',
    }
  ], [navigate, handleDelete]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <Breadcrumb items={[{ label: 'Branches' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Branches</h2>
        </div>
        <div className="d-flex gap-2">
          <PermLink to="/cms/branches/new" className="premium-btn-primary">
            <i className="bi bi-plus-lg me-2"></i> Add Branch
          </PermLink>
        </div>
      </div>

      <DataGrid
        deleteUrl="/branches"
        deleteMode="permanent"
        itemLabel="branch"
        columns={columns}
        data={data}
        totalRows={totalRows}
        pageCount={Math.ceil(totalRows / 50)}
        fetchData={fetchData}
        isLoading={isLoading}
        error={error}
        title="All Branches"
      />

      <GridFilterDrawer onApplyFilters={handleApplyFilters} onResetFilters={handleResetFilters}>
        <div className="mb-4">
          <label className="form-label fw-medium text-muted small text-uppercase">Status</label>
          <select className="form-select" value={filterForm.status} onChange={(e) => setFilterForm(p => ({ ...p, status: e.target.value }))}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="coming_soon">Coming Soon</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="form-label fw-medium text-muted small text-uppercase">City</label>
          <input type="text" className="form-control" placeholder="Filter by city..." value={filterForm.city} onChange={(e) => setFilterForm(p => ({ ...p, city: e.target.value }))} />
        </div>
      </GridFilterDrawer>
    </div>
  );
};

export default BranchesList;

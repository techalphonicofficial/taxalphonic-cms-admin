import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import DataGrid from '../components/datagrid/DataGrid';
import { StatusBadge, DateCell } from '../components/datagrid/CellRenderers';
import ActionColumn from '../components/datagrid/ActionColumn';
import GridFilterDrawer from '../components/datagrid/GridFilterDrawer';
import api from '../services/api';
import { toast } from 'react-toastify';
import { AuthService } from '../services/auth.service';
import { confirmDelete } from '../components/common/confirm';

const ServicesList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize filters from URL if available
  const initialCategory = searchParams.get('category') || '';
  const initialStatus = searchParams.get('status') || '';

  const [filterForm, setFilterForm] = useState({ 
    status: initialStatus,
    categoryId: initialCategory
  });
  
  const initialApplied = {};
  if (initialStatus) initialApplied.status = initialStatus;
  if (initialCategory) initialApplied.categoryId = initialCategory;
  
  const [appliedFilters, setAppliedFilters] = useState(initialApplied);

  // Sync state when URL params change (e.g. clicking a link in sidebar)
  useEffect(() => {
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    
    setFilterForm(prev => ({
      ...prev,
      categoryId: category,
      status: status
    }));
    
    setAppliedFilters(prev => {
      const updated = { ...prev };
      if (category) updated.categoryId = category;
      else delete updated.categoryId;
      
      if (status) updated.status = status;
      else delete updated.status;
      
      return updated;
    });
  }, [searchParams]);

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

  const fetchData = React.useCallback(async (params) => {
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

      // By default, exclude "old service data" category unless explicitly requested
      if (!appliedFilters.categoryId) {
        apiParams.categoryId_ne = 'fd630088-6d13-47eb-a5b9-9de555ec5e82';
      }
      
      if (params.globalFilter) {
        apiParams.title_like = params.globalFilter;
      }
      
      const res = await api.get('/services', { params: apiParams });
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
      console.error('Failed to fetch services:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  const handleDelete = React.useCallback(async (row) => {
    if ((await confirmDelete(row.title, { trash: true }))) {
      try {
        await api.delete(`/services/${row.id}`);
        toast.success('Service deleted successfully.');
        fetchData({ pageIndex: 0, pageSize: 50, sorting: [] });
      } catch (err) {
        console.error('Failed to delete service:', err);
        toast.error('Failed to delete service.');
      }
    }
  }, [fetchData]);

  const columns = useMemo(() => {
    const user = AuthService.getCurrentUser();
    const isAdmin = user?.role?.name === 'Admin';
    const perms = user?.role?.permissions || [];
    const canUpdate = isAdmin || perms.some(p => p.module === 'Services' && p.action === 'update');
    const canDelete = isAdmin || perms.some(p => p.module === 'Services' && p.action === 'delete');

    return [
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
        accessorKey: 'createdAt',
        header: 'Created At',
        cell: info => <DateCell date={info.getValue()} />,
        size: 200,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <ActionColumn
            row={row.original}
            onEdit={canUpdate ? (r) => navigate(`/services/edit/${r.id}`) : undefined}
            onDelete={canDelete ? handleDelete : undefined}
          />
        ),
        size: 120,
        enableSorting: false,
        pinned: 'right', // Custom handled
      }
    ];
  }, [navigate, handleDelete]);

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <Breadcrumb items={[{ label: 'Services' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Services</h2>
        </div>
        
        <div className="d-flex gap-2">
          <Link to="/trash?module=services" className="btn btn-sm btn-light border d-inline-flex align-items-center fw-semibold" title="Deleted services (restore)">
            <i className="bi bi-trash3 me-2"></i> Trash
          </Link>
          {(AuthService.getCurrentUser()?.role?.name === 'Admin' || AuthService.getCurrentUser()?.role?.permissions?.some(p => p.module === 'Services' && p.action === 'create')) && (
            <Link to="/services/new" className="premium-btn-primary">
              <i className="bi bi-plus-lg me-2"></i> Add Service
            </Link>
          )}
        </div>
      </div>

      <DataGrid 
        columns={columns}
        data={data}
        totalRows={totalRows}
        pageCount={Math.ceil(totalRows / 50)} 
        fetchData={fetchData}
        isLoading={isLoading}
        error={error}
        title="All Services"
        deleteUrl={AuthService.getCurrentUser()?.role?.name === 'Admin' || AuthService.getCurrentUser()?.role?.permissions?.some(p => p.module === 'Services' && p.action === 'delete') ? '/services' : undefined}
        deleteMode="trash"
        itemLabel="service"
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

export default ServicesList;

import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import DataGrid from '../components/datagrid/DataGrid';
import { StatusBadge, DateCell } from '../components/datagrid/CellRenderers';
import ActionColumn from '../components/datagrid/ActionColumn';
import GridFilterDrawer from '../components/datagrid/GridFilterDrawer';
import { ServiceCategoryService } from '../services/serviceCategory.service';
import { confirmDelete } from '../components/common/confirm';
import PermLink from '../components/common/PermLink';

const ServiceCategoriesList = () => {
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

  const fetchData = React.useCallback(async (params) => {
    setIsLoading(true);
    setError(null);
    try {
      // mapping TanStack pagination/sorting to our backend API params
      // Map frontend column IDs to backend database columns
      let finalSortBy = params.sorting?.[0]?.id || 'createdAt';
      if (finalSortBy === 'parent') finalSortBy = 'parentId';

      const apiParams = {
        page: params.pageIndex + 1,
        limit: params.pageSize,
        sortBy: finalSortBy,
        sortOrder: params.sorting?.[0]?.desc ? 'DESC' : 'ASC',
        ...appliedFilters
      };
      
      if (params.globalFilter) {
        apiParams.name_like = params.globalFilter;
      }
      
      const res = await ServiceCategoryService.getAll(apiParams);
      setData(res.data);
      setTotalRows(res.pagination?.totalItems || res.data.length);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  const handleDelete = async (row) => {
    if ((await confirmDelete(row.name, { trash: true, extra: 'Child categories will lose their parent association.' }))) {
      try {
        await ServiceCategoryService.delete(row.id);
        // trigger re-fetch by tricking state or re-calling fetchData
        // In a real app with React Query, we'd invalidate the query here.
        fetchData({ pageIndex: 0, pageSize: 50, sorting: [] });
      } catch (error) {
        console.error('Failed to delete category:', error);
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
      accessorKey: 'name',
      header: 'Name',
      size: 250,
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: info => <span className="text-muted">/{info.getValue()}</span>,
      size: 200,
    },
    {
      accessorKey: 'parent',
      header: 'Parent Category',
      cell: info => info.getValue()?.name ? <span className="badge bg-info">{info.getValue().name}</span> : <span className="text-muted">-</span>,
      size: 200,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue()} />,
      size: 150,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <ActionColumn
          row={row.original}
          onEdit={(r) => navigate(`/service-categories/edit/${r.id}`)}
          onDelete={handleDelete}
        />
      ),
      size: 120,
      enableSorting: false,
      pinned: 'right', // Custom handled
    }
  ], [navigate, handleDelete]);

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <Breadcrumb items={[{ label: 'Service Categories' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Service Categories</h2>
        </div>
        
        <div className="d-flex gap-2">
          <PermLink to="/service-categories/new" className="premium-btn-primary">
            <i className="bi bi-plus-lg me-2"></i> Add Category
          </PermLink>
        </div>
      </div>

      <DataGrid 
        deleteUrl="/service-categories"
        deleteMode="trash"
        itemLabel="category"
        columns={columns}
        data={data}
        totalRows={totalRows}
        pageCount={Math.ceil(totalRows / 50)} // dynamic based on page size ideally
        fetchData={fetchData}
        isLoading={isLoading}
        error={error}
        title="All Categories"
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

export default ServiceCategoriesList;

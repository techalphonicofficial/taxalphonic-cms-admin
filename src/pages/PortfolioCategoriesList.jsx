import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import DataGrid from '../components/datagrid/DataGrid';
import { StatusBadge, DateCell } from '../components/datagrid/CellRenderers';
import ActionColumn from '../components/datagrid/ActionColumn';
import GridFilterDrawer from '../components/datagrid/GridFilterDrawer';
import { PortfolioCategoryService } from '../services/portfolioCategory.service';
import { confirmDelete } from '../components/common/confirm';

const PortfolioCategoriesList = () => {
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
      
      const res = await PortfolioCategoryService.getAll(apiParams);
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
    if ((await confirmDelete(row.name, { what: 'category' }))) {
      try {
        await PortfolioCategoryService.delete(row.id);
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
          onEdit={(r) => navigate(`/portfolio-categories/edit/${r.id}`)}
          onDelete={handleDelete}
        />
      ),
      size: 120,
      enableSorting: false,
      pinned: 'right',
    }
  ], [navigate, handleDelete]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <Breadcrumb items={[{ label: 'Portfolio Categories' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Portfolio Categories</h2>
        </div>
        
        <div className="d-flex gap-2">
          <Link to="/portfolio-categories/new" className="premium-btn-primary">
            <i className="bi bi-plus-lg me-2"></i> Add Category
          </Link>
        </div>
      </div>

      <DataGrid 
        deleteUrl="/portfolio-categories"
        deleteMode="permanent"
        itemLabel="category"
        columns={columns}
        data={data}
        totalRows={totalRows}
        pageCount={Math.ceil(totalRows / 50)} 
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

export default PortfolioCategoriesList;

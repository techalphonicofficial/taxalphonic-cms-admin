import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import DataGrid from '../components/datagrid/DataGrid';
import { DateCell } from '../components/datagrid/CellRenderers';
import ActionColumn from '../components/datagrid/ActionColumn';
import GridFilterDrawer from '../components/datagrid/GridFilterDrawer';
import api from '../services/api';
import { PackageService } from '../services/package.service';
import { toast } from 'react-toastify';
import { confirmDialog, confirmDelete } from '../components/common/confirm';

const PackagesList = () => {
  const navigate = useNavigate();
  
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter state
  const [filterForm, setFilterForm] = useState({ category: '' });
  const [appliedFilters, setAppliedFilters] = useState({});

  const handleApplyFilters = () => {
    const cleanedFilters = Object.fromEntries(
      Object.entries(filterForm).filter(([_, v]) => v !== '')
    );
    setAppliedFilters(cleanedFilters);
  };

  const handleResetFilters = () => {
    setFilterForm({ category: '' });
    setAppliedFilters({});
  };

  const fetchData = React.useCallback(async (params) => {
    setIsLoading(true);
    setError(null);
    try {
      let finalSortBy = params.sorting?.[0]?.id || 'displayOrder';

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
      
      const res = await api.get('/packages', { params: apiParams });
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
      console.error('Failed to fetch packages:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  const handleDelete = React.useCallback(async (row) => {
    if (!(await confirmDelete(row.name, { what: 'package' }))) return;
    const remove = async (force) => {
      await PackageService.delete(row.id, force);
      toast.success('Package deleted successfully.');
      fetchData({ pageIndex: 0, pageSize: 50, sorting: [] });
    };
    try {
      await remove(false);
    } catch (err) {
      const res = err.response?.data;
      if (err.response?.status === 409) {
        // Package is attached to pages/services/blogs
        if ((await confirmDialog({ title: 'This package is in use', message: res.message, note: 'Delete anyway? The package will stop rendering on those pages.', tone: 'warning', confirmText: 'Delete anyway' }))) {
          try {
            await remove(true);
          } catch (forceErr) {
            toast.error(forceErr.response?.data?.message || 'Failed to delete package.');
          }
        }
        return;
      }
      console.error('Failed to delete package:', err);
      toast.error(res?.message || 'Failed to delete package.');
    }
  }, [fetchData]);

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
      accessorKey: 'category',
      header: 'Category',
      size: 200,
    },
    {
      accessorKey: 'isRecommended',
      header: 'Recommended',
      cell: info => info.getValue() ? <span className="badge bg-success">Yes</span> : <span className="badge bg-secondary">No</span>,
      size: 150,
    },
    {
      accessorKey: 'displayOrder',
      header: 'Order',
      size: 100,
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
          onEdit={(r) => navigate(`/packages/edit/${r.id}`)}
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
          <Breadcrumb items={[{ label: 'Services', link: '/services' }, { label: 'Packages' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Packages</h2>
        </div>
        
        <div className="d-flex gap-2">
          <Link to="/packages/new" className="premium-btn-primary">
            <i className="bi bi-plus-lg me-2"></i> Add Package
          </Link>
        </div>
      </div>

      <DataGrid 
        deleteUrl="/packages"
        deleteMode="permanent"
        itemLabel="package"
        columns={columns}
        data={data}
        totalRows={totalRows}
        pageCount={Math.ceil(totalRows / 50)} 
        fetchData={fetchData}
        isLoading={isLoading}
        error={error}
        title="All Packages"
      />

      <GridFilterDrawer 
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      >
        <div className="mb-4">
          <label className="form-label fw-medium text-muted small text-uppercase">Category</label>
          <select 
            className="form-select"
            value={filterForm.category}
            onChange={(e) => setFilterForm(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">All Categories</option>
            <option value="SEO">SEO</option>
            <option value="SMO">SMO</option>
            <option value="PPC">PPC</option>
            <option value="ASO">ASO</option>
          </select>
        </div>
      </GridFilterDrawer>
    </div>
  );
};

export default PackagesList;

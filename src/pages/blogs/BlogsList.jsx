import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import DataGrid from '../../components/datagrid/DataGrid';
import { StatusBadge, DateCell } from '../../components/datagrid/CellRenderers';
import ActionColumn from '../../components/datagrid/ActionColumn';
import GridFilterDrawer from '../../components/datagrid/GridFilterDrawer';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { confirmDelete } from '../../components/common/confirm';
import PermLink from '../../components/common/PermLink';

const BlogsList = () => {
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
      
      const res = await api.get('/blogs', { params: apiParams });
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
      console.error('Failed to fetch blogs:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  const handleDelete = React.useCallback(async (row) => {
    if ((await confirmDelete(row.title, { trash: true }))) {
      try {
        await api.delete(`/blogs/${row.id}`);
        toast.success('Blog deleted successfully.');
        fetchData({ pageIndex: 0, pageSize: 50, sorting: [] });
      } catch (err) {
        console.error('Failed to delete blog:', err);
        toast.error('Failed to delete blog.');
      }
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
      accessorKey: 'featuredImage',
      header: 'Image',
      size: 80,
      enableSorting: false,
      cell: info => (
        info.getValue() ? (
          <img 
            src={info.getValue().startsWith('http') ? info.getValue() : `${import.meta.env.VITE_APP_URL || (import.meta.env.VITE_APP_URL || 'https://api.taxalphonic.com')}${info.getValue()}`} 
            alt="thumbnail" 
            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} 
          />
        ) : (
          <div style={{ width: '40px', height: '40px', backgroundColor: '#e9ecef', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-image text-muted"></i>
          </div>
        )
      ),
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
      accessorKey: 'category',
      header: 'Category',
      cell: info => <span className="badge bg-light text-dark border">{info.row.original.category?.name || 'Uncategorized'}</span>,
      size: 150,
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
          onEdit={(r) => navigate(`/blogs/edit/${r.id}`)}
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
          <Breadcrumb items={[{ label: 'Blogs' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Blogs</h2>
        </div>
        
        <div className="d-flex gap-2">
          <PermLink to="/blogs/new" className="premium-btn-primary">
            <i className="bi bi-plus-lg me-2"></i> Add Blog
          </PermLink>
        </div>
      </div>

      <DataGrid 
        deleteUrl="/blogs"
        deleteMode="trash"
        itemLabel="blog"
        columns={columns}
        data={data}
        totalRows={totalRows}
        pageCount={Math.ceil(totalRows / 50)} 
        fetchData={fetchData}
        isLoading={isLoading}
        error={error}
        title="All Blogs"
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

export default BlogsList;

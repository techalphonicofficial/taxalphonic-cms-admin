import React, { useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import DataGrid from '../components/datagrid/DataGrid';
import { StatusBadge, DateCell } from '../components/datagrid/CellRenderers';
import ActionColumn from '../components/datagrid/ActionColumn';
import GridFilterDrawer from '../components/datagrid/GridFilterDrawer';
import api from '../services/api';
import { toast } from 'react-toastify';
import { confirmDelete } from '../components/common/confirm';

const TestimonialsList = () => {
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
        apiParams.authorName_like = params.globalFilter;
      }
      
      const res = await api.get('/testimonials', { params: apiParams });
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
      console.error('Failed to fetch testimonials:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  const handleDelete = async (row) => {
    if ((await confirmDelete(row.authorName, { what: 'testimonial' }))) {
      try {
        await api.delete(`/testimonials/${row.id}`);
        toast.success('Testimonial deleted successfully.');
        fetchData({ pageIndex: 0, pageSize: 50, sorting: [] });
      } catch (err) {
        console.error('Failed to delete testimonial:', err);
        toast.error('Failed to delete testimonial.');
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
      accessorKey: 'authorName',
      header: 'Author Name',
      size: 200,
    },
    {
      accessorKey: 'company',
      header: 'Company / Role',
      cell: info => {
        const company = info.getValue() || '';
        const role = info.row.original.authorRole || '';
        if (company && role) return <span className="text-muted">{role} at {company}</span>;
        return <span className="text-muted">{company || role || '-'}</span>;
      },
      size: 200,
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: info => (
        <div className="text-warning">
          {[...Array(5)].map((star, index) => {
            index += 1;
            return (
              <i key={index} className={index <= info.getValue() ? 'bi bi-star-fill' : 'bi bi-star'}></i>
            );
          })}
        </div>
      ),
      size: 150,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue()} />,
      size: 120,
    },
    {
      accessorKey: 'createdAt',
      header: 'Added On',
      cell: info => <DateCell date={info.getValue()} />,
      size: 150,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <ActionColumn
          row={row.original}
          onEdit={(r) => navigate(`/cms/testimonials/edit/${r.id}`)}
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
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <Breadcrumb items={[{ label: 'Testimonials' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Testimonials</h2>
        </div>
        
        <div className="d-flex gap-2">
          <Link to="/cms/testimonials/new" className="premium-btn-primary">
            <i className="bi bi-plus-lg me-2"></i> Add Testimonial
          </Link>
        </div>
      </div>

      <DataGrid 
        deleteUrl="/testimonials"
        deleteMode="permanent"
        itemLabel="testimonial"
        columns={columns}
        data={data}
        totalRows={totalRows}
        pageCount={Math.ceil(totalRows / 50)} 
        fetchData={fetchData}
        isLoading={isLoading}
        error={error}
        title="All Testimonials"
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

export default TestimonialsList;

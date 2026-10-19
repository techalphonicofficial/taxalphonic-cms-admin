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
import { mediaUrl } from '../utils/mediaUrl';

const BannersList = () => {
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
      let finalSortBy = params.sorting?.[0]?.id || 'displayOrder';

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

      const res = await api.get('/banners', { params: apiParams });
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
      console.error('Failed to fetch banners:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  const handleDelete = async (row) => {
    if ((await confirmDelete(row.title, { what: 'banner' }))) {
      try {
        await api.delete(`/banners/${row.id}`);
        toast.success('Banner deleted successfully.');
        fetchData({ pageIndex: 0, pageSize: 50, sorting: [] });
      } catch (err) {
        console.error('Failed to delete banner:', err);
        toast.error('Failed to delete banner.');
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
      accessorKey: 'imageUrl',
      header: 'Image',
      cell: info => (
        <div style={{ width: '80px', height: '40px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f3f4f6', border: '1px solid #000' }}>
          {info.getValue() ? (
            <img src={mediaUrl(info.getValue())} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="d-flex h-100 justify-content-center align-items-center text-muted"><i className="bi bi-image"></i></div>
          )}
        </div>
      ),
      size: 100,
      enableSorting: false,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      size: 250,
      cell: info => info.getValue() ? <span className="fw-medium">{info.getValue()}</span> : <span className="text-muted fst-italic">No Title</span>
    },
    {
      accessorKey: 'linkUrl',
      header: 'Link',
      size: 200,
      cell: info => (
        <a href={info.getValue()} target={info.row.original.linkTarget || '_self'} className="text-decoration-none text-truncate d-inline-block" style={{ maxWidth: '180px' }}>
          {info.getValue() || '-'}
        </a>
      )
    },
    {
      accessorKey: 'displayOrder',
      header: 'Order',
      size: 100,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        const { startDate, endDate } = info.row.original;
        
        let displayStatus = status;
        let badgeClass = '';
        
        if (status === 'published') {
          const now = new Date();
          if (startDate && new Date(startDate) > now) {
            displayStatus = 'scheduled';
            badgeClass = 'bg-info text-white';
          } else if (endDate && new Date(endDate) < now) {
            displayStatus = 'expired';
            badgeClass = 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25';
          }
        }
        
        if (displayStatus === 'scheduled' || displayStatus === 'expired') {
          return (
            <span className={`badge rounded-pill fw-medium ${badgeClass} text-uppercase px-2 py-1`} style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
              {displayStatus}
            </span>
          );
        }
        
        return <StatusBadge status={status} />;
      },
      size: 120,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <ActionColumn
          row={row.original}
          onEdit={(r) => navigate(`/cms/banners/edit/${r.id}`)}
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Breadcrumb items={[{ label: 'Banners' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Banners</h2>
        </div>

        <div className="d-flex gap-2">
          <Link to="/cms/banners/new" className="premium-btn-primary">
            <i className="bi bi-plus-lg me-2"></i> Add Banner
          </Link>
        </div>
      </div>

      <DataGrid
        deleteUrl="/banners"
        deleteMode="permanent"
        itemLabel="banner"
        columns={columns}
        data={data}
        totalRows={totalRows}
        pageCount={Math.ceil(totalRows / 50)}
        fetchData={fetchData}
        isLoading={isLoading}
        error={error}
        title="All Banners"
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

export default BannersList;

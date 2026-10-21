import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import DataGrid from '../components/datagrid/DataGrid';
import { StatusBadge } from '../components/datagrid/CellRenderers';
import ActionColumn from '../components/datagrid/ActionColumn';
import GridFilterDrawer from '../components/datagrid/GridFilterDrawer';
import { PortfolioItemService } from '../services/portfolioItem.service';
import { confirmDelete } from '../components/common/confirm';

const PortfolioItemsList = () => {
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
      if (finalSortBy === 'category') finalSortBy = 'categoryId';

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
      
      const res = await PortfolioItemService.getAll(apiParams);
      setData(res.data);
      setTotalRows(res.pagination?.totalItems || res.data.length);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  const handleDelete = async (row) => {
    if ((await confirmDelete(row.title, { what: 'portfolio item' }))) {
      try {
        await PortfolioItemService.delete(row.id);
        fetchData({ pageIndex: 0, pageSize: 50, sorting: [] });
      } catch (error) {
        console.error('Failed to delete item:', error);
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
      accessorKey: 'image',
      header: 'Image',
      cell: ({ row }) => {
        const image = row.original.image;
        const title = row.original.title;
        return (
          <div 
            className="rounded overflow-hidden bg-light d-flex align-items-center justify-content-center"
            style={{ width: '48px', height: '48px' }}
          >
            {image ? (
              <img src={image.startsWith('http') ? image : `${import.meta.env.VITE_APP_URL || 'https://api.taxalphonic.com'}${image}`} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <i className="bi bi-image text-muted"></i>
            )}
          </div>
        );
      },
      size: 100,
      enableSorting: false,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      size: 250,
    },
    {
      id: 'category',
      accessorFn: row => row.category?.name,
      header: 'Category',
      cell: info => {
        const cat = info.row.original.category;
        if (!cat) return <span className="text-muted">-</span>;
        
        return (
          <div className="d-flex flex-column gap-1 align-items-start">
            {cat.parent && <span className="badge bg-secondary" style={{fontSize: '0.7rem'}}>{cat.parent.name}</span>}
            <span className="badge bg-info">{cat.name}</span>
          </div>
        );
      },
      size: 180,
      enableSorting: false,
    },
    {
      accessorKey: 'clientName',
      header: 'Client',
      cell: info => info.getValue() || <span className="text-muted">-</span>,
      size: 150,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue()} />,
      size: 120,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="d-flex align-items-center justify-content-end w-100 gap-1">
          {row.original.websiteUrl && (
            <a href={row.original.websiteUrl} target="_blank" rel="noreferrer" className="btn" title="View Website" onClick={(e) => e.stopPropagation()}>
              <i className="bi bi-box-arrow-up-right"></i>
            </a>
          )}
          <ActionColumn
            row={row.original}
            onEdit={(r) => navigate(`/portfolio-items/edit/${r.id}`)}
            onDelete={handleDelete}
          />
        </div>
      ),
      size: 150,
      enableSorting: false,
      pinned: 'right',
    }
  ], [navigate, handleDelete]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <Breadcrumb items={[{ label: 'Portfolio Items' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Portfolio Items</h2>
        </div>
        
        <div className="d-flex gap-2">
          <Link to="/portfolio-items/new" className="premium-btn-primary">
            <i className="bi bi-plus-lg me-2"></i> Add Item
          </Link>
        </div>
      </div>

      <DataGrid 
        deleteUrl="/portfolio-items"
        deleteMode="permanent"
        itemLabel="portfolio item"
        columns={columns}
        data={data}
        totalRows={totalRows}
        pageCount={Math.ceil(totalRows / 50)} 
        fetchData={fetchData}
        isLoading={isLoading}
        error={error}
        title="All Items"
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

export default PortfolioItemsList;

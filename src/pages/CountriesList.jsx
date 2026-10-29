import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import DataGrid from '../components/datagrid/DataGrid';
import { StatusBadge } from '../components/datagrid/CellRenderers';
import ActionColumn from '../components/datagrid/ActionColumn';
import GridFilterDrawer from '../components/datagrid/GridFilterDrawer';
import api from '../services/api';
import { toast } from 'react-toastify';
import { confirmDelete } from '../components/common/confirm';

import { mediaUrl } from '../utils/mediaUrl';
import PermLink from '../components/common/PermLink';

const CountriesList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterForm, setFilterForm] = useState({ status: '' });
  const [appliedFilters, setAppliedFilters] = useState({});

  const handleApplyFilters = () => {
    const cleaned = Object.fromEntries(Object.entries(filterForm).filter(([_, v]) => v !== ''));
    setAppliedFilters(cleaned);
  };

  const handleResetFilters = () => {
    setFilterForm({ status: '' });
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

      const res = await api.get('/countries', { params: apiParams });
      const resData = res.data;

      let items = [], total = 0;
      if (Array.isArray(resData)) {
        items = resData; total = resData.length;
      } else if (resData?.data?.data && Array.isArray(resData.data.data)) {
        items = resData.data.data;
        total = resData.data.pagination?.totalItems || items.length;
      } else if (resData?.data && Array.isArray(resData.data)) {
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
    if ((await confirmDelete(row.name, { what: 'country' }))) {
      try {
        await api.delete(`/countries/${row.id}`);
        toast.success('Country deleted successfully.');
        fetchData({ pageIndex: 0, pageSize: 50, sorting: [] });
      } catch (err) {
        toast.error('Failed to delete country.');
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
      accessorKey: 'flagUrl',
      header: 'Flag',
      cell: info => {
        const flag = info.getValue();
        const name = info.row.original.name;
        return flag ? (
          <img
            src={mediaUrl(flag)}
            alt={name}
            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
            className="rounded-circle border"
          />
        ) : (
          <div className="d-flex align-items-center justify-content-center bg-light rounded-circle border" style={{ width: '40px', height: '40px' }}>
            <i className="bi bi-flag text-muted"></i>
          </div>
        );
      },
      size: 80,
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Country Name',
      cell: info => <div className="fw-semibold">{info.getValue()}</div>,
      size: 250,
    },
    {
      accessorKey: 'displayOrder',
      header: 'Order',
      size: 100,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue() === 'active' ? 'published' : 'draft'} label={info.getValue() === 'active' ? 'Active' : 'Inactive'} />,
      size: 120,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <ActionColumn
          row={row.original}
          onEdit={(r) => navigate(`/cms/countries/edit/${r.id}`)}
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
          <Breadcrumb items={[{ label: 'Countries' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Global Presence</h2>
        </div>
        <div className="d-flex gap-2">
          <PermLink to="/cms/countries/new" className="premium-btn-primary">
            <i className="bi bi-plus-lg me-2"></i> Add Country
          </PermLink>
        </div>
      </div>

      <DataGrid
        deleteUrl="/countries"
        deleteMode="permanent"
        itemLabel="country"
        columns={columns}
        data={data}
        totalRows={totalRows}
        pageCount={Math.ceil(totalRows / 50)}
        fetchData={fetchData}
        isLoading={isLoading}
        error={error}
        title="All Countries"
      />

      <GridFilterDrawer onApplyFilters={handleApplyFilters} onResetFilters={handleResetFilters}>
        <div className="mb-4">
          <label className="form-label fw-medium text-muted small text-uppercase">Status</label>
          <select className="form-select" value={filterForm.status} onChange={(e) => setFilterForm(p => ({ ...p, status: e.target.value }))}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </GridFilterDrawer>
    </div>
  );
};

export default CountriesList;

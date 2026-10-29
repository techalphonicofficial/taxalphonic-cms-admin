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
import { mediaUrl } from '../utils/mediaUrl';
import PermLink from '../components/common/PermLink';

const AvatarCell = ({ imageUrl, name }) => {
  if (!imageUrl) {
    return (
      <div className="d-flex align-items-center">
        <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
          {name?.charAt(0)?.toUpperCase()}
        </div>
        <span className="fw-medium">{name}</span>
      </div>
    );
  }
  return (
    <div className="d-flex align-items-center">
      <img 
        src={mediaUrl(imageUrl)} 
        alt={name} 
        className="rounded-circle me-3 object-fit-cover shadow-sm"
        style={{ width: '40px', height: '40px' }}
      />
      <span className="fw-medium">{name}</span>
    </div>
  );
};

const TeamMembersList = () => {
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
      
      const res = await api.get('/team', { params: apiParams });
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
      console.error('Failed to fetch team members:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  const handleDelete = React.useCallback(async (row) => {
    if ((await confirmDelete(row.name, { what: 'team member' }))) {
      try {
        await api.delete(`/team/${row.id}`);
        toast.success('Team member deleted successfully.');
        fetchData({ pageIndex: 0, pageSize: 50, sorting: [] });
      } catch (err) {
        console.error('Failed to delete team member:', err);
        toast.error('Failed to delete team member.');
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
      accessorKey: 'name',
      header: 'Team Member',
      cell: info => <AvatarCell imageUrl={info.row.original.imageUrl} name={info.getValue()} />,
      size: 300,
    },
    {
      accessorKey: 'role',
      header: 'Role / Position',
      size: 200,
    },
    {
      accessorKey: 'displayOrder',
      header: 'Order',
      size: 100,
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
          onEdit={(r) => navigate(`/cms/team/edit/${r.id}`)}
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
          <Breadcrumb items={[{ label: 'Team Members' }]} />
          <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Team Members</h2>
        </div>
        
        <div className="d-flex gap-2">
          <PermLink to="/cms/team/new" className="premium-btn-primary">
            <i className="bi bi-plus-lg me-2"></i> Add Team Member
          </PermLink>
        </div>
      </div>

      <DataGrid 
        deleteUrl="/team"
        deleteMode="permanent"
        itemLabel="team member"
        columns={columns}
        data={data}
        totalRows={totalRows}
        pageCount={Math.ceil(totalRows / 50)} 
        fetchData={fetchData}
        isLoading={isLoading}
        error={error}
        title="All Team Members"
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

export default TeamMembersList;

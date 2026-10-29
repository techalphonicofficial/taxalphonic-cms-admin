import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DataGrid from '../components/datagrid/DataGrid';
import useServerList from '../components/datagrid/useServerList';
import { HistoryButton, recordTitle } from '../components/datagrid/RecordHistory';
import { PermissionService } from '../services/permission.service';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import HasPermission from '../components/common/HasPermission';
import { confirmDelete } from '../components/common/confirm';
import PermLink from '../components/common/PermLink';

// The list API returns 10 rows by default: the grid pages on the server (useServerList), the
// module filter and the counts come from one call for all permissions (module + action only).
const PermissionsList = () => {
  const queryClient = useQueryClient();
  const [module, setModule] = useState('');

  const { data: all = [] } = useQuery({
    queryKey: ['permissions', 'all'],
    queryFn: async () => {
      const res = await PermissionService.getAll({ limit: 1000, sortBy: 'module', sortOrder: 'ASC' });
      return Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
    },
  });
  const modules = useMemo(() => {
    const counts = {};
    all.forEach((p) => { counts[p.module] = (counts[p.module] || 0) + 1; });
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  }, [all]);

  const params = useMemo(() => ({ module }), [module]);
  const list = useServerList('/permissions', { searchField: 'module', defaultSort: 'module', defaultOrder: 'ASC', params });

  const deleteMutation = useMutation({
    mutationFn: PermissionService.delete,
    onSuccess: () => {
      toast.success('Permission deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      list.reload();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Error deleting permission'),
  });

  const handleDelete = async (id) => {
    if ((await confirmDelete(null, { what: 'permission' }))) {
      deleteMutation.mutate(id);
    }
  };

  const columns = React.useMemo(() => [
    { accessorKey: 'module', header: 'Module', cell: ({ row }) => <span className="fw-medium text-primary">{row.original.module}</span> },
    { accessorKey: 'action', header: 'Action', cell: ({ row }) => <span className="badge bg-secondary">{row.original.action}</span> },
    { accessorKey: 'description', header: 'Description', enableSorting: false },
    { accessorKey: 'createdAt', header: 'Created At', cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() },
    {
      id: 'actions', header: 'Actions', cell: ({ row }) => (
        <div className="d-flex gap-2">
          <HasPermission action="update" module="Permissions">
            <Link to={`/permissions/edit/${row.original.id}`} className="btn btn-sm btn-outline-primary" title="Edit">
              <i className="bi bi-pencil"></i>
            </Link>
          </HasPermission>
          <HasPermission action="delete" module="Permissions">
            <button onClick={() => handleDelete(row.original.id)} className="btn btn-sm btn-outline-danger" title="Delete">
              <i className="bi bi-trash"></i>
            </button>
          </HasPermission>
          <HistoryButton recordId={row.original.id} title={recordTitle(row.original)} className="btn btn-sm btn-outline-secondary" />
        </div>
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div>
          <h4 className="mb-1 fw-bold">Permissions</h4>
          <p className="text-muted mb-0">{all.length} permissions in {modules.length} modules. Give them to people through Roles.</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <select className="form-select form-select-sm" style={{ minWidth: 220 }} value={module} onChange={(e) => setModule(e.target.value)} aria-label="Filter by module">
            <option value="">All modules ({all.length})</option>
            {modules.map(([name, count]) => <option key={name} value={name}>{name} ({count})</option>)}
          </select>
          <HasPermission action="create" module="Permissions">
            <PermLink to="/permissions/new" className="btn btn-primary rounded-pill px-4 text-nowrap">
              <i className="bi bi-plus-lg me-2"></i> Add Permission
            </PermLink>
          </HasPermission>
        </div>
      </div>

      <DataGrid {...list.gridProps} columns={columns} title="Permissions" />
    </div>
  );
};

export default PermissionsList;

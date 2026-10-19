import React from 'react';
import { Link } from 'react-router-dom';
import DataGrid from '../components/datagrid/DataGrid';
import { HistoryButton, recordTitle } from '../components/datagrid/RecordHistory';
import { PermissionService } from '../services/permission.service';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import HasPermission from '../components/common/HasPermission';
import { confirmDelete } from '../components/common/confirm';

const PermissionsList = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => PermissionService.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: PermissionService.delete,
    onSuccess: () => {
      toast.success('Permission deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
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
    { accessorKey: 'description', header: 'Description' },
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
  ], []);

  const permissionsArray = Array.isArray(data?.data) ? data.data : (data?.data?.data || []);

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h4 className="mb-1 fw-bold">Permissions</h4>
          <p className="text-muted mb-0">Manage system access levels</p>
        </div>
        <Link to="/permissions/new" className="btn btn-primary rounded-pill px-4">
          <i className="bi bi-plus-lg me-2"></i> Add Permission
        </Link>
      </div>

      <DataGrid
        columns={columns}
        data={permissionsArray}
        loading={isLoading}
        error={isError ? error.message : null}
      />
    </div>
  );
};

export default PermissionsList;

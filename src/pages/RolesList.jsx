import React from 'react';
import { Link } from 'react-router-dom';
import DataGrid from '../components/datagrid/DataGrid';
import { HistoryButton, recordTitle } from '../components/datagrid/RecordHistory';
import { RoleService } from '../services/role.service';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import HasPermission from '../components/common/HasPermission';
import { confirmDelete } from '../components/common/confirm';

const RolesList = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['roles'],
    queryFn: () => RoleService.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: RoleService.delete,
    onSuccess: () => {
      toast.success('Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Error deleting role'),
  });

  const handleDelete = async (id) => {
    if ((await confirmDelete(null, { what: 'role' }))) {
      deleteMutation.mutate(id);
    }
  };

  const columns = React.useMemo(() => [
    { accessorKey: 'name', header: 'Role Name' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => (
      <span className={`badge ${row.original.isActive ? 'bg-success' : 'bg-danger'}`}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { accessorKey: 'createdAt', header: 'Created At', cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() },
    { id: 'actions', header: 'Actions', cell: ({ row }) => (
      <div className="d-flex gap-2">
        <HasPermission action="update" module="Roles">
            <Link to={`/roles/edit/${row.original.id}`} className="btn btn-sm btn-outline-primary" title="Edit">
            <i className="bi bi-pencil"></i>
            </Link>
        </HasPermission>
        {row.original.name !== 'Admin' && (
          <HasPermission action="delete" module="Roles">
              <button onClick={() => handleDelete(row.original.id)} className="btn btn-sm btn-outline-danger" title="Delete">
                <i className="bi bi-trash"></i>
              </button>
          </HasPermission>
        )}
        <HistoryButton recordId={row.original.id} title={recordTitle(row.original)} className="btn btn-sm btn-outline-secondary" />
      </div>
    )}
  ], []);

  const rolesArray = Array.isArray(data?.data) ? data.data : (data?.data?.data || []);

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h4 className="mb-1 fw-bold">Role Management</h4>
          <p className="text-muted mb-0">Define roles and assign permissions</p>
        </div>
        <Link to="/roles/new" className="btn btn-primary rounded-pill px-4">
          <i className="bi bi-plus-lg me-2"></i> Add Role
        </Link>
      </div>
      
      <DataGrid 
        columns={columns} 
        data={rolesArray} 
        loading={isLoading} 
        error={isError ? error.message : null}
      />
    </div>
  );
};

export default RolesList;

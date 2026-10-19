import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataGrid from '../components/datagrid/DataGrid';
import { HistoryButton, recordTitle } from '../components/datagrid/RecordHistory';
import { UserService } from '../services/user.service';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import HasPermission from '../components/common/HasPermission';
import { confirmDelete } from '../components/common/confirm';

const UsersList = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => UserService.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: UserService.delete,
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Error deleting user'),
  });

  const handleDelete = async (id) => {
    if ((await confirmDelete(null, { what: 'user' }))) {
      deleteMutation.mutate(id);
    }
  };

  const columns = React.useMemo(() => [
    { accessorKey: 'firstName', header: 'First Name' },
    { accessorKey: 'lastName', header: 'Last Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'role.name', header: 'Role', cell: ({ row }) => <span className="badge bg-info">{row.original.role?.name}</span> },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => (
      <span className={`badge ${row.original.isActive ? 'bg-success' : 'bg-danger'}`}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { id: 'actions', header: 'Actions', cell: ({ row }) => (
      <div className="d-flex gap-2">
        <HasPermission action="update" module="Users">
            <Link to={`/users/edit/${row.original.id}`} className="btn btn-sm btn-outline-primary" title="Edit">
            <i className="bi bi-pencil"></i>
            </Link>
        </HasPermission>
        <HasPermission action="delete" module="Users">
            <button onClick={() => handleDelete(row.original.id)} className="btn btn-sm btn-outline-danger" title="Delete">
            <i className="bi bi-trash"></i>
            </button>
        </HasPermission>
        <HistoryButton recordId={row.original.id} title={recordTitle(row.original)} className="btn btn-sm btn-outline-secondary" />
      </div>
    )}
  ], []);

  const usersArray = Array.isArray(data?.data) ? data.data : (data?.data?.data || []);

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h4 className="mb-1 fw-bold">User Management</h4>
          <p className="text-muted mb-0">Manage system users and their roles</p>
        </div>
        <Link to="/users/new" className="btn btn-primary rounded-pill px-4">
          <i className="bi bi-plus-lg me-2"></i> Add User
        </Link>
      </div>
      
      <DataGrid 
        columns={columns} 
        data={usersArray} 
        loading={isLoading} 
        error={isError ? error.message : null}
      />
    </div>
  );
};

export default UsersList;

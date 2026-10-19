import React from 'react';
import MasterList, { ActiveBadge, Clamp } from '../components/datagrid/MasterList';

const IndustriesList = () => {
  const columns = React.useMemo(() => [
    { accessorKey: 'name', header: 'Industry Name' },
    { accessorKey: 'slug', header: 'Slug' },
    { accessorKey: 'description', header: 'Tax Context', enableSorting: false, cell: ({ row }) => <Clamp text={row.original.description} /> },
    { accessorKey: 'active', header: 'Active', cell: ({ row }) => <ActiveBadge active={row.original.active} /> },
  ], []);

  return (
    <MasterList
      title="Industries Master"
      subtitle="Manage industry tagging categories dynamically."
      url="/industries"
      editPath="/industries/edit"
      addPath="/industries/new"
      addLabel="Add Industry"
      itemLabel="industry"
      columns={columns}
      filters={[{ key: 'active', label: 'Status', options: [{ value: '1', label: 'Active' }, { value: '0', label: 'Inactive' }] }]}
    />
  );
};

export default IndustriesList;

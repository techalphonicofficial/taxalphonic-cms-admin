import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import MasterList, { ActiveBadge, Clamp } from '../components/datagrid/MasterList';

// Locations (pSEO cities): server-side list with a state filter.
const LocationsList = () => {
  const { data: states = [] } = useQuery({
    queryKey: ['states', 'options'],
    queryFn: async () => {
      const res = await api.get('/states', { params: { limit: 1000, sortBy: 'name', sortOrder: 'ASC' } });
      const body = res.data?.data;
      return Array.isArray(body) ? body : body?.data || [];
    },
  });

  const columns = React.useMemo(() => [
    { accessorKey: 'name', header: 'Name' },
    {
      id: 'state',
      accessorFn: (r) => r.stateMaster?.name || '',
      header: 'State',
      enableSorting: false,
      cell: ({ row }) => (row.original.stateMaster ? <span className="badge bg-secondary-subtle text-secondary-emphasis">{row.original.stateMaster.name}</span> : '-'),
    },
    { accessorKey: 'slug', header: 'Slug' },
    { accessorKey: 'description', header: 'Local Context', enableSorting: false, cell: ({ row }) => <Clamp text={row.original.description} /> },
    { accessorKey: 'active', header: 'Active', cell: ({ row }) => <ActiveBadge active={row.original.active} /> },
  ], []);

  return (
    <MasterList
      title="Locations Master"
      subtitle="Manage geographical targeting endpoints."
      url="/locations"
      editPath="/locations/edit"
      addPath="/locations/new"
      addLabel="Add Location"
      itemLabel="location"
      columns={columns}
      filters={[{ key: 'stateId', label: 'State', options: states.map((s) => ({ value: s.id, label: s.name })) }]}
    />
  );
};

export default LocationsList;

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import MasterList, { ActiveBadge } from '../components/datagrid/MasterList';

// States (pSEO): server-side list with a country filter.
const StatesList = () => {
  const { data: countries = [] } = useQuery({
    queryKey: ['countries', 'options'],
    queryFn: async () => {
      const res = await api.get('/countries', { params: { limit: 1000 } });
      const body = res.data?.data;
      return Array.isArray(body) ? body : body?.data || [];
    },
  });

  const columns = React.useMemo(() => [
    {
      id: 'country',
      accessorFn: (r) => r.country?.name || '',
      header: 'Country Master',
      enableSorting: false,
      cell: ({ row }) => (row.original.country ? <span className="badge bg-secondary">{row.original.country.name}</span> : '-'),
    },
    { accessorKey: 'name', header: 'State Name' },
    { accessorKey: 'slug', header: 'Slug' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <ActiveBadge active={row.original.status === 'active'} /> },
  ], []);

  return (
    <MasterList
      title="States Master"
      subtitle="Manage geographical states mapped natively to internal countries"
      url="/states"
      editPath="/states/edit"
      addPath="/states/new"
      addLabel="Add State"
      itemLabel="state"
      columns={columns}
      filters={[{ key: 'countryId', label: 'Country', options: countries.map((c) => ({ value: c.id, label: c.name })) }]}
    />
  );
};

export default StatesList;

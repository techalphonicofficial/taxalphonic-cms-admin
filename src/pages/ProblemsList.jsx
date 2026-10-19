import React from 'react';
import MasterList, { ActiveBadge, Clamp } from '../components/datagrid/MasterList';

// Problem types used by scripts/seed-pseo-india.js in the backend.
const TYPES = ['Notice', 'Registration', 'Filing', 'Compliance', 'Refund', 'Penalty', 'Dispute', 'Advisory'];

const ProblemsList = () => {
  const columns = React.useMemo(() => [
    { accessorKey: 'name', header: 'Problem Statement' },
    { accessorKey: 'problemType', header: 'Type', cell: ({ row }) => (row.original.problemType ? <span className="badge bg-info-subtle text-info-emphasis">{row.original.problemType}</span> : '-') },
    { accessorKey: 'description', header: 'Description', enableSorting: false, cell: ({ row }) => <Clamp text={row.original.description} /> },
    { accessorKey: 'active', header: 'Active', cell: ({ row }) => <ActiveBadge active={row.original.active} /> },
  ], []);

  return (
    <MasterList
      title="Independent Problems Dictionary"
      subtitle="Track standalone query endpoints representing broad SEO targets without a specific Service anchor."
      url="/problems"
      editPath="/problems/edit"
      addPath="/problems/new"
      addLabel="Add Problem Case"
      itemLabel="problem"
      columns={columns}
      filters={[{ key: 'problemType', label: 'Type', options: TYPES.map((t) => ({ value: t, label: t })) }]}
    />
  );
};

export default ProblemsList;

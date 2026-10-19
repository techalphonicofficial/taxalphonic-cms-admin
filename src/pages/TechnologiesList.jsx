import React from 'react';
import MasterList, { ActiveBadge, Clamp } from '../components/datagrid/MasterList';

// Categories used by scripts/seed-pseo-india.js in the backend.
const CATEGORIES = ['Accounting Software', 'ERP', 'Tax Software', 'Payroll Software', 'Government Portal', 'Payment Gateway', 'E-commerce Platform', 'Marketplace', 'Digital Identity', 'Banking', 'Framework'];

const TechnologiesList = () => {
  const columns = React.useMemo(() => [
    { accessorKey: 'name', header: 'Tech Target' },
    { accessorKey: 'category', header: 'Stack Zone', cell: ({ row }) => (row.original.category ? <span className="badge bg-secondary">{row.original.category}</span> : '-') },
    { accessorKey: 'description', header: 'Description', enableSorting: false, cell: ({ row }) => <Clamp text={row.original.description} /> },
    { accessorKey: 'active', header: 'Active', cell: ({ row }) => <ActiveBadge active={row.original.active} /> },
  ], []);

  return (
    <MasterList
      title="Technologies Master"
      subtitle="Record software stacks used across SEO matrix combinations."
      url="/technologies"
      editPath="/technologies/edit"
      addPath="/technologies/new"
      addLabel="Add Tech Engine"
      itemLabel="technology"
      columns={columns}
      filters={[{ key: 'category', label: 'Category', options: CATEGORIES.map((c) => ({ value: c, label: c })) }]}
    />
  );
};

export default TechnologiesList;

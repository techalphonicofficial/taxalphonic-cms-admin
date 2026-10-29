import React, { useState, useEffect, useRef } from 'react';
import { flexRender } from '@tanstack/react-table';
import { getCoreRowModel, getPaginationRowModel, getFilteredRowModel, getSortedRowModel, useLegacyTable as useReactTable } from '@tanstack/react-table/legacy';
import GridPagination from './GridPagination';
import GridToolbar from './GridToolbar';
import BulkActionBar from './BulkActionBar';
import { LoadingState, ErrorState, NoDataState } from './EmptyStates';
import ConfirmDialog from '../common/ConfirmDialog';
import api from '../../services/api';
import { useLocation } from 'react-router-dom';
import { canOnPage } from '../../utils/permissions';
import { toast } from 'react-toastify';
import './DataGrid.css';

const AgGridFilterPopover = ({ column, table, close, originalData }) => {
  const [searchText, setSearchText] = useState('');
  
  const uniqueValues = React.useMemo(() => {
    const vals = new Set();
    // Use originalData to ensure the list of checkboxes doesn't shrink when filtering
    originalData.forEach(row => {
      let val = row[column.id];
      
      // Fallbacks mimicking the filtering logic
      if (val === undefined && row[column.id + 'Id'] !== undefined) val = row[column.id + 'Id'];
      if (val === undefined && row.category) val = row.category.name;
      
      // Extract string if value is an object (e.g. parent category)
      if (val !== null && typeof val === 'object' && val.name) {
        val = val.name;
      } else if (val !== null && typeof val === 'object' && val.title) {
        val = val.title;
      }
      
      if (val !== null && val !== undefined && val !== '') {
        vals.add(String(val));
      }
    });
    return Array.from(vals).sort();
  }, [originalData, column.id]);

  const currentFilterValue = column.getFilterValue();
  
  const [selected, setSelected] = useState(() => {
    if (Array.isArray(currentFilterValue)) return new Set(currentFilterValue);
    if (currentFilterValue !== undefined) {
      return new Set(uniqueValues.filter(v => v.toLowerCase().includes(String(currentFilterValue).toLowerCase())));
    }
    return new Set(uniqueValues);
  });

  const visibleValues = uniqueValues.filter(v => v.toLowerCase().includes(searchText.toLowerCase()));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(new Set(uniqueValues));
      column.setFilterValue(undefined);
    } else {
      setSelected(new Set());
      column.setFilterValue([]);
    }
  };

  const handleSelect = (val, checked) => {
    const newSelected = new Set(selected);
    if (checked) newSelected.add(val);
    else newSelected.delete(val);
    setSelected(newSelected);
    
    if (newSelected.size === uniqueValues.length) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue(Array.from(newSelected));
    }
  };

  const popoverRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [close]);

  return (
    <div 
      ref={popoverRef}
      className="ag-grid-filter-popover shadow border"
      style={{
        position: 'absolute',
        top: '100%',
        left: 'auto',
        right: 0,
        zIndex: 1000,
        background: 'var(--bs-body-bg)',
        minWidth: '220px',
        borderRadius: '6px',
        padding: '8px',
        marginTop: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        fontWeight: 'normal',
        color: '#212529',
        textAlign: 'left'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 position-relative">
        <i className="bi bi-search position-absolute" style={{ left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.8rem' }}></i>
        <input
          type="text"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="Search..."
          className="form-control form-control-sm"
          style={{ paddingLeft: '24px' }}
          autoFocus
        />
      </div>
      <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.85rem' }}>
        {!searchText && (
          <div className="form-check mb-1">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id={`selectAll-${column.id}`}
              checked={selected.size === uniqueValues.length}
              onChange={handleSelectAll}
            />
            <label className="form-check-label user-select-none" htmlFor={`selectAll-${column.id}`}>(Select All)</label>
          </div>
        )}
        {visibleValues.map((val, idx) => (
          <div className="form-check mb-1" key={idx}>
            <input 
              className="form-check-input" 
              type="checkbox" 
              id={`chk-${column.id}-${idx}`}
              checked={selected.has(val)}
              onChange={(e) => handleSelect(val, e.target.checked)}
            />
            <label className="form-check-label user-select-none text-truncate d-block" htmlFor={`chk-${column.id}-${idx}`} title={val}>{val}</label>
          </div>
        ))}
        {visibleValues.length === 0 && <div className="text-muted small">No matches</div>}
      </div>
    </div>
  );
};

// The row-actions column always sticks to the right edge while the rest scrolls.
const ACTIONS_ID = 'actions';
const pinnedSide = (column) => column.columnDef.pinned || (column.id === ACTIONS_ID ? 'right' : null);

// Column reordering must never move the actions column away from the end.
const keepActionsLast = (order) =>
  order.includes(ACTIONS_ID) ? [...order.filter(id => id !== ACTIONS_ID), ACTIONS_ID] : order;

/** Display name of a row, for confirmations and messages. */
const rowName = (row) => String(
  row?.title || row?.name || row?.label || row?.question || row?.targetLabel || row?.route
  || [row?.firstName, row?.lastName].filter(Boolean).join(' ') || row?.email || row?.slug || row?.id || ''
).trim();

const pluralize = (word, count) => (count === 1 ? word : /s$/.test(word) ? word : /y$/.test(word) ? word.replace(/y$/, 'ies') : `${word}s`);

const DataGrid = ({
  columns,
  data,
  fetchData,
  totalRows,
  pageCount,
  isLoading,
  error,
  title = 'Data',
  onBulkDelete: onBulkDeleteProp,
  // Built-in bulk delete: DELETE `${deleteUrl}/${row.id}` for every selected row, after a themed
  // confirmation, then the grid reloads. deleteMode "trash" = the records go to the Trash (soft
  // delete, restorable); "permanent" = they are gone for good. itemLabel names one record.
  deleteUrl: deleteUrlProp,
  deleteMode = 'permanent',
  itemLabel = 'item',
  // Extra bulk-bar buttons: [{ label, icon, variant, disabled, onClick(selectedRows, clearSelection) }]
  bulkActions = [],
}) => {
  // Bulk delete only for a role that may delete on this list page (utils/permissions.js).
  const canDelete = canOnPage('delete', useLocation().pathname);
  const deleteUrl = canDelete ? deleteUrlProp : undefined;
  const onBulkDelete = canDelete ? onBulkDeleteProp : undefined;
  const [rowSelection, setRowSelection] = useState({});
  const [confirmRows, setConfirmRows] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });
  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnOrder, setColumnOrder] = useState(() => keepActionsLast(columns.map(c => c.id || c.accessorKey)));
  const [columnFilters, setColumnFilters] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  // Server-side lists: the search goes to the API 300 ms after typing stops, and a new search
  // starts again from page 1 (otherwise a search on page 5 shows "no results").
  const [serverFilter, setServerFilter] = useState('');
  useEffect(() => {
    if (!fetchData || globalFilter === serverFilter) return undefined;
    const t = setTimeout(() => {
      setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }));
      setServerFilter(globalFilter);
    }, 300);
    return () => clearTimeout(t);
  }, [fetchData, globalFilter, serverFilter]);

  useEffect(() => {
    if (fetchData) {
      fetchData({ pageIndex, pageSize, globalFilter: serverFilter, sorting, columnFilters });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, pageIndex, pageSize, serverFilter, JSON.stringify(sorting)]);

  const handleDragStart = (e, columnId) => {
    e.dataTransfer.setData('text/plain', columnId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    const draggedColId = e.dataTransfer.getData('text/plain');
    if (draggedColId === targetColumnId || !draggedColId) return;

    setColumnOrder(old => {
      let newOrder = [...old];
      // if columnOrder is missing some columns, initialize it fully first
      if (newOrder.length === 0) {
        newOrder = table.getAllLeafColumns().map(c => c.id);
      }
      const dragIdx = newOrder.indexOf(draggedColId);
      const dropIdx = newOrder.indexOf(targetColumnId);
      if (dragIdx === -1 || dropIdx === -1) return old;
      
      newOrder.splice(dragIdx, 1);
      newOrder.splice(dropIdx, 0, draggedColId);
      return keepActionsLast(newOrder);
    });
  };


  const filteredData = React.useMemo(() => {
    if (!columnFilters || columnFilters.length === 0) return data;
    return data.filter(row => {
      return columnFilters.every(filter => {
        const val = row[filter.id] || row[filter.id + 'Id'] || row.category?.name || '';
        
        if (Array.isArray(filter.value)) {
          if (filter.value.length === 0) return false;
          return filter.value.includes(String(val));
        }

        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(String(filter.value).toLowerCase());
      });
    });
  }, [data, columnFilters]);

  const table = useReactTable({
    data: filteredData,
    columns,
    pageCount: pageCount ?? -1,
    state: {
      rowSelection,
      globalFilter,
      pagination,
      sorting,
      columnVisibility,
      columnOrder,
      columnFilters,
    },
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: !!fetchData,
    manualFiltering: !!fetchData,
    manualSorting: !!fetchData,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="premium-data-grid-container">
      {isLoading && <div className="loading-overlay"><div className="spinner-border text-primary"></div></div>}
      
      <GridToolbar
        table={table} 
        title={title}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />

      <div className="table-responsive-wrapper">
        <table className="premium-table" style={{ minWidth: table.getRowModel().rows.length > 0 ? table.getTotalSize() : '100%' }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  const isPinned = pinnedSide(header.column);
                  return (
                    <th 
                      key={header.id} 
                      style={{ width: header.getSize() }}
                      className={`${header.column.getCanSort() ? 'cursor-pointer' : ''} ${isPinned ? 'pinned-' + isPinned : ''}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, header.column.id)}
                    >
                      <div 
                        onClick={header.column.getToggleSortingHandler()} 
                        className="th-content"
                        draggable={!header.isPlaceholder && !isPinned}
                        onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, header.column.id); }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className="sort-icon">
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted()] ?? null}
                          </span>
                          {header.column.getCanFilter() && (
                            <div style={{ position: 'relative' }}>
                              <i 
                                className="bi bi-filter" 
                                style={{ 
                                  cursor: 'pointer', 
                                  fontSize: '1.2rem', 
                                  color: activeFilters[header.column.id] || (header.column.getFilterValue() && (!Array.isArray(header.column.getFilterValue()) || header.column.getFilterValue().length > 0)) ? '#0d6efd' : 'inherit'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveFilters(prev => ({ ...prev, [header.column.id]: !prev[header.column.id] }));
                                }}
                                title="Filter this column"
                              ></i>
                              {activeFilters[header.column.id] && (
                                <AgGridFilterPopover 
                                  column={header.column} 
                                  table={table} 
                                  close={() => setActiveFilters(prev => ({ ...prev, [header.column.id]: false }))} 
                                  originalData={data}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`resizer ${header.column.getIsResizing() ? 'isResizing' : ''}`}
                        onClick={e => e.stopPropagation()}
                      ></div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingState colSpan={columns.length} />
            ) : error ? (
              <ErrorState colSpan={columns.length} error={error} />
            ) : table.getRowModel().rows.length === 0 ? (
              <NoDataState colSpan={columns.length} />
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className={row.getIsSelected() ? 'row-selected' : ''}>
                  {row.getVisibleCells().map(cell => {
                    const isPinned = pinnedSide(cell.column);
                    return (
                      <td key={cell.id} className={isPinned ? 'pinned-' + isPinned : ''}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <GridPagination table={table} pageCount={pageCount} totalRows={totalRows} />

      <BulkActionBar
        selectedCount={selectedCount}
        onClear={() => table.resetRowSelection()}
        deleteText={deleteUrl && deleteMode === 'trash' ? 'Move to Trash' : 'Delete Selected'}
        actions={bulkActions.map((a) => ({
          ...a,
          onClick: () => a.onClick(table.getSelectedRowModel().rows.map(row => row.original), () => table.resetRowSelection()),
        }))}
        onDelete={(deleteUrl || onBulkDelete) ? () => {
          const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
          if (deleteUrl) {
            setConfirmRows(selectedRows);
          } else {
            onBulkDelete(selectedRows);
            table.resetRowSelection();
          }
        } : undefined}
      />

      {deleteUrl && (
        <ConfirmDialog
          show={Boolean(confirmRows)}
          tone={deleteMode === 'trash' ? 'warning' : 'danger'}
          title={`${deleteMode === 'trash' ? 'Move' : 'Delete'} ${confirmRows?.length || 0} ${pluralize(itemLabel, confirmRows?.length)}${deleteMode === 'trash' ? ' to the Trash' : ''}?`}
          message={deleteMode === 'trash'
            ? 'They disappear from the website and this list.'
            : 'These will be deleted from the website and the admin.'}
          items={(confirmRows || []).map(rowName)}
          note={deleteMode === 'trash'
            ? 'You can restore them any time from Trash.'
            : 'This cannot be undone.'}
          confirmText={deleteMode === 'trash' ? 'Move to Trash' : `Delete ${confirmRows?.length || ''}`}
          busy={deleting}
          onCancel={() => setConfirmRows(null)}
          onConfirm={async () => {
            const rows = confirmRows || [];
            setDeleting(true);
            const results = await Promise.allSettled(rows.map(row => api.delete(`${deleteUrl}/${row.id}`)));
            setDeleting(false);
            setConfirmRows(null);
            table.resetRowSelection();

            const failed = results
              .map((result, index) => ({ result, row: rows[index] }))
              .filter(({ result }) => result.status === 'rejected');
            const done = rows.length - failed.length;
            if (done) {
              toast.success(`${done} ${pluralize(itemLabel, done)} ${deleteMode === 'trash' ? 'moved to the Trash' : 'deleted'}.`);
            }
            if (failed.length) {
              const reason = failed[0].result.reason?.response?.data?.message || failed[0].result.reason?.message || 'Request failed';
              toast.error(`${failed.length} could not be deleted (${rowName(failed[0].row)}: ${reason}).`, { autoClose: 8000 });
            }
            if (fetchData) fetchData({ pageIndex, pageSize, globalFilter: serverFilter, sorting, columnFilters });
          }}
        />
      )}
    </div>
  );
};

export default DataGrid;

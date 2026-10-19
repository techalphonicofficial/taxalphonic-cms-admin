import React from 'react';

const GridToolbar = ({ title, globalFilter, setGlobalFilter, table }) => {

  const exportToCSV = () => {
    if (!table) return;
    const rows = table.getRowModel().rows;
    const cols = table.getVisibleLeafColumns().filter(c => typeof c.columnDef.header === 'string' && c.id !== 'actions' && c.id !== 'selection');
    
    let csv = cols.map(c => c.columnDef.header).join(',') + '\n';
    
    rows.forEach(row => {
      const rowData = cols.map(col => {
        let val = row.getValue(col.id);
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });
      csv += rowData.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', (title || 'export').replace(/\s+/g, '_').toLowerCase() + '.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="grid-toolbar">
      <h5 className="mb-0 fw-bold">{title}</h5>
      
      <div className="d-flex align-items-center gap-3">
        <div className="grid-search-wrapper">
          <i className="bi bi-search"></i>
          <input 
            type="text" 
            className="grid-search-input" 
            placeholder="Search..."
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
          />
        </div>
        
        <div className="toolbar-actions d-flex gap-2">
          {table && (
            <div className="dropdown">
              <button className="btn bg-white border dropdown-toggle d-flex align-items-center gap-2 text-dark px-3 py-2" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" style={{ borderRadius: '8px' }}>
                <i className="bi bi-layout-three-columns"></i> Columns
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 p-3" style={{ width: '220px', borderRadius: '12px' }}>
                <li className="mb-2 fw-bold text-muted small text-uppercase px-1">Toggle Columns</li>
                {table.getAllLeafColumns().map(column => {
                  return (
                    typeof column.columnDef.header === 'string' && (
                      <li key={column.id} className="mb-2">
                        <label className="d-flex align-items-center cursor-pointer px-1">
                          <input 
                            type="checkbox" 
                            className="form-check-input me-2 mt-0 cursor-pointer"
                            checked={column.getIsVisible()}
                            onChange={column.getToggleVisibilityHandler()}
                          />
                          <span className="user-select-none text-truncate text-dark">{column.columnDef.header}</span>
                        </label>
                      </li>
                    )
                  );
                })}
              </ul>
            </div>
          )}
          <button className="btn bg-white border d-flex align-items-center gap-2 text-dark px-3 py-2" type="button" onClick={exportToCSV} style={{ borderRadius: '8px' }}>
            <i className="bi bi-download"></i> Export
          </button>
          <button className="btn px-3 py-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#filterDrawer" style={{ borderRadius: '8px' }}>
            <i className="bi bi-funnel"></i> Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default GridToolbar;

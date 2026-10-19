import React, { useCallback, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import './DataTable.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const AdvancedDataTable = ({
  columnDefs,
  fetchData, // function(params) => { data: [], total: number }
  rowData, // fallback if not using infinite scrolling
  onRowClicked,
  onSelectionChanged,
  gridRef
}) => {
  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 150,
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true, // Advanced filter UI under headers
    wrapText: true,       // Prevent text clipping
    autoHeight: true,     // Let rows expand to fit wrapped text
  }), []);

  const datasource = useMemo(() => {
    if (!fetchData) return null;
    return {
      getRows: async (params) => {
        try {
          const { startRow, endRow, sortModel, filterModel } = params;
          const limit = endRow - startRow;
          const page = Math.floor(startRow / limit) + 1;
          
          let sortBy = 'createdAt';
          let sortOrder = 'DESC';
          if (sortModel && sortModel.length > 0) {
            sortBy = sortModel[0].colId;
            sortOrder = sortModel[0].sort.toUpperCase();
          }

          // Build generic filters
          const filters = {};
          Object.keys(filterModel).forEach(key => {
            if (filterModel[key].type === 'contains') {
               filters[`${key}_like`] = filterModel[key].filter;
            } else {
               filters[key] = filterModel[key].filter;
            }
          });

          const response = await fetchData({ page, limit, sortBy, sortOrder, ...filters });
          
          let lastRow = -1;
          if (response.data.length < limit) {
             lastRow = startRow + response.data.length;
          } else if (response.total) {
             lastRow = response.total;
          }
          
          params.successCallback(response.data, lastRow);
        } catch (error) {
          console.error("Failed to fetch grid data", error);
          params.failCallback();
        }
      }
    };
  }, [fetchData]);

  const onGridReady = useCallback((params) => {
    if (fetchData && datasource) {
      params.api.setGridOption('datasource', datasource);
    }
  }, [datasource, fetchData]);

  return (
    <div className="card border-0 shadow-sm overflow-hidden">
      <div className="ag-theme-quartz custom-bootstrap-theme" style={{ height: '600px', width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowModelType={fetchData ? 'infinite' : 'clientSide'}
          rowData={fetchData ? undefined : rowData}
          onGridReady={onGridReady}
          pagination={true}
          paginationPageSize={50}
          cacheBlockSize={50}
          rowDragManaged={true}
          onRowClicked={onRowClicked}
          onSelectionChanged={onSelectionChanged}
          rowSelection="multiple"
          suppressCellFocus={true}
          animateRows={false}
        />
      </div>
    </div>
  );
};

export default AdvancedDataTable;

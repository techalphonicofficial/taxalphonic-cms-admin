import { useCallback, useRef, useState } from 'react';
import api from '../../services/api';

/**
 * Server-side paging / search / sort for a DataGrid backed by a BaseService list API
 * (`GET url?page=&limit=&sortBy=&sortOrder=&<field>_like=`).
 *
 *   const list = useServerList('/locations', { searchField: 'name', params: { stateId } });
 *   <DataGrid {...list.gridProps} columns={columns} />
 *
 * Handles both response shapes ({ data: [...], pagination } and { data: { data, pagination } })
 * and ignores responses that arrive after a newer request.
 */
export default function useServerList(url, { searchField = 'name', searchParam, defaultSort = 'name', defaultOrder = 'ASC', params = {} } = {}) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({}); // extra top-level fields of the response (e.g. counts)
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);
  const lastArgs = useRef(null);
  const paramsKey = JSON.stringify(params);

  const fetchData = useCallback(async (args) => {
    lastArgs.current = args;
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    const sort = args.sorting?.[0];
    const query = {
      page: args.pageIndex + 1,
      limit: args.pageSize,
      sortBy: sort?.id || defaultSort,
      sortOrder: sort ? (sort.desc ? 'DESC' : 'ASC') : defaultOrder,
      ...JSON.parse(paramsKey),
    };
    Object.keys(query).forEach((k) => { if (query[k] === '' || query[k] == null) delete query[k]; });
    if (args.globalFilter?.trim()) query[searchParam || `${searchField}_like`] = args.globalFilter.trim();
    try {
      const res = await api.get(url, { params: query });
      if (id !== requestId.current) return;
      const body = res.data || {};
      const payload = Array.isArray(body.data) ? body : (body.data && Array.isArray(body.data.data) ? body.data : { data: [] });
      const pagination = payload.pagination || body.pagination || {};
      const items = payload.data || [];
      const count = Number(pagination.totalItems ?? items.length) || 0;
      setRows(items);
      setTotal(count);
      const { data: _d, pagination: _p, success: _s, message: _m, errors: _e, ...extra } = body;
      setMeta(extra);
      setPageCount(Math.max(1, Number(pagination.totalPages) || Math.ceil(count / args.pageSize) || 1));
    } catch (err) {
      if (id !== requestId.current) return;
      setRows([]);
      setTotal(0);
      setError(err.response?.data?.message || err.message);
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [url, searchField, searchParam, defaultSort, defaultOrder, paramsKey]);

  /** Reload the current page (after a delete or status change). */
  const reload = useCallback(() => {
    if (lastArgs.current) fetchData(lastArgs.current);
  }, [fetchData]);

  return {
    rows,
    total,
    meta,
    reload,
    gridProps: { data: rows, totalRows: total, pageCount, fetchData, isLoading, error },
  };
}

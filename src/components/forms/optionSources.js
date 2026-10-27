import { useEffect, useState } from 'react';
import api from '../../services/api';

/*
 * Form Builder "Options from": a Dropdown / Radio / Checkbox field can take its options from site
 * data (services, landing pages, states, ...) instead of typed options. The backend
 * (services/forms/optionSources.js) fills them when the website loads the form and checks
 * submissions against the same list; typed options are added after it (e.g. "Other").
 * Here: the source list for the picker and the live options for previews (cached per session tab).
 */

const cache = new Map(); // url -> { at, promise }
const CACHE_MS = 20 * 1000; // short: a service published / moved to draft shows up quickly

const cached = (url, params) => {
  const key = `${url}?${new URLSearchParams(params || {})}`;
  const hit = cache.get(key);
  if (!hit || Date.now() - hit.at > CACHE_MS) {
    const promise = api.get(url, { params }).then(res => res.data?.data || []).catch((error) => {
      cache.delete(key);
      throw error;
    });
    cache.set(key, { at: Date.now(), promise });
    return promise;
  }
  return hit.promise;
};

/** [{ key, label, filter, count }] */
export function useOptionSources() {
  const [sources, setSources] = useState(null);
  useEffect(() => {
    let alive = true;
    cached('/forms/option-sources').then(list => alive && setSources(list)).catch(() => alive && setSources([]));
    return () => { alive = false; };
  }, []);
  return sources;
}

/** Service categories for the "Only one category" filter. */
export function useServiceCategories(enabled) {
  const [list, setList] = useState([]);
  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    cached('/service-categories', { limit: 1000 })
      .then(rows => alive && setList((Array.isArray(rows) ? rows : rows?.data || []).map(c => ({ id: c.id, name: c.name })).sort((a, b) => String(a.name).localeCompare(String(b.name)))))
      .catch(() => alive && setList([]));
    return () => { alive = false; };
  }, [enabled]);
  return list;
}

/** One field's current site options ([] while loading / on error). */
export function useSourceOptions(field) {
  const source = field?.optionsSource || '';
  const categoryId = field?.optionsFilter?.categoryId || '';
  const [state, setState] = useState({ key: '', options: [], loading: false });
  const key = source ? `${source}:${categoryId}` : '';
  useEffect(() => {
    if (!source) return undefined;
    let alive = true;
    cached(`/forms/option-sources/${source}`, categoryId ? { categoryId } : {})
      .then(options => alive && setState({ key: `${source}:${categoryId}`, options, loading: false }))
      .catch(() => alive && setState({ key: `${source}:${categoryId}`, options: [], loading: false }));
    return () => { alive = false; };
  }, [source, categoryId]);
  if (!source) return { options: [], loading: false };
  return state.key === key ? state : { options: [], loading: true };
}

/** The fields with "Options from" options filled (site list, then the typed ones), for previews. */
export function useLiveOptionFields(fields) {
  const [live, setLive] = useState({});
  const wanted = (fields || []).filter(f => f?.optionsSource);
  const signature = wanted.map(f => `${f.optionsSource}:${f.optionsFilter?.categoryId || ''}`).sort().join('|');

  useEffect(() => {
    if (!signature) return undefined;
    let alive = true;
    Promise.all([...new Set(signature.split('|'))].map(async (key) => {
      const [source, categoryId] = key.split(':');
      const options = await cached(`/forms/option-sources/${source}`, categoryId ? { categoryId } : {}).catch(() => []);
      return [key, options];
    })).then(entries => alive && setLive(Object.fromEntries(entries)));
    return () => { alive = false; };
  }, [signature]);

  if (!wanted.length) return fields;
  return fields.map((field) => {
    if (!field?.optionsSource) return field;
    const fromSite = live[`${field.optionsSource}:${field.optionsFilter?.categoryId || ''}`] || [];
    const seen = new Set();
    const options = [...fromSite, ...(field.options || [])].filter(o => !seen.has(o.value) && seen.add(o.value));
    return { ...field, options };
  });
}

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import SearchableSelect from '../components/common/SearchableSelect';
import { confirmDialog } from '../components/common/confirm';
import './SeoPageForm.css';

// pSEO Matrix Combinator (/seo-pages/new): pick a service, then locations / industries / technologies
// (combined with it) and independent problems; the planned pages are checked against the existing
// ones (GET /seo-pages/combos) and only new combinations go to POST /seo-pages/bulk-generate,
// which creates DRAFT pages without content (AI content is generated later per page or in bulk).

const makeSlug = (str) => {
  if (!str) return '';
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

const listOf = (res) => {
  const body = res?.data?.data;
  return Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);
};

const byName = (a, b) => String(a.name || a.title || '').localeCompare(String(b.name || b.title || ''));

const PANELS = [
  { field: 'locationIds', type: 'location', key: 'locations', title: 'Locations', icon: 'bi-geo-alt', needsService: true, groupLabel: 'State', group: (x) => x.stateMaster?.name || 'No state', example: (s) => `${s} in Noida` },
  { field: 'industryIds', type: 'industry', key: 'industries', title: 'Industries', icon: 'bi-buildings', needsService: true, example: (s) => `${s} for Restaurants` },
  { field: 'technologyIds', type: 'technology', key: 'technologies', title: 'Technologies', icon: 'bi-cpu', needsService: true, groupLabel: 'Category', group: (x) => x.category || 'Other', example: (s) => `Tally Prime ${s}` },
  { field: 'problemIds', type: 'problem', key: 'problems', title: 'Independent Problems', icon: 'bi-exclamation-octagon', needsService: false, groupLabel: 'Type', group: (x) => x.problemType || 'Other', example: () => 'GST Notice ASMT-10 (no service needed)' },
];

/** One dimension: search, group filter, grouped checkbox list with "select group", chips of the selection. */
function PickerPanel({ panel, items, selected, onChange, disabled, isExisting, hideExisting, serviceName }) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [showAllChips, setShowAllChips] = useState(false);
  const selectedSet = useMemo(() => new Set(selected.map(String)), [selected]);

  const groups = useMemo(() => (panel.group ? [...new Set(items.map(panel.group))].sort((a, b) => a.localeCompare(b)) : []), [items, panel]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((x) => {
      if (hideExisting && isExisting(x)) return false;
      if (group && panel.group(x) !== group) return false;
      if (!term) return true;
      return `${x.name} ${panel.group ? panel.group(x) : ''}`.toLowerCase().includes(term);
    });
  }, [items, search, group, hideExisting, isExisting, panel]);

  const grouped = useMemo(() => {
    if (!panel.group) return [['', shown]];
    const map = new Map();
    shown.forEach((x) => {
      const g = panel.group(x);
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(x);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [shown, panel]);

  const set = (ids) => onChange([...new Set(ids.map(String))]);
  const toggle = (id) => set(selectedSet.has(String(id)) ? selected.filter((s) => String(s) !== String(id)) : [...selected, id]);
  const addMany = (list) => set([...selected, ...list.map((x) => x.id)]);
  const removeMany = (list) => {
    const drop = new Set(list.map((x) => String(x.id)));
    set(selected.filter((s) => !drop.has(String(s))));
  };
  const groupState = (list) => {
    const n = list.filter((x) => selectedSet.has(String(x.id))).length;
    return n === 0 ? 'none' : n === list.length ? 'all' : 'some';
  };

  const newShown = shown.filter((x) => !isExisting(x));
  const selectedItems = items.filter((x) => selectedSet.has(String(x.id)));
  const chips = showAllChips ? selectedItems : selectedItems.slice(0, 12);

  return (
    <div className={`mx-panel${disabled ? ' is-disabled' : ''}${selected.length ? ' has-selection' : ''}`}>
      <div className="mx-panel-head">
        <div className="mx-panel-title">
          <span className="mx-panel-icon"><i className={`bi ${panel.icon}`}></i></span>
          <div>
            <b>{panel.title}</b>
            <small>{panel.needsService ? `Combined with the service · e.g. ${panel.example(serviceName || 'Service')}` : panel.example()}</small>
          </div>
        </div>
        <span className={`mx-count${selected.length ? ' on' : ''}`}>{selected.length}<span>/{items.length}</span></span>
      </div>

      {disabled ? (
        <div className="mx-locked">
          <i className="bi bi-lock"></i>
          <span>Choose a service in step 1 first.</span>
        </div>
      ) : (
        <>
          <div className="mx-tools">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-body"><i className="bi bi-search"></i></span>
              <input type="search" className="form-control" placeholder={`Search ${items.length} ${panel.title.toLowerCase()}…`} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {panel.group && (
              <select className="form-select form-select-sm" value={group} onChange={(e) => setGroup(e.target.value)} aria-label={panel.groupLabel}>
                <option value="">All {panel.groupLabel === 'Category' ? 'categories' : `${panel.groupLabel.toLowerCase()}s`} ({groups.length})</option>
                {groups.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            )}
          </div>

          <div className="mx-actions">
            <button type="button" onClick={() => addMany(shown)} disabled={!shown.length}>
              <i className="bi bi-check2-all"></i> Select shown ({shown.length})
            </button>
            <button type="button" onClick={() => addMany(newShown)} disabled={!newShown.length} title="Only the ones that do not have a page yet">
              <i className="bi bi-stars"></i> Only new ({newShown.length})
            </button>
            <button type="button" onClick={() => (search || group ? removeMany(shown) : set([]))} disabled={!selected.length} className="ms-auto text-danger">
              <i className="bi bi-x-lg"></i> {search || group ? 'Unselect shown' : 'Clear'}
            </button>
          </div>

          <div className="mx-list" role="listbox" aria-multiselectable="true" aria-label={panel.title}>
            {shown.length === 0 && <div className="mx-empty">Nothing matches.</div>}
            {grouped.map(([g, list]) => (
              <React.Fragment key={g || 'all'}>
                {panel.group && (
                  <label className="mx-group">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={groupState(list) === 'all'}
                      ref={(el) => { if (el) el.indeterminate = groupState(list) === 'some'; }}
                      onChange={() => (groupState(list) === 'all' ? removeMany(list) : addMany(list))}
                    />
                    <span>{g}</span>
                    <small>{list.filter((x) => selectedSet.has(String(x.id))).length}/{list.length}</small>
                  </label>
                )}
                {list.map((x) => {
                  const exists = isExisting(x);
                  const on = selectedSet.has(String(x.id));
                  return (
                    <label key={x.id} className={`mx-item${on ? ' on' : ''}${exists ? ' exists' : ''}`}>
                      <input type="checkbox" className="form-check-input" checked={on} onChange={() => toggle(x.id)} />
                      <span className="mx-item-name">{x.name}</span>
                      {exists && <span className="mx-tag" title="A page for this combination already exists; it will be skipped">Exists</span>}
                    </label>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {selectedItems.length > 0 && (
            <div className="mx-chips">
              {chips.map((x) => (
                <span key={x.id} className={`mx-chip${isExisting(x) ? ' exists' : ''}`}>
                  {x.name}
                  <button type="button" onClick={() => toggle(x.id)} aria-label={`Remove ${x.name}`}><i className="bi bi-x"></i></button>
                </span>
              ))}
              {selectedItems.length > 12 && (
                <button type="button" className="mx-more" onClick={() => setShowAllChips((v) => !v)}>
                  {showAllChips ? 'Show less' : `+${selectedItems.length - 12} more`}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const SeoPageForm = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ services: [], locations: [], industries: [], technologies: [], problems: [], countries: [] });
  const [existingPages, setExistingPages] = useState([]);
  const [selections, setSelections] = useState({ serviceId: '', locationIds: [], industryIds: [], technologyIds: [], problemIds: [] });
  const [hideExisting, setHideExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [planFilter, setPlanFilter] = useState('all'); // all | new | existing
  const [planSearch, setPlanSearch] = useState('');
  const [planLimit, setPlanLimit] = useState(100);

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        const [srv, loc, ind, tech, prob, seo, ctry] = await Promise.all([
          api.get('/services?limit=2000&sortBy=title&sortOrder=ASC&categoryId_ne=fd630088-6d13-47eb-a5b9-9de555ec5e82'),
          api.get('/locations?limit=5000&sortBy=name&sortOrder=ASC'),
          api.get('/industries?limit=1000&sortBy=name&sortOrder=ASC'),
          api.get('/technologies?limit=1000&sortBy=name&sortOrder=ASC'),
          api.get('/problems?limit=1000&sortBy=name&sortOrder=ASC'),
          // Only ids and slugs of the existing pages (no content), for the duplicate check.
          api.get('/seo-pages/combos'),
          // Only for the location slug preview; a failure just shows "global/…".
          api.get('/countries?limit=1000').catch(() => null),
        ]);
        const active = (list) => list.filter((x) => x.active !== false && x.active !== 0).sort(byName);
        setData({
          services: listOf(srv),
          locations: active(listOf(loc)),
          industries: active(listOf(ind)),
          technologies: active(listOf(tech)),
          problems: active(listOf(prob)),
          countries: listOf(ctry),
        });
        setExistingPages(listOf(seo));
      } catch {
        toast.error('Failed to load backend dictionaries and existing SEO matrix pages.');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const selectedService = useMemo(
    () => data.services.find((s) => String(s.id) === String(selections.serviceId)) || null,
    [data.services, selections.serviceId]
  );
  const serviceSlug = selectedService ? (selectedService.slug || makeSlug(selectedService.title)) : '';

  // Existing combinations for the selected service (and all problems / slugs).
  const existingCombos = useMemo(() => {
    const out = { locations: new Set(), industries: new Set(), technologies: new Set(), problems: new Set(), slugs: new Set() };
    existingPages.forEach((page) => {
      if (page.slug) out.slugs.add(page.slug.trim().toLowerCase());
      if (selectedService && String(page.serviceId) === String(selectedService.id)) {
        if (page.locationId) out.locations.add(String(page.locationId));
        if (page.industryId) out.industries.add(String(page.industryId));
        if (page.technologyId) out.technologies.add(String(page.technologyId));
      }
      if (page.problemId) out.problems.add(String(page.problemId));
    });
    return out;
  }, [existingPages, selectedService]);

  // Website path of a service + location page, built exactly like the backend's bulk-generate:
  // "<country>/<service>-<location>", e.g. india/seo-services-noida.
  const slugFor = useMemo(() => ({
    location: (loc) => {
      const country = data.countries.find((c) => String(c.id) === String(loc.countryId));
      const countrySlug = country ? (country.slug || makeSlug(country.name)) : 'global';
      return `${countrySlug}/${serviceSlug}-${loc.slug || makeSlug(loc.name)}`.toLowerCase();
    },
    industry: (ind) => `${serviceSlug}-for-${ind.slug || makeSlug(ind.name)}`.toLowerCase(),
    technology: (tech) => `${tech.slug || makeSlug(tech.name)}-${serviceSlug}`.toLowerCase(),
    problem: (prob) => (prob.slug || makeSlug(prob.name)).toLowerCase(),
  }), [data.countries, serviceSlug]);

  const existsFns = useMemo(() => {
    const check = (type, setKey) => (item) => {
      if (!item) return false;
      if (type !== 'problem' && !selectedService) return false;
      if (existingCombos[setKey].has(String(item.id))) return true;
      return existingCombos.slugs.has(slugFor[type](item));
    };
    return {
      location: check('location', 'locations'),
      industry: check('industry', 'industries'),
      technology: check('technology', 'technologies'),
      problem: check('problem', 'problems'),
    };
  }, [existingCombos, selectedService, slugFor]);

  const plannedCombinations = useMemo(() => {
    const list = [];
    const add = (panel, label, title) => {
      selections[panel.field].forEach((id) => {
        const item = data[panel.key].find((x) => String(x.id) === String(id));
        if (!item) return;
        list.push({ type: panel.type, typeName: label, entityId: item.id, title: title(item), slug: slugFor[panel.type](item), isExisting: existsFns[panel.type](item) });
      });
    };
    if (selectedService) {
      add(PANELS[0], 'Location', (l) => `${selectedService.title} in ${l.name}`);
      add(PANELS[1], 'Industry', (i) => `${selectedService.title} for ${i.name}`);
      add(PANELS[2], 'Technology', (t) => `${t.name} ${selectedService.title}`);
    }
    add(PANELS[3], 'Problem', (p) => p.name);
    return list;
  }, [selectedService, selections, data, slugFor, existsFns]);

  const stats = useMemo(() => {
    const total = plannedCombinations.length;
    const existing = plannedCombinations.filter((c) => c.isExisting).length;
    const byType = {};
    plannedCombinations.forEach((c) => {
      byType[c.type] = byType[c.type] || { total: 0, fresh: 0 };
      byType[c.type].total += 1;
      if (!c.isExisting) byType[c.type].fresh += 1;
    });
    return { total, existing, newItems: total - existing, byType };
  }, [plannedCombinations]);

  const visiblePlan = useMemo(() => {
    const term = planSearch.trim().toLowerCase();
    return plannedCombinations.filter((c) => {
      if (planFilter === 'new' && c.isExisting) return false;
      if (planFilter === 'existing' && !c.isExisting) return false;
      return !term || `${c.title} ${c.slug}`.toLowerCase().includes(term);
    });
  }, [plannedCombinations, planFilter, planSearch]);

  const setField = (field) => (ids) => setSelections((prev) => ({ ...prev, [field]: ids }));
  const clearAll = () => setSelections((prev) => ({ ...prev, locationIds: [], industryIds: [], technologyIds: [], problemIds: [] }));

  const handleGenerate = async () => {
    if (!selections.serviceId && selections.problemIds.length === 0) {
      return toast.warning('Select a service or some independent problems first.');
    }
    if (stats.newItems === 0) {
      return toast.warning(stats.total ? `All ${stats.total} selected combinations already exist.` : 'Select at least one location, industry, technology or problem.');
    }
    if (stats.newItems > 50) {
      const ok = await confirmDialog({
        title: `Create ${stats.newItems.toLocaleString('en-IN')} draft pages?`,
        message: 'They are created as DRAFT pages without content. Writing their content with AI later costs AI credits for every page.',
        tone: 'warning',
        confirmText: `Create ${stats.newItems.toLocaleString('en-IN')} pages`,
      });
      if (!ok) return;
    }

    const fresh = (panel) => selections[panel.field].filter((id) => {
      const item = data[panel.key].find((x) => String(x.id) === String(id));
      return item && !existsFns[panel.type](item);
    });

    setLoading(true);
    try {
      const res = await api.post('/seo-pages/bulk-generate', {
        serviceId: selections.serviceId,
        locationIds: selectedService ? fresh(PANELS[0]) : [],
        industryIds: selectedService ? fresh(PANELS[1]) : [],
        technologyIds: selectedService ? fresh(PANELS[2]) : [],
        problemIds: fresh(PANELS[3]),
      });
      const { created, overlaps } = res.data.data;
      if (created > 0) toast.success(`Created ${created} new SEO page${created === 1 ? '' : 's'} as drafts.${overlaps > 0 ? ` Skipped ${overlaps} duplicates.` : ''}`);
      else toast.info(`Nothing new created. Skipped ${overlaps} existing duplicates.`);
      navigate('/seo-pages');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate matrix');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="container-fluid p-5 text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-muted">Loading SEO matrix configuration and existing pages...</p>
      </div>
    );
  }

  const servicePages = selectedService ? existingPages.filter((p) => String(p.serviceId) === String(selectedService.id)).length : 0;
  const anySelected = selections.locationIds.length + selections.industryIds.length + selections.technologyIds.length + selections.problemIds.length > 0;

  return (
    <div className="container-fluid p-0 mx-page">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="mb-1 fw-bold">pSEO Matrix Combinator</h4>
          <p className="text-muted mb-0">
            Pick a service and what to combine it with. Pages that already exist on{' '}
            <Link to="/seo-pages" className="text-decoration-none fw-semibold">SEO Pages</Link> are skipped automatically.
          </p>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <div className="form-check form-switch m-0">
            <input className="form-check-input" type="checkbox" id="hideExistingSwitch" checked={hideExisting} onChange={(e) => setHideExisting(e.target.checked)} />
            <label className="form-check-label small fw-medium" htmlFor="hideExistingSwitch">Hide existing</label>
          </div>
          <Link to="/seo-pages" className="btn btn-light border shadow-sm rounded-pill px-4">
            <i className="bi bi-arrow-left me-2"></i> Back to Matrix
          </Link>
        </div>
      </div>

      <div className="mx-layout">
        <div className="mx-main">
          {/* Step 1 */}
          <section className="mx-step">
            <div className="mx-step-head">
              <span className="mx-step-num">1</span>
              <div>
                <h5>Choose the service</h5>
                <p>Needed for location, industry and technology pages. Problems can be generated without it.</p>
              </div>
            </div>
            <SearchableSelect
              spaced={false}
              value={selections.serviceId}
              onChange={(serviceId) => setSelections((p) => ({ ...p, serviceId }))}
              placeholder="-- Choose Base Service --"
              emptyLabel="-- None --"
              searchPlaceholder={`Search ${data.services.length} services...`}
              options={data.services.map((s) => {
                const n = existingPages.filter((p) => String(p.serviceId) === String(s.id)).length;
                return { value: s.id, label: s.title, sub: `/${s.slug} · ${n} existing SEO page${n === 1 ? '' : 's'}` };
              })}
            />
            {selectedService && (
              <div className="mx-service-note">
                <i className="bi bi-check-circle-fill text-success"></i>
                <span><b>{selectedService.title}</b> already has <b>{servicePages}</b> SEO page{servicePages === 1 ? '' : 's'}. Items with an <span className="mx-tag">Exists</span> tag are skipped.</span>
              </div>
            )}
          </section>

          {/* Step 2 */}
          <section className="mx-step">
            <div className="mx-step-head">
              <span className="mx-step-num">2</span>
              <div className="flex-grow-1">
                <h5>Choose what to combine</h5>
                <p>Every selected item becomes one page. Tick a group heading to take the whole state / category.</p>
              </div>
              {anySelected && (
                <button type="button" className="btn btn-sm btn-outline-danger rounded-pill" onClick={clearAll}>
                  <i className="bi bi-x-lg me-1"></i>Clear all
                </button>
              )}
            </div>
            <div className="mx-panels">
              {PANELS.map((panel) => (
                <PickerPanel
                  key={panel.field}
                  panel={panel}
                  items={data[panel.key]}
                  selected={selections[panel.field]}
                  onChange={setField(panel.field)}
                  disabled={panel.needsService && !selectedService}
                  isExisting={existsFns[panel.type]}
                  hideExisting={hideExisting}
                  serviceName={selectedService?.title}
                />
              ))}
            </div>
          </section>

          {/* Step 3 */}
          <section className="mx-step">
            <div className="mx-step-head">
              <span className="mx-step-num">3</span>
              <div className="flex-grow-1">
                <h5>Review the pages</h5>
                <p>Titles and website addresses of the pages that will be created.</p>
              </div>
            </div>
            {stats.total === 0 ? (
              <div className="mx-empty-plan">
                <i className="bi bi-grid-3x3-gap"></i>
                <p className="mb-0">Nothing selected yet. Pick items in step 2 to see the pages here.</p>
              </div>
            ) : (
              <>
                <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                  <div className="btn-group btn-group-sm">
                    {[['all', `All (${stats.total})`], ['new', `New (${stats.newItems})`], ['existing', `Skipped (${stats.existing})`]].map(([k, label]) => (
                      <button key={k} type="button" className={`btn ${planFilter === k ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => { setPlanFilter(k); setPlanLimit(100); }}>{label}</button>
                    ))}
                  </div>
                  <input type="search" className="form-control form-control-sm ms-auto" style={{ maxWidth: 260 }} placeholder="Search titles or URLs…" value={planSearch} onChange={(e) => { setPlanSearch(e.target.value); setPlanLimit(100); }} />
                </div>
                <div className="mx-plan">
                  <table className="table table-sm table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: 110 }}>Type</th>
                        <th>Page title</th>
                        <th>Website address</th>
                        <th className="text-end" style={{ width: 110 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePlan.slice(0, planLimit).map((item) => (
                        <tr key={`${item.type}-${item.entityId}`} className={item.isExisting ? 'is-existing' : ''}>
                          <td><span className={`mx-type t-${item.type}`}>{item.typeName}</span></td>
                          <td className="fw-medium">{item.title}</td>
                          <td className="font-monospace small text-muted text-break">/{item.slug}</td>
                          <td className="text-end">
                            {item.isExisting
                              ? <span className="badge bg-warning-subtle text-warning-emphasis"><i className="bi bi-skip-forward me-1"></i>Skipped</span>
                              : <span className="badge bg-success-subtle text-success"><i className="bi bi-plus-circle me-1"></i>New</span>}
                          </td>
                        </tr>
                      ))}
                      {visiblePlan.length === 0 && (
                        <tr><td colSpan={4} className="text-center text-muted py-4">No pages match.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {visiblePlan.length > planLimit && (
                  <button type="button" className="btn btn-sm btn-link" onClick={() => setPlanLimit((n) => n + 200)}>
                    Show more ({(visiblePlan.length - planLimit).toLocaleString('en-IN')} left)
                  </button>
                )}
              </>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="mx-summary">
          <div className="mx-summary-card">
            <h6>Summary</h6>
            <div className="mx-sum-service">
              <small>Service</small>
              <b>{selectedService ? selectedService.title : <span className="text-muted fw-normal">Not chosen</span>}</b>
            </div>
            <ul className="mx-sum-list">
              {PANELS.map((panel) => {
                const s = stats.byType[panel.type];
                return (
                  <li key={panel.type} className={s ? 'on' : ''}>
                    <i className={`bi ${panel.icon}`}></i>
                    <span>{panel.title}</span>
                    <b>{s ? s.total : 0}</b>
                  </li>
                );
              })}
            </ul>
            <div className="mx-sum-totals">
              <div className="new"><b>{stats.newItems.toLocaleString('en-IN')}</b><small>new pages</small></div>
              <div className="skip"><b>{stats.existing.toLocaleString('en-IN')}</b><small>skipped</small></div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || stats.newItems === 0}
              className="btn btn-primary w-100 rounded-pill py-2 fw-semibold"
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creating pages…</>
              ) : stats.newItems > 0 ? (
                <><i className="bi bi-lightning-charge me-2"></i>Create {stats.newItems.toLocaleString('en-IN')} page{stats.newItems === 1 ? '' : 's'}</>
              ) : (
                stats.total > 0 ? 'All selected already exist' : 'Select items to create pages'
              )}
            </button>
            <p className="mx-sum-note">
              <i className="bi bi-info-circle me-1"></i>
              Pages are created as <b>drafts</b> without content and hidden from Google. Write their content with AI from the SEO Pages list, then publish.
            </p>
            {stats.newItems > 100 && (
              <p className="mx-sum-warn">
                <i className="bi bi-exclamation-triangle me-1"></i>
                That is a lot of pages. Each one costs AI credits when its content is generated.
              </p>
            )}
            <Link to="/seo-pages" className="btn btn-light w-100 rounded-pill mt-2">Cancel</Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SeoPageForm;

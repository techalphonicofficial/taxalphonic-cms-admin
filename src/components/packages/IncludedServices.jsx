import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import SearchableSelect from '../common/SearchableSelect';

/*
 * "Services in this package": makes a package a bundle (e.g. Income Tax + GST + ROC management).
 * value: [{ serviceId | null, title, label, note }], saved in package.features.includedServices.
 * - picked service: `title` keeps its name (shown if the service is later unpublished / deleted);
 *   the website shows its current title and links to /<slug> while it is published.
 * - custom item (not a service on the site): only `title`, never a link.
 * - `label` (optional) replaces the shown name, `note` is a short line under it ("Monthly returns").
 */
export default function IncludedServices({ value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    let stale = false;
    api.get('/services', { params: { limit: 1000, sortBy: 'title', sortOrder: 'ASC' } })
      .then((res) => {
        if (stale) return;
        const rows = res.data?.data || res.data?.rows || [];
        setServices(Array.isArray(rows) ? rows : []);
      })
      .catch(() => !stale && setFailed(true))
      .finally(() => !stale && setLoading(false));
    return () => { stale = true; };
  }, []);

  const byId = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const chosen = new Set(items.map((item) => item.serviceId).filter(Boolean));
  const options = services
    .filter((s) => !chosen.has(s.id))
    .map((s) => ({ value: s.id, label: s.title, sub: `/${s.slug}${s.status !== 'published' ? ` · ${s.status}` : ''}` }));

  const update = (index, patch) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index) => onChange(items.filter((_, i) => i !== index));
  const move = (index, step) => {
    const next = [...items];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const addService = (serviceId) => {
    const service = byId.get(serviceId);
    if (!service) return;
    onChange([...items, { serviceId, title: service.title, label: '', note: '' }]);
  };
  const addCustom = () => {
    const title = customName.trim();
    if (!title) return;
    onChange([...items, { serviceId: null, title, label: '', note: '' }]);
    setCustomName('');
  };

  return (
    <div>
      <p className="text-muted small mb-3">
        <i className="bi bi-info-circle me-1" />
        Ek package mein kai services jodo (jaise Income Tax Management + GST Management + ECI Management).
        Website par package ke andar inki list dikhegi; published service apne page se link hogi.
        Price <strong>Pricing &amp; Tiers</strong> tab mein poore bundle ka daalo.
      </p>

      {items.length > 0 && (
        <div className="d-flex flex-column gap-2 mb-3">
          {items.map((item, index) => {
            const service = item.serviceId ? byId.get(item.serviceId) : null;
            const missing = item.serviceId && !loading && !failed && !service;
            const draft = service && service.status !== 'published';
            return (
              <div key={`${item.serviceId || 'custom'}-${index}`} className="border rounded p-2" style={{ background: 'var(--bs-tertiary-bg)' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-primary-subtle text-primary-emphasis">{index + 1}</span>
                  <div className="flex-grow-1 fw-semibold text-truncate">
                    {item.serviceId ? <i className="bi bi-briefcase me-1" /> : <i className="bi bi-pencil-square me-1" />}
                    {service?.title || item.title}
                    {!item.serviceId && <span className="badge bg-secondary-subtle text-secondary-emphasis ms-2">Custom</span>}
                    {draft && <span className="badge bg-warning-subtle text-warning-emphasis ms-2" title="Shown without a link until the service is published">{service.status}</span>}
                    {missing && <span className="badge bg-danger-subtle text-danger-emphasis ms-2" title="The service was deleted; its saved name is shown without a link">Service deleted</span>}
                  </div>
                  <div className="btn-group btn-group-sm">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => move(index, -1)} disabled={index === 0} title="Move up"><i className="bi bi-arrow-up" /></button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => move(index, 1)} disabled={index === items.length - 1} title="Move down"><i className="bi bi-arrow-down" /></button>
                    <button type="button" className="btn btn-outline-danger" onClick={() => remove(index)} title="Remove"><i className="bi bi-x-lg" /></button>
                  </div>
                </div>
                <div className="row g-2">
                  <div className="col-md-5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={item.serviceId ? item.label || '' : item.title || ''}
                      onChange={(e) => update(index, item.serviceId ? { label: e.target.value } : { title: e.target.value })}
                      placeholder={item.serviceId ? `Show as (optional): ${service?.title || item.title}` : 'Name'}
                    />
                  </div>
                  <div className="col-md-7">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={item.note || ''}
                      onChange={(e) => update(index, { note: e.target.value })}
                      placeholder="Note (optional), e.g. Monthly GSTR-1 & 3B filing"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="row g-2 align-items-start">
        <div className="col-md-7">
          <label className="form-label small fw-semibold mb-1">Add a service</label>
          <SearchableSelect
            spaced={false}
            size="sm"
            value=""
            onChange={addService}
            options={options}
            placeholder={loading ? 'Loading services…' : 'Search services…'}
            loading={loading}
            error={failed}
          />
          {failed && <div className="text-danger small mt-1">Could not load services. Check that your role can read Services.</div>}
        </div>
        <div className="col-md-5">
          <label className="form-label small fw-semibold mb-1">Or a custom item</label>
          <div className="input-group input-group-sm">
            <input
              type="text"
              className="form-control"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
              placeholder="e.g. ECI Management"
            />
            <button type="button" className="btn btn-outline-primary" onClick={addCustom} disabled={!customName.trim()}>
              <i className="bi bi-plus-lg" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

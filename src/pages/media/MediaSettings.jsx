import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Breadcrumb from '../../components/common/Breadcrumb';
import api from '../../services/api';
import { confirmDialog } from '../../components/common/confirm';

/**
 * Media → Media Settings: where uploaded files are stored. "Project folder" (the backend's
 * uploads/ folder) is the default; a cloud provider (S3 and S3-compatible) is used once its
 * keys pass the connection test and it is saved as active. Existing files stay where they are.
 * Backend: services/storage/StorageService.js, GET/PUT /media/storage-settings, POST .../test.
 */

const STEP_ICON = { true: 'bi-check-circle-fill text-success', false: 'bi-x-circle-fill text-danger' };

const MediaSettings = () => {
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState([]);
  const [activeProvider, setActiveProvider] = useState('local');
  const [saved, setSaved] = useState({});
  const [lastTest, setLastTest] = useState(null);
  const [selected, setSelected] = useState('local');
  const [form, setForm] = useState({});
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const load = async (keepSelection) => {
    try {
      const res = await api.get('/media/storage-settings');
      const data = res.data?.data || {};
      setCatalog(data.catalog || []);
      setActiveProvider(data.activeProvider || 'local');
      setSaved(data.providers || {});
      setLastTest(data.lastTest || null);
      if (!keepSelection) setSelected(data.activeProvider || 'local');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load media settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(false); }, []);

  const provider = useMemo(() => catalog.find((p) => p.key === selected), [catalog, selected]);

  // The form starts from the provider's saved settings (secrets stay empty = keep saved).
  useEffect(() => {
    const stored = saved[selected] || {};
    const next = {};
    (provider?.fields || []).forEach((field) => {
      next[field.key] = field.type === 'switch' ? Boolean(stored[field.key]) : field.secret ? '' : stored[field.key] ?? '';
    });
    setForm(next);
    setResult(null);
  }, [selected, provider, saved]);

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await api.post('/media/storage-settings/test', { provider: selected, settings: form });
      setResult(res.data?.data || null);
      if (res.data?.data?.ok) toast.success('Connection works');
      else toast.error('Connection test failed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  const save = async (activate) => {
    if (activate && selected !== activeProvider) {
      const label = provider?.label || selected;
      const ok = await confirmDialog({
        title: `Store new uploads in ${label}?`,
        message: selected === 'local'
          ? 'New files will be saved in the project uploads/ folder.'
          : 'The settings are tested once more, then every new upload goes to this storage.',
        note: 'Files uploaded before keep working from where they are now.',
        tone: 'warning',
        confirmText: 'Switch storage',
      });
      if (!ok) return;
    }
    setSaving(true);
    try {
      const res = await api.put('/media/storage-settings', { provider: selected, settings: form, activate });
      if (res.data?.data?.test) setResult(res.data.data.test);
      toast.success(activate ? `New uploads now go to ${provider?.label || selected}.` : 'Settings saved.');
      await load(true);
    } catch (error) {
      const test = error.response?.data?.data?.test;
      if (test) setResult(test);
      toast.error(error.response?.data?.message || 'Could not save', { autoClose: 8000 });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;

  const activeLabel = catalog.find((p) => p.key === activeProvider)?.label || activeProvider;
  const isConfigured = (key) => key === 'local' || Boolean(saved[key]);

  return (
    <div>
      <div className="mb-3">
        <Breadcrumb items={[{ label: 'Media Library', link: '/media' }, { label: 'Media Settings' }]} />
        <h2 className="premium-title mb-0 fs-5" style={{ letterSpacing: '-0.5px' }}>Media Settings</h2>
        <p className="text-muted small mb-0">Choose where uploaded images and files are stored.</p>
      </div>

      <div className="alert alert-primary d-flex align-items-center gap-2 py-2">
        <i className="bi bi-cloud-arrow-up fs-5"></i>
        <div>New uploads go to: <b>{activeLabel}</b>. Files uploaded earlier keep working from where they were stored.</div>
      </div>

      <div className="row g-3 mb-4">
        {catalog.map((p) => (
          <div key={p.key} className="col-sm-6 col-lg-3">
            <button
              type="button"
              onClick={() => setSelected(p.key)}
              className={`card h-100 w-100 text-start p-3 border ${selected === p.key ? 'border-primary border-2 shadow-sm' : ''}`}
              style={{ background: 'var(--bs-body-bg)' }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <i className={`bi ${p.icon} fs-4 text-primary`}></i>
                {activeProvider === p.key
                  ? <span className="badge bg-success">Active</span>
                  : isConfigured(p.key) && p.key !== 'local' && <span className="badge bg-light text-muted border">Saved</span>}
              </div>
              <div className="fw-semibold">{p.label}</div>
              <div className="small text-muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</div>
            </button>
          </div>
        ))}
      </div>

      {provider && (
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card shadow-sm border-0 rounded-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1"><i className={`bi ${provider.icon} me-2 text-primary`}></i>{provider.label}</h5>
                <p className="text-muted small">{provider.description}</p>

                {provider.fields.length === 0 ? (
                  <div className="text-muted small">No settings needed: files are saved in <code>cms-backend/uploads/</code> and served at <code>/uploads/…</code>.</div>
                ) : (
                  <div className="row g-3">
                    {provider.fields.map((field) => {
                      const id = `storage-${field.key}`;
                      if (field.type === 'switch') {
                        return (
                          <div key={field.key} className="col-md-6">
                            <div className="form-check form-switch mt-md-4">
                              <input id={id} className="form-check-input" type="checkbox" role="switch" checked={Boolean(form[field.key])} onChange={(e) => set(field.key)(e.target.checked)} />
                              <label className="form-check-label" htmlFor={id}>{field.label}</label>
                            </div>
                          </div>
                        );
                      }
                      const hint = saved[selected]?.[`${field.key}Hint`];
                      const wide = ['publicUrl', 'endpoint'].includes(field.key);
                      return (
                        <div key={field.key} className={wide ? 'col-12' : 'col-md-6'}>
                          <label className="form-label small fw-semibold mb-1" htmlFor={id}>
                            {field.label}{field.required && <span className="text-danger"> *</span>}
                          </label>
                          <input
                            id={id}
                            type={field.secret ? 'password' : 'text'}
                            className="form-control"
                            autoComplete="off"
                            value={form[field.key] ?? ''}
                            onChange={(e) => set(field.key)(e.target.value)}
                            placeholder={field.secret && hint ? `Saved (${hint}) — leave empty to keep` : field.placeholder || ''}
                          />
                          {field.help && <div className="form-text">{field.help}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="d-flex flex-wrap gap-2 mt-4">
                  <button type="button" className="btn btn-outline-primary" onClick={runTest} disabled={testing || saving}>
                    {testing ? <><span className="spinner-border spinner-border-sm me-2"></span>Testing…</> : <><i className="bi bi-plug me-1"></i>Test connection</>}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => save(true)} disabled={saving || testing || (selected === activeProvider && selected === 'local')}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving…</> : selected === activeProvider ? <><i className="bi bi-save me-1"></i>Save changes</> : <><i className="bi bi-check2-circle me-1"></i>Save &amp; use this storage</>}
                  </button>
                  {selected !== 'local' && selected !== activeProvider && (
                    <button type="button" className="btn btn-light border" onClick={() => save(false)} disabled={saving || testing}>Save without switching</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            {result && (
              <div className={`card border-0 shadow-sm rounded-4 mb-3 ${result.ok ? 'border-start border-success border-4' : 'border-start border-danger border-4'}`}>
                <div className="card-body p-4">
                  <h6 className="fw-bold mb-3">{result.ok ? 'Connection works' : 'Connection test failed'}</h6>
                  <ul className="list-unstyled mb-0 small">
                    {result.steps.map((step) => (
                      <li key={step.step} className="d-flex gap-2 mb-2">
                        <i className={`bi ${STEP_ICON[step.ok]}`}></i>
                        <div style={{ minWidth: 0 }}>
                          <div className="fw-semibold">{step.step}</div>
                          <div className="text-muted text-break">{step.message}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4 small">
                <h6 className="fw-bold">How it works</h6>
                <ul className="ps-3 mb-3">
                  <li><b>Test connection</b> uploads a small file, opens it from its public URL and deletes it.</li>
                  <li>A cloud storage is switched on only after that test passes.</li>
                  <li>Keys are stored encrypted; a saved secret is never shown again (leave it empty to keep it).</li>
                  <li>Switching does not move old files; they keep working from where they are.</li>
                  <li>Folders in the Media library work the same with every storage.</li>
                </ul>
                <h6 className="fw-bold">Making files public</h6>
                <p className="mb-0 text-muted">The website shows files from their public URL, so the bucket must allow public reads (a bucket policy, public access, or a CDN / custom domain set as the Public URL).</p>
                {lastTest && (
                  <p className="mb-0 mt-3 text-muted">Last test: {catalog.find((p) => p.key === lastTest.provider)?.label || lastTest.provider} — {lastTest.ok ? 'passed' : 'failed'}, {new Date(lastTest.at).toLocaleString('en-IN')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaSettings;

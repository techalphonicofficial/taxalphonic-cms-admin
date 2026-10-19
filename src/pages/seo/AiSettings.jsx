import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import SearchableSelect from '../../components/common/SearchableSelect';
import api from '../../services/api';
import { confirmDialog } from '../../components/common/confirm';

const PROVIDER_META = {
  openai: { icon: 'bi-openai', keyPlaceholder: 'sk-...', keyUrl: 'https://platform.openai.com/api-keys' },
  anthropic: { icon: 'bi-stars', keyPlaceholder: 'sk-ant-...', keyUrl: 'https://console.anthropic.com/settings/keys' },
  gemini: { icon: 'bi-google', keyPlaceholder: 'AIza...', keyUrl: 'https://aistudio.google.com/apikey' },
};

const TABS = [
  { key: 'provider', label: 'Provider & Model', icon: 'bi-cpu' },
  { key: 'generation', label: 'Generation', icon: 'bi-sliders' },
  { key: 'sections', label: 'Content Sections', icon: 'bi-layout-text-sidebar' },
  { key: 'tiers', label: 'Word Tiers & Tones', icon: 'bi-type' },
];

const errorText = (err, fallback) => {
  const res = err.response?.data;
  const details = (res?.errors || []).map(e => e.message).filter(Boolean);
  return details.length ? `${res.message}: ${details.join(' • ')}` : (res?.message || fallback);
};

const moveItem = (list, index, delta) => {
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(index + delta, 0, item);
  return next;
};

// Up/down/remove controls shared by the editable lists
const RowControls = ({ index, length, onMove, onRemove }) => (
  <div className="btn-group btn-group-sm">
    <button type="button" className="btn btn-light border" disabled={index === 0} onClick={() => onMove(index, -1)} title="Move up"><i className="bi bi-arrow-up"></i></button>
    <button type="button" className="btn btn-light border" disabled={index === length - 1} onClick={() => onMove(index, 1)} title="Move down"><i className="bi bi-arrow-down"></i></button>
    <button type="button" className="btn btn-light border text-danger" disabled={length <= 1} onClick={() => onRemove(index)} title="Remove"><i className="bi bi-trash"></i></button>
  </div>
);

const ProviderPanel = ({ providerKey, label, saved, draft, onDraft, isActive, onActivate }) => {
  const meta = PROVIDER_META[providerKey] || {};
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [manualModel, setManualModel] = useState(false);

  const typedKey = (draft.apiKey || '').trim();
  const hasUsableKey = Boolean(typedKey) || (saved.hasKey && !draft.clearKey);
  const body = () => ({ provider: providerKey, ...(typedKey ? { apiKey: typedKey } : {}) });

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const res = await api.post('/seo-pages/ai-settings/models', body());
      setModels(res.data.data || []);
      setManualModel(false);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(errorText(err, 'Could not fetch models.'));
    } finally {
      setLoadingModels(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post('/seo-pages/ai-settings/test', { ...body(), model: draft.model });
      setTestResult({ ok: true, text: res.data.message });
    } catch (err) {
      setTestResult({ ok: false, text: errorText(err, 'Connection test failed.') });
    } finally {
      setTesting(false);
    }
  };

  const modelInList = models.some(m => m.id === draft.model);

  return (
    <div className={`card border rounded-4 mb-3 ${isActive ? 'border-primary shadow-sm' : ''}`}>
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <i className={`bi ${meta.icon} fs-4 ${isActive ? 'text-primary' : 'text-muted'}`}></i>
            <div>
              <h6 className="fw-bold mb-0">{label}</h6>
              <small className="text-muted">
                {saved.hasKey ? <>Saved key: <code>{saved.keyHint}</code></> : 'No key saved'}
                {saved.model && <> · Saved model: <code>{saved.model}</code></>}
              </small>
            </div>
          </div>
          {isActive
            ? <span className="badge bg-primary px-3 py-2"><i className="bi bi-check2-circle me-1"></i>Active for generation</span>
            : <button type="button" className="btn btn-sm btn-outline-primary" onClick={onActivate}>Use this provider</button>}
        </div>

        {saved.keyUnreadable && (
          <div className="alert alert-warning py-2 small">
            <i className="bi bi-exclamation-triangle me-1"></i>
            The saved key can no longer be decrypted (the server secret changed). Enter the key again.
          </div>
        )}

        <div className="row g-3">
          <div className="col-lg-6">
            <label className="form-label fw-semibold small mb-1">API Key</label>
            <div className="input-group">
              <input
                type="password"
                className="form-control"
                autoComplete="new-password"
                placeholder={saved.hasKey && !draft.clearKey ? `Saved (${saved.keyHint}). Type to replace` : meta.keyPlaceholder}
                value={draft.apiKey || ''}
                onChange={e => onDraft({ apiKey: e.target.value, clearKey: false })}
              />
              {saved.hasKey && (
                <button type="button" className={`btn ${draft.clearKey ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => onDraft({ clearKey: !draft.clearKey, apiKey: '' })} title="Remove the saved key on save">
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
            <small className="text-muted">
              {draft.clearKey ? <span className="text-danger">The saved key will be removed when you save.</span> : <>Stored encrypted. <a href={meta.keyUrl} target="_blank" rel="noreferrer">Get a key</a></>}
            </small>
          </div>
          <div className="col-lg-6">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-semibold small mb-0">Model</label>
              <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => setManualModel(v => !v)}>
                {manualModel ? 'Pick from list' : 'Type model id'}
              </button>
            </div>
            <div className="input-group">
              {manualModel || models.length === 0 ? (
                <input type="text" className="form-control" placeholder={models.length === 0 ? 'Fetch models, or type a model id' : 'e.g. gpt-5.1'} value={draft.model || ''} onChange={e => onDraft({ model: e.target.value })} />
              ) : (
                <SearchableSelect
                  className="flex-grow-1"
                  spaced={false}
                  value={draft.model || ''}
                  onChange={model => onDraft({ model })}
                  placeholder="— Choose a model —"
                  searchPlaceholder={`Search ${models.length} models...`}
                  options={[
                    ...(draft.model && !modelInList ? [{ value: draft.model, label: `${draft.model} (saved)` }] : []),
                    ...models.map(m => ({ value: m.id, label: m.name || m.id, sub: m.name !== m.id ? m.id : undefined })),
                  ]}
                />
              )}
              <button type="button" className="btn btn-outline-secondary" onClick={fetchModels} disabled={!hasUsableKey || loadingModels}>
                {loadingModels ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-arrow-repeat me-1"></i>Fetch models</>}
              </button>
            </div>
            <small className="text-muted">Live list from {label} for this key.</small>
          </div>
          <div className="col-12 d-flex align-items-center gap-3 flex-wrap">
            <button type="button" className="btn btn-sm btn-outline-dark" onClick={testConnection} disabled={!hasUsableKey || !draft.model || testing}>
              {testing ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-plug me-1"></i>}
              Test connection
            </button>
            {testResult && (
              <span className={`small ${testResult.ok ? 'text-success' : 'text-danger'}`}>
                <i className={`bi ${testResult.ok ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>{testResult.text}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AiSettings = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('provider');
  const [form, setForm] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['seo-ai-settings'],
    queryFn: async () => (await api.get('/seo-pages/ai-settings')).data.data,
  });

  const loadFrom = (d) => {
    setForm({
      activeProvider: d.activeProvider || '',
      generation: { ...d.generation },
      sections: d.sections.map(s => ({ ...s, targetWords: { ...s.targetWords } })),
      wordCountTiers: d.wordCountTiers.map(t => ({ ...t })),
      toneOptions: d.toneOptions.map(t => ({ ...t })),
    });
    setDrafts(Object.fromEntries(d.providerList.map(p => [p.key, { apiKey: '', clearKey: false, model: d.providers[p.key]?.model || '' }])));
  };

  useEffect(() => { if (data) loadFrom(data); }, [data]);

  if (isLoading || !form) {
    if (isError) return <div className="alert alert-danger">{error.response?.data?.message || 'Failed to load AI settings.'}</div>;
    return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;
  }

  const set = (patch) => setForm(prev => ({ ...prev, ...patch }));
  const setGen = (patch) => setForm(prev => ({ ...prev, generation: { ...prev.generation, ...patch } }));
  const setListItem = (listKey, index, patch) => setForm(prev => ({
    ...prev,
    [listKey]: prev[listKey].map((item, i) => (i === index ? { ...item, ...patch } : item)),
  }));
  const tierKeys = form.wordCountTiers.map(t => t.key).filter(Boolean);

  const handleSave = async () => {
    setSaving(true);
    try {
      const providers = Object.fromEntries(Object.entries(drafts).map(([key, d]) => [key, {
        model: d.model,
        ...(d.clearKey ? { clearKey: true } : {}),
        ...(d.apiKey?.trim() ? { apiKey: d.apiKey.trim() } : {}),
      }]));
      const res = await api.put('/seo-pages/ai-settings', { ...form, activeProvider: form.activeProvider || null, providers });
      queryClient.setQueryData(['seo-ai-settings'], res.data.data);
      queryClient.invalidateQueries({ queryKey: ['seo-ai-config'] });
      toast.success('AI settings saved.');
    } catch (err) {
      toast.error(errorText(err, 'Failed to save AI settings.'), { autoClose: 8000 });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async (keys) => {
    if (!(await confirmDialog({ title: 'Reset to the built-in defaults?', message: 'These values are replaced with the built-in defaults. Nothing is saved until you click Save.', tone: 'warning', confirmText: 'Reset' }))) return;
    const d = data.defaults;
    const patch = {};
    keys.forEach(k => {
      if (k === 'generation') patch.generation = { ...d.generation };
      if (k === 'sections') patch.sections = d.sections.map(s => ({ ...s, targetWords: { ...s.targetWords } }));
      if (k === 'wordCountTiers') patch.wordCountTiers = d.wordCountTiers.map(t => ({ ...t }));
      if (k === 'toneOptions') patch.toneOptions = d.toneOptions.map(t => ({ ...t }));
    });
    set(patch);
  };

  const addSection = () => set({
    sections: [...form.sections, {
      id: `section${form.sections.length + 1}`, name: '', icon: 'bi-card-text', description: '', instructions: '',
      targetWords: Object.fromEntries(tierKeys.map(k => [k, 150])), enabled: true,
    }],
  });

  const active = data.active;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="mb-1 fw-bold">pSEO AI Settings</h4>
          <p className="text-muted mb-0">Choose the AI provider and model, and control how matrix page content is generated.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/seo-pages" className="btn btn-light border rounded-pill px-4"><i className="bi bi-arrow-left me-2"></i>Matrix Pages</Link>
          <button type="button" className="btn btn-primary rounded-pill px-4" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
            Save Settings
          </button>
        </div>
      </div>

      <div className={`alert ${active ? (active.source === 'env' ? 'alert-warning' : 'alert-success') : 'alert-danger'} d-flex align-items-center gap-2 rounded-4`}>
        <i className={`bi ${active ? 'bi-robot' : 'bi-exclamation-octagon'} fs-5`}></i>
        <div>
          {active
            ? <>Generation currently uses <strong>{active.label}</strong> · <code>{active.model}</code>
              {active.source === 'env' && <> (fallback from the server <code>.env</code> GEMINI_API_KEY; choose a provider below to manage it here)</>}</>
            : 'No AI provider is configured. Generation will fail until you add an API key and model below.'}
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        {TABS.map(t => (
          <li className="nav-item" key={t.key}>
            <button type="button" className={`nav-link ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              <i className={`bi ${t.icon} me-1`}></i>{t.label}
            </button>
          </li>
        ))}
      </ul>

      {tab === 'provider' && (
        <div>
          {data.providerList.map(p => (
            <ProviderPanel
              key={p.key}
              providerKey={p.key}
              label={p.label}
              saved={data.providers[p.key] || {}}
              draft={drafts[p.key] || {}}
              onDraft={(patch) => setDrafts(prev => ({ ...prev, [p.key]: { ...prev[p.key], ...patch } }))}
              isActive={form.activeProvider === p.key}
              onActivate={() => set({ activeProvider: p.key })}
            />
          ))}
          {form.activeProvider && (
            <button type="button" className="btn btn-sm btn-link text-muted" onClick={() => set({ activeProvider: '' })}>
              Clear active provider (fall back to .env)
            </button>
          )}
        </div>
      )}

      {tab === 'generation' && (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Temperature ({form.generation.temperature})</label>
                <input type="range" className="form-range" min="0" max="2" step="0.1" value={form.generation.temperature} onChange={e => setGen({ temperature: Number(e.target.value) })} />
                <small className="text-muted">Lower = consistent, higher = creative. Ignored by models that do not support it.</small>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Max output tokens</label>
                <input type="number" className="form-control" min="256" max="128000" value={form.generation.maxOutputTokens} onChange={e => setGen({ maxOutputTokens: e.target.value })} />
                <small className="text-muted">Must fit the model's limit. ~16000 suits comprehensive pages.</small>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Attempts per page</label>
                <input type="number" className="form-control" min="1" max="5" value={form.generation.maxRetries} onChange={e => setGen({ maxRetries: e.target.value })} />
                <small className="text-muted">Retries on rate limits and server errors.</small>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold small">Timeout (seconds)</label>
                <input type="number" className="form-control" min="30" max="900" value={form.generation.timeoutSeconds} onChange={e => setGen({ timeoutSeconds: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small">Default word tier</label>
                <select className="form-select" value={form.generation.defaultTier} onChange={e => setGen({ defaultTier: e.target.value })}>
                  {form.wordCountTiers.map(t => <option key={t.key} value={t.key}>{t.label || t.key}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold small">Default tone</label>
                <select className="form-select" value={form.generation.defaultTone} onChange={e => setGen({ defaultTone: e.target.value })}>
                  {form.toneOptions.map(t => <option key={t.key} value={t.key}>{t.name || t.key}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small">System prompt (AI role)</label>
                <textarea className="form-control font-monospace" rows="6" style={{ fontSize: '0.85rem' }} value={form.generation.systemPrompt} onChange={e => setGen({ systemPrompt: e.target.value })} />
                <small className="text-muted">
                  Sent as the system instruction. The page context (service, location, industry...), section list and the JSON output format are added automatically.
                </small>
              </div>
            </div>
            <div className="text-end mt-3">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => resetToDefaults(['generation'])}>Reset to defaults</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'sections' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <small className="text-muted">Each section becomes a <code>&lt;section id="..."&gt;</code> block in the generated HTML. Order here is the order on the page.</small>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => resetToDefaults(['sections'])}>Reset to defaults</button>
              <button type="button" className="btn btn-sm btn-primary" onClick={addSection}><i className="bi bi-plus-lg me-1"></i>Add section</button>
            </div>
          </div>
          {form.sections.map((s, i) => (
            <div key={i} className={`card border rounded-4 mb-2 ${s.enabled === false ? 'opacity-75' : ''}`}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center mb-2 gap-2">
                  <div className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" id={`sec_en_${i}`} checked={s.enabled !== false} onChange={e => setListItem('sections', i, { enabled: e.target.checked })} />
                    <label className="form-check-label fw-semibold" htmlFor={`sec_en_${i}`}>
                      <i className={`bi ${s.icon || 'bi-card-text'} me-1`}></i>{i + 1}. {s.name || 'Untitled section'}
                    </label>
                  </div>
                  <RowControls index={i} length={form.sections.length}
                    onMove={(idx, d) => set({ sections: moveItem(form.sections, idx, d) })}
                    onRemove={(idx) => set({ sections: form.sections.filter((_, x) => x !== idx) })} />
                </div>
                <div className="row g-2">
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Key (HTML id)</label>
                    <input className="form-control form-control-sm font-monospace" value={s.id} onChange={e => setListItem('sections', i, { id: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small mb-0">Name</label>
                    <input className="form-control form-control-sm" value={s.name} onChange={e => setListItem('sections', i, { name: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Icon (Bootstrap)</label>
                    <input className="form-control form-control-sm" value={s.icon || ''} placeholder="bi-stars" onChange={e => setListItem('sections', i, { icon: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small mb-0">What this section covers</label>
                    <textarea className="form-control form-control-sm" rows="2" value={s.description} onChange={e => setListItem('sections', i, { description: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label small mb-0">HTML / structure instructions</label>
                    <textarea className="form-control form-control-sm font-monospace" rows="2" style={{ fontSize: '0.8rem' }} value={s.instructions || ''} onChange={e => setListItem('sections', i, { instructions: e.target.value })} />
                  </div>
                  <div className="col-12 d-flex flex-wrap gap-3 align-items-end">
                    <span className="small text-muted">Target words per tier:</span>
                    {tierKeys.map(k => (
                      <div key={k} style={{ width: 130 }}>
                        <label className="form-label small mb-0">{k}</label>
                        <input type="number" className="form-control form-control-sm" min="10" max="5000" value={s.targetWords?.[k] ?? 150}
                          onChange={e => setListItem('sections', i, { targetWords: { ...s.targetWords, [k]: e.target.value } })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'tiers' && (
        <div className="row g-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0">Word count tiers</h6>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => resetToDefaults(['wordCountTiers'])}>Reset to defaults</button>
                <button type="button" className="btn btn-sm btn-primary" onClick={() => set({ wordCountTiers: [...form.wordCountTiers, { key: `tier${form.wordCountTiers.length + 1}`, label: '', badge: '', targetWords: 1000, minWords: 850, description: '' }] })}>
                  <i className="bi bi-plus-lg me-1"></i>Add tier
                </button>
              </div>
            </div>
            {form.wordCountTiers.map((t, i) => (
              <div key={i} className="card border rounded-4 mb-2">
                <div className="card-body p-3 row g-2 align-items-end">
                  <div className="col-md-2">
                    <label className="form-label small mb-0">Key</label>
                    <input className="form-control form-control-sm font-monospace" value={t.key} onChange={e => setListItem('wordCountTiers', i, { key: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Label</label>
                    <input className="form-control form-control-sm" value={t.label} onChange={e => setListItem('wordCountTiers', i, { label: e.target.value })} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small mb-0">Badge</label>
                    <input className="form-control form-control-sm" value={t.badge || ''} onChange={e => setListItem('wordCountTiers', i, { badge: e.target.value })} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small mb-0">Min words</label>
                    <input type="number" className="form-control form-control-sm" value={t.minWords} onChange={e => setListItem('wordCountTiers', i, { minWords: e.target.value })} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small mb-0">Target words</label>
                    <input type="number" className="form-control form-control-sm" value={t.targetWords} onChange={e => setListItem('wordCountTiers', i, { targetWords: e.target.value })} />
                  </div>
                  <div className="col-md-1 text-end">
                    <RowControls index={i} length={form.wordCountTiers.length}
                      onMove={(idx, d) => set({ wordCountTiers: moveItem(form.wordCountTiers, idx, d) })}
                      onRemove={(idx) => set({ wordCountTiers: form.wordCountTiers.filter((_, x) => x !== idx) })} />
                  </div>
                  <div className="col-12">
                    <input className="form-control form-control-sm" placeholder="Description shown in the generation modal" value={t.description || ''} onChange={e => setListItem('wordCountTiers', i, { description: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
            <small className="text-muted">If you rename or add a tier, set its per-section targets on the Content Sections tab.</small>
          </div>

          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0">Tones</h6>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => resetToDefaults(['toneOptions'])}>Reset to defaults</button>
                <button type="button" className="btn btn-sm btn-primary" onClick={() => set({ toneOptions: [...form.toneOptions, { key: `tone${form.toneOptions.length + 1}`, name: '', description: '' }] })}>
                  <i className="bi bi-plus-lg me-1"></i>Add tone
                </button>
              </div>
            </div>
            {form.toneOptions.map((t, i) => (
              <div key={i} className="card border rounded-4 mb-2">
                <div className="card-body p-3 row g-2 align-items-end">
                  <div className="col-md-2">
                    <label className="form-label small mb-0">Key</label>
                    <input className="form-control form-control-sm font-monospace" value={t.key} onChange={e => setListItem('toneOptions', i, { key: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small mb-0">Name</label>
                    <input className="form-control form-control-sm" value={t.name} onChange={e => setListItem('toneOptions', i, { name: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small mb-0">Instruction sent to the AI</label>
                    <input className="form-control form-control-sm" value={t.description} onChange={e => setListItem('toneOptions', i, { description: e.target.value })} />
                  </div>
                  <div className="col-md-1 text-end">
                    <RowControls index={i} length={form.toneOptions.length}
                      onMove={(idx, d) => set({ toneOptions: moveItem(form.toneOptions, idx, d) })}
                      onRemove={(idx) => set({ toneOptions: form.toneOptions.filter((_, x) => x !== idx) })} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiSettings;

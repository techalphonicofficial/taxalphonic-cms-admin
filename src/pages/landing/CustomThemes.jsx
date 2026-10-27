import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { LandingPageService, apiErrorText } from '../../services/landingPage.service';
import { confirmDialog } from '../../components/common/confirm';
import { CUSTOM, HEX, LANDING_THEMES, contrast, isCustomTheme, themeColours } from '../../components/page-builder/landingThemes';

/*
 * Landing page colour themes: the 10 built-in ones, "My themes" (custom themes saved for every
 * landing page, GET/PUT /landing-pages/themes) and "Create your own" (CustomThemeModal).
 * A theme value is { key, custom }: key "custom" carries its colours, which are copied onto the
 * page (Header payload.customTheme), so editing a saved theme never changes pages already using it.
 */

const QUERY_KEY = ['landing-themes'];
const sameColours = (a, b) => Boolean(a && b) && ['brand', 'accent', 'deep'].every((c) => String(a[c]).toLowerCase() === String(b[c]).toLowerCase());
const swatch = (t) => `linear-gradient(135deg, ${t.brand} 0 55%, ${t.accent} 55% 78%, ${t.deep} 78%)`;

/** "My themes" library: { themes, save(list) }. */
function useMyThemes() {
  const client = useQueryClient();
  const { data: themes = [], isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: LandingPageService.themes, staleTime: 60 * 1000 });
  const save = async (list) => {
    const saved = await LandingPageService.saveThemes(list);
    client.setQueryData(QUERY_KEY, saved);
    return saved;
  };
  return { themes: Array.isArray(themes) ? themes : [], isLoading, save };
}

const COLOUR_FIELDS = [
  { key: 'brand', label: 'Main colour', hint: 'Buttons, headings, icons, links' },
  { key: 'accent', label: 'Accent colour', hint: 'Highlights, badges, second buttons' },
  { key: 'deep', label: 'Dark colour', hint: 'Footer and dark sections' },
];

/** One colour: native picker + hex text. */
const ColourInput = ({ field, value, onChange }) => {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div className="col-sm-4">
      <label className="form-label fw-semibold small mb-1">{field.label}</label>
      <div className="input-group">
        <input type="color" className="form-control form-control-color flex-grow-0" style={{ width: '3rem' }} value={value} onChange={(e) => onChange(e.target.value)} title={field.label} />
        <input
          type="text"
          className={`form-control font-monospace ${HEX.test(text) ? '' : 'is-invalid'}`}
          value={text}
          maxLength={7}
          onChange={(e) => {
            const next = e.target.value.trim().startsWith('#') ? e.target.value.trim() : `#${e.target.value.trim()}`;
            setText(next);
            if (HEX.test(next)) onChange(next.toLowerCase());
          }}
        />
      </div>
      <div className="form-text">{field.hint}</div>
    </div>
  );
};

/** Small mock of a landing page in the theme's colours. */
const ThemePreview = ({ t }) => (
  <div className="lp-ct-preview" style={{ '--b': t.brand, '--a': t.accent, '--d': t.deep }}>
    <div className="lp-ct-bar"><span className="lp-ct-logo" /><span className="lp-ct-btn">Enquire Now</span></div>
    <div className="lp-ct-hero">
      <span className="lp-ct-chip">GST · 7 days</span>
      <strong>Your service, done right</strong>
      <span className="lp-ct-row"><span className="lp-ct-btn">Get started</span><span className="lp-ct-btn ghost">Call us</span></span>
    </div>
    <div className="lp-ct-cards">
      {[0, 1, 2].map((i) => <span key={i} className="lp-ct-card"><i /><b /><em /></span>)}
    </div>
    <div className="lp-ct-foot">© Tax Alphonic</div>
  </div>
);

/** Readability warnings for a theme. */
function themeWarnings(t) {
  if (!isCustomTheme(t)) return [];
  const out = [];
  if (contrast(t.brand, '#ffffff') < 3) out.push('White button text is hard to read on the main colour: pick a darker main colour.');
  if (contrast(t.deep, '#ffffff') < 4.5) out.push('Footer text is hard to read on the dark colour: pick a darker one.');
  if (contrast(t.accent, '#ffffff') < 2) out.push('The accent colour is very light: highlights may disappear on white.');
  return out;
}

/**
 * Create / edit a custom theme. onApply(theme, { save, id }): save = also keep it in My themes
 * (id = the saved theme being edited).
 */
export const CustomThemeModal = ({ show, initial, editingId = null, canSave = true, onHide, onApply }) => {
  const start = initial && isCustomTheme(initial) ? initial : { name: '', ...themeColours({ key: 'default' }) };
  const [t, setT] = useState({ name: start.name || '', brand: start.brand, accent: start.accent, deep: start.deep });
  const [save, setSave] = useState(true);
  useEffect(() => {
    if (!show) return;
    const from = initial && isCustomTheme(initial) ? initial : { name: '', ...themeColours({ key: 'default' }) };
    setT({ name: from.name || '', brand: from.brand, accent: from.accent, deep: from.deep });
    setSave(true);
  }, [show, initial]);

  const warnings = themeWarnings(t);
  const name = t.name.trim() || 'My theme';
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-5">{editingId ? 'Edit theme' : 'Create your own theme'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-semibold small mb-1">Theme name</label>
            <input className="form-control" value={t.name} maxLength={40} placeholder="e.g. Diwali offer, Client brand" onChange={(e) => setT({ ...t, name: e.target.value })} />
          </div>
          {COLOUR_FIELDS.map((f) => <ColourInput key={f.key} field={f} value={t[f.key]} onChange={(v) => setT({ ...t, [f.key]: v })} />)}
          <div className="col-12">
            <div className="small fw-semibold mb-1">Start from a built-in theme</div>
            <div className="d-flex flex-wrap gap-2">
              {LANDING_THEMES.map((b) => (
                <button key={b.key} type="button" className="lp-theme-dot" title={b.name} style={{ background: `linear-gradient(135deg, ${b.brand} 0 60%, ${b.accent} 60%)` }} onClick={() => setT({ ...t, brand: b.brand, accent: b.accent, deep: b.deep })} />
              ))}
            </div>
          </div>
          <div className="col-12">
            <div className="small fw-semibold mb-1">Preview</div>
            <ThemePreview t={t} />
            {warnings.length > 0 && (
              <ul className="small text-warning-emphasis mt-2 mb-0 ps-3">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            )}
          </div>
          {canSave && (
            <div className="col-12">
              <label className="form-check">
                <input type="checkbox" className="form-check-input" checked={save} onChange={(e) => setSave(e.target.checked)} />
                <span className="form-check-label">{editingId ? 'Update it in My themes' : 'Save in My themes (use it on other landing pages too)'}</span>
              </label>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-light border" onClick={onHide}>Cancel</button>
        <button type="button" className="btn btn-primary" disabled={!isCustomTheme(t)} onClick={() => onApply({ ...t, name }, { save: canSave && save, id: editingId })}>
          <i className="bi bi-palette me-1"></i>Use on this page
        </button>
      </Modal.Footer>
    </Modal>
  );
};

/** Opens the modal and keeps My themes in step; returns [modal, open(initial, editingId)]. */
function useThemeEditor({ value, onChange, canManage }) {
  const { themes, save } = useMyThemes();
  const [editor, setEditor] = useState(null); // { initial, id }

  const apply = async (theme, { save: keep, id }) => {
    setEditor(null);
    onChange({ key: CUSTOM, custom: { name: theme.name, brand: theme.brand, accent: theme.accent, deep: theme.deep } });
    if (!keep) return;
    try {
      const list = id ? themes.map((x) => (x.id === id ? { ...x, ...theme } : x)) : [...themes, { id: `t${Date.now().toString(36)}`, ...theme }];
      await save(list);
      toast.success(id ? `"${theme.name}" updated in My themes.` : `"${theme.name}" saved in My themes.`);
    } catch (error) {
      toast.error(apiErrorText(error, 'Could not save the theme'));
    }
  };

  const remove = async (theme) => {
    const ok = await confirmDialog({
      title: `Delete "${theme.name}" from My themes?`,
      message: 'Pages that already use it keep their colours.',
      tone: 'danger',
      confirmText: 'Delete',
    });
    if (!ok) return;
    try {
      await save(themes.filter((x) => x.id !== theme.id));
      toast.success('Theme deleted.');
    } catch (error) {
      toast.error(apiErrorText(error, 'Could not delete the theme'));
    }
  };

  const modal = (
    <CustomThemeModal
      show={Boolean(editor)}
      initial={editor?.initial}
      editingId={editor?.id || null}
      canSave={canManage}
      onHide={() => setEditor(null)}
      onApply={apply}
    />
  );
  const pageCustom = value?.key === CUSTOM ? value.custom : null;
  const inLibrary = pageCustom ? themes.find((x) => sameColours(x, pageCustom)) : null;
  return { modal, themes, remove, open: (initial = null, id = null) => setEditor({ initial, id }), pageCustom, inLibrary };
}

/** Theme cards: built-in, My themes, this page's own colours, and "Create your own". */
export const ThemePicker = ({ value, onChange, disabled = false, canManage = true }) => {
  const { modal, themes, remove, open, pageCustom, inLibrary } = useThemeEditor({ value, onChange, canManage });
  const builtIn = (t) => (
    <button key={t.key} type="button" role="radio" aria-checked={value?.key === t.key} className={`lp-theme${value?.key === t.key ? ' active' : ''}`} onClick={() => onChange({ key: t.key, custom: null })} disabled={disabled} title={t.name}>
      <span className="lp-theme-swatch" style={{ background: swatch(t) }} />
      <span className="lp-theme-name">{t.name}</span>
      {value?.key === t.key && <i className="bi bi-check-circle-fill lp-theme-check" />}
    </button>
  );
  const custom = (t, { id = null, own = false } = {}) => {
    const active = pageCustom && sameColours(t, pageCustom);
    return (
      <div key={id || 'own'} className={`lp-theme lp-theme-custom${active ? ' active' : ''}`}>
        <button type="button" role="radio" aria-checked={Boolean(active)} className="lp-theme-pick" onClick={() => onChange({ key: CUSTOM, custom: { name: t.name, brand: t.brand, accent: t.accent, deep: t.deep } })} disabled={disabled} title={t.name}>
          <span className="lp-theme-swatch" style={{ background: swatch(t) }} />
          <span className="lp-theme-name">{t.name}{own ? ' (this page)' : ''}</span>
        </button>
        {active && <i className="bi bi-check-circle-fill lp-theme-check" />}
        {!disabled && (
          <span className="lp-theme-tools">
            <button type="button" title="Edit colours" onClick={() => open(t, own ? null : id)}><i className="bi bi-pencil" /></button>
            {!own && canManage && <button type="button" title="Delete from My themes" onClick={() => remove(t)}><i className="bi bi-trash" /></button>}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="lp-themes" role="radiogroup" aria-label="Page colour theme">
        {LANDING_THEMES.map(builtIn)}
        {pageCustom && !inLibrary && custom(pageCustom, { own: true })}
        {themes.map((t) => custom(t, { id: t.id }))}
        <button type="button" className="lp-theme lp-theme-new" onClick={() => open(pageCustom || themeColours(value))} disabled={disabled}>
          <span className="lp-theme-swatch"><i className="bi bi-plus-lg" /></span>
          <span className="lp-theme-name">Create your own</span>
        </button>
      </div>
      {modal}
    </>
  );
};

/** Compact round swatches (Live Preview bar), with "+" for a new custom theme. */
export const ThemeDots = ({ value, onChange, disabled = false, canManage = true }) => {
  const { modal, themes, open, pageCustom, inLibrary } = useThemeEditor({ value, onChange, canManage });
  const dot = (t, active, pick, key) => (
    <button key={key} type="button" role="radio" aria-checked={active} aria-label={t.name} title={t.name} className={`lp-theme-dot${active ? ' active' : ''}`} style={{ background: `linear-gradient(135deg, ${t.brand} 0 60%, ${t.accent} 60%)` }} onClick={pick} disabled={disabled} />
  );
  return (
    <>
      <div className="lp-theme-dots" role="radiogroup" aria-label="Page colour theme">
        {LANDING_THEMES.map((t) => dot(t, value?.key === t.key, () => onChange({ key: t.key, custom: null }), t.key))}
        {pageCustom && !inLibrary && dot(pageCustom, true, () => {}, 'own')}
        {themes.map((t) => dot(t, Boolean(pageCustom && sameColours(t, pageCustom)), () => onChange({ key: CUSTOM, custom: { name: t.name, brand: t.brand, accent: t.accent, deep: t.deep } }), t.id))}
        <button type="button" className="lp-theme-dot lp-theme-dot-new" title="Create your own theme" aria-label="Create your own theme" onClick={() => open(pageCustom || themeColours(value))} disabled={disabled}>
          <i className="bi bi-plus-lg" />
        </button>
      </div>
      {modal}
    </>
  );
};

/** Display name of a theme value. */
export const themeName = (value) => (value?.key === CUSTOM ? value.custom?.name || 'Custom theme' : LANDING_THEMES.find((t) => t.key === value?.key)?.name || 'Tax Alphonic');

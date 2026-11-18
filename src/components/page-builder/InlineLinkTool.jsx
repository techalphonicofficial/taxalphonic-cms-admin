import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PopupFormSelect, popupFormOf } from './blockFields';

/*
 * Link on selected text in any content box. Select words in a text box / text area inside a
 * container marked data-ta-links (every Page Builder, FAQ and Testimonial forms) and a small
 * "Link" button appears; it writes Markdown-style link syntax into the text:
 *   [selected words](/gst-registration)            a link
 *   [selected words](https://example.com "_blank") opens in a new tab
 *   [selected words](#form) / (#form-12)           opens a CMS form popup
 *   [selected words](tel:+91…) / (mailto:…) / (#faq)
 * The website turns it into a real <a> in every block (components/tax-alphonic/blocks/InlineLinks.jsx
 * + lib/inlineLinks.js; keep the syntax in sync). data-ta-links="landing" = landing pages: only
 * form popup, section of this page, phone and email (no outbound links).
 * Mounted once in AdminLayout.
 */

const LINK_ONLY = /^\[([^\]\n]+)\]\(([^)\s]+)(?:\s+"_blank")?\)$/;
const NEW_TAB = /\s+"_blank"\)$/;

const isEligible = (el) => {
  if (!el || el.readOnly || el.disabled) return false;
  const ok = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search' || !el.getAttribute('type')));
  if (!ok || el.type === 'search') return false;
  if (!el.closest('[data-ta-links]') || el.closest('[data-no-links]')) return false;
  // URL / slug / icon boxes: a link inside them makes no sense.
  const value = String(el.value || '').trim();
  return !/^(https?:\/\/|\/|#|tel:|mailto:|www\.)\S*$/i.test(value);
};

const policyOf = (el) => (el?.closest('[data-ta-links]')?.getAttribute('data-ta-links') === 'landing' ? 'landing' : 'any');

const setNativeValue = (el, value) => {
  const win = el.ownerDocument.defaultView || window;
  const proto = el.tagName === 'TEXTAREA' ? win.HTMLTextAreaElement.prototype : win.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
};

const kindOf = (url) => {
  if (!url) return 'link';
  if (popupFormOf(url) !== null) return 'popup';
  if (/^tel:/i.test(url)) return 'phone';
  if (/^mailto:/i.test(url)) return 'email';
  if (url.startsWith('#')) return 'section';
  return 'link';
};

const valueOf = (kind, url) => {
  if (kind === 'phone') return url.replace(/^tel:/i, '');
  if (kind === 'email') return url.replace(/^mailto:/i, '');
  if (kind === 'section') return url.replace(/^#/, '');
  if (kind === 'popup') return popupFormOf(url) || '';
  return url;
};

/** Final URL from the dialog fields, or '' when it is not usable. */
const buildUrl = (kind, raw) => {
  const value = String(raw || '').trim();
  if (kind === 'popup') return value ? `#form-${value}` : '#form';
  if (!value) return '';
  if (kind === 'phone') return `tel:${value.replace(/[^\d+]/g, '')}`;
  if (kind === 'email') return /^\S+@\S+\.\S+$/.test(value) ? `mailto:${value}` : '';
  if (kind === 'section') return `#${value.replace(/^#/, '').trim().replace(/\s+/g, '-')}`;
  if (/^javascript:/i.test(value)) return '';
  if (/^(https?:\/\/|\/|#)/i.test(value)) return value.replace(/\s/g, '%20').replace(/\)/g, '%29');
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(value)) return `https://${value.replace(/\s/g, '%20')}`;
  return `/${value.replace(/^\/+/, '').replace(/\s/g, '-')}`;
};

const KINDS = [
  { value: 'link', label: 'Opens a page / link', landing: false },
  { value: 'popup', label: 'Opens a form popup' },
  { value: 'section', label: 'Goes to a section of this page' },
  { value: 'phone', label: 'Calls a phone number' },
  { value: 'email', label: 'Sends an email' },
];

const stop = (e) => e.stopPropagation();

const LinkDialog = ({ state, onClose, onApply }) => {
  const existing = LINK_ONLY.exec(state.selected);
  const startUrl = existing ? existing[2] : '';
  const allowed = KINDS.filter(k => state.policy !== 'landing' || k.landing !== false);
  const firstKind = kindOf(startUrl);
  const [text, setText] = useState(existing ? existing[1] : state.selected.trim());
  const [kind, setKind] = useState(allowed.some(k => k.value === firstKind) ? firstKind : allowed[0].value);
  const [value, setValue] = useState(valueOf(firstKind, startUrl));
  const [newTab, setNewTab] = useState(existing ? NEW_TAB.test(state.selected) : false);
  const url = buildUrl(kind, value);
  const cleanText = text.replace(/[[\]\n]/g, ' ').replace(/\s+/g, ' ').trim();
  const canApply = Boolean(url && cleanText);

  const apply = () => {
    if (!canApply) return;
    const tab = kind === 'link' && newTab ? ' "_blank"' : '';
    onApply(`[${cleanText}](${url}${tab})`);
  };

  const placeholder = {
    link: '/gst-registration, https://…',
    section: 'faq (the block’s Anchor ID)',
    phone: '+91 98765 43210',
    email: 'hello@example.com',
  }[kind];

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 2100, background: 'rgba(15, 23, 42, .45)' }}
      onMouseDown={(e) => { stop(e); if (e.target === e.currentTarget) onClose(); }}
      onClick={stop}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); apply(); }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Add a link"
    >
      <div className="rounded-4 shadow-lg p-3" style={{ width: 'min(440px, calc(100vw - 32px))', background: 'var(--cms-card-bg, var(--bs-body-bg))', border: '1px solid var(--bs-border-color)' }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-link-45deg text-primary fs-5"></i>
          <strong className="flex-grow-1">{existing ? 'Edit link' : 'Add a link'}</strong>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
        </div>
        <label className="form-label small text-muted mb-1">Linked text</label>
        <input type="text" className="form-control form-control-sm mb-2" value={text} onChange={e => setText(e.target.value)} />
        <label className="form-label small text-muted mb-1">A click</label>
        <select className="form-select form-select-sm mb-2" value={kind} onChange={e => { setKind(e.target.value); setValue(''); }}>
          {allowed.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        {kind === 'popup' ? (
          <div className="mb-2"><PopupFormSelect value={value} onChange={setValue} /></div>
        ) : (
          <input
            type="text"
            className="form-control form-control-sm mb-2"
            placeholder={placeholder}
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
          />
        )}
        {kind === 'link' && (
          <div className="form-check mb-2">
            <input className="form-check-input" type="checkbox" id="ta-inline-link-tab" checked={newTab} onChange={e => setNewTab(e.target.checked)} />
            <label className="form-check-label small" htmlFor="ta-inline-link-tab">Open in a new tab</label>
          </div>
        )}
        {state.policy === 'landing' && <div className="form-text mb-2">Landing pages never send visitors away: only a form popup, a section, a call or an email.</div>}
        {url && <div className="small text-muted mb-3 text-truncate">Saved as <code>[{cleanText || '…'}]({url}{kind === 'link' && newTab ? ' "_blank"' : ''})</code></div>}
        <div className="d-flex gap-2 justify-content-end">
          {existing && <button type="button" className="btn btn-sm btn-outline-danger me-auto" onClick={() => onApply(existing[1])}><i className="bi bi-link-45deg me-1"></i>Remove link</button>}
          <button type="button" className="btn btn-sm btn-light" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-sm btn-primary" disabled={!canApply} onClick={apply}>{existing ? 'Update link' : 'Add link'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const InlineLinkTool = () => {
  const [bubble, setBubble] = useState(null); // { el, start, end, x, y }
  const [dialog, setDialog] = useState(null); // { el, start, end, selected, policy }
  const bubbleRef = useRef(null);

  const check = useCallback((event) => {
    const el = event.target;
    if (!isEligible(el)) { if (event.type !== 'keyup') setBubble(null); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start == null || end == null || end - start < 1 || !el.value.slice(start, end).trim()) { setBubble(null); return; }
    const rect = el.getBoundingClientRect();
    const x = event.type === 'mouseup' ? event.clientX : rect.left + Math.min(rect.width - 40, 24);
    const y = event.type === 'mouseup' ? event.clientY : rect.top;
    setBubble({ el, start, end, x: Math.max(8, Math.min(window.innerWidth - 90, x - 30)), y: Math.max(8, y - 40) });
  }, []);

  useEffect(() => {
    const onMouseUp = (e) => { if (!bubbleRef.current?.contains(e.target)) setTimeout(() => check(e), 0); };
    const onKeyUp = (e) => { if (e.shiftKey || e.key === 'Shift' || (e.key === 'a' && (e.ctrlKey || e.metaKey))) check(e); };
    const onDown = (e) => { if (!bubbleRef.current?.contains(e.target)) setBubble(null); };
    const onScroll = () => setBubble(null);
    document.addEventListener('mouseup', onMouseUp, true);
    document.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mouseup', onMouseUp, true);
      document.removeEventListener('keyup', onKeyUp, true);
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [check]);

  const openDialog = () => {
    if (!bubble) return;
    let { start, end } = bubble;
    const { el } = bubble;
    // A selection inside an existing link edits that link.
    for (const m of el.value.matchAll(/\[[^\]\n]+\]\([^)\s]+(?:\s+"_blank")?\)/g)) {
      if (m.index <= start && end <= m.index + m[0].length) { start = m.index; end = m.index + m[0].length; break; }
    }
    setDialog({ el, start, end, selected: el.value.slice(start, end), policy: policyOf(el) });
    setBubble(null);
  };

  const applyLink = (replacement) => {
    const { el, start, end, selected } = dialog;
    setDialog(null);
    if (!el.isConnected) return;
    let from = start;
    let to = end;
    // The text changed while the dialog was open: find the selected words again.
    if (el.value.slice(start, end) !== selected) {
      const at = el.value.indexOf(selected);
      if (at < 0) return;
      from = at;
      to = at + selected.length;
    }
    // Keep the spaces around the selection outside the link.
    const lead = selected.match(/^\s*/)[0];
    const trail = LINK_ONLY.test(selected) ? '' : selected.match(/\s*$/)[0];
    const next = el.value.slice(0, from) + lead + replacement + trail + el.value.slice(to);
    setNativeValue(el, next);
    el.focus();
    const caret = from + lead.length + replacement.length + trail.length;
    try { el.setSelectionRange(caret, caret); } catch { /* some inputs do not support it */ }
  };

  return (
    <>
      {bubble && createPortal(
        <div ref={bubbleRef} className="position-fixed" style={{ left: bubble.x, top: bubble.y, zIndex: 2090 }}>
          <button
            type="button"
            className="btn btn-sm btn-dark shadow d-flex align-items-center gap-1 py-1 px-2"
            style={{ borderRadius: 8, fontSize: 12.5 }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={openDialog}
            title="Add a link to the selected text"
          >
            <i className="bi bi-link-45deg"></i>{LINK_ONLY.test(bubble.el.value.slice(bubble.start, bubble.end)) ? 'Edit link' : 'Link'}
          </button>
        </div>,
        document.body,
      )}
      {dialog && <LinkDialog state={dialog} onClose={() => { const el = dialog.el; setDialog(null); el?.focus?.(); }} onApply={applyLink} />}
    </>
  );
};

export default InlineLinkTool;

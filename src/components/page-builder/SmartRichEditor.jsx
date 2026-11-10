import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import JoditEditor from 'jodit-react';
import { JODIT_CLEAN_PASTE } from './cleanPastedHtml';
import MediaPickerModal from '../media/MediaPickerModal';
import { MEDIA_BASE, mediaUrl } from '../../utils/mediaUrl';

/*
 * Rich text editor with ready-made inserts (Overview block and other long-text fields):
 * Media image (alt text, caption, size, alignment), table, check points (tick + title + text, 1–3
 * columns, like the reference "One platform for everything" list), note box (info / success /
 * warning), button link (page, #section, #form popup, tel:), divider and quote.
 * The inserted HTML uses the ta-rt-* classes, styled on the website in blocks/blocks.css (keep the
 * class names in sync) and in the editor by global.scss. Everything stays editable in place.
 * Media images are saved as /uploads/... paths (the website makes them absolute) but shown in the
 * editor through the API address.
 */

const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const HEX = /^#[0-9a-f]{6}$/i;
const UPLOADS_IN = /(src\s*=\s*["'])(\/uploads\/)/gi;

const toEditor = (html) => String(html || '').replace(UPLOADS_IN, `$1${MEDIA_BASE}$2`);
const fromEditor = (html) => String(html || '').split(`${MEDIA_BASE}/uploads/`).join('/uploads/');

const BASE_BUTTONS = [
  'paragraph', '|',
  'bold', 'italic', 'underline', 'strikethrough', 'brush', 'eraser', '|',
  'ul', 'ol', 'outdent', 'indent', '|',
  'align', '|',
  'link',
];

const TAIL_BUTTONS = ['|', 'undo', 'redo', '|', 'source', 'fullsize'];

const PARAGRAPH = {
  text: 'Format',
  icon: false,
  list: { p: 'Normal', h2: 'Heading 2', h3: 'Heading 3', h4: 'Heading 4', blockquote: 'Quote', pre: 'Code' },
};

// React events bubble out of a portal to the React parents: inside a Service / Page editor (a <form>)
// a submit or click from this dialog reached that form and saved / closed the page. So the dialog is
// no <form>, and its events stop here.
const stop = (e) => e.stopPropagation();

/** A Bootstrap-looking modal in <body> (custom modals are portalled; see CLAUDE.md). */
const Dialog = ({ title, onClose, onSubmit, submitText = 'Insert', children, wide = false, disabled = false }) => createPortal(
  <div onClick={stop} onMouseDown={stop} onMouseUp={stop} onKeyDown={stop} onKeyUp={stop} onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); }} onChange={stop} onInput={stop} onFocus={stop} onBlur={stop}>
    <div className="modal-backdrop fade show" style={{ zIndex: 1080 }}></div>
    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1085 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${wide ? 'modal-lg' : ''}`}>
        <div
          className="modal-content"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onKeyDown={(e) => {
            // Enter in a one-line field inserts (as a form would); Escape closes.
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); if (!disabled) onSubmit(); }
          }}
        >
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">{children}</div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light border" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary ta-rt-insert" onClick={onSubmit} disabled={disabled}><i className="bi bi-plus-lg me-1"></i>{submitText}</button>
          </div>
        </div>
      </div>
    </div>
  </div>,
  document.body
);

const DEFAULT_POINTS = [
  { title: 'One platform for everything', text: '700+ services, from registration to revenue, in one place.' },
  { title: 'Real experts, not bots', text: 'CAs, CS and lawyers handle your work personally.' },
  { title: 'Simple, honest pricing', text: 'Clear fees shown upfront. No surprises, ever.' },
  { title: 'Fully online & fast', text: 'Most services done in 7 to 10 working days.' },
];

const SmartRichEditor = ({ value, onChange, height = 420, theme = 'default', placeholder }) => {
  const editorRef = useRef(null);
  const [dialog, setDialog] = useState(null); // 'image' | 'imageDetails' | 'checks' | 'note' | 'button'
  const [image, setImage] = useState({ url: '', alt: '', caption: '', size: 'full', align: 'center' });
  const [checks, setChecks] = useState({ points: DEFAULT_POINTS, columns: '2', color: '#0e96ac', style: 'circle' });
  const [note, setNote] = useState({ tone: 'info', title: 'Good to know', text: '' });
  const [btn, setBtn] = useState({ text: 'Talk to an expert', url: '#form', style: 'solid', align: 'left' });

  // Remembers where the cursor was, so the insert lands there after a dialog.
  const open = (name) => (editor) => {
    editorRef.current = editor;
    try { editor.s.save(); } catch { /* no selection yet */ }
    setDialog(name);
  };

  const insert = (html) => {
    const editor = editorRef.current;
    setDialog(null);
    if (!editor) return;
    try { editor.s.restore(); } catch { editor.s.focus(); }
    editor.s.insertHTML(html);
    onChange(fromEditor(editor.value));
  };

  const config = useMemo(() => ({
    ...JODIT_CLEAN_PASTE,
    enter: 'P',
    theme,
    placeholder: placeholder || 'Write here… Use the toolbar to add images, tables, check points and more.',
    toolbarAdaptive: false,
    toolbarSticky: false,
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    height,
    tableAllowCellResize: true,
    controls: { paragraph: PARAGRAPH },
    buttons: [
      ...BASE_BUTTONS,
      { name: 'taImage', icon: 'image', tooltip: 'Image from Media (with alt text and caption)', exec: open('image') },
      'table',
      { name: 'taChecks', text: '✓ Check points', tooltip: 'Check points: tick + title + text, in columns', exec: open('checks') },
      { name: 'taNote', text: 'ⓘ Note', tooltip: 'Note box (info / success / warning)', exec: open('note') },
      { name: 'taButton', text: '▣ Button', tooltip: 'Button link (page, form popup, #section, phone)', exec: open('button') },
      'hr',
      ...TAIL_BUTTONS,
    ],
  // open() only calls state setters, which never change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [theme, height, placeholder]);

  const imageHtml = () => {
    const sizeClass = `ta-rt-img-${image.size}`;
    const alignClass = image.size === 'full' ? '' : ` ta-rt-align-${image.align}`;
    const img = `<img src="${esc(image.url)}" alt="${esc(image.alt)}" loading="lazy">`;
    const cap = image.caption.trim() ? `<figcaption>${esc(image.caption)}</figcaption>` : '';
    return `<figure class="ta-rt-figure ${sizeClass}${alignClass}">${img}${cap}</figure><p><br></p>`;
  };

  const checksHtml = () => {
    const points = checks.points.filter((p) => p.title.trim() || p.text.trim());
    const color = HEX.test(checks.color) ? checks.color : '#0e96ac';
    const items = points.map((p) => (
      `<div class="ta-rt-check"><span class="ta-rt-tick" contenteditable="false">✓</span><div class="ta-rt-check-body">`
      + `${p.title.trim() ? `<strong>${esc(p.title)}</strong>` : ''}${p.text.trim() ? `<p>${esc(p.text)}</p>` : ''}</div></div>`
    )).join('');
    return `<div class="ta-rt-checks ta-rt-cols-${checks.columns} ta-rt-tick-${checks.style}" style="--rt-tick: ${color}">${items}</div><p><br></p>`;
  };

  const noteHtml = () => (
    `<div class="ta-rt-note ta-rt-note-${note.tone}">${note.title.trim() ? `<strong>${esc(note.title)}</strong>` : ''}<p>${esc(note.text) || 'Write the note here.'}</p></div><p><br></p>`
  );

  const buttonHtml = () => {
    const url = btn.url.trim() || '#form';
    const outside = /^https?:\/\//i.test(url);
    return `<p class="ta-rt-btn-row ta-rt-btn-row-${btn.align}"><a class="ta-rt-btn ta-rt-btn-${btn.style}" href="${esc(url)}"${outside ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(btn.text || 'Learn more')}</a></p><p><br></p>`;
  };

  const setPoint = (i, key, v) => setChecks((c) => ({ ...c, points: c.points.map((p, j) => (j === i ? { ...p, [key]: v } : p)) }));
  const movePoint = (i, d) => setChecks((c) => {
    const next = [...c.points];
    const [p] = next.splice(i, 1);
    next.splice(i + d, 0, p);
    return { ...c, points: next };
  });

  return (
    <>
      <JoditEditor
        value={toEditor(value)}
        config={config}
        onBlur={(html) => onChange(fromEditor(html))}
      />
      <div className="form-text">
        Toolbar extras: <i className="bi bi-image"></i> image from Media · table · <b>✓ Check points</b> · <b>Note</b> box · <b>Button</b> link · divider. Inserted parts stay editable in place.
      </div>

      <MediaPickerModal
        show={dialog === 'image'}
        title="Choose an image"
        accept="image/*"
        onClose={() => setDialog((d) => (d === 'image' ? null : d))}
        onSelect={(item) => {
          setImage((s) => ({ ...s, url: item.url, alt: s.alt || String(item.originalName || '').replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' '), caption: '' }));
          setTimeout(() => setDialog('imageDetails'), 0);
        }}
      />

      {dialog === 'imageDetails' && (
        <Dialog title="Image details" disabled={!image.alt.trim()} onClose={() => setDialog(null)} onSubmit={() => insert(imageHtml())}>
          <div className="d-flex gap-3 align-items-start mb-3">
            <img src={mediaUrl(image.url)} alt="" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8 }} className="border" />
            <div className="flex-grow-1">
              <label className="form-label">Alt text (describes the image for Google and screen readers)</label>
              <input className="form-control" value={image.alt} onChange={(e) => setImage({ ...image, alt: e.target.value })} placeholder="e.g. GST registration certificate sample" required />
            </div>
          </div>
          <label className="form-label">Caption (optional, shown under the image)</label>
          <input className="form-control mb-3" value={image.caption} onChange={(e) => setImage({ ...image, caption: e.target.value })} />
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label">Size</label>
              <select className="form-select" value={image.size} onChange={(e) => setImage({ ...image, size: e.target.value })}>
                <option value="full">Full width</option>
                <option value="large">Large (75%)</option>
                <option value="half">Half (text beside it)</option>
                <option value="small">Small (35%, text beside it)</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label">Position</label>
              <select className="form-select" value={image.align} disabled={image.size === 'full'} onChange={(e) => setImage({ ...image, align: e.target.value })}>
                <option value="center">Centre</option>
                <option value="left">Left (text on the right)</option>
                <option value="right">Right (text on the left)</option>
              </select>
            </div>
          </div>
        </Dialog>
      )}

      {dialog === 'checks' && (
        <Dialog wide title="Check points" submitText="Insert check points" onClose={() => setDialog(null)} onSubmit={() => insert(checksHtml())}>
          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <label className="form-label">Columns</label>
              <select className="form-select" value={checks.columns} onChange={(e) => setChecks({ ...checks, columns: e.target.value })}>
                <option value="1">1 (one under the other)</option>
                <option value="2">2 (default)</option>
                <option value="3">3</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Tick style</label>
              <select className="form-select" value={checks.style} onChange={(e) => setChecks({ ...checks, style: e.target.value })}>
                <option value="circle">Filled circle</option>
                <option value="soft">Soft circle</option>
                <option value="plain">Plain tick</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Tick colour</label>
              <input type="color" className="form-control form-control-color w-100" value={HEX.test(checks.color) ? checks.color : '#0e96ac'} onChange={(e) => setChecks({ ...checks, color: e.target.value })} />
            </div>
          </div>
          {checks.points.map((p, i) => (
            <div key={i} className="d-flex gap-2 align-items-start border rounded-3 p-2 mb-2">
              <span className="fw-bold text-primary mt-2">✓</span>
              <div className="flex-grow-1">
                <input className="form-control form-control-sm mb-1 fw-semibold" placeholder="Title (bold)" value={p.title} onChange={(e) => setPoint(i, 'title', e.target.value)} />
                <textarea className="form-control form-control-sm" rows={2} placeholder="Text under it (optional)" value={p.text} onChange={(e) => setPoint(i, 'text', e.target.value)} />
              </div>
              <div className="btn-group-vertical btn-group-sm">
                <button type="button" className="btn btn-light border" disabled={i === 0} onClick={() => movePoint(i, -1)}><i className="bi bi-arrow-up"></i></button>
                <button type="button" className="btn btn-light border" disabled={i === checks.points.length - 1} onClick={() => movePoint(i, 1)}><i className="bi bi-arrow-down"></i></button>
                <button type="button" className="btn btn-light border text-danger" onClick={() => setChecks({ ...checks, points: checks.points.filter((_, j) => j !== i) })}><i className="bi bi-trash"></i></button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setChecks({ ...checks, points: [...checks.points, { title: '', text: '' }] })}>
            <i className="bi bi-plus-lg me-1"></i>Add point
          </button>
          <div className="form-text mt-2">After inserting, click any title or text in the editor to change it. Empty points are skipped.</div>
        </Dialog>
      )}

      {dialog === 'note' && (
        <Dialog title="Note box" onClose={() => setDialog(null)} onSubmit={() => insert(noteHtml())}>
          <label className="form-label">Type</label>
          <select className="form-select mb-3" value={note.tone} onChange={(e) => setNote({ ...note, tone: e.target.value })}>
            <option value="info">Info (blue)</option>
            <option value="success">Tip / success (green)</option>
            <option value="warning">Important / warning (orange)</option>
          </select>
          <label className="form-label">Title (optional)</label>
          <input className="form-control mb-3" value={note.title} onChange={(e) => setNote({ ...note, title: e.target.value })} />
          <label className="form-label">Text</label>
          <textarea className="form-control" rows={3} value={note.text} onChange={(e) => setNote({ ...note, text: e.target.value })} />
        </Dialog>
      )}

      {dialog === 'button' && (
        <Dialog title="Button link" disabled={!btn.text.trim()} onClose={() => setDialog(null)} onSubmit={() => insert(buttonHtml())}>
          <label className="form-label">Button text</label>
          <input className="form-control mb-3" value={btn.text} onChange={(e) => setBtn({ ...btn, text: e.target.value })} required />
          <label className="form-label">Link</label>
          <input className="form-control" value={btn.url} onChange={(e) => setBtn({ ...btn, url: e.target.value })} placeholder="/gst-registration, #form, #form-<form id>, #section, tel:+91…" />
          <div className="form-text mb-3"><code>#form</code> opens the page's form in a popup; <code>#form-&lt;id&gt;</code> a chosen form.</div>
          <div className="row g-2">
            <div className="col-6">
              <label className="form-label">Look</label>
              <select className="form-select" value={btn.style} onChange={(e) => setBtn({ ...btn, style: e.target.value })}>
                <option value="solid">Filled</option>
                <option value="outline">Outline</option>
                <option value="soft">Soft</option>
                <option value="link">Text link →</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label">Position</label>
              <select className="form-select" value={btn.align} onChange={(e) => setBtn({ ...btn, align: e.target.value })}>
                <option value="left">Left</option>
                <option value="center">Centre</option>
              </select>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
};

export default SmartRichEditor;

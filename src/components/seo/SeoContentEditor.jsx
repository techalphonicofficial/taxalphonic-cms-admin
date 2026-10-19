import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { confirmDialog } from '../common/confirm';
import * as C from './pseoContent';
import HtmlCodeEditor from '../common/code/HtmlCodeEditor';
import './SeoContentEditor.css';

// Visual editor for the AI-generated pSEO content (SeoPageEditForm): one card per section with its
// heading, paragraphs (rich text), cards / steps / figures, FAQs and the CTA button. All edits go
// through pseoContent.js, which keeps the HTML structure the website reads.

/** Small rich-text box for a section's paragraphs. Uncontrolled: it is remounted (key) when the HTML changes from outside. */
function MiniRichText({ value, onChange, label }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [3, 4] } }), Link.configure({ openOnClick: false })],
    content: value || '',
    onUpdate: ({ editor: ed }) => onChange(ed.isEmpty ? '' : ed.getHTML()),
  });
  if (!editor) return null;

  const btn = (title, icon, action, active) => (
    <button type="button" title={title} className={`sce-tool${active ? ' on' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={action}>
      <i className={`bi ${icon}`}></i>
    </button>
  );
  const setLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL (leave empty to remove)', prev);
    if (url === null) return;
    if (!url) editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="sce-rich">
      <div className="sce-toolbar">
        {btn('Bold', 'bi-type-bold', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
        {btn('Italic', 'bi-type-italic', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
        {btn('Link', 'bi-link-45deg', setLink, editor.isActive('link'))}
        <span className="sce-sep" />
        {btn('Sub-heading', 'bi-type-h3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
        {btn('Bullet list', 'bi-list-ul', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {btn('Numbered list', 'bi-list-ol', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
        <span className="sce-sep" />
        {btn('Undo', 'bi-arrow-counterclockwise', () => editor.chain().focus().undo().run())}
        {btn('Redo', 'bi-arrow-clockwise', () => editor.chain().focus().redo().run())}
      </div>
      <EditorContent editor={editor} className="sce-rich-body" aria-label={label} />
    </div>
  );
}

/** Textarea that grows with its text. */
function AutoText({ value, onChange, placeholder, rows = 2, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return <textarea ref={ref} rows={rows} className={`form-control sce-auto ${className}`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

const words = (text) => (String(text || '').replace(/<[^>]*>/g, ' ').trim().match(/\S+/g) || []).length;

function ItemTools({ index, count, onMove, onRemove, label }) {
  return (
    <div className="sce-item-tools">
      <button type="button" className="btn btn-sm btn-light" title="Move up" disabled={index === 0} onClick={() => onMove(-1)}><i className="bi bi-arrow-up"></i></button>
      <button type="button" className="btn btn-sm btn-light" title="Move down" disabled={index === count - 1} onClick={() => onMove(1)}><i className="bi bi-arrow-down"></i></button>
      <button type="button" className="btn btn-sm btn-light text-danger" title={`Remove ${label}`} onClick={onRemove}><i className="bi bi-trash"></i></button>
    </div>
  );
}

function SectionCard({ section, count, open, onToggle, html, onChange, version, setVersion }) {
  const { index } = section;
  // Section HTML mode keeps its own draft and applies it 0.5 s after typing stops, so the browser's
  // fix-ups of half-typed tags never replace the text under the cursor.
  const [rawDraft, setRawDraft] = useState(null);
  const rawMode = rawDraft !== null;
  const htmlRef = useRef(html);
  const pendingRaw = useRef(null);
  const rawTimer = useRef(null);
  useEffect(() => { htmlRef.current = html; }, [html]);
  const flushRaw = () => {
    clearTimeout(rawTimer.current);
    if (pendingRaw.current !== null) {
      onChange(C.setSectionHtml(htmlRef.current, index, pendingRaw.current));
      pendingRaw.current = null;
    }
  };
  const flushRef = useRef(flushRaw);
  useEffect(() => { flushRef.current = flushRaw; });
  useEffect(() => () => flushRef.current(), []);
  const editRaw = (value) => {
    setRawDraft(value);
    pendingRaw.current = value;
    clearTimeout(rawTimer.current);
    rawTimer.current = setTimeout(flushRaw, 500);
  };
  const toggleRaw = (on) => {
    if (on) {
      setRawDraft(section.html);
    } else {
      flushRaw();
      setRawDraft(null);
      setVersion((v) => v + 1);
    }
  };
  const apply = (next) => onChange(next);
  const structural = (next) => {
    onChange(next);
    setVersion((v) => v + 1);
  };
  const itemNoun = section.key === 'methodology' ? 'step' : section.schema.some((f) => f.role === 'value') ? 'figure' : 'card';

  const confirmRemoveSection = async () => {
    const ok = await confirmDialog({ title: `Remove "${section.info.label}"?`, message: 'The whole section is taken off this page. Click Save to keep the change.', tone: 'danger', confirmText: 'Remove section' });
    if (ok) structural(C.removeSection(html, index));
  };

  const summary = [
    section.items.length ? `${section.items.length} ${itemNoun}${section.items.length === 1 ? '' : 's'}` : null,
    section.faqs.length ? `${section.faqs.length} question${section.faqs.length === 1 ? '' : 's'}` : null,
    `${words(section.html)} words`,
  ].filter(Boolean).join(' · ');

  return (
    <div className={`sce-card${open ? ' open' : ''}`} id={`sce-${index}`}>
      <div className="sce-card-head" onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }} aria-expanded={open}>
        <span className="sce-num">{index + 1}</span>
        <i className={`bi ${section.info.icon} sce-icon`}></i>
        <div className="sce-titles">
          <b>{section.info.label}</b>
          <small>{section.heading?.trim() || section.info.help}</small>
        </div>
        <span className="sce-meta d-none d-md-inline">{summary}</span>
        <div className="sce-head-tools" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn btn-sm btn-light" title="Move section up" disabled={index === 0} onClick={() => structural(C.moveSection(html, index, -1))}><i className="bi bi-chevron-up"></i></button>
          <button type="button" className="btn btn-sm btn-light" title="Move section down" disabled={index === count - 1} onClick={() => structural(C.moveSection(html, index, 1))}><i className="bi bi-chevron-down"></i></button>
          <button type="button" className="btn btn-sm btn-light text-danger" title="Remove section" onClick={confirmRemoveSection}><i className="bi bi-trash"></i></button>
        </div>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'} sce-caret`}></i>
      </div>

      {open && (
        <div className="sce-card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <small className="text-muted">{section.info.help}</small>
            <div className="form-check form-switch m-0">
              <input className="form-check-input" type="checkbox" role="switch" id={`raw-${index}`} checked={rawMode} onChange={(e) => toggleRaw(e.target.checked)} />
              <label className="form-check-label small" htmlFor={`raw-${index}`}>Edit HTML</label>
            </div>
          </div>

          {rawMode ? (
            <HtmlCodeEditor compact value={rawDraft} onChange={editRaw} height={360} fileName={`${section.key}.html`} path={`seo-section-${index}-${section.key}.html`} />
          ) : (
            <>
              {section.heading !== null && (
                <div className="mb-3">
                  <label className="form-label sce-label">{section.headingTag === 'h1' ? 'Main heading (H1)' : 'Heading'}</label>
                  <input className={`form-control ${section.headingTag === 'h1' ? 'form-control-lg fw-bold' : 'fw-semibold'}`} value={section.heading} onChange={(e) => apply(C.setHeading(html, index, e.target.value))} placeholder="Section heading" />
                </div>
              )}

              {(section.hasIntro || section.items.length === 0) && (
                <div className="mb-3">
                  <label className="form-label sce-label">Text</label>
                  <MiniRichText
                    key={`intro-${version}-${index}`}
                    value={section.intro}
                    label="Section text"
                    onChange={(value) => apply(C.setIntro(html, index, value))}
                  />
                </div>
              )}

              {section.items.length > 0 && (
                <div className="mb-3">
                  <label className="form-label sce-label">{itemNoun === 'step' ? 'Steps' : itemNoun === 'figure' ? 'Highlights' : 'Cards'} <span className="text-muted fw-normal">({section.items.length})</span></label>
                  <div className={`sce-items ${section.schema.length <= 2 && itemNoun !== 'step' ? 'compact' : ''}`}>
                    {section.items.map((fields, itemIndex) => (
                      <div className="sce-item" key={itemIndex}>
                        <div className="sce-item-head">
                          <span className="sce-badge">{itemNoun === 'step' ? `Step ${itemIndex + 1}` : `${itemNoun[0].toUpperCase()}${itemNoun.slice(1)} ${itemIndex + 1}`}</span>
                          <ItemTools
                            index={itemIndex}
                            count={section.items.length}
                            label={itemNoun}
                            onMove={(dir) => apply(C.moveItem(html, index, itemIndex, dir))}
                            onRemove={() => apply(C.removeItem(html, index, itemIndex))}
                          />
                        </div>
                        {section.schema.map((field, fieldIndex) => {
                          const value = fields[fieldIndex] ?? '';
                          const set = (v) => apply(C.setItemField(html, index, itemIndex, fieldIndex, v));
                          if (field.role === 'icon') {
                            return (
                              <div className="input-group input-group-sm mb-2" key={fieldIndex}>
                                <span className="input-group-text"><i className={`bi ${value.startsWith('bi-') ? value : 'bi-image'}`}></i></span>
                                <input className="form-control" value={value} onChange={(e) => set(e.target.value)} placeholder="Icon, e.g. bi-shield-check" title="Bootstrap icon name (icons.getbootstrap.com)" />
                              </div>
                            );
                          }
                          if (field.role === 'title' || field.role === 'value') {
                            return <AutoText key={fieldIndex} rows={1} className={`mb-2 ${field.role === 'value' ? 'fw-bold' : 'fw-semibold'}`} value={value} onChange={(v) => set(v.replace(/\s*\n\s*/g, ' '))} placeholder={field.label} />;
                          }
                          return <AutoText key={fieldIndex} className="mb-2" value={value} onChange={set} placeholder={field.label} />;
                        })}
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={() => apply(C.addItem(html, index))}>
                    <i className="bi bi-plus-lg me-1"></i>Add {itemNoun}
                  </button>
                </div>
              )}

              {(section.faqs.length > 0 || section.key === 'faq') && (
                <div className="mb-3">
                  <label className="form-label sce-label">Questions <span className="text-muted fw-normal">({section.faqs.length})</span></label>
                  <div className="d-flex flex-column gap-2">
                    {section.faqs.map((faq, faqIndex) => (
                      <div className="sce-item" key={faqIndex}>
                        <div className="sce-item-head">
                          <span className="sce-badge">Q{faqIndex + 1}</span>
                          <ItemTools
                            index={faqIndex}
                            count={section.faqs.length}
                            label="question"
                            onMove={(dir) => apply(C.moveFaq(html, index, faqIndex, dir))}
                            onRemove={() => apply(C.removeFaq(html, index, faqIndex))}
                          />
                        </div>
                        <input className="form-control fw-semibold mb-2" value={faq.question} placeholder="Question" onChange={(e) => apply(C.setFaq(html, index, faqIndex, 'question', e.target.value))} />
                        <AutoText value={faq.answer} placeholder="Answer" onChange={(v) => apply(C.setFaq(html, index, faqIndex, 'answer', v))} />
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={() => apply(C.addFaq(html, index))}>
                    <i className="bi bi-plus-lg me-1"></i>Add question
                  </button>
                </div>
              )}

              {section.links.length > 0 && (
                <div className="mb-3">
                  <label className="form-label sce-label">Button{section.links.length > 1 ? 's' : ''}</label>
                  {section.links.map((link, linkIndex) => (
                    <div className="row g-2 mb-2" key={linkIndex}>
                      <div className="col-md-7">
                        <input className="form-control" value={link.text} placeholder="Button text" onChange={(e) => apply(C.setLink(html, index, linkIndex, 'text', e.target.value))} />
                      </div>
                      <div className="col-md-5">
                        <input className="form-control font-monospace" value={link.href} placeholder="#contact or https://…" onChange={(e) => apply(C.setLink(html, index, linkIndex, 'href', e.target.value))} />
                      </div>
                    </div>
                  ))}
                  <small className="text-muted">A link starting with <code>#</code> scrolls to the enquiry form on the website.</small>
                </div>
              )}

              {section.extraCount > 0 && (
                <div className="alert alert-light border small mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle"></i>
                  This section has {section.extraCount} more block{section.extraCount === 1 ? '' : 's'} that can only be changed with <b>Edit HTML</b> (switch above).
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * html: the page's longDescription; onChange(nextHtml).
 * resetKey: bump it when the HTML is replaced from outside (AI regenerate), so the rich-text boxes reload.
 */
export default function SeoContentEditor({ html, onChange, resetKey = 0 }) {
  const sections = useMemo(() => C.parseContent(html), [html]);
  const [openIndex, setOpenIndex] = useState(0);
  const [version, setVersion] = useState(0);
  const [allOpen, setAllOpen] = useState(false);
  const v = `${resetKey}-${version}`;

  if (!html?.trim()) {
    return (
      <div className="sce-empty">
        <i className="bi bi-robot"></i>
        <p className="mb-1 fw-semibold">No content yet</p>
        <p className="text-muted small mb-0">Use "Regenerate Multi-Section AI" above to write this page, or the HTML Source tab.</p>
      </div>
    );
  }

  if (sections.length === 0) {
    // Hand-written content without <section> blocks: one rich-text box.
    return (
      <div className="sce">
        <div className="alert alert-light border small">This content has no sections, so it is edited as one text.</div>
        <MiniRichText key={`all-${v}`} value={html} onChange={onChange} label="Page content" />
      </div>
    );
  }

  const jump = (i) => {
    setOpenIndex(i);
    setAllOpen(false);
    requestAnimationFrame(() => document.getElementById(`sce-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="sce">
      <div className="sce-layout">
        <nav className="sce-nav" aria-label="Sections">
          <div className="sce-nav-title">Sections</div>
          {sections.map((s) => (
            <button type="button" key={`${s.key}-${s.index}`} className={`sce-nav-item${(allOpen || openIndex === s.index) ? ' active' : ''}`} onClick={() => jump(s.index)}>
              <i className={`bi ${s.info.icon}`}></i>
              <span>{s.info.label}</span>
            </button>
          ))}
          <button type="button" className="btn btn-sm btn-link text-decoration-none mt-2 px-2" onClick={() => setAllOpen((o) => !o)}>
            <i className={`bi ${allOpen ? 'bi-arrows-collapse' : 'bi-arrows-expand'} me-1`}></i>{allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </nav>

        <div className="sce-main">
          {sections.map((s) => (
            <SectionCard
              key={`${s.key}-${s.index}-${v}`}
              section={s}
              count={sections.length}
              open={allOpen || openIndex === s.index}
              onToggle={() => { setAllOpen(false); setOpenIndex(openIndex === s.index && !allOpen ? -1 : s.index); }}
              html={html}
              onChange={onChange}
              version={v}
              setVersion={setVersion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

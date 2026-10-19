// Reads and edits the AI-generated pSEO HTML (SeoPage.longDescription) section by section.
// The HTML is `<section data-section="hero|painPoints|solution|features|methodology|roi|faq|cta">` blocks;
// the website (taxalphonic service/seoPageService.js) turns them into blocks by their content
// (cards, steps, figures, <details>, <aside>), so edits change texts / items in place and keep the
// tags and classes of the original markup. Every edit parses the current HTML, changes the DOM and
// serializes it again, so the HTML string stays the single source of truth.

export const SECTION_INFO = {
  hero: { label: 'Hero (top of the page)', icon: 'bi-stars', help: 'Main heading, intro and the highlight badges.' },
  painPoints: { label: 'Problems / Challenges', icon: 'bi-exclamation-triangle', help: 'The problems your customers face.' },
  solution: { label: 'Our Solution', icon: 'bi-lightbulb', help: 'How you solve those problems.' },
  features: { label: 'Services / Features', icon: 'bi-grid', help: 'What is included, as cards.' },
  methodology: { label: 'Process / Steps', icon: 'bi-list-ol', help: 'How the work is done, step by step.' },
  roi: { label: 'Results / Benefits', icon: 'bi-graph-up-arrow', help: 'The benefits or figures customers get.' },
  faq: { label: 'FAQs', icon: 'bi-question-circle', help: 'Questions and answers.' },
  cta: { label: 'Call to Action', icon: 'bi-megaphone', help: 'The closing banner and its button.' },
};

export const sectionInfo = (key) => SECTION_INFO[key] || { label: key ? key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()) : 'Content', icon: 'bi-file-text', help: '' };

function load(html) {
  const doc = new DOMParser().parseFromString(`<!doctype html><html><body>${html || ''}</body></html>`, 'text/html');
  const sections = [...doc.body.children].filter((el) => el.tagName === 'SECTION');
  return { doc, sections };
}

const save = (doc) => doc.body.innerHTML;

const ICON_CLASS = /^(bi|fa)-[\w-]+$/;
const iconClassOf = (el) => [...el.classList].find((c) => ICON_CLASS.test(c) && !/^fa-(solid|regular|brands|light)$/.test(c)) || '';
const isIcon = (el) => el.tagName === 'I' || (!el.textContent.trim() && Boolean(iconClassOf(el)));

/** The editable parts of one section (element references into its DOM). */
function analyze(section) {
  const root = [...section.children].find((el) => el.tagName === 'ASIDE') || section;
  const kids = [...root.children];
  const heading = kids.find((el) => /^H[1-3]$/.test(el.tagName)) || null;
  const paragraphs = kids.filter((el) => el.tagName === 'P' || el.tagName === 'UL' || el.tagName === 'OL');
  const faqs = kids.filter((el) => el.tagName === 'DETAILS');
  const links = kids.filter((el) => el.tagName === 'A');
  // A list of cards / steps / figures: a div whose children are all the same kind of element with content.
  const list = kids.find((el) => el.tagName === 'DIV'
    && el.children.length > 0
    && [...el.children].every((c) => c.tagName === el.children[0].tagName && c.children.length > 0)) || null;
  const used = new Set([heading, ...paragraphs, ...faqs, ...links, list].filter(Boolean));
  const extra = kids.filter((el) => !used.has(el));
  return { root, heading, paragraphs, faqs, links, list, items: list ? [...list.children] : [], extra };
}

/** Field roles of a card, from its child elements: icon, title, text (or value + label for figures). */
function itemSchema(item) {
  const children = [...item.children];
  const hasTitle = children.some((c) => /^H[2-6]$/.test(c.tagName));
  const texts = children.filter((c) => !isIcon(c) && !/^H[2-6]$/.test(c.tagName));
  return children.map((el) => {
    if (isIcon(el)) return { role: 'icon', label: 'Icon' };
    if (/^H[2-6]$/.test(el.tagName)) return { role: 'title', label: 'Title' };
    const n = texts.indexOf(el);
    if (hasTitle) return { role: 'text', label: n === 0 ? 'Text' : `Text ${n + 1}` };
    if (texts.length > 1) return n === 0 ? { role: 'value', label: 'Highlight' } : { role: 'text', label: n === 1 ? 'Label' : `Text ${n + 1}` };
    return { role: 'text', label: 'Text' };
  });
}

const readField = (el, role) => (role === 'icon' ? iconClassOf(el) : el.textContent);

function writeField(el, role, value) {
  if (role === 'icon') {
    const old = iconClassOf(el);
    if (old) el.classList.remove(old);
    const next = String(value || '').trim();
    if (next) el.classList.add(...next.split(/\s+/).filter(Boolean));
    return;
  }
  el.textContent = value;
}

function faqParts(details) {
  const summary = [...details.children].find((c) => c.tagName === 'SUMMARY') || null;
  const answer = [...details.children].find((c) => c !== summary) || null;
  return { summary, answer };
}

/** Plain model of the content for the editor UI. */
export function parseContent(html) {
  const { sections } = load(html);
  return sections.map((section, index) => {
    const key = section.getAttribute('data-section') || section.id || `section-${index + 1}`;
    const a = analyze(section);
    const schema = a.items[0] ? itemSchema(a.items[0]) : [];
    return {
      index,
      key,
      info: sectionInfo(key),
      heading: a.heading ? a.heading.textContent : null,
      headingTag: a.heading ? a.heading.tagName.toLowerCase() : null,
      intro: a.paragraphs.map((p) => p.outerHTML).join(''),
      hasIntro: a.paragraphs.length > 0,
      schema,
      items: a.items.map((item) => [...item.children].map((el, i) => readField(el, schema[i]?.role || 'text'))),
      faqs: a.faqs.map((d) => {
        const { summary, answer } = faqParts(d);
        return { question: summary ? summary.textContent : '', answer: answer ? answer.textContent : '' };
      }),
      links: a.links.map((l) => ({ text: l.textContent, href: l.getAttribute('href') || '' })),
      extraCount: a.extra.length,
      html: section.innerHTML,
    };
  });
}

/** Runs `fn(parts, section, doc)` on section `index` and returns the new HTML. */
function edit(html, index, fn) {
  const { doc, sections } = load(html);
  const section = sections[index];
  if (!section) return html;
  fn(analyze(section), section, doc);
  return save(doc);
}

export const setHeading = (html, index, value) => edit(html, index, (a) => {
  if (a.heading) a.heading.textContent = value;
});

/** Replaces the section's paragraphs with the rich-text editor's HTML. */
export const setIntro = (html, index, introHtml) => edit(html, index, (a, section, doc) => {
  const holder = doc.createElement('div');
  holder.innerHTML = introHtml || '';
  const empty = !holder.textContent.trim();
  const anchor = a.paragraphs[0] || null;
  const nodes = empty ? [] : [...holder.childNodes];
  if (anchor) {
    nodes.forEach((n) => a.root.insertBefore(n, anchor));
  } else if (nodes.length) {
    const after = a.heading ? a.heading.nextSibling : a.root.firstChild;
    nodes.forEach((n) => a.root.insertBefore(n, after));
  }
  a.paragraphs.forEach((p) => p.remove());
});

export const setItemField = (html, index, itemIndex, fieldIndex, value) => edit(html, index, (a) => {
  const item = a.items[itemIndex];
  const schema = a.items[0] ? itemSchema(a.items[0]) : [];
  const el = item?.children[fieldIndex];
  if (el) writeField(el, schema[fieldIndex]?.role || 'text', value);
});

export const addItem = (html, index) => edit(html, index, (a) => {
  const last = a.items[a.items.length - 1];
  if (!last) return;
  const schema = itemSchema(last);
  const copy = last.cloneNode(true);
  [...copy.children].forEach((el, i) => { if (schema[i]?.role !== 'icon') el.textContent = ''; });
  a.list.appendChild(copy);
});

export const removeItem = (html, index, itemIndex) => edit(html, index, (a) => {
  a.items[itemIndex]?.remove();
});

export const moveItem = (html, index, itemIndex, dir) => edit(html, index, (a) => {
  const item = a.items[itemIndex];
  const other = a.items[itemIndex + dir];
  if (!item || !other) return;
  if (dir < 0) a.list.insertBefore(item, other);
  else a.list.insertBefore(other, item);
});

export const setFaq = (html, index, faqIndex, field, value) => edit(html, index, (a) => {
  const d = a.faqs[faqIndex];
  if (!d) return;
  const { summary, answer } = faqParts(d);
  if (field === 'question' && summary) summary.textContent = value;
  if (field === 'answer') {
    if (answer) answer.textContent = value;
    else {
      const div = d.ownerDocument.createElement('div');
      div.className = 'faq-answer';
      div.textContent = value;
      d.appendChild(div);
    }
  }
});

export const addFaq = (html, index) => edit(html, index, (a, section, doc) => {
  const last = a.faqs[a.faqs.length - 1];
  let d;
  if (last) {
    d = last.cloneNode(true);
    const { summary, answer } = faqParts(d);
    if (summary) summary.textContent = '';
    if (answer) answer.textContent = '';
    last.after(d);
  } else {
    d = doc.createElement('details');
    d.className = 'faq-accordion';
    d.innerHTML = '<summary class="faq-question"></summary><div class="faq-answer"></div>';
    a.root.appendChild(d);
  }
});

export const removeFaq = (html, index, faqIndex) => edit(html, index, (a) => {
  a.faqs[faqIndex]?.remove();
});

export const moveFaq = (html, index, faqIndex, dir) => edit(html, index, (a) => {
  const d = a.faqs[faqIndex];
  const other = a.faqs[faqIndex + dir];
  if (!d || !other) return;
  if (dir < 0) other.before(d);
  else other.after(d);
});

export const setLink = (html, index, linkIndex, field, value) => edit(html, index, (a) => {
  const link = a.links[linkIndex];
  if (!link) return;
  if (field === 'text') link.textContent = value;
  else link.setAttribute('href', value);
});

export const setSectionHtml = (html, index, inner) => edit(html, index, (a, section) => {
  section.innerHTML = inner;
});

export function moveSection(html, index, dir) {
  const { doc, sections } = load(html);
  const s = sections[index];
  const other = sections[index + dir];
  if (!s || !other) return html;
  if (dir < 0) other.before(s);
  else other.after(s);
  return save(doc);
}

export function removeSection(html, index) {
  const { doc, sections } = load(html);
  sections[index]?.remove();
  return save(doc);
}

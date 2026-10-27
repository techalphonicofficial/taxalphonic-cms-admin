// Clean HTML pasted into a Jodit editor (from a website, Google Docs or Word).
// Keeps the structure (headings, paragraphs, lists, tables, links, images, bold / italic) and
// drops the source page's styles, classes and widths, which made the editor and the website
// page as wide as the page the text was copied from.

const DROP = 'script, style, meta, link, title, head, noscript, iframe, object, embed, form, input, button, select, textarea, svg, canvas';
const UNWRAP = new Set(['SPAN', 'FONT', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'FOOTER', 'ASIDE', 'NAV', 'FIGURE', 'CENTER', 'O:P']);
const BLOCK = 'p, h1, h2, h3, h4, h5, h6, ul, ol, li, table, div, blockquote, pre, hr';
const KEEP_ATTRS = {
  A: ['href', 'target', 'rel', 'title'],
  IMG: ['src', 'alt', 'title'],
  TD: ['colspan', 'rowspan'],
  TH: ['colspan', 'rowspan'],
};

const unwrap = (el) => el.replaceWith(...el.childNodes);

function rename(el, tag) {
  const next = el.ownerDocument.createElement(tag);
  next.append(...el.childNodes);
  el.replaceWith(next);
  return next;
}

export function cleanPastedHtml(html) {
  if (typeof DOMParser === 'undefined' || !html) return html;
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  const body = doc.body;

  body.querySelectorAll(DROP).forEach((el) => el.remove());

  // Comments (Word / Google Docs markers).
  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_COMMENT);
  const comments = [];
  while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach((c) => c.remove());

  // Google Docs wraps everything in <b style="font-weight:normal" id="docs-internal-guid-...">.
  body.querySelectorAll('b[id^="docs-internal-guid"]').forEach(unwrap);

  // Bold / italic given by style only (Google Docs) becomes <strong> / <em> before styles go.
  body.querySelectorAll('span[style]').forEach((el) => {
    const style = el.getAttribute('style') || '';
    let inner = el;
    if (/font-weight\s*:\s*(bold|[6-9]00)/i.test(style)) inner = rename(inner, 'strong');
    if (/font-style\s*:\s*italic/i.test(style)) {
      const em = doc.createElement('em');
      em.append(...inner.childNodes);
      inner.append(em);
    }
  });

  // Elements are collected first: unwrapping changes the tree while walking it.
  Array.from(body.querySelectorAll('*')).forEach((el) => {
    const keep = KEEP_ATTRS[el.tagName] || [];
    Array.from(el.attributes).forEach((attr) => {
      if (!keep.includes(attr.name.toLowerCase())) el.removeAttribute(attr.name);
    });
    if (el.tagName === 'A' && /^\s*javascript:/i.test(el.getAttribute('href') || '')) el.removeAttribute('href');
    if (UNWRAP.has(el.tagName)) unwrap(el);
  });

  // A <div> holding only text / inline content is a paragraph; one holding blocks is just a wrapper.
  Array.from(body.querySelectorAll('div')).reverse().forEach((div) => {
    if (div.querySelector(BLOCK)) unwrap(div);
    else rename(div, 'p');
  });

  // Empty paragraphs and headings (only spaces / &nbsp; / <br>).
  body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li').forEach((el) => {
    if (!el.textContent.trim() && !el.querySelector('img')) el.remove();
  });

  return body.innerHTML.replace(/&nbsp;/g, ' ').trim();
}

// Jodit options: pasted HTML is cleaned and inserted straight away (no "Paste as HTML" dialog).
export const JODIT_CLEAN_PASTE = {
  askBeforePasteHTML: false,
  // Word / Excel HTML takes the same path (the Word plugin would insert it untouched).
  processPasteFromWord: false,
  defaultActionOnPaste: 'insert_clean_structure',
  events: {
    onCustomPasteHTMLOption: (action, html) => (action === 'insert_clean_structure' ? cleanPastedHtml(html) : undefined),
  },
};

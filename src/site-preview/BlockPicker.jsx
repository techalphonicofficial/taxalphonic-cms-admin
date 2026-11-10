import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/*
 * Inside the preview frame: click a block to open it in the Page Builder. Every block of the preview's
 * draft carries config.previewId (only on the preview copy, never saved); the website's
 * BlockBackground.jsx renders it as <div data-ta-bid style="display: contents">. Hovering a block
 * outlines it with its name; a click is kept from the page (no link, popup or tab change) and calls
 * onPick(id). Off (enabled = false): the page behaves normally.
 */

const COLOR = '#6366f1';

/** Box of a display: contents wrapper = the box around its content. */
function boxOf(el) {
  const doc = el.ownerDocument;
  const range = doc.createRange();
  range.selectNodeContents(el);
  const r = range.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  const win = doc.defaultView;
  return { x: r.left + win.scrollX, y: r.top + win.scrollY, w: r.width, h: r.height };
}

export default function BlockPicker({ doc, enabled, onPick, labelOf, selectedId }) {
  const [hover, setHover] = useState(null); // { id, box }

  useEffect(() => {
    if (!enabled) { setHover(null); return undefined; }
    const blockAt = (target) => target?.closest?.('[data-ta-bid]') || null;
    const onMove = (event) => {
      const el = blockAt(event.target);
      if (!el) { setHover(null); return; }
      const id = el.getAttribute('data-ta-bid');
      const box = boxOf(el);
      setHover((current) => (current?.id === id && current.box?.y === box?.y && current.box?.h === box?.h ? current : box ? { id, box } : null));
    };
    const onLeave = () => setHover(null);
    // Capture phase on the window: runs before the page's own handlers (links, form popups, tabs,
    // accordions), including the ones the website adds to the document.
    const onClick = (event) => {
      const el = blockAt(event.target);
      if (!el) return;
      event.preventDefault();
      event.stopPropagation();
      onPick(el.getAttribute('data-ta-bid'));
    };
    doc.addEventListener('mousemove', onMove, true);
    doc.addEventListener('mouseleave', onLeave);
    const win = doc.defaultView;
    win.addEventListener('click', onClick, true);
    return () => {
      doc.removeEventListener('mousemove', onMove, true);
      doc.removeEventListener('mouseleave', onLeave);
      win.removeEventListener('click', onClick, true);
    };
  }, [doc, enabled, onPick]);

  if (!enabled || !hover) return null;
  const { box } = hover;
  const selected = String(selectedId) === hover.id;
  return createPortal(
    <div style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, zIndex: 2147483001, pointerEvents: 'none' }} aria-hidden="true">
      <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, boxSizing: 'border-box', border: `2px solid ${COLOR}`, background: 'rgba(99, 102, 241, .06)', borderRadius: 6 }} />
      <div style={{ position: 'absolute', left: box.x, top: Math.max(0, box.y - 24), background: COLOR, color: '#fff', font: '600 12px/1 system-ui, sans-serif', padding: '6px 9px', borderRadius: '6px 6px 6px 0', whiteSpace: 'nowrap' }}>
        {labelOf?.(hover.id) || 'Block'}{selected ? ' · open in editor' : ' · click to edit'}
      </div>
    </div>,
    doc.body
  );
}

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/*
 * Inside the preview frame: draws the marked block's margin, padding and border over the page, like
 * the browser's inspector. The website marks the block with data-ta-block (config.previewMark, set
 * only on the preview's copy of the draft; see BlockBackground.jsx). The block's root is found the
 * same way the ".ta-sp" rules in the website's blocks.css find it.
 */
export const OVERLAY_COLORS = { margin: 'rgba(249, 115, 22, .38)', padding: 'rgba(34, 197, 94, .35)', border: '#6366f1' };

function rootOf(mark) {
  let el = mark.firstElementChild;
  if (!el) return null;
  const wrapper = el.classList.contains('ta-sp') ? el : null;
  if (wrapper) el = wrapper.firstElementChild;
  if (!el) return null;
  if (el.classList.contains('ta-bg')) return { outer: wrapper || el, box: el, inner: el.querySelector(':scope > .ta-bg-content') || el };
  if (el.classList.contains('ta-svc-embed')) el = el.firstElementChild;
  else if (el.classList.contains('ta-jt-embed')) el = el.querySelector(':scope > .wrap')?.firstElementChild;
  else if (el.classList.contains('ta-home-embed')) el = el.querySelector(':scope > .home-page')?.firstElementChild;
  return el ? { outer: wrapper || el, box: el, inner: el } : null;
}

function read(doc) {
  const mark = doc.querySelector('[data-ta-block]');
  const root = mark && rootOf(mark);
  if (!root) return null;
  const win = doc.defaultView;
  const px = (value) => Math.round(parseFloat(value) || 0);
  const box = win.getComputedStyle(root.box);
  const inner = win.getComputedStyle(root.inner);
  const outer = root.outer === root.box ? null : win.getComputedStyle(root.outer);
  const rect = root.box.getBoundingClientRect();
  const innerRect = root.inner.getBoundingClientRect();
  return {
    id: mark.getAttribute('data-ta-block'),
    x: Math.round(rect.left + win.scrollX),
    y: Math.round(rect.top + win.scrollY),
    w: Math.round(rect.width),
    h: Math.round(rect.height),
    innerX: Math.round(innerRect.left + win.scrollX),
    innerY: Math.round(innerRect.top + win.scrollY),
    innerW: Math.round(innerRect.width),
    innerH: Math.round(innerRect.height),
    radius: box.borderTopLeftRadius,
    margin: { top: px(box.marginTop) + px(outer?.marginTop), bottom: px(box.marginBottom) + px(outer?.marginBottom) },
    padding: { top: px(inner.paddingTop), right: px(inner.paddingRight), bottom: px(inner.paddingBottom), left: px(inner.paddingLeft) },
    border: px(box.borderTopWidth),
  };
}

const Band = ({ color, label, style }) => (
  <div style={{ position: 'absolute', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...style }}>
    {label > 0 && <span style={{ font: '700 11px/1 system-ui, sans-serif', color: '#111827', background: 'rgba(255,255,255,.85)', padding: '2px 4px', borderRadius: 3 }}>{label}</span>}
  </div>
);

export default function SpacingOverlay({ doc, show, onMeasure }) {
  const [m, setM] = useState(null);
  const last = useRef('');
  const scrolledTo = useRef(null);

  // The page re-renders after each edit, and images and fonts load later: read it on a short timer.
  useEffect(() => {
    const tick = () => {
      const next = read(doc);
      const key = JSON.stringify(next);
      if (key === last.current) return;
      last.current = key;
      setM(next);
      onMeasure?.(next);
      if (next && next.id !== scrolledTo.current) {
        scrolledTo.current = next.id;
        doc.querySelector('[data-ta-block]')?.scrollIntoView({ block: 'center' });
      }
    };
    tick();
    const timer = setInterval(tick, 200);
    return () => clearInterval(timer);
  }, [doc, onMeasure]);

  if (!show || !m) return null;
  const { margin: mg, padding: pd } = m;
  return createPortal(
    <div style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, zIndex: 2147483000, pointerEvents: 'none' }} aria-hidden="true">
      <Band color={OVERLAY_COLORS.margin} label={mg.top} style={{ left: m.x, top: m.y - mg.top, width: m.w, height: mg.top }} />
      <Band color={OVERLAY_COLORS.margin} label={mg.bottom} style={{ left: m.x, top: m.y + m.h, width: m.w, height: mg.bottom }} />
      <Band color={OVERLAY_COLORS.padding} label={pd.top} style={{ left: m.innerX, top: m.innerY, width: m.innerW, height: pd.top }} />
      <Band color={OVERLAY_COLORS.padding} label={pd.bottom} style={{ left: m.innerX, top: m.innerY + m.innerH - pd.bottom, width: m.innerW, height: pd.bottom }} />
      <Band color={OVERLAY_COLORS.padding} label={pd.left} style={{ left: m.innerX, top: m.innerY + pd.top, width: pd.left, height: Math.max(0, m.innerH - pd.top - pd.bottom) }} />
      <Band color={OVERLAY_COLORS.padding} label={pd.right} style={{ left: m.innerX + m.innerW - pd.right, top: m.innerY + pd.top, width: pd.right, height: Math.max(0, m.innerH - pd.top - pd.bottom) }} />
      <div style={{ position: 'absolute', left: m.x, top: m.y, width: m.w, height: m.h, boxSizing: 'border-box', outline: `2px dashed ${OVERLAY_COLORS.border}`, outlineOffset: -1, borderRadius: m.radius }} />
    </div>,
    doc.body
  );
}

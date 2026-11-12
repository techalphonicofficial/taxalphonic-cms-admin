/*
 * pSEO page hero background (2026-11-12). Stored on the content's hero section as data attributes,
 * so it needs no database column and travels with the page:
 *   <section data-section="hero" data-bg-image="/uploads/x.webp" data-bg-overlay="#0a1a2f"
 *            data-bg-opacity="55" data-bg-text="light" data-bg-position="center" data-bg-size="cover">
 * Read by the website (service/seoPageService.js → the HeroBanner's config.background); kept by the
 * backend when AI rewrites the content (utils/pseoHeroBg.js). Empty = the service hero's own background.
 */
export const HERO_BG_KEYS = ['image', 'overlay', 'opacity', 'text', 'position', 'size'];
export const HERO_BG_DEFAULT = { image: '', overlay: '#0a1a2f', opacity: '55', text: 'light', position: 'center', size: 'cover' };

function load(html) {
  const doc = new DOMParser().parseFromString(`<!doctype html><html><body>${html || ''}</body></html>`, 'text/html');
  const sections = [...doc.body.children].filter((el) => el.tagName === 'SECTION');
  // The hero: data-section="hero", or the first section when it has the page's h1 (as the website reads it).
  const hero = sections.find((s) => s.getAttribute('data-section') === 'hero')
    || (sections[0] && sections[0].querySelector('h1') ? sections[0] : null);
  return { doc, hero };
}

/** { image, overlay, opacity, text, position, size } of the hero, or null when there is no hero section. */
export function readHeroBg(html) {
  const { hero } = load(html);
  if (!hero) return null;
  return Object.fromEntries(HERO_BG_KEYS.map((key) => [key, hero.getAttribute(`data-bg-${key}`) || '']));
}

/** The content with the hero's background set (an empty image removes every bg attribute). */
export function writeHeroBg(html, bg) {
  const { doc, hero } = load(html);
  if (!hero) return html;
  const clear = !String(bg?.image || '').trim();
  for (const key of HERO_BG_KEYS) {
    const value = String(bg?.[key] ?? '').trim();
    if (clear || !value) hero.removeAttribute(`data-bg-${key}`);
    else hero.setAttribute(`data-bg-${key}`, value);
  }
  return doc.body.innerHTML;
}

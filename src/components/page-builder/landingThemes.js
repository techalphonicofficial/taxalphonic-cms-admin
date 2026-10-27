// Colour themes of a landing page: same keys and colours as the website's
// components/tax-alphonic/landing/landingThemes.js (its landing-themes.css applies them).
// Saved as the Header block's payload.pageTheme, so drafts, versions and the preview carry it.
export const LANDING_THEMES = [
  { key: 'default', name: 'Tax Alphonic', brand: '#0e96ac', accent: '#e8521e', deep: '#0b1120' },
  { key: 'ocean', name: 'Ocean Blue', brand: '#2563eb', accent: '#f59e0b', deep: '#0b1b3f' },
  { key: 'emerald', name: 'Emerald', brand: '#059669', accent: '#f97316', deep: '#052e24' },
  { key: 'royal', name: 'Royal Purple', brand: '#7c3aed', accent: '#ec4899', deep: '#1e1240' },
  { key: 'sunset', name: 'Sunset Orange', brand: '#ea580c', accent: '#db2777', deep: '#2a1206' },
  { key: 'rose', name: 'Rose', brand: '#e11d48', accent: '#7c3aed', deep: '#2a0a14' },
  { key: 'midnight', name: 'Navy & Gold', brand: '#1e3a8a', accent: '#d97706', deep: '#0a1230' },
  { key: 'forest', name: 'Forest Green', brand: '#15803d', accent: '#ca8a04', deep: '#0c2414' },
  { key: 'crimson', name: 'Crimson', brand: '#b91c1c', accent: '#f59e0b', deep: '#1c0a0a' },
  { key: 'slate', name: 'Slate & Sky', brand: '#334155', accent: '#0ea5e9', deep: '#0f172a' },
];

const HEADER = 'LandingHeader';
const KEYS = new Set(LANDING_THEMES.map((t) => t.key));

// Custom themes ("Create your own"): pageTheme "custom" + payload.customTheme { name, brand, accent, deep }
// on the page itself (the website turns them into CSS variables); "My themes" (GET/PUT
// /landing-pages/themes) is only a library to pick them from again.
export const CUSTOM = 'custom';
export const HEX = /^#[0-9a-f]{6}$/i;
export const isCustomTheme = (t) => Boolean(t) && ['brand', 'accent', 'deep'].every((c) => HEX.test(String(t[c] || '')));

/** The theme of a landing page's blocks: { key, custom } (custom = the colours when key is "custom"). */
export function pageThemeOfSections(sections) {
  const payload = (sections || []).find((s) => s.type === HEADER)?.data?.payload || {};
  if (payload.pageTheme === CUSTOM && isCustomTheme(payload.customTheme)) return { key: CUSTOM, custom: payload.customTheme };
  return { key: KEYS.has(payload.pageTheme) ? payload.pageTheme : 'default', custom: null };
}

/** The theme key saved in a landing page's blocks ("default" when none). */
export function themeOfSections(sections) {
  return pageThemeOfSections(sections).key;
}

/**
 * The blocks with `key` as the page theme (`custom` = the colours for key "custom"); a Header block
 * in "Website header" style is added when there is none.
 */
export function withTheme(sections, key, custom = null) {
  const list = Array.isArray(sections) ? sections : [];
  const apply = (payload = {}) => {
    const { customTheme: _previous, ...rest } = payload;
    if (key === CUSTOM && isCustomTheme(custom)) {
      const { name = 'My theme', brand, accent, deep } = custom;
      return { ...rest, pageTheme: CUSTOM, customTheme: { name, brand, accent, deep } };
    }
    return { ...rest, pageTheme: KEYS.has(key) ? key : 'default' };
  };
  const index = list.findIndex((s) => s.type === HEADER);
  if (index === -1) {
    return [{ id: `sec_${Date.now()}_theme`, type: HEADER, config: {}, data: { payload: apply({ mode: 'site' }) } }, ...list];
  }
  return list.map((s, i) => (i === index ? { ...s, data: { ...s.data, payload: apply(s.data?.payload || {}) } } : s));
}

/** Colours of any theme value ({ key, custom }) for swatches. */
export function themeColours(theme) {
  if (theme?.key === CUSTOM && isCustomTheme(theme.custom)) return theme.custom;
  return LANDING_THEMES.find((t) => t.key === theme?.key) || LANDING_THEMES[0];
}

/** WCAG contrast ratio of two hex colours (white text on a colour should be at least 3, better 4.5). */
export function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

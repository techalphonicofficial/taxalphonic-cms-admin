import { homePlacementRule } from './homeBlocks';

// Layout areas of the page builder canvas. The builder still saves one ordered list of
// sections with section.config.placement; these helpers turn that list into the areas the
// website renders, and back.

export const ZONE_LABELS = {
  header: 'Header',
  footer: 'Footer',
  hero: 'Hero',
  top: 'Top (full width)',
  main: 'Main content',
  sidebar: 'Right sidebar',
  bottom: 'Bottom (full width)',
  full: 'Full width',
};

/* ---------- Service pages: hero, top, main | sidebar, bottom ---------- */

// Where the website places a block when its config has no placement.
// Keep in sync with DEFAULT_PLACEMENT in the website's ApiServicePage.jsx.
export const DEFAULT_PLACEMENT = {
  Faq: 'bottom',
  Form: 'sidebar',
  Checklist: 'sidebar',
  Highlights: 'top',
  CallToAction: 'bottom',
  LocationsServed: 'bottom',
  CommonFormHero: 'top', // hero with a form: full width under the hero
  CommonExploreHub: 'bottom', // explore links grid: full width under the page body
  CommonDataBand: 'bottom', // numbers dashboard: full width under the page body
  // Blog post cards (blogBlocks.js; website blog/blogLayout.js puts them in the sidebar too).
  BlogToc: 'sidebar',
  BlogShare: 'sidebar',
  BlogExpertCta: 'sidebar',
};

// Blocks the website has a sidebar design for (lead card, side-trust grid, side-why, side CTA).
// CommonTool: a free tool's calculator, which stacks into one column there.
// CommonCards / CommonStats: one card per row / two numbers per row in the sidebar (website blocks.css).
// CommonButtons: stacked full-width buttons in the sidebar.
export const SERVICE_SIDEBAR_BLOCKS = ['Form', 'Highlights', 'Checklist', 'CallToAction', 'CommonTool', 'CommonTrust', 'CommonContact', 'CommonMiniFaq', 'CommonCards', 'CommonStats', 'CommonButtons', 'BlogToc', 'BlogShare', 'BlogExpertCta'];

// header / footer: the landing page regions (LandingHeader / LandingFooter blocks, landingBlocks.js);
// empty on every other builder. They stay first / last in the saved list.
export const SERVICE_ZONES = ['header', 'hero', 'top', 'main', 'sidebar', 'bottom', 'footer'];
const SERVICE_PLACEMENTS = ['top', 'main', 'sidebar', 'bottom'];
const REGION_ZONE = { LandingHeader: 'header', LandingFooter: 'footer' };

// Blocks that may fill the Hero area (one block there): with config.placement "hero" (the Hero Banner also
// without a placement). Since 2026-11-13 the Hero Banner may be placed in any other area / section too
// (placement top / main / bottom; website ApiServicePage isTopHero). Keep in sync with HERO_BLOCKS there.
export const SERVICE_HERO_BLOCKS = ['HeroBanner', 'HomeHero', 'CommonFormHero', 'HomeBanners'];
export const SERVICE_HERO_LABEL = 'Hero Banner, Homepage Hero, Hero with Form, Banners Slider';

export const servicePlacementOf = (section) => {
  if (REGION_ZONE[section.type]) return REGION_ZONE[section.type];
  const placement = section.config?.placement;
  if (section.type === 'HeroBanner') return ['top', 'main', 'bottom'].includes(placement) ? placement : 'hero';
  if (placement === 'hero' && SERVICE_HERO_BLOCKS.includes(section.type)) return 'hero';
  // Homepage blocks are full-width designs: the Bottom area unless placed elsewhere (website: same rule).
  return SERVICE_PLACEMENTS.includes(placement) ? placement : DEFAULT_PLACEMENT[section.type] || (/^Home[A-Z]/.test(section.type) ? 'bottom' : 'main');
};

/** Why `type` can't go in `zone`, or '' when it can. */
export const serviceDropError = (type, zone, label) => {
  // Landing page header / footer never mix with the body.
  if (REGION_ZONE[type] && zone !== REGION_ZONE[type]) return `The ${label} block stays in the ${ZONE_LABELS[REGION_ZONE[type]]} area.`;
  if (!REGION_ZONE[type] && (zone === 'header' || zone === 'footer')) return `Only the ${zone === 'header' ? 'Header' : 'Footer'} block goes in the ${ZONE_LABELS[zone]} area.`;
  if (zone === 'hero' && !SERVICE_HERO_BLOCKS.includes(type)) return `Only a hero block goes in the Hero area (${SERVICE_HERO_LABEL}).`;
  if (zone === 'sidebar' && !SERVICE_SIDEBAR_BLOCKS.includes(type)) {
    return `${label} can't go in the right sidebar. Sidebar blocks: Form, Highlights, Checklist, Call to Action, Free Tool / Calculator, Trust Badges, Contact Card, Quick FAQ.`;
  }
  return '';
};

export const serviceZones = (sections) => {
  const zones = Object.fromEntries(SERVICE_ZONES.map(z => [z, []]));
  sections.forEach(section => zones[servicePlacementOf(section)].push(section));
  return zones;
};

/* ---------- Homepage: full-width rows and two-column rows, in page order ---------- */

export const homePlacementOf = (section) => {
  const rule = homePlacementRule(section.type);
  const chosen = section.config?.placement;
  return rule.options.includes(chosen) ? chosen : rule.default;
};

export const homeDropError = (type, column, label) => {
  const rule = homePlacementRule(type);
  if (column === 'full') return !rule.options.includes('full') ? `${label} can't be full width.` : '';
  const where = column === 'sidebar' ? 'the right sidebar' : 'main content';
  if (!rule.options.includes(column)) return `${label} is too wide for ${where}. Put it in main content or a full-width row.`;
  return '';
};

/**
 * Consecutive full-width blocks form one "full" row; consecutive main/sidebar blocks form one
 * "split" row (the website shows it as main left, sidebar right). A trailing empty row of the
 * other kind is added so there is always somewhere to drop a block at the end of the page.
 */
export const homeRows = (sections) => {
  const rows = [];
  sections.forEach(section => {
    const placement = homePlacementOf(section);
    const kind = placement === 'full' ? 'full' : 'split';
    let row = rows[rows.length - 1];
    if (row?.kind !== kind) {
      row = { kind, full: [], main: [], sidebar: [] };
      rows.push(row);
    }
    row[placement].push(section);
  });
  const extra = (kind) => ({ kind, full: [], main: [], sidebar: [], extra: true });
  if (!rows.length) rows.push(extra('full'), extra('split'));
  else rows.push(extra(rows[rows.length - 1].kind === 'split' ? 'full' : 'split'));
  return rows;
};

/**
 * Inserts `moving` into the flat list (which no longer holds it) so it lands at `index` of
 * `column`. An empty column goes next to the rest of its row (`rowRest`), else at
 * `fallbackIndex` (its old place), else at the end of the page.
 */
export const insertInFlat = (flat, { column, index, rowRest = [], fallbackIndex = null }, moving) => {
  const list = [...flat];
  let at = list.length;
  if (index < column.length) at = list.indexOf(column[index]);
  else if (column.length) at = list.indexOf(column[column.length - 1]) + 1;
  else if (rowRest.length) at = list.indexOf(rowRest[0]);
  else if (fallbackIndex !== null) at = Math.min(fallbackIndex, list.length);
  list.splice(at, 0, moving);
  return list;
};

/* ---------- Layout sections: repeatable full width / main + sidebar sections (every builder) ---------- */

// A LayoutSection marker starts a section; the blocks after it belong to it (website: blocks/layoutSections.js).
// Everything before the first marker is the builder's own canvas. A marker with payload.scope "base"
// holds only the width of that canvas's main + sidebar area, and always comes first.
export const LAYOUT_SECTION = 'LayoutSection';
const isMarker = (s) => s.type === LAYOUT_SECTION;
const firstMarker = (list) => {
  const at = list.findIndex(isMarker);
  return at < 0 ? list.length : at;
};
export const baseOf = (list) => list.slice(0, firstMarker(list));
export const tailOf = (list) => list.slice(firstMarker(list));
export const baseMarkerOf = (list) => list.find(s => isMarker(s) && s.data?.payload?.scope === 'base') || null;

/** [{ marker, items }] of the sections after the builder's own canvas. */
export const layoutGroups = (list) => {
  const groups = [];
  tailOf(list).forEach(s => {
    if (isMarker(s)) {
      if (s.data?.payload?.scope !== 'base') groups.push({ marker: s, items: [] });
    } else groups[groups.length - 1]?.items.push(s);
  });
  return groups;
};

export const groupColumn = (s) => (s.config?.placement === 'sidebar' ? 'sidebar' : 'main');

/** Puts the groups back in the flat list, right after the builder's own canvas. */
export const withGroups = (list, groups) => {
  const base = baseMarkerOf(list);
  return [
    ...baseOf(list),
    ...(base ? [base] : []),
    ...groups.flatMap(g => [g.marker, ...g.items]),
  ];
};

/*
 * Order of the service canvas areas (2026-11-13): built-in hero / top / body (main + sidebar) / bottom and
 * the layout sections, in any order, moved with ↑ / ↓ on each area. Saved as payload.areaOrder of the
 * "base" LayoutSection marker: built-in keys and "g" (the next layout section, in list order); payload
 * hiddenAreas = built-in areas the editor removed (shown again as soon as a block lands there).
 * Same rules as the website's blocks/layoutSections.js areaTokens. Returns [{ key }] / [{ group: index }].
 */
export const BUILTIN_AREAS = ['hero', 'top', 'body', 'bottom'];
export const BUILTIN_AREA_LABELS = { hero: 'Hero', top: 'Top (full width)', body: 'Main content + Right sidebar', bottom: 'Bottom (full width)' };
export function areaTokens(areaOrder, groupCount) {
  const tokens = [];
  const seen = new Set();
  let g = 0;
  (Array.isArray(areaOrder) ? areaOrder : []).forEach((key) => {
    if (key === 'g') {
      if (g < groupCount) tokens.push({ group: g++ });
    } else if (BUILTIN_AREAS.includes(key) && !seen.has(key)) {
      seen.add(key);
      tokens.push({ key });
    }
  });
  BUILTIN_AREAS.forEach((key, i) => {
    if (seen.has(key)) return;
    let at = 0;
    for (let j = i - 1; j >= 0; j -= 1) {
      const before = tokens.findIndex(t => t.key === BUILTIN_AREAS[j]);
      if (before >= 0) {
        at = before + 1;
        break;
      }
    }
    tokens.splice(at, 0, { key });
    seen.add(key);
  });
  while (g < groupCount) tokens.push({ group: g++ });
  return tokens;
}

/** The areaOrder value for `tokens` (groups as "g"). */
export const tokensToOrder = (tokens) => tokens.map(t => (t.key ? t.key : 'g'));

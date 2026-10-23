import { HOME_PLACEMENT_RULES } from './homeBlocks';

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
};

// Blocks the website has a sidebar design for (lead card, side-trust grid, side-why, side CTA).
export const SERVICE_SIDEBAR_BLOCKS = ['Form', 'Highlights', 'Checklist', 'CallToAction'];

// header / footer: the landing page regions (LandingHeader / LandingFooter blocks, landingBlocks.js);
// empty on every other builder. They stay first / last in the saved list.
export const SERVICE_ZONES = ['header', 'hero', 'top', 'main', 'sidebar', 'bottom', 'footer'];
const SERVICE_PLACEMENTS = ['top', 'main', 'sidebar', 'bottom'];
const REGION_ZONE = { LandingHeader: 'header', LandingFooter: 'footer' };

export const servicePlacementOf = (section) => {
  if (REGION_ZONE[section.type]) return REGION_ZONE[section.type];
  if (section.type === 'HeroBanner') return 'hero';
  const placement = section.config?.placement;
  // Homepage blocks are full-width designs: the Bottom area unless placed elsewhere (website: same rule).
  return SERVICE_PLACEMENTS.includes(placement) ? placement : DEFAULT_PLACEMENT[section.type] || (/^Home[A-Z]/.test(section.type) ? 'bottom' : 'main');
};

/** Why `type` can't go in `zone`, or '' when it can. */
export const serviceDropError = (type, zone, label) => {
  // Landing page header / footer never mix with the body.
  if (REGION_ZONE[type] && zone !== REGION_ZONE[type]) return `The ${label} block stays in the ${ZONE_LABELS[REGION_ZONE[type]]} area.`;
  if (!REGION_ZONE[type] && (zone === 'header' || zone === 'footer')) return `Only the ${zone === 'header' ? 'Header' : 'Footer'} block goes in the ${ZONE_LABELS[zone]} area.`;
  if (type === 'HeroBanner' && zone !== 'hero') return `${label} always stays at the top of the page.`;
  if (type !== 'HeroBanner' && zone === 'hero') return 'Only the Hero Banner goes in the Hero area.';
  if (zone === 'sidebar' && !SERVICE_SIDEBAR_BLOCKS.includes(type)) {
    return `${label} can't go in the right sidebar. Sidebar blocks: Form, Highlights, Checklist, Call to Action.`;
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
  const rule = HOME_PLACEMENT_RULES[section.type];
  if (!rule) return 'full';
  const chosen = section.config?.placement;
  return rule.options.includes(chosen) ? chosen : rule.default;
};

export const homeDropError = (type, column, label) => {
  const rule = HOME_PLACEMENT_RULES[type];
  if (column === 'full') return rule && !rule.options.includes('full') ? `${label} can't be full width.` : '';
  const where = column === 'sidebar' ? 'the right sidebar' : 'main content';
  if (!rule) return `${label} is always full width, so it can't go in ${where}.`;
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

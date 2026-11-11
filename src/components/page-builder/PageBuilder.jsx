import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-toastify';
import SectionRenderer from './SectionRenderer';
import { HOME_BLOCKS, HOME_PLACEMENTS, defaultHomeSections, homeDefaultPayload, homePlacementRule } from './homeBlocks';
import { JOURNEY_BLOCKS, JOURNEY_REFERENCE_STAGES, journeyDefaultPayload, journeyStageSections } from './journeyBlocks';
import { TOOL_BLOCKS, TOOL_REFERENCE, toolDefaultPayload, toolPageSections, toolsHubSections } from './toolBlocks';
import { COMMON_BLOCKS, commonDefaultPayload, isCommonType } from './commonBlocks';
import { BLOG_BLOCKS, blogDefaultPayload, isBlogType } from './blogBlocks';
import BackgroundSettings from './BackgroundSettings';
import SpacingSettings from './SpacingSettings';
import CardLayoutSettings from './CardLayoutSettings';
import BlockButtonsSettings from './BlockButtonsSettings';
import { LinkPolicyContext } from './blockFields';
import { LANDING_BLOCKS, isLandingRegion, landingDefaultPayload } from './landingBlocks';
import {
  SERVICE_HERO_BLOCKS, SERVICE_SIDEBAR_BLOCKS, SERVICE_ZONES, ZONE_LABELS,
  LAYOUT_SECTION, baseMarkerOf, baseOf, groupColumn, homeDropError, homeRows, insertInFlat, layoutGroups, serviceDropError, servicePlacementOf, serviceZones, tailOf, withGroups
} from './layoutZones';
import { confirmDialog } from '../common/confirm';
import { PaletteBlockPreviewModal, previewKindOf, singleBlockDraft } from './BlockPreviewModal';
import LivePreviewDock from './LivePreviewDock';

const AVAILABLE_BLOCKS = [
  { type: 'HeroBanner', label: 'Hero Banner', icon: 'bi-image' },
  { type: 'Overview', label: 'Overview', icon: 'bi-file-text' },
  { type: 'WhyUs', label: 'Why Us', icon: 'bi-star' },
  { type: 'Faq', label: 'FAQ Accordion', icon: 'bi-question-circle' },
  { type: 'ServicesIncluded', label: 'Services Included', icon: 'bi-grid' },
  { type: 'OurProcess', label: 'Our Process', icon: 'bi-list-ol' },
  { type: 'Form', label: 'Form', icon: 'bi-ui-checks' },
  { type: 'Packages', label: 'Packages', icon: 'bi-box-seam' }
];

// Extra blocks for service pages (the website lays these out with Display settings).
const SERVICE_BLOCKS = [
  { type: 'Highlights', label: 'Highlights / Trust Strip', icon: 'bi-patch-check' },
  { type: 'Checklist', label: 'Checklist', icon: 'bi-check2-square' },
  { type: 'CallToAction', label: 'Call to Action', icon: 'bi-megaphone' }
];

// Only in the Service Page Builder (blockSet="service"): links to the service's location pages (SEO Pages).
const SERVICE_ONLY_BLOCKS = [
  { type: 'LocationsServed', label: 'Locations We Serve', icon: 'bi-geo-alt' }
];

const BLOCK_META = Object.fromEntries([...AVAILABLE_BLOCKS, ...SERVICE_BLOCKS, ...SERVICE_ONLY_BLOCKS, ...HOME_BLOCKS, ...JOURNEY_BLOCKS, ...TOOL_BLOCKS, ...COMMON_BLOCKS, ...LANDING_BLOCKS, ...BLOG_BLOCKS].map(b => [b.type, b]));
const HOME_TYPES = new Set(HOME_BLOCKS.map(b => b.type));
const JOURNEY_TYPES = new Set(JOURNEY_BLOCKS.map(b => b.type));
const TOOL_TYPES = new Set(TOOL_BLOCKS.map(b => b.type));
// Blocks whose Background panel is about the page hero.
const HERO_TYPES = new Set(['HeroBanner', 'HomeHero', 'JourneyHero', 'ToolHero']);

// Starting content of a new block, whatever builder it is added in.
const defaultPayloadFor = (type) => (
  HOME_TYPES.has(type) ? homeDefaultPayload(type)
    : JOURNEY_TYPES.has(type) ? journeyDefaultPayload(type)
      : TOOL_TYPES.has(type) ? toolDefaultPayload(type)
        : isCommonType(type) ? commonDefaultPayload(type)
          : isBlogType(type) ? blogDefaultPayload(type)
          : isLandingRegion(type) ? landingDefaultPayload(type)
            : {}
);

// Blocks of one builder offered in the others. Left out, because they only work on their own kind of
// page: the Hero Banner (uses the service), Locations We Serve (needs a service), the Journey hero, progress,
// roadmap, flow and prev / next (need a stage; the hero makes a page a stage page), the Tool hero and
// calculator (they make a page a tool page; use the Free Tool / Calculator general block), and the
// landing Header / Footer.
const SERVICE_EXTRA_BLOCKS = [...AVAILABLE_BLOCKS, ...SERVICE_BLOCKS].filter(b => b.type !== 'HeroBanner');
const JOURNEY_EXTRA_BLOCKS = JOURNEY_BLOCKS.filter(b => !['JourneyHero', 'JourneyProgress', 'JourneyRoadmap', 'JourneyFlow', 'JourneyNav'].includes(b.type));
const TOOL_EXTRA_BLOCKS = TOOL_BLOCKS.filter(b => !['ToolHero', 'ToolCalculator'].includes(b.type));
const JOURNEY_ORDER = Object.fromEntries(JOURNEY_BLOCKS.map((b, i) => [b.type, i]));
const TOOL_ORDER = Object.fromEntries(TOOL_BLOCKS.map((b, i) => [b.type, i]));
const labelOf = (type) => BLOCK_META[type]?.label || type;
// Width of the Live Preview panel; on small screens it covers the editor.
const DOCK_WIDTH = 'max(46vw, min(100vw, 520px))';

const PLACEMENTS = [
  { value: 'main', label: 'Main content' },
  { value: 'sidebar', label: 'Right sidebar' },
  { value: 'top', label: 'Top (full width, under the hero)' },
  { value: 'bottom', label: 'Bottom (full width)' }
];

// Hints shown in each area of the canvas.
const ZONE_HINTS = {
  header: 'Header block only (website header, landing header or none)',
  footer: 'Footer block only (website footer, landing footer or none)',
  hero: 'One hero block: Hero Banner, Homepage Hero, Hero with Form, Banners Slider',
  top: 'Full width, under the hero',
  main: 'Left column',
  sidebar: 'Form, Highlights, Checklist, Call to Action',
  bottom: 'Full width, after the content',
  full: 'Hero, strips, sliders and any block set to full width',
  homeMain: 'Left column',
  homeSidebar: 'Blocks that fit a narrow column',
};

// One-line summary shown on a collapsed block, so editors can tell blocks apart.
const summarize = (section) => {
  const p = section.data?.payload || {};
  const text = p.heading || p.title || p.formName || p.eyebrow || p.label ||
    (Array.isArray(p.items) ? p.items.map(i => i?.text || i?.title || i?.name || i?.label).filter(Boolean).slice(0, 3).join(' · ') : '') || (p.packageNames || []).filter(Boolean).join(', ') ||
    String(p.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 70 ? `${text.slice(0, 70)}…` : text;
};

// Per-block layout options stored in section.config (services, and placement on the homepage).
const BlockSettings = ({ section, onChange, home = false, heroTaken = false }) => {
  if (section.type === 'HeroBanner' || isLandingRegion(section.type)) return null;
  const config = section.config || {};
  const set = (key, value) => onChange({ ...config, [key]: value });

  if (home) {
    const rule = homePlacementRule(section.type);
    const value = rule.options.includes(config.placement) ? config.placement : rule.default;
    return (
      <div className="row g-2 mb-3 pb-3 border-bottom align-items-end">
        <div className="col-md-4">
          <label className="form-label small text-muted mb-1">Placement</label>
          <select className="form-select form-select-sm" value={value} onChange={e => set('placement', e.target.value)}>
            {HOME_PLACEMENTS.filter(p => rule.options.includes(p.value)).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="col-md-8 small text-muted">
          Or drag the block into another area. Main content blocks next to a Right sidebar block share one row (content left, sidebar right); without a sidebar block, main content is full width.
        </div>
      </div>
    );
  }

  // Only blocks with a sidebar design may go there (an old value stays selectable).
  const value = servicePlacementOf(section);
  const options = [
    // Hero blocks may also fill the Hero area, when it is free (or it is this block).
    ...(SERVICE_HERO_BLOCKS.includes(section.type) && (value === 'hero' || !heroTaken) ? [{ value: 'hero', label: 'Hero (top of the page)' }] : []),
    ...PLACEMENTS.filter(p => p.value !== 'sidebar' || SERVICE_SIDEBAR_BLOCKS.includes(section.type) || value === 'sidebar'),
  ];

  return (
    <div className="row g-2 mb-3 pb-3 border-bottom">
      <div className="col-md-4">
        <label className="form-label small text-muted mb-1">Placement</label>
        <select className="form-select form-select-sm" value={value} onChange={e => set('placement', e.target.value)}>
          {options.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      <div className="col-md-4">
        <label className="form-label small text-muted mb-1">Kicker (small label above heading)</label>
        <input type="text" className="form-control form-control-sm" value={config.kicker || ''} onChange={e => set('kicker', e.target.value)} placeholder="e.g. HOW IT WORKS" />
      </div>
      <div className="col-md-4">
        <label className="form-label small text-muted mb-1">Anchor ID (for #links)</label>
        <input type="text" className="form-control form-control-sm" value={config.anchorId || ''} onChange={e => set('anchorId', e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))} placeholder="e.g. pricing" />
      </div>
    </div>
  );
};

const iconButton = { width: '32px', height: '32px' };

// The dragged copy is position:fixed. Any transformed ancestor (tab animations, layouts) would
// shift it away from the cursor, so while dragging it is rendered straight into <body>.
const inBody = (node, dragging) => (dragging ? createPortal(node, document.body) : node);
const PALETTE_PREFIX = 'palette:';

// blockSet="home": the Home Page Builder (homepage sections only, prefilled with the current content).
// Service pages (layoutSettings) and the homepage show the canvas as the page's layout areas;
// blocks are dragged between them (or in from Available Blocks) and only land where they fit.
// blockSet="journey": a Journey Stage page (journeyBlocks.js): one full-width list, blocks keep
// the reference order when added, and a reference stage can fill the whole page.
// previewKind / previewDraft: the form's own Live Preview draft for the whole page (it receives the sections).
// blockSet="blog" (with layoutSettings): the service canvas plus the blog's own blocks (blogBlocks.js);
// sidebarSide (right | left | none) only changes how the Sidebar area is labelled and placed.
const PageBuilder = ({ initialSections = [], onChange, layoutSettings = false, blockSet = 'default', previewKind, previewDraft, sidebarSide = 'right' }) => {
  const isHome = blockSet === 'home';
  const isJourney = blockSet === 'journey';
  // blockSet="tool": a free tool page or the tools hub (toolBlocks.js), one full-width list like journeys.
  const isTool = blockSet === 'tool';
  // blockSet="landing" (Landing Pages): the service canvas plus Header and Footer areas.
  const isLanding = blockSet === 'landing';
  const isBlog = blockSet === 'blog';
  const zoned = isHome || layoutSettings;
  // Palette groups: the builder's own blocks first, then general-purpose and homepage blocks,
  // which every builder offers (the website renders them on any page).
  const ownBlocks = isTool ? TOOL_BLOCKS : isJourney ? JOURNEY_BLOCKS : isHome ? HOME_BLOCKS
    : isBlog ? [...BLOG_BLOCKS, ...SERVICE_EXTRA_BLOCKS]
    : layoutSettings ? [...AVAILABLE_BLOCKS, ...SERVICE_BLOCKS, ...(blockSet === 'service' ? SERVICE_ONLY_BLOCKS : [])]
    : [...AVAILABLE_BLOCKS, ...SERVICE_BLOCKS];
  const ownTitle = isTool ? 'Tool blocks' : isJourney ? 'Journey blocks' : isHome ? 'Homepage blocks' : isBlog ? 'Blog blocks' : 'Page blocks';
  const paletteGroups = [
    // Landing pages (blockSet="landing", with layoutSettings): the Header / Footer regions first.
    ...(isLanding ? [{ title: 'Header & Footer', items: LANDING_BLOCKS }] : []),
    { title: ownTitle, items: ownBlocks },
    { title: 'General blocks', items: COMMON_BLOCKS },
    ...(isHome ? [] : [{ title: 'Homepage sections', items: HOME_BLOCKS }]),
    ...(isHome || isJourney || isTool ? [{ title: 'Service page blocks', items: SERVICE_EXTRA_BLOCKS }] : []),
    ...(isJourney ? [] : [{ title: 'Journey blocks', items: JOURNEY_EXTRA_BLOCKS }]),
    ...(isTool ? [] : [{ title: 'Tool blocks', items: TOOL_EXTRA_BLOCKS }]),
  ];
  const [paletteSearch, setPaletteSearch] = useState('');
  const query = paletteSearch.trim().toLowerCase();
  const visibleGroups = paletteGroups
    .map(g => ({ ...g, items: query ? g.items.filter(b => `${b.label} ${b.type}`.toLowerCase().includes(query)) : g.items }))
    .filter(g => g.items.length);
  const [sections, setSections] = useState(initialSections);
  // Live Preview panel: the block being edited or the whole page, beside the editor (unsaved edits included).
  const [dockOpen, setDockOpen] = useState(false);
  const [dockView, setDockView] = useState('block');
  const [focusId, setFocusId] = useState(null);
  const [visible, setVisible] = useState(true);
  const [dockTop, setDockTop] = useState(0);
  const rootRef = useRef(null);
  // Eye button in Available Blocks: a block type previewed before it is added.
  const [paletteType, setPaletteType] = useState(null);
  const palettePayload = useMemo(() => (paletteType ? defaultPayloadFor(paletteType) : null), [paletteType]);
  // Accordion: only one block is open at a time; null = all collapsed.
  const [openId, setOpenId] = useState(null);
  const [scrollToId, setScrollToId] = useState(null);
  const cardRefs = useRef({});

  // The panel follows the block that is open in the editor.
  useEffect(() => { if (openId) setFocusId(openId); }, [openId]);

  // The floating button and panel live in <body>: hide them while this builder's tab is hidden.
  useEffect(() => {
    if (!rootRef.current) return undefined;
    const observer = new ResizeObserver(() => setVisible(Boolean(rootRef.current?.offsetParent || rootRef.current?.getClientRects().length)));
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);

  // The panel starts under the sticky editor header and tabs, so Save stays reachable.
  useEffect(() => {
    if (!dockOpen) return undefined;
    const place = () => {
      if (!rootRef.current) return;
      const main = rootRef.current.closest('main');
      const offset = parseFloat(getComputedStyle(rootRef.current).getPropertyValue('--ta-sticky-offset')) || 0;
      setDockTop(Math.max(0, main ? main.getBoundingClientRect().top : 0) + offset);
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [dockOpen]);

  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  // Bring a newly added / opened block into view once it has rendered: its editor below a two-column
  // row when it has one there, else its card (scroll-margin keeps it under the sticky header + tabs).
  useEffect(() => {
    if (!scrollToId) return;
    (cardRefs.current[`editor:${scrollToId}`] || cardRefs.current[scrollToId])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setScrollToId(null);
  }, [scrollToId, sections]);

  const blockCount = sections.filter(s => s.type !== LAYOUT_SECTION).length;
  const counts = sections.reduce((acc, s) => ({ ...acc, [s.type]: (acc[s.type] || 0) + 1 }), {});
  // "2 / 3" next to the label when a block type is used more than once.
  const ordinals = {};
  const seen = {};
  sections.forEach(s => {
    seen[s.type] = (seen[s.type] || 0) + 1;
    if (counts[s.type] > 1) ordinals[s.id] = `${seen[s.type]} / ${counts[s.type]}`;
  });

  const update = (items) => {
    setSections(items);
    onChange?.(items);
  };

  // Opening a block also scrolls its editor into view (the block above may just have collapsed).
  const toggleBlock = (id) => {
    const opening = openId !== id;
    setOpenId(opening ? id : null);
    if (opening) setScrollToId(id);
  };

  const newSection = (type) => ({
    id: `sec_${Date.now()}`,
    type,
    config: {},
    data: { payload: defaultPayloadFor(type) }
  });

  // Tools: replace every block with a tool template ("__blank"), the hub ("__hub") or a reference tool.
  const fillTool = async (key) => {
    const tool = TOOL_REFERENCE.find(t => t.key === key) || null;
    const label = key === '__hub' ? 'the tools hub' : tool ? `"${tool.title}"` : 'an empty tool template';
    if (sections.length && !(await confirmDialog({
      title: `Fill the page with ${label}?`,
      message: 'Every block is replaced. Your current blocks will be lost (until you leave without saving).',
      tone: 'warning',
      confirmText: 'Fill page',
    }))) return;
    setOpenId(null);
    update(key === '__hub' ? toolsHubSections() : toolPageSections(tool));
  };
  const toolOptions = (
    <>
      <option value="__blank">Empty tool page</option>
      <option value="__hub">Tools hub (/tools)</option>
      {TOOL_REFERENCE.map(t => <option key={t.key} value={t.key}>{t.icon} {t.title}</option>)}
    </>
  );

  // Journey: replace every block with the template, optionally filled with a reference stage.
  const fillJourney = async (stageKey) => {
    const stage = JOURNEY_REFERENCE_STAGES.find(s => s.key === stageKey) || null;
    if (sections.length && !(await confirmDialog({
      title: stage ? `Fill the page with "${stage.title}"?` : 'Reset to the journey template?',
      message: stage ? 'Every block is replaced with the reference content of this stage (texts, steps, services, story). Your current blocks will be lost (until you leave without saving).' : 'Every block is replaced with the empty journey template. Your current blocks will be lost (until you leave without saving).',
      tone: 'warning',
      confirmText: stage ? 'Fill page' : 'Reset',
    }))) return;
    setOpenId(null);
    update(journeyStageSections(stage));
  };

  const reveal = (section) => {
    // New blocks open straight away (everything else collapses) and scroll into view.
    setOpenId(section.id);
    setScrollToId(section.id);
  };

  // The service canvas Hero area holds one block (the Hero Banner or another hero block placed there).
  const heroOf = (except) => sections.find(s => s !== except && servicePlacementOf(s) === 'hero') || null;
  const hasServiceHero = () => Boolean(heroOf());

  const handleAddBlock = (blockType) => {
    const section = newSection(blockType);
    if (layoutSettings && !isHome) {
      if (blockType === 'HeroBanner' && hasServiceHero()) {
        toast.warning(`The Hero area already has ${labelOf(heroOf().type)}. Remove it or move it out first.`);
        return;
      }
      if (isLandingRegion(blockType) && sections.some(s => s.type === blockType)) {
        toast.warning(`This page already has a ${labelOf(blockType)} block. Open it to change its style.`);
        return;
      }
      // Lands at the end of the area the block goes to by default.
      const zones = serviceZones(baseOf(sections));
      zones[servicePlacementOf(section)].push(section);
      update([...SERVICE_ZONES.flatMap(z => zones[z]), ...tailOf(sections)]);
    } else if (isHome) {
      // The hero goes first; other blocks at the end of the page, ready to be dragged.
      update(blockType === 'HomeHero' ? [section, ...sections] : [...baseOf(sections), section, ...tailOf(sections)]);
    } else if (isJourney) {
      if (blockType === 'JourneyHero' && sections.some(s => s.type === 'JourneyHero')) {
        toast.warning('This page already has a Stage Hero: it defines the stage, keep one.');
        return;
      }
      // Lands where it sits in the reference page (before the first block that comes after it).
      const order = JOURNEY_ORDER[blockType] ?? 99;
      const at = sections.findIndex(s => (JOURNEY_ORDER[s.type] ?? 99) > order);
      update(at < 0 ? [...sections, section] : [...sections.slice(0, at), section, ...sections.slice(at)]);
    } else if (isTool) {
      if (blockType === 'ToolHero' && sections.some(s => s.type === 'ToolHero')) {
        toast.warning('This page already has a Tool Hero.');
        return;
      }
      const order = TOOL_ORDER[blockType] ?? 99;
      const at = sections.findIndex(s => (TOOL_ORDER[s.type] ?? 99) > order);
      update(at < 0 ? [...sections, section] : [...sections.slice(0, at), section, ...sections.slice(at)]);
    } else {
      update([section, ...sections]);
    }
    reveal(section);
  };

  const handleRemoveBlock = (section) => {
    update(sections.filter(s => s !== section));
  };

  // Copy of a block (content, placement, background) placed right below it, in the same area.
  const handleDuplicateBlock = (section) => {
    if (layoutSettings && !isHome && (section.type === 'HeroBanner' || isLandingRegion(section.type))) {
      toast.warning(`A page has only one ${labelOf(section.type)} block.`);
      return;
    }
    const copy = {
      ...JSON.parse(JSON.stringify(section)),
      id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    // The Hero area holds one block: a copy of the hero goes to the Top area instead.
    if (layoutSettings && !isHome && copy.config?.placement === 'hero') copy.config.placement = 'top';
    const items = [...sections];
    items.splice(items.indexOf(section) + 1, 0, copy);
    update(items);
    reveal(copy);
    toast.success(`${labelOf(section.type)} duplicated below.`);
  };

  // Up/down moves a block within its own area (column).
  const handleMove = (column, section, delta) => {
    const neighbour = column[column.indexOf(section) + delta];
    if (!neighbour) return;
    const items = [...sections];
    const a = items.indexOf(section);
    const b = items.indexOf(neighbour);
    [items[a], items[b]] = [items[b], items[a]];
    update(items);
  };

  const withPlacement = (section, placement) => ({ ...section, config: { ...(section.config || {}), placement } });

  const dropIntoService = (zone, index, moving, fromPalette) => {
    const error = serviceDropError(moving.type, zone, labelOf(moving.type));
    if (error) return toast.warning(error);
    if (zone === 'hero' && heroOf(moving)) return toast.warning(`The Hero area already has ${labelOf(heroOf(moving).type)}. Move it to another area or remove it first.`);
    if (fromPalette && isLandingRegion(moving.type) && sections.some(s => s.type === moving.type)) {
      return toast.warning(`This page already has a ${labelOf(moving.type)} block.`);
    }

    // The Hero Banner and landing regions have a fixed area; every other block remembers its area.
    const placed = moving.type === 'HeroBanner' || isLandingRegion(moving.type) ? moving : withPlacement(moving, zone);
    const rest = sections.filter(s => s !== moving);
    const zones = serviceZones(baseOf(rest));
    zones[zone].splice(index, 0, placed);
    update([...SERVICE_ZONES.flatMap(z => zones[z]), ...tailOf(rest)]);
    return placed;
  };

  const dropIntoHome = (rowIndex, column, index, moving) => {
    const error = homeDropError(moving.type, column, labelOf(moving.type));
    if (error) return toast.warning(error);

    const base = baseOf(sections);
    const row = homeRows(base)[rowIndex];
    if (!row) return null;
    const placed = withPlacement(moving, column);
    const others = (list) => list.filter(s => s !== moving);
    const oldIndex = base.indexOf(moving);
    update([...insertInFlat(others(base), {
      column: others(row[column]),
      index,
      rowRest: others([...row.full, ...row.main, ...row.sidebar]),
      fallbackIndex: row.extra || oldIndex < 0 ? null : oldIndex,
    }, placed), ...tailOf(others(sections))]);
    return placed;
  };

  // Into a layout section (Add section): its one list, or its main / sidebar column.
  const dropIntoSection = (markerId, column, index, moving) => {
    if (moving.type === 'HeroBanner' || isLandingRegion(moving.type)) {
      toast.warning(`${labelOf(moving.type)} stays in its own area.`);
      return null;
    }
    if (column === 'sidebar' && !SERVICE_SIDEBAR_BLOCKS.includes(moving.type) && !homePlacementRule(moving.type).options.includes('sidebar')) {
      toast.warning(`${labelOf(moving.type)} is too wide for the right sidebar. Put it in main content or a full-width section.`);
      return null;
    }
    const placed = withPlacement(moving, column);
    const rest = sections.filter(s => s !== moving);
    const groups = layoutGroups(rest);
    const group = groups.find(g => g.marker.id === markerId);
    if (!group) return null;
    const side = group.items.filter(s => groupColumn(s) === 'sidebar');
    const main = group.items.filter(s => groupColumn(s) === 'main');
    if (column === 'full') group.items.splice(index, 0, placed);
    else {
      (column === 'sidebar' ? side : main).splice(index, 0, placed);
      group.items = [...main, ...side];
    }
    update(withGroups(rest, groups));
    return placed;
  };

  const addLayoutSection = (layout) => update([...sections, {
    id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: LAYOUT_SECTION,
    config: {},
    data: { payload: { layout } },
  }]);
  const setMarker = (marker, patch) => update(sections.map(s => (s.id === marker.id ? { ...s, data: { ...s.data, payload: { ...s.data?.payload, ...patch } } } : s)));
  // Removing a section keeps its blocks: they join what comes before it.
  const removeLayoutSection = (marker) => update(sections.filter(s => s.id !== marker.id));
  const moveLayoutSection = (marker, delta) => {
    const groups = layoutGroups(sections);
    const at = groups.findIndex(g => g.marker.id === marker.id);
    if (!groups[at + delta]) return;
    [groups[at], groups[at + delta]] = [groups[at + delta], groups[at]];
    update(withGroups(sections, groups));
  };
  // Width of the builder's own main + sidebar area.
  const setBaseWidth = (mainWidth) => {
    const marker = baseMarkerOf(sections);
    if (marker) {
      update(mainWidth ? sections.map(s => (s === marker ? { ...s, data: { payload: { scope: 'base', mainWidth } } } : s)) : sections.filter(s => s !== marker));
    } else if (mainWidth) {
      update([...baseOf(sections), { id: `sec_${Date.now()}_base`, type: LAYOUT_SECTION, config: {}, data: { payload: { scope: 'base', mainWidth } } }, ...tailOf(sections)]);
    }
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const fromPalette = source.droppableId === 'palette';
    const moving = fromPalette ? newSection(draggableId.slice(PALETTE_PREFIX.length)) : sections.find(s => s.id === draggableId);
    if (!moving) return;

    // Plain pages: one list.
    if (destination.droppableId === 'canvas') {
      const rest = sections.filter(s => s !== moving);
      const items = baseOf(rest);
      items.splice(destination.index, 0, moving);
      update([...items, ...tailOf(rest)]);
      if (fromPalette) reveal(moving);
      return;
    }

    // section:<marker id>:<column> (a layout section)
    if (destination.droppableId.startsWith('section:')) {
      const [, markerId, column] = destination.droppableId.split(':');
      const placed = dropIntoSection(markerId, column, destination.index, moving);
      if (fromPalette && placed) reveal(placed);
      return;
    }

    // zone:<area> (service) or zone:<row>:<column> (homepage)
    const [, first, second] = destination.droppableId.split(':');
    const placed = isHome
      ? dropIntoHome(Number(first), second, destination.index, moving)
      : dropIntoService(first, destination.index, moving, fromPalette);
    if (fromPalette && placed && typeof placed === 'object') reveal(placed);
  };

  const setConfig = (section) => (config) => update(sections.map(s => s.id === section.id ? { ...s, config } : s));

  const editorFor = (section) => (
    <>
      {zoned && <BlockSettings home={isHome} section={section} onChange={setConfig(section)} heroTaken={Boolean(heroOf(section))} />}
      {/* Every block, in every builder: colour, image, overlay (website: blocks/BlockBackground.jsx). */}
      <BackgroundSettings key={section.id} section={section} hero={HERO_TYPES.has(section.type)} onChange={setConfig(section)} />
      {/* Every block, in every builder: margin and padding (website: blocks/BlockBackground.jsx). */}
      <SpacingSettings key={`spacing-${section.id}`} section={section} onChange={setConfig(section)} />
      {/* Every block with a heading / cards: alignment, cards per row, gaps (website: BlockBackground.jsx + center-grids.css). */}
      <CardLayoutSettings key={`layout-${section.id}`} section={section} onChange={setConfig(section)} />
      {/* Every block, in every builder: extra buttons (website: blocks/BlockBackground.jsx BlockButtons). */}
      <BlockButtonsSettings key={`buttons-${section.id}`} section={section} onChange={setConfig(section)} />
      <SectionRenderer
        section={section}
        onChange={(id, newData) => update(sections.map(s => s.id === id ? { ...s, data: newData } : s))}
      />
    </>
  );

  // One block card. In narrow columns the editor opens below the row instead of inside the card.
  const renderCard = (section, index, column, { inline = true } = {}) => {
    const meta = BLOCK_META[section.type];
    const isOpen = openId === section.id;
    const ordinal = ordinals[section.id];
    const summary = isOpen ? '' : summarize(section);
    const position = column.indexOf(section);

    return (
      <Draggable key={section.id} draggableId={section.id} index={index}>
        {(provided, snapshot) => inBody(
          <div
            ref={(el) => { provided.innerRef(el); cardRefs.current[section.id] = el; }}
            {...provided.draggableProps}
            className={`card mb-3 border-0 shadow-sm rounded-4 ${isOpen ? 'border-start border-4 border-primary' : ''} ${snapshot.isDragging ? 'shadow-lg' : ''}`}
            style={{ ...provided.draggableProps.style, scrollMarginTop: 'calc(var(--ta-sticky-offset, 0px) + 0.75rem)' }}
          >
            <div className={`card-header d-flex justify-content-between align-items-center gap-2 bg-transparent border-bottom-0 px-3 ${isOpen && inline ? 'pt-3 pb-0 mb-2' : 'py-3'}`}>
              <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
                <span {...provided.dragHandleProps} className="text-muted" title="Drag to move">
                  <i className="bi bi-grip-vertical fs-5"></i>
                </span>
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none text-start d-flex align-items-center justify-content-start gap-2 flex-grow-1"
                  style={{ minWidth: 0 }}
                  onClick={() => toggleBlock(section.id)}
                  aria-expanded={isOpen}
                >
                  <i className={`bi ${isOpen ? 'bi-chevron-down' : 'bi-chevron-right'} text-secondary`}></i>
                  {meta && <i className={`bi ${meta.icon} text-primary`}></i>}
                  <span className="fw-bold text-dark text-truncate">{meta?.label || section.type}</span>
                  {ordinal && <span className="badge rounded-pill bg-light text-secondary border">{ordinal}</span>}
                  {summary && inline && <span className="text-muted small text-truncate">— {summary}</span>}
                </button>
              </div>
              <div className="d-flex align-items-center gap-1 flex-shrink-0">
                <button type="button" className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={iconButton} onClick={() => { setOpenId(section.id); setFocusId(section.id); setDockView('block'); setDockOpen(true); }} title="Preview this block" aria-label={`Preview ${meta?.label || section.type}`}>
                  <i className="bi bi-eye text-primary"></i>
                </button>
                <button type="button" className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={iconButton} onClick={() => handleMove(column, section, -1)} disabled={position === 0} title="Move Up">
                  <i className="bi bi-arrow-up text-secondary"></i>
                </button>
                <button type="button" className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={iconButton} onClick={() => handleMove(column, section, 1)} disabled={position === column.length - 1} title="Move Down">
                  <i className="bi bi-arrow-down text-secondary"></i>
                </button>
                <button type="button" className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={iconButton} onClick={() => handleDuplicateBlock(section)} title="Duplicate (copy below)" aria-label={`Duplicate ${meta?.label || section.type}`}>
                  <i className="bi bi-copy text-secondary"></i>
                </button>
                <button type="button" className="btn btn-sm btn-light text-danger rounded-circle p-2 d-flex align-items-center justify-content-center ms-1" style={iconButton} onClick={() => handleRemoveBlock(section)} title="Remove Block">
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
            {!inline && summary && <div className="px-3 pb-3 mt-n2 small text-muted text-truncate">{summary}</div>}
            {isOpen && inline && <div className="card-body p-4 pt-3">{editorFor(section)}</div>}
          </div>,
          snapshot.isDragging
        )}
      </Draggable>
    );
  };

  // One droppable layout area with its label.
  const renderZone = (droppableId, title, hint, items, { inline = true, tone = 'primary' } = {}) => (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-1 px-1">
        <span className={`small fw-bold text-uppercase text-${tone}`} style={{ letterSpacing: '0.5px', fontSize: '0.72rem' }}>{title}</span>
        <span className="small text-muted text-truncate ms-2" style={{ fontSize: '0.72rem' }}>{hint}</span>
      </div>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`rounded-4 p-2 ${snapshot.isDraggingOver ? 'bg-primary-subtle' : 'bg-body-tertiary'}`}
            style={{ border: `2px dashed ${snapshot.isDraggingOver ? 'var(--bs-primary)' : 'var(--bs-border-color)'}`, minHeight: '72px', transition: 'background-color .15s' }}
          >
            {items.map((section, index) => renderCard(section, index, items, { inline }))}
            {provided.placeholder}
            {!items.length && !snapshot.isDraggingOver && (
              <div className="text-center text-muted small py-3">Drag a block here</div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );

  // Editor for the open block of a two-column area, shown full width under it.
  const renderColumnEditor = (items) => {
    const open = items.find(s => s.id === openId);
    if (!open) return null;
    return (
      <div
        ref={(el) => { cardRefs.current[`editor:${open.id}`] = el; }}
        className="card border-0 shadow-sm rounded-4 border-start border-4 border-primary mb-4"
        style={{ scrollMarginTop: 'calc(var(--ta-sticky-offset, 0px) + 0.75rem)' }}
      >
        <div className="card-header bg-transparent border-bottom-0 px-4 pt-3 pb-0 d-flex justify-content-between align-items-center">
          <span className="fw-bold"><i className={`bi ${BLOCK_META[open.type]?.icon || 'bi-square'} text-primary me-2`}></i>Editing: {labelOf(open.type)}</span>
          <button type="button" className="btn btn-sm btn-light" onClick={() => setOpenId(null)}>Done</button>
        </div>
        <div className="card-body p-4 pt-3">{editorFor(open)}</div>
      </div>
    );
  };

  // Main + sidebar share: empty = the design's own columns.
  const renderWidthControl = (value, onChange) => {
    const main = Number(value) || 0;
    return (
      <div className="d-flex flex-wrap align-items-center gap-2 px-1 mb-2 small">
        <i className="bi bi-layout-sidebar-reverse text-primary"></i>
        <span className="fw-semibold">Column width</span>
        <input type="range" className="form-range" style={{ width: 160 }} min="50" max="80" step="5" value={main || 70} onChange={e => onChange(Number(e.target.value))} aria-label="Main content width" />
        <span className="text-muted">{main ? `Main ${main}% · Sidebar ${100 - main}%` : 'Automatic'}</span>
        {main > 0 && <button type="button" className="btn btn-link btn-sm p-0" onClick={() => onChange(null)}>Automatic</button>}
      </div>
    );
  };

  const renderTwoColumns = (mainId, sideId, main, sidebar, hints, mainWidth, { sideFirst = false, sideLabel = ZONE_LABELS.sidebar } = {}) => (
    <>
      <div className={`row g-3${sideFirst ? ' flex-row-reverse' : ''}`}>
        <div className="col-lg-8" style={mainWidth ? { flex: `0 0 ${mainWidth}%`, width: `${mainWidth}%` } : undefined}>{renderZone(mainId, ZONE_LABELS.main, hints[0], main, { inline: false })}</div>
        <div className="col-lg-4" style={mainWidth ? { flex: `0 0 ${100 - mainWidth}%`, width: `${100 - mainWidth}%` } : undefined}>{renderZone(sideId, sideLabel, hints[1], sidebar, { inline: false, tone: 'success' })}</div>
      </div>
      {renderColumnEditor([...main, ...sidebar])}
    </>
  );

  // Repeatable sections below the builder's own canvas, and the buttons that add them.
  const renderLayoutSections = () => {
    const groups = layoutGroups(sections);
    return (
      <>
        {groups.map((group, g) => {
          const p = group.marker.data?.payload || {};
          const full = p.layout === 'full';
          return (
            <div key={group.marker.id} className="border rounded-4 p-3 mb-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className={`bi ${full ? 'bi-square' : 'bi-layout-sidebar-reverse'} text-primary`}></i>
                <span className="fw-bold small">Section {g + 1}: {full ? 'Full width' : 'Main content + Right sidebar'}</span>
                <div className="ms-auto d-flex gap-1">
                  <button type="button" className="btn btn-sm btn-light" disabled={g === 0} onClick={() => moveLayoutSection(group.marker, -1)} title="Move section up" aria-label="Move section up"><i className="bi bi-arrow-up"></i></button>
                  <button type="button" className="btn btn-sm btn-light" disabled={g === groups.length - 1} onClick={() => moveLayoutSection(group.marker, 1)} title="Move section down" aria-label="Move section down"><i className="bi bi-arrow-down"></i></button>
                  <button type="button" className="btn btn-sm btn-light text-danger" onClick={() => removeLayoutSection(group.marker)} title="Remove section (its blocks stay, in the section above)" aria-label="Remove section"><i className="bi bi-trash"></i></button>
                </div>
              </div>
              {full
                ? renderZone(`section:${group.marker.id}:full`, ZONE_LABELS.full, 'Blocks one under the other', group.items, { tone: 'secondary' })
                : (
                  <>
                    {renderWidthControl(p.mainWidth, mainWidth => setMarker(group.marker, { mainWidth }))}
                    {renderTwoColumns(
                      `section:${group.marker.id}:main`,
                      `section:${group.marker.id}:sidebar`,
                      group.items.filter(s => groupColumn(s) === 'main'),
                      group.items.filter(s => groupColumn(s) === 'sidebar'),
                      ['Left column', 'Right column'],
                      p.mainWidth,
                    )}
                  </>
                )}
            </div>
          );
        })}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <span className="small fw-semibold text-muted">Add section:</span>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addLayoutSection('full')}><i className="bi bi-square me-1"></i>Full width</button>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addLayoutSection('split')}><i className="bi bi-layout-sidebar-reverse me-1"></i>Main content + Right sidebar</button>
        </div>
      </>
    );
  };

  const renderServiceCanvas = () => {
    const zones = serviceZones(baseOf(sections));
    return (
      <>
        {isLanding && renderZone('zone:header', ZONE_LABELS.header, ZONE_HINTS.header, zones.header, { tone: 'info' })}
        {renderZone('zone:hero', ZONE_LABELS.hero, ZONE_HINTS.hero, zones.hero, { tone: 'warning' })}
        {renderZone('zone:top', ZONE_LABELS.top, ZONE_HINTS.top, zones.top)}
        {!isBlog && renderWidthControl(baseMarkerOf(sections)?.data?.payload?.mainWidth, setBaseWidth)}
        {isBlog
          ? renderTwoColumns('zone:main', 'zone:sidebar', zones.main, zones.sidebar, [
            'The article: text and blocks, in order',
            sidebarSide === 'none' ? 'Sidebar is off (Blog layout): these blocks show at the end of the article' : 'On this page, Share, Expert help, Form, Trust, Contact…',
          ], undefined, {
            sideFirst: sidebarSide === 'left',
            sideLabel: sidebarSide === 'left' ? 'Left sidebar' : sidebarSide === 'none' ? 'Sidebar (off)' : 'Right sidebar',
          })
          : renderTwoColumns('zone:main', 'zone:sidebar', zones.main, zones.sidebar, [ZONE_HINTS.main, ZONE_HINTS.sidebar], baseMarkerOf(sections)?.data?.payload?.mainWidth)}
        {renderZone('zone:bottom', ZONE_LABELS.bottom, ZONE_HINTS.bottom, zones.bottom)}
        {renderLayoutSections()}
        {isLanding && renderZone('zone:footer', ZONE_LABELS.footer, ZONE_HINTS.footer, zones.footer, { tone: 'info' })}
      </>
    );
  };

  const renderHomeCanvas = () => homeRows(baseOf(sections)).map((row, r) => (
    <div key={`row-${r}`} className={row.extra ? 'opacity-75' : undefined}>
      {row.kind !== 'full' && !row.extra && renderWidthControl(baseMarkerOf(sections)?.data?.payload?.mainWidth, setBaseWidth)}
      {row.kind === 'full'
        ? renderZone(`zone:${r}:full`, row.extra ? `${ZONE_LABELS.full} (new row)` : ZONE_LABELS.full, ZONE_HINTS.full, row.full, { tone: 'secondary' })
        : renderTwoColumns(`zone:${r}:main`, `zone:${r}:sidebar`, row.main, row.sidebar, [
          row.extra ? 'New two-column row' : ZONE_HINTS.homeMain,
          ZONE_HINTS.homeSidebar,
        ], baseMarkerOf(sections)?.data?.payload?.mainWidth)}
    </div>
  ));

  const renderFlatCanvas = () => (
    <Droppable droppableId="canvas">
      {(provided, snapshot) => (
        <div
          className={`p-1 rounded ${snapshot.isDraggingOver ? 'bg-light' : ''}`}
          {...provided.droppableProps}
          ref={provided.innerRef}
          style={{ minHeight: '600px' }}
        >
          {baseOf(sections).length === 0 && (
            <div className="text-center py-5 text-muted border border-dashed rounded">
              <i className="bi bi-layout-text-window display-4"></i>
              <p className="mt-3">Drag blocks here or click 'Add' from the sidebar to build your page.</p>
            </div>
          )}
          {baseOf(sections).map((section, index) => renderCard(section, index, baseOf(sections)))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );

  const focusedSection = sections.find(s => s.id === focusId) || null;
  // Only the preview's copy carries these (website BlockBackground.jsx); they are never saved.
  // previewMark: the block being edited (spacing overlay); previewId: every block (click to select).
  const markFocused = (s) => ({
    ...s,
    config: { ...s.config, previewId: String(s.id), ...(s.id === focusId ? { previewMark: String(s.id) } : {}) },
  });
  // A block clicked in the Live Preview panel: open it here, scroll its editor into view.
  const pickBlock = (id) => {
    const section = sections.find(s => String(s.id) === String(id));
    if (!section) return;
    setOpenId(section.id);
    setFocusId(section.id);
    setScrollToId(section.id);
  };
  const pickLabel = (id) => {
    const section = sections.find(s => String(s.id) === String(id));
    return section ? `${labelOf(section.type)}${ordinals[section.id] ? ` ${ordinals[section.id]}` : ''}` : '';
  };
  const dockDraft = dockView === 'block' && focusedSection
    ? singleBlockDraft(markFocused(focusedSection), sections, blockSet)
    : previewDraft ? previewDraft(sections.map(markFocused))
      : isHome ? { sections: sections.map(markFocused) }
        : { title: '\u200b', slug: '', content: '', sections: sections.map(markFocused) };

  return (
    <LinkPolicyContext.Provider value={isLanding ? 'landing' : 'any'}>
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="d-flex flex-column flex-md-row gap-4" ref={rootRef} style={dockOpen ? { paddingRight: DOCK_WIDTH } : undefined}>
        {/* Canvas */}
        <div className="flex-grow-1 w-100" style={{ minWidth: 0 }}>
          {sections.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mb-2 px-1 small text-muted">
              <span>
                {blockCount} block{blockCount === 1 ? '' : 's'} on this page
                {zoned && ' · drag blocks between areas; blocks only drop where they fit'}
              </span>
              <div className="d-flex gap-3 flex-shrink-0 align-items-center">
                {isJourney && (
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto' }}
                    value=""
                    onChange={e => { if (e.target.value) fillJourney(e.target.value === '__blank' ? null : e.target.value); }}
                    title="Replace the blocks with the template or a reference stage"
                  >
                    <option value="">Fill from template…</option>
                    <option value="__blank">Empty journey template</option>
                    {JOURNEY_REFERENCE_STAGES.map(s => <option key={s.key} value={s.key}>{s.number} · {s.title}</option>)}
                  </select>
                )}
                {isTool && (
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto' }}
                    value=""
                    onChange={e => { if (e.target.value) fillTool(e.target.value); }}
                    title="Replace the blocks with a tool template, the hub or a reference tool"
                  >
                    <option value="">Fill from template…</option>
                    {toolOptions}
                  </select>
                )}
                {isHome && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-decoration-none text-danger"
                    onClick={async () => {
                      if ((await confirmDialog({ title: 'Reset to the default layout?', message: 'Every block is replaced with the default homepage layout. Your current blocks will be lost (until you leave without saving).', tone: 'warning', confirmText: 'Reset layout' }))) {
                        setOpenId(null);
                        update(defaultHomeSections());
                      }
                    }}
                  >
                    Reset to default layout
                  </button>
                )}
                {openId && (
                  <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => setOpenId(null)}>
                    Collapse all
                  </button>
                )}
              </div>
            </div>
          )}

          {isHome && sections.length === 0 && (
            <div className="text-center py-4 mb-3 text-muted border border-dashed rounded">
              <button type="button" className="btn btn-primary" onClick={() => update(defaultHomeSections())}>
                <i className="bi bi-magic me-1"></i> Load default layout
              </button>
              <div className="small mt-2">Adds every homepage section with the content the website shows today, or drag blocks into the areas below.</div>
            </div>
          )}

          {isJourney && sections.length === 0 && (
            <div className="text-center py-4 mb-3 text-muted border border-dashed rounded">
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <button type="button" className="btn btn-primary" onClick={() => fillJourney(null)}>
                  <i className="bi bi-magic me-1"></i> Load the journey template
                </button>
                <select className="form-select" style={{ width: 'auto' }} value="" onChange={e => e.target.value && fillJourney(e.target.value)}>
                  <option value="">…or start from a reference stage</option>
                  {JOURNEY_REFERENCE_STAGES.map(s => <option key={s.key} value={s.key}>{s.number} · {s.title}</option>)}
                </select>
              </div>
              <div className="small mt-2">Adds every section of the reference stage page in order. Then fill the Stage Hero (number, title, icon, colour) and the texts.</div>
            </div>
          )}

          {isTool && sections.length === 0 && (
            <div className="text-center py-4 mb-3 text-muted border border-dashed rounded">
              <div className="d-flex flex-wrap justify-content-center gap-2">
                <button type="button" className="btn btn-primary" onClick={() => fillTool('__blank')}>
                  <i className="bi bi-magic me-1"></i> Load the tool template
                </button>
                <select className="form-select" style={{ width: 'auto' }} value="" onChange={e => e.target.value && fillTool(e.target.value)}>
                  <option value="">…or start from</option>
                  {toolOptions}
                </select>
              </div>
              <div className="small mt-2">Then choose the calculator in the Calculator block and set its texts.</div>
            </div>
          )}

          {isHome ? renderHomeCanvas() : layoutSettings ? renderServiceCanvas() : renderFlatCanvas()}
          {/* The service canvas shows them itself, above a landing page's Footer area. */}
          {(isHome || !layoutSettings) && renderLayoutSections()}
        </div>

        {/* Sidebar: Available Blocks (drag one into an area, or click + to add it); the preview panel takes its place. */}
        <div className={`flex-shrink-0 w-100 ${dockOpen ? 'd-none' : ''}`} style={{ maxWidth: '320px' }}>
          <div className="premium-form-card w-100 sticky-top ta-below-bar" style={{ zIndex: 10, maxHeight: 'calc(100vh - var(--ta-sticky-offset, 0px) - 7rem)', overflowY: 'auto' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h6 className="mb-0 fw-bold text-muted text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>Available Blocks</h6>
                <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis" title="Blocks on this page">
                  {blockCount} added
                </span>
              </div>
              <p className="small text-muted mb-2">Drag a block onto the page, or click + to add it. The eye shows a preview first.</p>
              <div className="input-group input-group-sm mb-3">
                <span className="input-group-text bg-transparent"><i className="bi bi-search"></i></span>
                <input type="search" className="form-control" placeholder="Search blocks…" value={paletteSearch} onChange={e => setPaletteSearch(e.target.value)} />
              </div>
              {!visibleGroups.length && <div className="small text-muted text-center py-3">No block matches “{paletteSearch}”.</div>}
              <Droppable droppableId="palette" isDropDisabled>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="d-flex flex-column gap-3">
                    {visibleGroups.flatMap(group => [{ heading: group.title, count: group.items.length }, ...group.items]).map((block, position, all) => block.heading ? (
                      <div key={`group-${block.heading}`} className={`small fw-bold text-uppercase text-secondary d-flex justify-content-between ${position ? 'mt-2 pt-2 border-top' : ''}`} style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                        <span>{block.heading}</span><span className="fw-normal">{block.count}</span>
                      </div>
                    ) : (
                      <Draggable key={block.type} draggableId={`${PALETTE_PREFIX}${block.type}`} index={all.slice(0, position).filter(b => !b.heading).length}>
                        {(drag, snapshot) => {
                          const item = (props = {}) => (
                            <div className="premium-block-btn w-100 d-flex align-items-center flex-nowrap" style={{ cursor: 'grab' }} {...props}>
                              <i className={`bi ${block.icon} me-2`}></i>
                              <span className="flex-grow-1 text-start" style={{ minWidth: 0 }}>{block.label}</span>
                              {counts[block.type] > 0 && (
                                <span className="badge rounded-pill bg-primary ms-2" title={`${counts[block.type]} on this page`}>{counts[block.type]}</span>
                              )}
                              <button type="button" className="btn btn-sm btn-link p-0 ms-2 text-reset" onClick={() => setPaletteType(block.type)} title={`Preview ${block.label}`} aria-label={`Preview ${block.label}`}>
                                <i className="bi bi-eye"></i>
                              </button>
                              <button type="button" className="btn btn-sm btn-link p-0 ms-2 text-reset" onClick={() => handleAddBlock(block.type)} title={`Add ${block.label}`}>
                                <i className="bi bi-plus"></i>
                              </button>
                            </div>
                          );
                          return (
                            <>
                              {inBody(<div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                // Palette items never shift: the list stays as it is while one is dragged out.
                                style={snapshot.isDragging ? drag.draggableProps.style : { ...drag.draggableProps.style, transform: 'none' }}
                              >
                                {item()}
                              </div>, snapshot.isDragging)}
                              {snapshot.isDragging && item({ style: { opacity: 0.5 } })}
                            </>
                          );
                        }}
                      </Draggable>
                    ))}
                    <div style={{ display: 'none' }}>{provided.placeholder}</div>
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
    {visible && !dockOpen && createPortal(
      <button
        type="button"
        className="btn btn-primary rounded-pill shadow-lg d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold"
        style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1040 }}
        onClick={() => { setDockView(focusedSection ? 'block' : 'page'); setDockOpen(true); }}
      >
        <i className="bi bi-eye"></i> Live Preview
      </button>,
      document.body
    )}
    {visible && dockOpen && (
      <LivePreviewDock
        kind={dockView === 'block' && focusedSection ? previewKindOf(blockSet) : (previewKind || previewKindOf(blockSet))}
        draft={dockDraft}
        view={dockView}
        onView={setDockView}
        label={focusedSection ? labelOf(focusedSection.type) : ''}
        hasBlock={Boolean(focusedSection)}
        width={DOCK_WIDTH}
        top={dockTop}
        onClose={() => setDockOpen(false)}
        onPick={pickBlock}
        labelOf={pickLabel}
        selectedId={openId}
      />
    )}
    <PaletteBlockPreviewModal
      type={paletteType}
      payload={palettePayload}
      sections={sections}
      blockSet={blockSet}
      label={paletteType ? labelOf(paletteType) : ''}
      onAdd={() => { handleAddBlock(paletteType); setPaletteType(null); }}
      onHide={() => setPaletteType(null)}
    />
    </LinkPolicyContext.Provider>
  );
};

export default PageBuilder;

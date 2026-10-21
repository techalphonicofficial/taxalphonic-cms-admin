import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'react-toastify';
import SectionRenderer from './SectionRenderer';
import { HOME_BLOCKS, HOME_PLACEMENTS, HOME_PLACEMENT_RULES, defaultHomeSections, homeDefaultPayload } from './homeBlocks';
import {
  SERVICE_SIDEBAR_BLOCKS, SERVICE_ZONES, ZONE_LABELS,
  homeDropError, homeRows, insertInFlat, serviceDropError, servicePlacementOf, serviceZones
} from './layoutZones';
import { confirmDialog } from '../common/confirm';

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

const BLOCK_META = Object.fromEntries([...AVAILABLE_BLOCKS, ...SERVICE_BLOCKS, ...SERVICE_ONLY_BLOCKS, ...HOME_BLOCKS].map(b => [b.type, b]));
const labelOf = (type) => BLOCK_META[type]?.label || type;

const PLACEMENTS = [
  { value: 'main', label: 'Main content' },
  { value: 'sidebar', label: 'Right sidebar' },
  { value: 'top', label: 'Top (full width, under the hero)' },
  { value: 'bottom', label: 'Bottom (full width)' }
];

// Hints shown in each area of the canvas.
const ZONE_HINTS = {
  hero: 'Hero Banner only',
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
const BlockSettings = ({ section, onChange, home = false }) => {
  if (section.type === 'HeroBanner') return null;
  const config = section.config || {};
  const set = (key, value) => onChange({ ...config, [key]: value });

  if (home) {
    // Only blocks with a placement rule can move; the hero and other wide blocks stay full width.
    const rule = HOME_PLACEMENT_RULES[section.type];
    if (!rule) return null;
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
  const options = PLACEMENTS.filter(p => p.value !== 'sidebar' || SERVICE_SIDEBAR_BLOCKS.includes(section.type) || value === 'sidebar');

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
const PageBuilder = ({ initialSections = [], onChange, layoutSettings = false, blockSet = 'default' }) => {
  const isHome = blockSet === 'home';
  const zoned = isHome || layoutSettings;
  const blocks = isHome ? HOME_BLOCKS
    : layoutSettings ? [...AVAILABLE_BLOCKS, ...SERVICE_BLOCKS, ...(blockSet === 'service' ? SERVICE_ONLY_BLOCKS : [])]
    : AVAILABLE_BLOCKS;
  const [sections, setSections] = useState(initialSections);
  // Accordion: only one block is open at a time; null = all collapsed.
  const [openId, setOpenId] = useState(null);
  const [scrollToId, setScrollToId] = useState(null);
  const cardRefs = useRef({});

  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  // Bring a newly added block into view once it has rendered.
  useEffect(() => {
    if (!scrollToId) return;
    cardRefs.current[scrollToId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setScrollToId(null);
  }, [scrollToId, sections]);

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

  const toggleBlock = (id) => setOpenId(prev => (prev === id ? null : id));

  const newSection = (type) => ({
    id: `sec_${Date.now()}`,
    type,
    config: {},
    data: { payload: isHome ? homeDefaultPayload(type) : {} }
  });

  const reveal = (section) => {
    // New blocks open straight away (everything else collapses) and scroll into view.
    setOpenId(section.id);
    setScrollToId(section.id);
  };

  const hasServiceHero = () => sections.some(s => s.type === 'HeroBanner');

  const handleAddBlock = (blockType) => {
    const section = newSection(blockType);
    if (layoutSettings && !isHome) {
      if (blockType === 'HeroBanner' && hasServiceHero()) {
        toast.warning('This page already has a Hero Banner.');
        return;
      }
      // Lands at the end of the area the block goes to by default.
      const zones = serviceZones(sections);
      zones[servicePlacementOf(section)].push(section);
      update(SERVICE_ZONES.flatMap(z => zones[z]));
    } else if (isHome) {
      // The hero goes first; other blocks at the end of the page, ready to be dragged.
      update(blockType === 'HomeHero' ? [section, ...sections] : [...sections, section]);
    } else {
      update([section, ...sections]);
    }
    reveal(section);
  };

  const handleRemoveBlock = (section) => {
    update(sections.filter(s => s !== section));
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
    if (fromPalette && zone === 'hero' && hasServiceHero()) return toast.warning('This page already has a Hero Banner.');

    const placed = zone === 'hero' ? moving : withPlacement(moving, zone);
    const zones = serviceZones(sections.filter(s => s !== moving));
    zones[zone].splice(index, 0, placed);
    update(SERVICE_ZONES.flatMap(z => zones[z]));
    return placed;
  };

  const dropIntoHome = (rowIndex, column, index, moving) => {
    const error = homeDropError(moving.type, column, labelOf(moving.type));
    if (error) return toast.warning(error);

    const row = homeRows(sections)[rowIndex];
    if (!row) return null;
    const placed = HOME_PLACEMENT_RULES[moving.type] ? withPlacement(moving, column) : moving;
    const others = (list) => list.filter(s => s !== moving);
    const oldIndex = sections.indexOf(moving);
    update(insertInFlat(others(sections), {
      column: others(row[column]),
      index,
      rowRest: others([...row.full, ...row.main, ...row.sidebar]),
      fallbackIndex: row.extra || oldIndex < 0 ? null : oldIndex,
    }, placed));
    return placed;
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
      const items = sections.filter(s => s !== moving);
      items.splice(destination.index, 0, moving);
      update(items);
      if (fromPalette) reveal(moving);
      return;
    }

    // zone:<area> (service) or zone:<row>:<column> (homepage)
    const [, first, second] = destination.droppableId.split(':');
    const placed = isHome
      ? dropIntoHome(Number(first), second, destination.index, moving)
      : dropIntoService(first, destination.index, moving, fromPalette);
    if (fromPalette && placed && typeof placed === 'object') reveal(placed);
  };

  const editorFor = (section) => (
    <>
      {zoned && (
        <BlockSettings
          home={isHome}
          section={section}
          onChange={(config) => update(sections.map(s => s.id === section.id ? { ...s, config } : s))}
        />
      )}
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
            style={{ ...provided.draggableProps.style, scrollMarginTop: '90px' }}
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
                <button type="button" className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={iconButton} onClick={() => handleMove(column, section, -1)} disabled={position === 0} title="Move Up">
                  <i className="bi bi-arrow-up text-secondary"></i>
                </button>
                <button type="button" className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={iconButton} onClick={() => handleMove(column, section, 1)} disabled={position === column.length - 1} title="Move Down">
                  <i className="bi bi-arrow-down text-secondary"></i>
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
      <div className="card border-0 shadow-sm rounded-4 border-start border-4 border-primary mb-4">
        <div className="card-header bg-transparent border-bottom-0 px-4 pt-3 pb-0 d-flex justify-content-between align-items-center">
          <span className="fw-bold"><i className={`bi ${BLOCK_META[open.type]?.icon || 'bi-square'} text-primary me-2`}></i>Editing: {labelOf(open.type)}</span>
          <button type="button" className="btn btn-sm btn-light" onClick={() => setOpenId(null)}>Done</button>
        </div>
        <div className="card-body p-4 pt-3">{editorFor(open)}</div>
      </div>
    );
  };

  const renderTwoColumns = (mainId, sideId, main, sidebar, hints) => (
    <>
      <div className="row g-3">
        <div className="col-lg-8">{renderZone(mainId, ZONE_LABELS.main, hints[0], main, { inline: false })}</div>
        <div className="col-lg-4">{renderZone(sideId, ZONE_LABELS.sidebar, hints[1], sidebar, { inline: false, tone: 'success' })}</div>
      </div>
      {renderColumnEditor([...main, ...sidebar])}
    </>
  );

  const renderServiceCanvas = () => {
    const zones = serviceZones(sections);
    return (
      <>
        {renderZone('zone:hero', ZONE_LABELS.hero, ZONE_HINTS.hero, zones.hero, { tone: 'warning' })}
        {renderZone('zone:top', ZONE_LABELS.top, ZONE_HINTS.top, zones.top)}
        {renderTwoColumns('zone:main', 'zone:sidebar', zones.main, zones.sidebar, [ZONE_HINTS.main, ZONE_HINTS.sidebar])}
        {renderZone('zone:bottom', ZONE_LABELS.bottom, ZONE_HINTS.bottom, zones.bottom)}
      </>
    );
  };

  const renderHomeCanvas = () => homeRows(sections).map((row, r) => (
    <div key={`row-${r}`} className={row.extra ? 'opacity-75' : undefined}>
      {row.kind === 'full'
        ? renderZone(`zone:${r}:full`, row.extra ? `${ZONE_LABELS.full} (new row)` : ZONE_LABELS.full, ZONE_HINTS.full, row.full, { tone: 'secondary' })
        : renderTwoColumns(`zone:${r}:main`, `zone:${r}:sidebar`, row.main, row.sidebar, [
          row.extra ? 'New two-column row' : ZONE_HINTS.homeMain,
          ZONE_HINTS.homeSidebar,
        ])}
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
          {sections.length === 0 && (
            <div className="text-center py-5 text-muted border border-dashed rounded">
              <i className="bi bi-layout-text-window display-4"></i>
              <p className="mt-3">Drag blocks here or click 'Add' from the sidebar to build your page.</p>
            </div>
          )}
          {sections.map((section, index) => renderCard(section, index, sections))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="d-flex flex-column flex-md-row gap-4">
        {/* Canvas */}
        <div className="flex-grow-1 w-100" style={{ minWidth: 0 }}>
          {sections.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mb-2 px-1 small text-muted">
              <span>
                {sections.length} block{sections.length === 1 ? '' : 's'} on this page
                {zoned && ' · drag blocks between areas; blocks only drop where they fit'}
              </span>
              <div className="d-flex gap-3 flex-shrink-0">
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

          {isHome ? renderHomeCanvas() : layoutSettings ? renderServiceCanvas() : renderFlatCanvas()}
        </div>

        {/* Sidebar: Available Blocks (drag one into an area, or click + to add it) */}
        <div className="flex-shrink-0 w-100" style={{ maxWidth: '320px' }}>
          <div className="premium-form-card w-100 sticky-top ta-below-bar" style={{ zIndex: 10, maxHeight: 'calc(100vh - var(--ta-sticky-offset, 0px) - 7rem)', overflowY: 'auto' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h6 className="mb-0 fw-bold text-muted text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>Available Blocks</h6>
                <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis" title="Blocks on this page">
                  {sections.length} added
                </span>
              </div>
              <p className="small text-muted mb-3">Drag a block onto the page, or click + to add it.</p>
              <Droppable droppableId="palette" isDropDisabled>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="d-flex flex-column gap-3">
                    {blocks.map((block, index) => (
                      <Draggable key={block.type} draggableId={`${PALETTE_PREFIX}${block.type}`} index={index}>
                        {(drag, snapshot) => {
                          const item = (props = {}) => (
                            <div className="premium-block-btn w-100" style={{ cursor: 'grab' }} {...props}>
                              <i className={`bi ${block.icon} me-2`}></i>
                              <span className="flex-grow-1 text-start">{block.label}</span>
                              {counts[block.type] > 0 && (
                                <span className="badge rounded-pill bg-primary ms-2" title={`${counts[block.type]} on this page`}>{counts[block.type]}</span>
                              )}
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
  );
};

export default PageBuilder;

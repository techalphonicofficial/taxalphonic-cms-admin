// Journey Stage pages (uirefrence.html #/journey/<stage>): one block per section of the
// reference's stage view. The website renders them in
// components/tax-alphonic/journey/JourneySections.jsx (BLOCKS map: keep the types in sync).
// - The Stage Hero block defines the stage: number, icon, colour, title. Every other block uses
//   that colour and icon, and "{stage}" in any text is replaced by the stage title.
// - Progress, Roadmap, Flow and Previous / Next are built by the website from all published
//   Journey pages, ordered by stage number: nothing to type.
import { JOURNEY_REFERENCE_INDUSTRIES, JOURNEY_REFERENCE_KNOWLEDGE, JOURNEY_REFERENCE_STAGES } from './journeyReference';
import { imageHint } from '../../config/imageSizes';

export const JOURNEY_SLUG_PREFIX = 'journey/';

/** A page is a Journey Stage page when it has Journey blocks (or a journey/ slug). */
export const isJourneyPage = (page) => String(page?.slug || '').startsWith(JOURNEY_SLUG_PREFIX)
  || (Array.isArray(page?.sections) && page.sections.some(s => String(s?.type || '').startsWith('Journey')));

// In page order, as in the reference.
export const JOURNEY_BLOCKS = [
  { type: 'JourneyProgress', label: 'Progress Tracker (auto)', icon: 'bi-bar-chart-steps' },
  { type: 'JourneyHero', label: 'Stage Hero (stage details)', icon: 'bi-stars' },
  { type: 'JourneyOffer', label: 'What You Get (promise)', icon: 'bi-bullseye' },
  { type: 'JourneyRoadmap', label: 'Full Roadmap (auto)', icon: 'bi-signpost-split' },
  { type: 'JourneySteps', label: 'Steps Timeline', icon: 'bi-list-ol' },
  { type: 'JourneyDeliverables', label: 'Deliverables & Services', icon: 'bi-check2-square' },
  { type: 'JourneyWhy', label: 'Why It Matters', icon: 'bi-lightbulb' },
  { type: 'JourneyStory', label: 'Real Example (before → after)', icon: 'bi-book' },
  { type: 'JourneyFlow', label: 'Journey Flow (auto)', icon: 'bi-bezier2' },
  { type: 'JourneyPhotos', label: 'Real Stories Photos', icon: 'bi-images' },
  { type: 'JourneySectors', label: 'Industries & States', icon: 'bi-buildings' },
  { type: 'JourneyResources', label: 'Related Resources', icon: 'bi-link-45deg' },
  { type: 'JourneyNav', label: 'Previous / Next Stage (auto)', icon: 'bi-arrow-left-right' },
  { type: 'JourneyKnowledge', label: 'Latest Updates (Taxpedia)', icon: 'bi-journal-text' },
  { type: 'JourneyCta', label: 'Final CTA Strip', icon: 'bi-megaphone' },
];

const KICKER = { key: 'kicker', label: 'Small label (kicker)', type: 'text' };
const HEADING = { key: 'heading', label: 'Heading', type: 'text' };
const SUB = { key: 'sub', label: 'Sub text', type: 'text', width: 'col-12' };
const STAGE_HINT = { key: 'stageHint', type: 'note', label: 'Tip: "{stage}" in any text becomes this page\'s stage title. Colours and icons come from the Stage Hero block.' };
const AUTO = (what) => ({ key: 'autoNote', type: 'note', label: `${what} is built automatically from all published Journey pages, in stage-number order — nothing to type here.` });
const URL = { key: 'url', placeholder: 'Link (/talk-to-expert, /gst-registration, https://…)', width: 'col-md-5' };

/** Field schema per block, rendered by SchemaFields.jsx (same field types as the Home Page Builder). */
export const JOURNEY_SCHEMAS = {
  JourneyProgress: [
    AUTO('The stage tracker'),
    { key: 'label', label: 'Tracker title', type: 'text' },
    { key: 'goalText', label: 'Progress suffix', type: 'text', placeholder: 'to revenue', hint: 'Shown as "Stage 2 of 10 · 20% to revenue".' },
  ],
  JourneyHero: [
    { key: 'heroNote', type: 'note', label: 'This block defines the stage: its number orders it in the journey, and its colour and icon are used by every block on the page.' },
    { key: 'number', label: 'Stage number', type: 'text', placeholder: '01', width: 'col-md-2' },
    { key: 'title', label: 'Stage title', type: 'text', placeholder: 'Idea & Structure', width: 'col-md-5' },
    { key: 'shortLabel', label: 'Short label (progress tracker)', type: 'text', placeholder: 'Idea', width: 'col-md-5' },
    { key: 'icon', label: 'Icon (emoji or image)', type: 'text', placeholder: '💡', width: 'col-md-3' },
    { key: 'color', label: 'Stage colour', type: 'color', width: 'col-md-3' },
    { key: 'tag', label: 'Tag (pill next to the number)', type: 'text', placeholder: 'Start here', width: 'col-md-6' },
    { key: 'chips', label: 'Chips under the title', type: 'list', addLabel: 'Add chip', hint: '"{read}" becomes the page\'s reading time in minutes. No chips = strip hidden.', fields: [{ key: 'text', placeholder: '✅ 100% Online Process', width: 'col-12' }] },
    { key: 'description', label: 'Description', type: 'textarea', hint: 'Wrap words in **double asterisks** to make them bold.' },
    { key: 'roadmapText', label: 'One-line outcome (roadmap row of this stage)', type: 'text', width: 'col-12', placeholder: 'Pick the right legal structure for your business' },
    { key: 'primaryButton', label: 'Primary button', type: 'button' },
    { key: 'secondaryButton', label: 'Secondary button', type: 'button' },
    { key: 'image', label: 'Image instead of the icon circle (optional)', type: 'image', hint: imageHint('journeyHero') },
    { key: 'showMeta', label: 'Stage / steps / services info and progress bar', type: 'select', options: [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }] },
    { key: 'goalText', label: 'Progress suffix', type: 'text', placeholder: 'to revenue' },
  ],
  JourneyOffer: [
    STAGE_HINT, KICKER, HEADING,
    { key: 'outcome', label: 'Outcome ("By the end of <stage>, you will have …")', type: 'text', width: 'col-12' },
    { key: 'sub', label: 'Text', type: 'textarea' },
    { key: 'button', label: 'Button', type: 'button' },
    { key: 'badgeFoot', label: 'Badge footer', type: 'text' },
  ],
  JourneyRoadmap: [
    AUTO('The roadmap list (one row per stage, with its one-line outcome)'),
    KICKER, HEADING, SUB,
    { key: 'hereLabel', label: '"You are here" text', type: 'text' },
  ],
  JourneySteps: [
    STAGE_HINT, KICKER, HEADING, SUB,
    { key: 'items', label: 'Steps (numbered automatically)', type: 'list', addLabel: 'Add step', fields: [{ key: 'text', placeholder: 'Step', width: 'col-12' }] },
  ],
  JourneyDeliverables: [
    STAGE_HINT,
    { key: 'leftKicker', label: 'Left: small label', type: 'text' },
    { key: 'leftHeading', label: 'Left: heading', type: 'text' },
    { key: 'deliverables', label: 'Deliverables (✓ list)', type: 'list', addLabel: 'Add deliverable', fields: [{ key: 'text', placeholder: 'Deliverable', width: 'col-12' }] },
    { key: 'rightKicker', label: 'Right: small label', type: 'text' },
    { key: 'rightHeading', label: 'Right: heading', type: 'text' },
    { key: 'services', label: 'Service cards', type: 'list', addLabel: 'Add service', fields: [{ key: 'icon', placeholder: 'Icon (empty = stage icon)', width: 'col-md-2' }, { key: 'name', placeholder: 'Service name', width: 'col-md-5' }, URL] },
  ],
  JourneyWhy: [
    STAGE_HINT, HEADING,
    { key: 'text', label: 'Text', type: 'textarea' },
    { key: 'icon', label: 'Icon (empty = stage icon)', type: 'text' },
  ],
  JourneyStory: [
    STAGE_HINT, KICKER, HEADING, SUB,
    { key: 'business', label: 'Business / person', type: 'text', width: 'col-12' },
    { key: 'before', label: 'Before', type: 'textarea' },
    { key: 'did', label: 'What we did', type: 'textarea' },
    { key: 'after', label: 'The result', type: 'textarea' },
    { key: 'beforeLabel', label: '"Before" label', type: 'text', width: 'col-md-4' },
    { key: 'didLabel', label: '"What we did" label', type: 'text', width: 'col-md-4' },
    { key: 'afterLabel', label: '"Result" label', type: 'text', width: 'col-md-4' },
    { key: 'note', label: 'Footnote', type: 'text', width: 'col-12' },
  ],
  JourneyFlow: [
    AUTO('The stage flow'),
    KICKER, HEADING, SUB,
    { key: 'primaryButton', label: 'Primary button', type: 'button' },
    { key: 'secondaryButton', label: 'Secondary button', type: 'button' },
  ],
  JourneyPhotos: [
    STAGE_HINT, KICKER, HEADING, SUB,
    { key: 'items', label: 'Photos (from Media)', type: 'list', addLabel: 'Add photo', hint: imageHint('journeyPhoto'), fields: [{ key: 'image', placeholder: 'Photo', width: 'col-md-5' }, { key: 'tag', placeholder: 'Tag on the photo', width: 'col-md-3' }, { key: 'caption', placeholder: 'Caption', width: 'col-md-4' }] },
    { key: 'note', label: 'Footnote', type: 'text', width: 'col-12' },
  ],
  JourneySectors: [
    STAGE_HINT,
    { key: 'kicker', label: 'Industries: small label', type: 'text' },
    { key: 'heading', label: 'Industries: heading', type: 'text' },
    { key: 'sub', label: 'Industries: text', type: 'text', width: 'col-12' },
    { key: 'industries', label: 'Industry cards (empty = industries part hidden)', type: 'list', addLabel: 'Add industry', fields: [{ key: 'icon', placeholder: 'Icon', width: 'col-md-2' }, { key: 'name', placeholder: 'Industry', width: 'col-md-3' }, { key: 'color', placeholder: 'Colour', type: 'color', width: 'col-md-2' }, { key: 'url', placeholder: 'Link', width: 'col-md-5' }, { key: 'text', placeholder: 'Card text', width: 'col-12' }] },
    { key: 'cardLinkText', label: 'Card link text', type: 'text' },
    { key: 'statesKicker', label: 'States: small label', type: 'text' },
    { key: 'statesHeading', label: 'States: heading', type: 'text' },
    { key: 'statesSub', label: 'States: text', type: 'text', width: 'col-12' },
    { key: 'states', label: 'State chips (empty = states part hidden)', type: 'list', addLabel: 'Add state', fields: [{ key: 'icon', placeholder: 'Icon', width: 'col-md-2' }, { key: 'name', placeholder: 'State', width: 'col-md-10' }] },
    { key: 'noteTitle', label: 'States: note title', type: 'text' },
    { key: 'button', label: 'States: button', type: 'button' },
    { key: 'noteText', label: 'States: note text', type: 'textarea' },
    { key: 'footnote', label: 'Footnote', type: 'text', width: 'col-12' },
  ],
  JourneyResources: [
    STAGE_HINT, KICKER, HEADING, SUB,
    { key: 'items', label: 'Resource cards', type: 'list', addLabel: 'Add card', fields: [{ key: 'icon', placeholder: 'Icon', width: 'col-md-2' }, { key: 'title', placeholder: 'Title', width: 'col-md-4' }, { key: 'url', placeholder: 'Link', width: 'col-md-6' }, { key: 'text', placeholder: 'Text', width: 'col-12' }] },
  ],
  JourneyNav: [
    AUTO('Previous / next stage'),
    { key: 'prevLabel', label: '"Previous" label', type: 'text' },
    { key: 'nextLabel', label: '"Next" label', type: 'text' },
    { key: 'lastLabel', label: 'Last stage: label', type: 'text' },
    { key: 'lastTitle', label: 'Last stage: button text', type: 'text' },
    { key: 'lastUrl', label: 'Last stage: link', type: 'text' },
  ],
  JourneyKnowledge: [
    STAGE_HINT,
    { key: 'kicker', label: 'Small label', type: 'text' },
    HEADING, SUB,
    { key: 'items', label: 'Topic buttons', type: 'list', addLabel: 'Add topic', fields: [{ key: 'icon', placeholder: 'Icon', width: 'col-md-2' }, { key: 'label', placeholder: 'Label', width: 'col-md-4' }, { key: 'url', placeholder: 'Link', width: 'col-md-6' }] },
    { key: 'footText', label: 'Footer text', type: 'text' },
    { key: 'footLink', label: 'Footer link', type: 'button' },
  ],
  JourneyCta: [
    STAGE_HINT, HEADING,
    { key: 'text', label: 'Text', type: 'text' },
    { key: 'button', label: 'Button', type: 'button' },
  ],
};

const STATES = [['🏛️', 'Delhi'], ['🏙️', 'Maharashtra'], ['💻', 'Karnataka'], ['🌾', 'Uttar Pradesh'], ['🏭', 'Gujarat'], ['⚙️', 'Tamil Nadu'], ['🚢', 'West Bengal'], ['🏢', 'Telangana']];

// Texts shared by every stage (from the reference); stage-specific fields are filled by stageContent().
const SHARED = {
  JourneyProgress: { label: '🗺️ Your business journey — idea to revenue', goalText: 'to revenue' },
  JourneyHero: {
    number: '', title: '', shortLabel: '', icon: '🚀', color: '#0E96AC', tag: '', description: '', roadmapText: '',
    chips: [{ text: '⏱ {read} min read' }, { text: '✅ 100% Online Process' }, { text: '👨‍💼 CA/CS Expert Assisted' }, { text: '🔄 Updated Sep 2026' }],
    primaryButton: { text: '🎧 Get help with this stage', url: '/talk-to-expert' },
    secondaryButton: { text: '📅 Book a meeting', url: '/book-meeting' },
    image: '', showMeta: 'show', goalText: 'to revenue',
  },
  JourneyOffer: {
    kicker: '🎯 What you get', heading: 'Our promise for this stage', outcome: '',
    sub: 'We do the work, handle the paperwork, and keep you updated in simple language at every step — so you stay focused on your business.',
    button: { text: '🎧 Get started with this stage', url: '/talk-to-expert' }, badgeFoot: '✓ Handled end to end by experts',
  },
  JourneyRoadmap: { kicker: '🗺️ The full roadmap', heading: 'Your complete journey — idea to revenue', sub: 'Here is every stage and what you achieve at each one. Tap any stage to explore it.', hereLabel: 'You are here' },
  JourneySteps: { kicker: '📋 The process, step by step', heading: 'How {stage} works', sub: 'A clear path — we handle each step with you.', items: [] },
  JourneyDeliverables: { leftKicker: "✅ What you'll get", leftHeading: 'Deliverables', deliverables: [], rightKicker: '🛠️ Services here', rightHeading: 'How we help', services: [] },
  JourneyWhy: { heading: 'Why this stage matters', text: "Skipping or rushing this stage creates problems later. We make sure it's done right the first time — giving your business a strong foundation to grow on.", icon: '' },
  JourneyStory: {
    kicker: '📖 A real example', heading: 'How we take a business through this stage', sub: 'A practical example of {stage} in action — names changed for privacy.',
    business: '', before: '', did: '', after: '', beforeLabel: '😟 Before', didLabel: '🛠️ What we did', afterLabel: '🎉 The result',
    note: 'Illustrative example based on the kind of work we do. Real client stories and portfolios are shared on request.',
  },
  JourneyFlow: {
    kicker: '🗺️ The complete picture', heading: 'Where this stage fits — idea to revenue', sub: 'Your full business journey. Tap any stage to jump there.',
    primaryButton: { text: '🎧 Map my full journey — free', url: '/talk-to-expert' }, secondaryButton: { text: '📅 Book a planning call', url: '/book-meeting' },
  },
  JourneyPhotos: {
    kicker: '📸 Real stories', heading: 'From our community', sub: 'Real businesses, real journeys.',
    items: [
      { image: '', tag: 'Client at work', caption: 'Real business owners we have helped' },
      { image: '', tag: 'Our experts', caption: 'CAs, CS & legal experts on your side' },
      { image: '', tag: 'Success moment', caption: 'A business going live' },
    ],
    note: '',
  },
  JourneySectors: {
    kicker: '🏭 Industry-specific', heading: '{stage} — by your industry', sub: 'Requirements vary by sector. We tailor this stage to your exact industry.',
    industries: JOURNEY_REFERENCE_INDUSTRIES, cardLinkText: 'View →',
    statesKicker: '📍 State-specific', statesHeading: '{stage} — across every state', statesSub: 'Rules, fees and processes can differ by state. We handle the right process for wherever you operate.',
    states: STATES.map(([icon, name]) => ({ icon, name })),
    noteTitle: '🇮🇳 Pan-India coverage',
    noteText: 'From Delhi to Tamil Nadu, our experts know the state-specific rules — Shop Act, professional tax, local licenses and stamp duty all vary by state. We make sure your {stage} is correct for your location.',
    button: { text: '🎧 Check rules for my state', url: '/talk-to-expert' },
    footnote: 'State-specific details are indicative — exact rules are confirmed by our experts for your state.',
  },
  JourneyResources: {
    kicker: '🔗 Related resources', heading: 'Everything you need for this stage', sub: '',
    items: [
      { icon: '💰', title: 'Business Loan', text: 'Funding for this stage — 22+ lenders', url: '/loan/government' },
      { icon: '📚', title: 'Taxpedia', text: '270+ expert guides & updates', url: '/taxpedia' },
      { icon: '📊', title: 'Budget 2026', text: 'Latest budget changes', url: '/budget/2026/highlights' },
      { icon: '📅', title: 'Book a Meeting', text: 'Free expert consultation', url: '/book-meeting' },
    ],
  },
  JourneyNav: { prevLabel: '← Previous stage', nextLabel: 'Next stage →', lastLabel: 'Goal reached! 🎉', lastTitle: '🎧 Start your journey', lastUrl: '/talk-to-expert' },
  JourneyKnowledge: {
    kicker: 'Stay updated', heading: 'Latest updates for {stage}', sub: 'Articles, news, notifications and rulings relevant to {stage} — browse by type.',
    items: JOURNEY_REFERENCE_KNOWLEDGE, footText: '📚 Fresh guides, notifications and rulings — updated regularly.', footLink: { text: 'Browse all Taxpedia →', url: '/taxpedia' },
  },
  JourneyCta: { heading: "Wherever you are, we'll map your next step", text: 'From idea to revenue — talk to an expert, free.', button: { text: '🎧 Talk to an expert — free', url: '/talk-to-expert' } },
};

const clone = (value) => JSON.parse(JSON.stringify(value ?? {}));

/** Prefill for one block added to a page. */
export const journeyDefaultPayload = (type) => clone(SHARED[type]);

/** Block payloads of one reference stage (stage-specific fields over the shared texts). */
function stageContent(stage) {
  if (!stage) return {};
  const items = stage.steps.map(text => ({ text }));
  return {
    JourneyHero: { number: stage.number, title: stage.title, shortLabel: stage.shortLabel, icon: stage.icon, color: stage.color, tag: stage.tag, description: stage.description, roadmapText: stage.roadmapText },
    JourneyOffer: { outcome: stage.outcome },
    JourneySteps: { items },
    JourneyDeliverables: { deliverables: clone(items), services: stage.services.map(s => ({ icon: '', ...s })) },
    JourneyStory: { ...stage.story },
  };
}

/**
 * Every block of a Journey Stage page in reference order. With `stage` (an entry of
 * JOURNEY_REFERENCE_STAGES) the stage-specific fields hold that stage's reference content.
 */
export function journeyStageSections(stage = null) {
  const content = stageContent(stage);
  const stamp = Date.now();
  return JOURNEY_BLOCKS.map((block, index) => ({
    id: `sec_${stamp}_${index}`,
    type: block.type,
    config: {},
    data: { payload: { ...clone(SHARED[block.type]), ...clone(content[block.type] || {}) } },
  }));
}

/** Page data (title, slug, sections) for a reference stage, ready for POST /pages. */
export const journeyReferencePage = (stage, status = 'draft') => ({
  title: stage.title,
  slug: `${JOURNEY_SLUG_PREFIX}${stage.key}`,
  content: '',
  status,
  metaTitle: `${stage.title} — Your Business Journey | Tax Alphonic`,
  metaDescription: stage.description,
  sections: journeyStageSections(stage),
});

export { JOURNEY_REFERENCE_STAGES };

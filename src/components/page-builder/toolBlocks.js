// Free tool pages (uirefrence.html #/tools and #/tool/<key>): one block per section of the
// reference's tool views. The website renders them in components/tax-alphonic/tools/ToolSections.jsx
// (BLOCKS map + toolBlockTypes.js: keep the types in sync) and the calculators in calculators.jsx.
// - A page with a Calculator block is a tool page (URL /tool/<key>); one with a Tools Grid is the
//   hub (/tools). The grid and "More free tools" list the published tool pages by themselves.
// - Calculator settings (tax slabs, GST rates, HSN list, ...) start from the website's
//   toolDefaults.js (through the in-admin preview copy) and can all be changed here.
import { CALCULATORS, DEFAULT_SETTINGS } from '../../site-preview/website/components/tax-alphonic/tools/toolDefaults';
import { TOOLS_HUB, TOOL_REFERENCE } from './toolReference';

export const TOOL_SLUG_PREFIX = 'tool/';
export const TOOLS_HUB_SLUG = 'tools';

/** A page is a tool page (or the hub) when it has Tool blocks, or a tool/ / tools slug. */
export const isToolPage = (page) => {
  const slug = String(page?.slug || '');
  return slug === TOOLS_HUB_SLUG || slug.startsWith(TOOL_SLUG_PREFIX)
    || (Array.isArray(page?.sections) && page.sections.some(s => /^Tools?[A-Z]/.test(String(s?.type || ''))));
};

export const TOOL_BLOCKS = [
  { type: 'ToolHero', label: 'Tool Hero (title & card)', icon: 'bi-stars' },
  { type: 'ToolCalculator', label: 'Calculator', icon: 'bi-calculator' },
  { type: 'ToolsGrid', label: 'Tools Grid (hub, auto)', icon: 'bi-grid-3x3-gap' },
  { type: 'ToolContent', label: 'Text / How it works', icon: 'bi-file-text' },
  { type: 'ToolFaq', label: 'FAQ', icon: 'bi-question-circle' },
  { type: 'ToolForm', label: 'Enquiry Form (CRM lead)', icon: 'bi-ui-checks' },
  { type: 'ToolCta', label: 'Expert Help Strip', icon: 'bi-headset' },
  { type: 'ToolMore', label: 'More Free Tools (auto)', icon: 'bi-collection' },
  { type: 'ToolNote', label: 'Disclaimer Note', icon: 'bi-info-circle' },
];

const DEFAULT_NOTE = '💡 Results are estimates for guidance only and use simplified assumptions. For exact figures based on your full situation, please consult our experts.';

// ---- Calculator settings fields, per calculator -------------------------------------------
const T = (key, label, extra = {}) => ({ key, label, type: 'text', width: 'col-md-4', ...extra });
const SETTINGS_FIELDS = {
  'income-tax': [
    { key: 'itNote', type: 'note', label: 'Tax rules: change these after a Budget. Slabs are "up to" amounts in ascending order; leave "Up to" empty on the last slab (and above).' },
    T('yearLabel', 'Year shown with the result', { width: 'col-md-6' }),
    T('cess', 'Health & education cess (%)', { width: 'col-md-3' }),
    T('newSurchargeCap', 'New regime surcharge cap (%)', { width: 'col-md-3' }),
    T('defaultIncome', 'Starting income (₹)'), T('defaultDeductions', 'Starting deductions (₹)'),
    { key: 'newHead', type: 'note', label: 'New regime (section 115BAC)' },
    T('newStdDeduction', 'Standard deduction (₹)'), T('newRebateLimit', '87A: no tax up to taxable income (₹)'),
    { key: 'newSlabs', label: 'New regime slabs', type: 'list', addLabel: 'Add slab', fields: [{ key: 'upto', placeholder: 'Up to (₹, empty = above)', width: 'col-md-7' }, { key: 'rate', placeholder: 'Rate %', width: 'col-md-5' }] },
    { key: 'oldHead', type: 'note', label: 'Old regime' },
    T('oldStdDeduction', 'Standard deduction (₹)'), T('oldRebateLimit', '87A: taxable income up to (₹)'), T('oldRebateMax', '87A: rebate up to (₹)'),
    T('oldExemptBelow60', 'Basic exemption, below 60 (₹)'), T('oldExemptSenior', 'Basic exemption, 60–80 (₹)'), T('oldExemptSuperSenior', 'Basic exemption, 80+ (₹)'),
    { key: 'oldSlabs', label: 'Old regime slabs (after the basic exemption)', type: 'list', addLabel: 'Add slab', fields: [{ key: 'upto', placeholder: 'Up to (₹, empty = above)', width: 'col-md-7' }, { key: 'rate', placeholder: 'Rate %', width: 'col-md-5' }] },
    { key: 'surcharge', label: 'Surcharge (on income above, both regimes)', type: 'list', addLabel: 'Add level', fields: [{ key: 'above', placeholder: 'Income above (₹)', width: 'col-md-7' }, { key: 'rate', placeholder: 'Surcharge %', width: 'col-md-5' }] },
  ],
  gst: [
    T('defaultAmount', 'Starting amount (₹)'), T('defaultRate', 'Starting rate (%)'),
    { key: 'rates', label: 'GST rates offered', type: 'list', addLabel: 'Add rate', fields: [{ key: 'rate', placeholder: 'Rate % (e.g. 18)', width: 'col-12' }] },
  ],
  hsn: [
    { key: 'hsnNote', type: 'note', label: 'The list people search. Check the codes and rates before publishing; add as many as you like.' },
    { key: 'items', label: 'HSN / SAC codes', type: 'list', addLabel: 'Add code', fields: [{ key: 'code', placeholder: 'Code', width: 'col-md-3' }, { key: 'name', placeholder: 'Product / service', width: 'col-md-5' }, { key: 'rate', placeholder: 'GST rate (e.g. 18%)', width: 'col-md-4' }] },
    T('note', 'Note under the results', { width: 'col-12' }),
  ],
  hra: [
    T('defaultBasic', 'Starting basic + DA (₹)'), T('defaultHra', 'Starting HRA (₹)'), T('defaultRent', 'Starting rent (₹)'),
    T('metroPercent', 'Metro: % of basic'), T('nonMetroPercent', 'Non-metro: % of basic'), T('rentOverBasicPercent', 'Rent minus % of basic'),
    T('metroLabel', 'Metro option text', { width: 'col-12' }),
  ],
  sip: [T('defaultAmount', 'Starting monthly amount (₹)'), T('defaultRate', 'Starting return (%)'), T('defaultYears', 'Starting years')],
  gstin: [
    { key: 'states', label: 'State codes', type: 'list', addLabel: 'Add state code', fields: [{ key: 'code', placeholder: 'Code', width: 'col-md-3' }, { key: 'name', placeholder: 'State / UT', width: 'col-md-9' }] },
  ],
  emi: [T('defaultAmount', 'Starting loan (₹)'), T('defaultRate', 'Starting rate (%)'), T('defaultYears', 'Starting years'), T('maxYears', 'Longest tenure (years)')],
};

/**
 * Field schema per block, rendered by SchemaFields.jsx. ToolCalculator is a function of the
 * payload: its settings fields follow the chosen calculator.
 */
export const TOOL_SCHEMAS = {
  ToolHero: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'eyebrow', label: 'Small label above the title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'cardNote', type: 'note', label: 'Shown on the tools hub and in "More free tools": icon, title and the short tag. Order sorts the tools (1, 2, 3 …).' },
    { key: 'icon', label: 'Icon (emoji or image)', type: 'text', width: 'col-md-4' },
    { key: 'tag', label: 'Short tag (card)', type: 'text', width: 'col-md-5' },
    { key: 'order', label: 'Order', type: 'text', width: 'col-md-3' },
  ],
  ToolCalculator: (payload = {}) => [
    { key: 'calculator', label: 'Calculator', type: 'select', options: [{ value: '', label: '— choose a calculator —' }, ...CALCULATORS] },
    { key: 'heading', label: 'Heading above the calculator (optional)', type: 'text' },
    ...(SETTINGS_FIELDS[payload.calculator]
      ? [{ key: 'settings', label: 'Calculator settings', type: 'group', hint: 'Empty fields use the built-in values. Everything is calculated in the visitor\'s browser; nothing is stored.', fields: SETTINGS_FIELDS[payload.calculator] }]
      : [{ key: 'pick', type: 'note', label: 'Choose a calculator to see its settings.' }]),
  ],
  ToolsGrid: [
    { key: 'gridNote', type: 'note', label: 'Lists every published tool page (Calculator block) by itself, in their Order.' },
    { key: 'heading', label: 'Heading (optional)', type: 'text' },
  ],
  ToolContent: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'anchorId', label: 'Anchor id (optional, for #links)', type: 'text' },
    { key: 'text', label: 'Text', type: 'textarea', hint: 'A blank line starts a new paragraph; **double asterisks** make words bold.' },
    { key: 'points', label: 'Bullet points (optional)', type: 'list', addLabel: 'Add point', fields: [{ key: 'text', placeholder: 'Point', width: 'col-12' }] },
  ],
  ToolFaq: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'items', label: 'Questions', type: 'list', addLabel: 'Add question', fields: [{ key: 'question', placeholder: 'Question', width: 'col-12' }, { key: 'answer', placeholder: 'Answer', width: 'col-12', textarea: true }] },
  ],
  ToolForm: [
    { key: 'formId', label: 'CMS form', type: 'form', hint: 'Pick an active form from Forms; submissions land in CRM Leads.' },
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'sub', label: 'Text', type: 'text', width: 'col-12' },
  ],
  ToolCta: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'text', label: 'Text', type: 'text' },
    { key: 'button', label: 'Button', type: 'button' },
  ],
  ToolMore: [
    { key: 'moreNote', type: 'note', label: 'Lists the other published tools by itself.' },
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'limit', label: 'Show at most', type: 'text', placeholder: '5' },
  ],
  ToolNote: [{ key: 'text', label: 'Note', type: 'textarea' }],
};

/** Fields of a block (TOOL_SCHEMAS entries may depend on the payload). */
export const toolSchemaFor = (type, payload) => {
  const schema = TOOL_SCHEMAS[type];
  return typeof schema === 'function' ? schema(payload || {}) : schema;
};

const clone = (value) => JSON.parse(JSON.stringify(value ?? {}));

const SHARED = {
  ToolHero: { eyebrow: '🧰 Free Tool', title: '', description: '', icon: '🧮', tag: '', order: '' },
  ToolCalculator: { calculator: '', heading: '', settings: {} },
  ToolsGrid: { heading: '' },
  ToolContent: { heading: 'How this calculator works', anchorId: '', text: '', points: [] },
  ToolFaq: { heading: 'Frequently asked questions', items: [] },
  ToolForm: { formId: '', heading: 'Want an expert to check it?', sub: 'Share your details and our CA team will call you back.' },
  ToolCta: { title: 'Need expert help?', text: 'Our CA/CS team can handle the filing for you — accurately and on time.', button: { text: '🎧 Talk to an expert', url: '/talk-to-expert' } },
  ToolMore: { heading: 'More free tools', limit: '5' },
  ToolNote: { text: DEFAULT_NOTE },
};

/** Prefill for one block added to a page. */
export const toolDefaultPayload = (type) => clone(SHARED[type]);

const sectionsOf = (blocks) => {
  const stamp = Date.now();
  return blocks.map(([type, payload], index) => ({ id: `sec_${stamp}_${index}`, type, config: {}, data: { payload } }));
};

/** A tool page in reference order; with `tool` (a TOOL_REFERENCE entry) filled with its content and settings. */
export function toolPageSections(tool = null) {
  return sectionsOf([
    ['ToolHero', { ...clone(SHARED.ToolHero), ...(tool ? { title: tool.title, description: tool.description, icon: tool.icon, tag: tool.tag, order: tool.order } : {}) }],
    ['ToolCalculator', { ...clone(SHARED.ToolCalculator), ...(tool ? { calculator: tool.calculator, settings: clone(DEFAULT_SETTINGS[tool.calculator]) } : {}) }],
    ['ToolCta', clone(SHARED.ToolCta)],
    ['ToolContent', { ...clone(SHARED.ToolContent), text: tool?.howItWorks || '' }],
    ['ToolMore', clone(SHARED.ToolMore)],
    ['ToolNote', clone(SHARED.ToolNote)],
  ]);
}

/** The hub page (/tools): hero + grid of all tools. */
export const toolsHubSections = () => sectionsOf([
  ['ToolHero', { ...clone(SHARED.ToolHero), eyebrow: '🧰 Free Tools', title: TOOLS_HUB.title, description: TOOLS_HUB.description, icon: '🧰', tag: '', order: '' }],
  ['ToolsGrid', clone(SHARED.ToolsGrid)],
]);

/** Page data (title, slug, sections) for a reference tool, or the hub, ready for POST /pages. */
export const toolReferencePage = (tool, status = 'draft') => (tool === TOOLS_HUB
  ? { title: 'Free Tools & Calculators', slug: TOOLS_HUB_SLUG, content: '', status, metaTitle: 'Free Tax Tools & Calculators — Tax Alphonic', metaDescription: 'Free online calculators — Income Tax, GST, HRA, SIP, EMI, HSN code finder and GSTIN check. Quick, free, no signup.', sections: toolsHubSections() }
  : { title: tool.title, slug: `${TOOL_SLUG_PREFIX}${tool.key}`, content: '', status, metaTitle: `${tool.title} — Free Tool | Tax Alphonic`, metaDescription: tool.description, sections: toolPageSections(tool) });

export { TOOL_REFERENCE, TOOLS_HUB };

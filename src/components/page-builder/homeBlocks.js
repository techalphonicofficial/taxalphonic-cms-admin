// Home Page Builder: the homepage sections of the website, one block per section.
// The website renders them in components/tax-alphonic/home/HomeSections.jsx with the
// layout of uirefrence.html's home view; only the content comes from here. Block types
// must match that file's BLOCKS map. Default content lives in homeDefaults.js.
import { HOME_DEFAULT_SECTIONS } from './homeDefaults';
import { imageHint } from '../../config/imageSizes';

export const HOME_PAGE_SLUG = 'home';

export const HOME_BLOCKS = [
  { type: 'HomeHero', label: 'Hero', icon: 'bi-stars' },
  { type: 'HomeTrustBar', label: 'Trust Bar', icon: 'bi-patch-check' },
  { type: 'HomeStages', label: 'Journey Stages (Idea → Revenue)', icon: 'bi-signpost-split' },
  { type: 'HomeKnowledge', label: 'Latest Knowledge Strip', icon: 'bi-journal-text' },
  { type: 'HomeServices', label: 'Service Categories', icon: 'bi-grid' },
  { type: 'HomePlatform', label: 'Platform (More than filings)', icon: 'bi-diagram-3' },
  { type: 'HomePress', label: 'Press / As Featured In', icon: 'bi-newspaper' },
  { type: 'HomeJourney', label: 'Journey Infographic', icon: 'bi-bezier2' },
  { type: 'HomeClients', label: 'Our Clients', icon: 'bi-buildings' },
  { type: 'HomeHowItWorks', label: 'How It Works', icon: 'bi-list-ol' },
  { type: 'HomeTools', label: 'Free Tools', icon: 'bi-calculator' },
  { type: 'HomeBundles', label: 'Starter Bundles', icon: 'bi-box-seam' },
  { type: 'HomeWhyUs', label: 'Why Us', icon: 'bi-award' },
  { type: 'HomeComparison', label: 'Comparison Table', icon: 'bi-table' },
  { type: 'HomeIndustries', label: 'Industries', icon: 'bi-briefcase' },
  { type: 'HomeExpertCta', label: 'Expert Banner + Callback Form', icon: 'bi-headset' },
  { type: 'HomeTestimonials', label: 'Testimonials', icon: 'bi-chat-quote' },
  { type: 'HomeSecurity', label: 'Security / Trust', icon: 'bi-shield-check' },
  { type: 'HomeFaq', label: 'FAQ', icon: 'bi-question-circle' },
  { type: 'HomeNewsletter', label: 'Newsletter', icon: 'bi-envelope' },
  { type: 'HomeFinalCta', label: 'Final CTA', icon: 'bi-megaphone' },
  { type: 'HomeForm', label: 'Form', icon: 'bi-ui-checks' },
  // Fed by the CMS content modules
  { type: 'HomeBanners', label: 'Banners Slider', icon: 'bi-images' },
  { type: 'HomeTeam', label: 'Team Members', icon: 'bi-person-badge' },
  { type: 'HomeBranches', label: 'Branches / Offices', icon: 'bi-building' },
  { type: 'HomeGlobalPresence', label: 'Global Presence', icon: 'bi-globe' },
  { type: 'HomePortfolio', label: 'Portfolio', icon: 'bi-collection' },
];

// Where a home block sits. Like service pages: Main content blocks next to Right sidebar
// blocks share one two-column row (main left, sidebar right). With no sidebar block in the
// run, main content shows full width; "Always full width" never joins a row.
export const HOME_PLACEMENTS = [
  { value: 'main', label: 'Main content' },
  { value: 'sidebar', label: 'Right sidebar' },
  { value: 'full', label: 'Always full width' },
];

// Blocks whose position can be chosen, their allowed placements and default. Blocks not
// listed (hero, strips, sliders, wide banners) are always full width, show no option and
// end a two-column row.
// Keep in sync with PLACEMENT_RULES in the website's components/tax-alphonic/home/HomeSections.jsx.
const ANY = ['full', 'main', 'sidebar'];
const WIDE = ['full', 'main']; // multi-column grids and tables do not fit a sidebar
export const HOME_PLACEMENT_RULES = {
  HomeForm: { default: 'sidebar', options: ANY },
  HomeTestimonials: { default: 'main', options: ANY },
  HomeFaq: { default: 'main', options: ANY },
  HomeWhyUs: { default: 'main', options: ANY },
  HomeSecurity: { default: 'main', options: ANY },
  HomeTools: { default: 'main', options: ANY },
  HomeTeam: { default: 'main', options: ANY },
  HomeBranches: { default: 'main', options: ANY },
  HomeGlobalPresence: { default: 'main', options: ANY },
  HomeServices: { default: 'main', options: WIDE },
  HomePlatform: { default: 'main', options: WIDE },
  HomeJourney: { default: 'main', options: WIDE },
  HomeHowItWorks: { default: 'main', options: WIDE },
  HomeBundles: { default: 'main', options: WIDE },
  HomeComparison: { default: 'main', options: WIDE },
  HomeIndustries: { default: 'main', options: WIDE },
  HomePortfolio: { default: 'main', options: WIDE },
};

// Blocks that read a CMS module, with the admin page that manages it.
const MODULES = {
  testimonials: { label: 'Testimonials', to: '/cms/testimonials' },
  faqs: { label: 'FAQs', to: '/cms/faqs' },
  partners: { label: 'Partners & Clients', to: '/cms/partners' },
  team: { label: 'Team Members', to: '/cms/team' },
  banners: { label: 'Banners', to: '/cms/banners' },
  branches: { label: 'Branches', to: '/cms/branches' },
  countries: { label: 'Global Presence', to: '/cms/countries' },
  portfolio: { label: 'Portfolio items', to: '/portfolio-items' },
};

const fromModule = (data) => data.source !== 'manual';

// "Content: from module / manual" switch for blocks that also accept hand-written items.
const sourceFields = (moduleKey) => {
  const m = MODULES[moduleKey];
  return [
    {
      key: 'source', label: 'Content', type: 'select',
      options: [{ value: 'cms', label: `From ${m.label} (CMS)` }, { value: 'manual', label: 'Write manually below' }],
      hint: `With "${m.label}", nothing to type here: add or edit records in that module.`,
    },
    { key: 'limit', label: 'Show at most (empty = all)', type: 'text', showIf: fromModule },
    { key: 'sourceNote', type: 'note', label: `Shows published ${m.label} in their display order. If none are published, the manual items below are shown instead.`, link: { to: m.to, text: `Manage ${m.label}` }, showIf: fromModule },
  ];
};

// Module-only blocks: always read the module.
const moduleNote = (moduleKey, extra = '') => {
  const m = MODULES[moduleKey];
  return { key: 'moduleNote', type: 'note', label: `Shows published ${m.label} in their display order.${extra} The block hides itself when there are none.`, link: { to: m.to, text: `Manage ${m.label}` } };
};

const ICON = { key: 'icon', placeholder: 'Icon (emoji or 96×96 image URL)', width: 'col-md-3' };
const URL = { key: 'url', placeholder: 'Link (/category/gst, #home-services, https://…)', width: 'col-md-5' };
const HEADING = { key: 'heading', label: 'Heading', type: 'text' };
const SUB = { key: 'sub', label: 'Sub heading', type: 'text' };
const EYEBROW = { key: 'eyebrow', label: 'Eyebrow (small pill above heading)', type: 'text' };
const FORM = { key: 'formId', label: 'CMS form', type: 'form', hint: 'Pick an active form from Forms. Empty = no form.' };

/**
 * Field schema per block, rendered by SchemaFields.jsx.
 * Types: text, textarea, select, button ({text,url}), list (repeater of `fields`), group (nested object), form (CMS form picker), portfolioCategory (portfolio category picker).
 * List fields: { key, placeholder, width?, textarea?, type: 'checkbox' | 'color' }.
 */
export const HOME_SCHEMAS = {
  HomeHero: [
    { ...EYEBROW, width: 'col-12' },
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'highlight', label: 'Highlighted words (gradient, after the heading)', type: 'text' },
    { key: 'subHeading', label: 'Sub heading', type: 'textarea', width: 'col-12' },
    {
      key: 'statCards', label: 'Stat cards', type: 'list', addLabel: 'Add card',
      fields: [{ key: 'value', placeholder: 'Value (622+)', width: 'col-md-3' }, { key: 'label', placeholder: 'Label', width: 'col-md-4' }, URL],
    },
    { key: 'primaryButton', label: 'Primary button', type: 'button' },
    { key: 'secondaryButton', label: 'Secondary button', type: 'button' },
    { key: 'searchPlaceholder', label: 'Search placeholder', type: 'text', hint: 'Empty placeholder and no search items = search box hidden.' },
    { key: 'searchButtonText', label: 'Search button text', type: 'text' },
    { key: 'searchEmptyText', label: '"No results" text', type: 'text' },
    {
      key: 'searchItems', label: 'Search suggestions', type: 'list', addLabel: 'Add suggestion',
      fields: [
        { key: 'icon', placeholder: 'Icon', width: 'col-md-2' },
        { key: 'label', placeholder: 'Title', width: 'col-md-6' },
        { key: 'desc', placeholder: 'Category tag', width: 'col-md-4' },
        { key: 'url', placeholder: 'Link', width: 'col-12' },
      ],
    },
    {
      key: 'metrics', label: 'Metrics row (gradient numbers under the buttons)', type: 'list', addLabel: 'Add metric',
      fields: [{ key: 'value', placeholder: 'Value', width: 'col-md-4' }, { key: 'label', placeholder: 'Label', width: 'col-md-8' }],
    },
    {
      key: 'heroImage', label: 'Right side image (optional)', type: 'image',
      hint: `When set, this image shows instead of the dashboard visual below. ${imageHint('heroImage')}`,
    },
    { key: 'heroImageAlt', label: 'Image alt text', type: 'text', showIf: (d) => Boolean(String(d.heroImage || '').trim()) },
    {
      key: 'visualSize', label: 'Right side size (image or dashboard)', type: 'select',
      options: [
        { value: 'lg', label: 'Large (default)' },
        { value: 'xl', label: 'Extra large' },
        { value: 'md', label: 'Medium' },
        { value: 'sm', label: 'Small' },
      ],
    },
    {
      key: 'dashboard', label: 'Dashboard visual (right side, when there is no image)', type: 'group',
      hint: 'Leave value, bars and chips empty (and no image) to hide the visual; the text then uses the full width.',
      fields: [
        { key: 'brand', label: 'Brand', type: 'text' },
        { key: 'label', label: 'Corner label', type: 'text' },
        { key: 'value', label: 'Big value', type: 'text' },
        { key: 'caption', label: 'Caption', type: 'text' },
        {
          key: 'bars', label: 'Progress bars (up to 3)', type: 'list', addLabel: 'Add bar',
          fields: [{ key: 'label', placeholder: 'Label', width: 'col-md-8' }, { key: 'percent', placeholder: 'Fill % (0-100)', width: 'col-md-4' }],
        },
        { key: 'rating', label: 'Rating (e.g. ★ 4.8)', type: 'text' },
        { key: 'ratingText', label: 'Rating text', type: 'text' },
        {
          key: 'chips', label: 'Floating chips (up to 6, two short lines each)', type: 'list', addLabel: 'Add chip',
          fields: [{ key: 'icon', placeholder: 'Icon', width: 'col-md-2' }, { key: 'title', placeholder: 'Line 1', width: 'col-md-5' }, { key: 'subtitle', placeholder: 'Line 2', width: 'col-md-5' }],
        },
      ],
    },
  ],
  HomeTrustBar: [
    { key: 'items', label: 'Trust points', type: 'list', addLabel: 'Add point', fields: [{ key: 'icon', placeholder: 'Icon', width: 'col-md-3' }, { key: 'text', placeholder: 'Text', width: 'col-md-9' }] },
  ],
  HomeStages: [
    EYEBROW,
    { key: 'linkText', label: 'Card hover link text', type: 'text', placeholder: 'See full process →' },
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'highlight', label: 'Highlighted words (after the heading)', type: 'text' },
    { key: 'text', label: 'Text', type: 'textarea', width: 'col-12', hint: 'Wrap words in **double asterisks** to make them bold.' },
    { key: 'stats', label: 'Head stats', type: 'list', addLabel: 'Add stat', fields: [{ key: 'value', placeholder: 'Value', width: 'col-md-5' }, { key: 'label', placeholder: 'Label', width: 'col-md-7' }] },
    {
      key: 'items', label: 'Stages (numbered 01/N automatically)', type: 'list', addLabel: 'Add stage',
      fields: [
        { key: 'icon', placeholder: 'Icon', width: 'col-md-2' },
        { key: 'title', placeholder: 'Title', width: 'col-md-5' },
        { key: 'tag', placeholder: 'Tag (Start here)', width: 'col-md-3' },
        { key: 'color', placeholder: 'Accent', type: 'color', width: 'col-md-2' },
        { key: 'text', placeholder: 'Text', width: 'col-12' },
        { key: 'step', placeholder: 'Hover step (✓ …)', width: 'col-md-7' },
        { key: 'url', placeholder: 'Link', width: 'col-md-5' },
      ],
    },
    { key: 'ctaTitle', label: 'Bottom band title', type: 'text' },
    { key: 'ctaText', label: 'Bottom band text', type: 'text' },
    { key: 'primaryButton', label: 'Bottom band primary button', type: 'button' },
    { key: 'secondaryButton', label: 'Bottom band secondary button', type: 'button' },
  ],
  HomeKnowledge: [
    { key: 'icon', label: 'Label icon', type: 'text', width: 'col-md-2' },
    { key: 'title', label: 'Label', type: 'text', width: 'col-md-6' },
    { key: 'badge', label: 'Badge (e.g. LIVE)', type: 'text', width: 'col-md-4' },
    { key: 'items', label: 'Chips', type: 'list', addLabel: 'Add chip', fields: [{ key: 'icon', placeholder: 'Icon', width: 'col-md-2' }, { key: 'label', placeholder: 'Label', width: 'col-md-4' }, { ...URL, width: 'col-md-6' }] },
    { key: 'moreLink', label: 'Last chip (highlighted link)', type: 'button' },
  ],
  HomeServices: [
    HEADING, SUB,
    { key: 'anchorId', label: 'Anchor ID (for #links)', type: 'text', hint: 'The hero "Explore services" button scrolls to #home-services.' },
    {
      key: 'items', label: 'Categories', type: 'list', addLabel: 'Add category',
      fields: [ICON, { key: 'title', placeholder: 'Title', width: 'col-md-4' }, URL, { key: 'text', placeholder: 'Text', width: 'col-md-8' }, { key: 'countText', placeholder: 'Link text (20 services →)', width: 'col-md-4' }],
    },
  ],
  HomePlatform: [
    HEADING, SUB,
    {
      key: 'items', label: 'Cards', type: 'list', addLabel: 'Add card',
      fields: [ICON, { key: 'title', placeholder: 'Title', width: 'col-md-4' }, URL, { key: 'text', placeholder: 'Text', width: 'col-md-8' }, { key: 'linkText', placeholder: 'Link text (48 pages →)', width: 'col-md-4' }],
    },
  ],
  HomePress: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'link', label: 'Bottom link', type: 'button' },
    {
      key: 'items', label: 'Outlets', type: 'list', addLabel: 'Add outlet', hint: `Logo image: ${imageHint('pressLogo')}`,
      fields: [{ key: 'name', placeholder: 'Name', width: 'col-md-4' }, { key: 'color', placeholder: 'Hover colour', type: 'color', width: 'col-md-2' }, { key: 'url', placeholder: 'Link', width: 'col-md-6' }, { key: 'image', placeholder: 'Logo image URL (optional, replaces the name)', width: 'col-12' }],
    },
  ],
  HomeJourney: [
    HEADING, SUB,
    {
      key: 'items', label: 'Stages', type: 'list', addLabel: 'Add stage',
      fields: [{ key: 'icon', placeholder: 'Icon', width: 'col-md-2' }, { key: 'title', placeholder: 'Title', width: 'col-md-4' }, { key: 'color', placeholder: 'Orb colour', type: 'color', width: 'col-md-2' }, { key: 'url', placeholder: 'Link', width: 'col-md-4' }, { key: 'text', placeholder: 'Text', width: 'col-12' }],
    },
  ],
  HomeClients: [
    EYEBROW, HEADING,
    { key: 'sub', label: 'Sub heading', type: 'textarea', width: 'col-12' },
    ...sourceFields('partners'),
    { key: 'items', label: 'Manual clients', type: 'list', addLabel: 'Add client', hint: `Logo image: ${imageHint('clientLogo')}`, fields: [{ key: 'logo', placeholder: 'Logo (emoji or image URL)', width: 'col-md-4' }, { key: 'name', placeholder: 'Name', width: 'col-md-4' }, { key: 'url', placeholder: 'Website (optional)', width: 'col-md-4' }] },
    { key: 'note', label: 'Note under the logos', type: 'text', width: 'col-12' },
  ],
  HomeHowItWorks: [
    EYEBROW, HEADING,
    { key: 'sub', label: 'Sub heading', type: 'text', width: 'col-12' },
    {
      key: 'items', label: 'Steps (numbered automatically)', type: 'list', addLabel: 'Add step',
      fields: [ICON, { key: 'title', placeholder: 'Title', width: 'col-md-5' }, { key: 'tag', placeholder: 'Tag (Day 1)', width: 'col-md-4' }, { key: 'text', placeholder: 'Text', width: 'col-md-7' }, { key: 'url', placeholder: 'Link', width: 'col-md-5' }],
    },
    { key: 'button', label: 'Button', type: 'button' },
  ],
  HomeTools: [
    HEADING, SUB,
    { key: 'items', label: 'Tools', type: 'list', addLabel: 'Add tool', fields: [ICON, { key: 'title', placeholder: 'Title', width: 'col-md-4' }, URL, { key: 'text', placeholder: 'Short text', width: 'col-12' }] },
    { key: 'button', label: 'Button', type: 'button' },
  ],
  HomeBundles: [
    HEADING, SUB,
    {
      key: 'items', label: 'Bundles', type: 'list', addLabel: 'Add bundle',
      fields: [
        { key: 'tag', placeholder: 'Tag (🚀 For new founders)', width: 'col-md-5' },
        { key: 'title', placeholder: 'Title', width: 'col-md-4' },
        { key: 'featured', placeholder: 'Highlight', type: 'checkbox', width: 'col-md-3' },
        { key: 'text', placeholder: 'Text', width: 'col-12' },
        { key: 'price', placeholder: 'Price (₹11,999)', width: 'col-md-3' },
        { key: 'priceNote', placeholder: 'Price note (+ govt fee)', width: 'col-md-3' },
        { key: 'linkText', placeholder: 'Link text (Get started →)', width: 'col-md-3' },
        { key: 'url', placeholder: 'Link', width: 'col-md-3' },
      ],
    },
  ],
  HomeWhyUs: [
    HEADING, SUB,
    { key: 'items', label: 'Reasons', type: 'list', addLabel: 'Add reason', fields: [ICON, { key: 'title', placeholder: 'Title', width: 'col-md-9' }, { key: 'text', placeholder: 'Text', width: 'col-12' }] },
  ],
  HomeComparison: [
    HEADING, SUB,
    { key: 'labelHeader', label: 'Column 1 header', type: 'text', width: 'col-md-3' },
    { key: 'oursHeader', label: 'Column 2 header (highlighted)', type: 'text', width: 'col-md-3' },
    { key: 'col2Header', label: 'Column 3 header', type: 'text', width: 'col-md-3' },
    { key: 'col3Header', label: 'Column 4 header', type: 'text', width: 'col-md-3' },
    {
      key: 'rows', label: 'Rows', type: 'list', addLabel: 'Add row',
      fields: [{ key: 'label', placeholder: 'Feature', width: 'col-md-3' }, { key: 'ours', placeholder: 'Us (✅ Upfront)', width: 'col-md-3' }, { key: 'col2', placeholder: 'Column 3', width: 'col-md-3' }, { key: 'col3', placeholder: 'Column 4', width: 'col-md-3' }],
    },
  ],
  HomeIndustries: [
    HEADING, SUB,
    { key: 'linkText', label: 'Card link text', type: 'text', placeholder: 'View details →' },
    { key: 'items', label: 'Industries', type: 'list', addLabel: 'Add industry', fields: [ICON, { key: 'title', placeholder: 'Title', width: 'col-md-4' }, URL] },
  ],
  HomeExpertCta: [
    EYEBROW,
    { key: 'anchorId', label: 'Anchor ID (for #links)', type: 'text' },
    { key: 'heading', label: 'Heading', type: 'text', width: 'col-12' },
    { key: 'text', label: 'Text', type: 'textarea', width: 'col-12' },
    { key: 'primaryButton', label: 'Primary button (white)', type: 'button' },
    { key: 'secondaryButton', label: 'Secondary link (e.g. WhatsApp: https://wa.me/91…)', type: 'button' },
    { key: 'formTitle', label: 'Form title', type: 'text' },
    FORM,
    { key: 'formNote', label: 'Note under the form', type: 'text', width: 'col-12' },
  ],
  HomeTestimonials: [
    HEADING, SUB,
    ...sourceFields('testimonials'),
    {
      key: 'items', label: 'Manual reviews', type: 'list', addLabel: 'Add review',
      fields: [{ key: 'quote', placeholder: 'Quote', textarea: true, width: 'col-12' }, { key: 'name', placeholder: 'Name (initials are made from it)', width: 'col-md-5' }, { key: 'role', placeholder: 'Role, city', width: 'col-md-5' }, { key: 'rating', placeholder: 'Stars (1-5)', width: 'col-md-2' }],
    },
  ],
  HomeSecurity: [
    HEADING, SUB,
    { key: 'items', label: 'Cards', type: 'list', addLabel: 'Add card', fields: [ICON, { key: 'title', placeholder: 'Title', width: 'col-md-9' }, { key: 'text', placeholder: 'Text', width: 'col-12' }] },
  ],
  HomeFaq: [
    HEADING, SUB,
    ...sourceFields('faqs'),
    { key: 'category', label: 'Only this FAQ category (empty = all)', type: 'text', placeholder: 'e.g. Digital Marketing', hint: 'Must match the category name used in FAQs exactly.', showIf: fromModule },
    { key: 'items', label: 'Manual questions (the first one starts open)', type: 'list', addLabel: 'Add question', fields: [{ key: 'question', placeholder: 'Question', width: 'col-12' }, { key: 'answer', placeholder: 'Answer', textarea: true, width: 'col-12' }] },
  ],
  HomeNewsletter: [
    HEADING,
    { key: 'text', label: 'Text', type: 'textarea', width: 'col-12' },
    { ...FORM, hint: 'Pick a form (e.g. an email-only form) to collect sign-ups. Without a form the email box is decorative.' },
    { key: 'placeholder', label: 'Email placeholder (no form)', type: 'text' },
    { key: 'buttonText', label: 'Button text (no form)', type: 'text', hint: 'Empty = no email box.' },
  ],
  HomeFinalCta: [HEADING, { key: 'text', label: 'Text', type: 'text' }, { key: 'button', label: 'Button', type: 'button' }],
  HomeForm: [
    { ...FORM, label: 'Form', width: 'col-md-6', hint: 'Pick an active form from Forms. The block is hidden until a form is chosen. Submissions go to Leads.' },
    { key: 'anchorId', label: 'Anchor ID (for #links)', type: 'text', placeholder: 'e.g. enquiry', hint: 'Buttons can link to #enquiry to scroll here.' },
    EYEBROW, HEADING,
    { key: 'sub', label: 'Sub heading', type: 'text', width: 'col-12' },
    { key: 'note', label: 'Note under the form', type: 'text', width: 'col-12' },
    { key: 'formNote', type: 'note', label: 'Like on service pages, the form sits in the right sidebar, and the Main content blocks just before and after it (FAQ, Testimonials, Why us, ...) fill the left column. Hero-type blocks, and blocks set to Always full width, end that row.' },
  ],
  HomeBanners: [
    moduleNote('banners', ' Only banners inside their start/end dates are shown; each uses its own image, text, button and alignment.'),
    { key: 'heading', label: 'Heading above the slider (optional)', type: 'text' },
    { key: 'sub', label: 'Sub heading (optional)', type: 'text' },
    { key: 'limit', label: 'Show at most (empty = all)', type: 'text' },
    { key: 'interval', label: 'Seconds per slide', type: 'text', placeholder: '6' },
  ],
  HomeTeam: [
    moduleNote('team'),
    EYEBROW, HEADING,
    { key: 'sub', label: 'Sub heading', type: 'text', width: 'col-12' },
    { key: 'limit', label: 'Show at most (empty = all)', type: 'text' },
    { key: 'showBio', label: 'Bio', type: 'select', options: [{ value: 'show', label: 'Show bio' }, { value: 'hide', label: 'Hide bio' }] },
  ],
  HomeBranches: [
    moduleNote('branches', ' Only active branches.'),
    EYEBROW, HEADING,
    { key: 'sub', label: 'Sub heading', type: 'text', width: 'col-12' },
    { key: 'headOfficeLabel', label: 'Head office badge', type: 'text', placeholder: 'Head office', hint: 'Empty = no badge.' },
    { key: 'limit', label: 'Show at most (empty = all)', type: 'text' },
  ],
  HomePortfolio: [
    { key: 'show', label: 'Show this section on the website', type: 'select', options: [{ value: 'show', label: 'Show' }, { value: 'hide', label: 'Hide' }], hint: 'Hide keeps the section and its settings here but takes it off the homepage.' },
    moduleNote('portfolio', ' Only published items with an image.'),
    EYEBROW, HEADING,
    { key: 'sub', label: 'Sub heading', type: 'text', width: 'col-12' },
    { key: 'categoryId', label: 'Only this category (empty = all)', type: 'portfolioCategory', hint: 'A main category includes its sub-categories.' },
    { key: 'tabs', label: 'Category tabs', type: 'select', options: [{ value: 'show', label: 'Show tabs (filter by category)' }, { value: 'hide', label: 'No tabs' }] },
    { key: 'imageFit', label: 'Images', type: 'select', options: [{ value: 'cover', label: 'Fill the card (may crop the edges)' }, { value: 'contain', label: 'Show the whole image (best for logos)' }] },
    { key: 'limit', label: 'Items shown at first', type: 'text', placeholder: '8', hint: '"Show more" reveals the same number again.' },
    { key: 'allLabel', label: '"All" tab text', type: 'text', placeholder: 'All work' },
    { key: 'moreLabel', label: 'Show more button text', type: 'text', placeholder: 'Show more' },
    { key: 'button', label: 'Extra button (optional)', type: 'button' },
  ],
  HomeGlobalPresence: [
    moduleNote('countries', ' Only active countries, with their flags.'),
    EYEBROW, HEADING,
    { key: 'sub', label: 'Sub heading', type: 'text', width: 'col-12' },
    { key: 'limit', label: 'Show at most (empty = all)', type: 'text' },
  ],
};

// Prefill for blocks that are not part of the default layout.
const EXTRA_DEFAULTS = {
  HomeForm: { formId: '', anchorId: 'enquiry', eyebrow: '📝 Free consultation', heading: 'Tell us what you need', sub: 'Share a few details and an expert will call you back within one working day.', note: '🔒 Your details are safe. We never spam.' },
  HomeBanners: { interval: '6' },
  HomeTeam: { eyebrow: '👥 Our team', heading: 'Meet the experts behind your business', sub: 'Qualified professionals who handle your work end to end.', showBio: 'show' },
  HomeBranches: { eyebrow: '📍 Our offices', heading: 'Find us near you', sub: 'Visit or call any of our branches.', headOfficeLabel: 'Head office' },
  HomeGlobalPresence: { eyebrow: '🌍 Global presence', heading: 'Serving businesses across the world', sub: 'Countries where we support clients today.' },
  HomePortfolio: { show: 'show', eyebrow: '🎨 Our work', heading: 'Projects we are proud of', sub: 'Websites, brands and campaigns we have delivered for our clients.', categoryId: '', tabs: 'show', limit: '8', allLabel: 'All work', moreLabel: 'Show more', anchorId: 'portfolio' },
};

const DEFAULTS_BY_TYPE = { ...EXTRA_DEFAULTS, ...Object.fromEntries(HOME_DEFAULT_SECTIONS.map(s => [s.type, s.payload])) };

const clone = (value) => JSON.parse(JSON.stringify(value ?? {}));

export const homeDefaultPayload = (type) => clone(DEFAULTS_BY_TYPE[type]);

// The full default homepage as Page Builder sections, in website order.
export const defaultHomeSections = () => HOME_DEFAULT_SECTIONS.map((section, index) => ({
  id: `sec_${Date.now()}_${index}`,
  type: section.type,
  config: {},
  data: { payload: clone(section.payload) },
}));

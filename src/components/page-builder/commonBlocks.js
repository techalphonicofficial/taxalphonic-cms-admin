// General-purpose blocks, available in every Page Builder (homepage, service pages, CMS pages,
// blogs, journey stages, tools). The website renders them with
// components/tax-alphonic/blocks/CommonBlocks.jsx (types in commonBlockTypes.js: keep in sync).
import { imageHint } from '../../config/imageSizes';
import { CALCULATORS } from '../../site-preview/website/components/tax-alphonic/tools/toolDefaults';

export const COMMON_BLOCKS = [
  { type: 'CommonText', label: 'Text & Heading', icon: 'bi-text-paragraph' },
  { type: 'CommonImageText', label: 'Image + Text', icon: 'bi-layout-split' },
  { type: 'CommonImage', label: 'Image', icon: 'bi-image' },
  { type: 'CommonVideo', label: 'Video (YouTube / Vimeo / MP4)', icon: 'bi-play-btn' },
  { type: 'CommonGallery', label: 'Photo Gallery', icon: 'bi-images' },
  { type: 'CommonStats', label: 'Numbers / Stats', icon: 'bi-bar-chart' },
  { type: 'CommonCards', label: 'Cards Grid', icon: 'bi-grid-3x2-gap' },
  { type: 'CommonLogos', label: 'Logo Strip', icon: 'bi-award' },
  { type: 'CommonButtons', label: 'Buttons', icon: 'bi-hand-index' },
  { type: 'CommonSpacer', label: 'Spacer / Divider', icon: 'bi-distribute-vertical' },
  { type: 'CommonEmbed', label: 'Map / Embed', icon: 'bi-geo-alt' },
  { type: 'CommonTool', label: 'Free Tool / Calculator', icon: 'bi-calculator' },
];

export const isCommonType = (type) => COMMON_BLOCKS.some(b => b.type === type);

const KICKER = { key: 'kicker', label: 'Small label above the heading', type: 'text' };
const HEADING = { key: 'heading', label: 'Heading', type: 'text' };
const SUB = { key: 'sub', label: 'Sub text', type: 'text', width: 'col-12' };
const ANCHOR = { key: 'anchorId', label: 'Anchor id (optional, for #links)', type: 'text' };
const TEXT = { key: 'text', label: 'Text', type: 'textarea', hint: 'A blank line starts a new paragraph; **double asterisks** make words bold.' };
const ALIGN = { key: 'align', label: 'Alignment', type: 'select', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }] };
const COLUMNS = (fallback) => ({ key: 'columns', label: 'Columns (desktop)', type: 'select', options: ['1', '2', '3', '4', '5', '6'].map(v => ({ value: v, label: v })).map(o => (o.value === fallback ? { ...o, label: `${o.label} (default)` } : o)) });

/** Field schema per block, rendered by SchemaFields.jsx. */
export const COMMON_SCHEMAS = {
  CommonText: [KICKER, HEADING, TEXT, ALIGN, ANCHOR, { key: 'primaryButton', label: 'Primary button', type: 'button' }, { key: 'secondaryButton', label: 'Secondary button', type: 'button' }],
  CommonImageText: [
    { key: 'image', label: 'Image', type: 'image', hint: imageHint('blockImage') },
    { key: 'imageSide', label: 'Image side', type: 'select', options: [{ value: 'left', label: 'Image on the left' }, { value: 'right', label: 'Image on the right' }] },
    { key: 'imageAlt', label: 'Image description (alt text)', type: 'text' },
    KICKER, HEADING, TEXT,
    { key: 'points', label: 'Tick points (optional)', type: 'list', addLabel: 'Add point', fields: [{ key: 'text', placeholder: 'Point', width: 'col-12' }] },
    { key: 'primaryButton', label: 'Primary button', type: 'button' },
    { key: 'secondaryButton', label: 'Secondary button', type: 'button' },
    ANCHOR,
  ],
  CommonImage: [
    { key: 'image', label: 'Image', type: 'image', hint: imageHint('blockImage') },
    { key: 'alt', label: 'Image description (alt text)', type: 'text' },
    { key: 'size', label: 'Width', type: 'select', options: [{ value: 'wide', label: 'Wide (1000px)' }, { value: 'full', label: 'Full width' }, { value: 'medium', label: 'Medium (720px)' }, { value: 'small', label: 'Small (420px)' }] },
    { key: 'caption', label: 'Caption', type: 'text' },
    { key: 'link', label: 'Link when clicked (optional)', type: 'text' },
    ANCHOR,
  ],
  CommonVideo: [
    { key: 'url', label: 'Video link', type: 'text', width: 'col-12', hint: 'A YouTube or Vimeo link, or a video file (.mp4) from Media.', media: true },
    KICKER, HEADING, SUB,
    { key: 'caption', label: 'Caption under the video', type: 'text' },
    { key: 'poster', label: 'Cover image (MP4 only, optional)', type: 'image' },
    ANCHOR,
  ],
  CommonGallery: [
    KICKER, HEADING, SUB, COLUMNS('3'),
    { key: 'items', label: 'Photos (click opens them large)', type: 'list', addLabel: 'Add photo', hint: imageHint('galleryImage'), fields: [{ key: 'image', placeholder: 'Photo', width: 'col-md-6' }, { key: 'caption', placeholder: 'Caption (optional)', width: 'col-md-6' }] },
    ANCHOR,
  ],
  CommonStats: [
    KICKER, HEADING, SUB, COLUMNS('4'),
    { key: 'items', label: 'Numbers', type: 'list', addLabel: 'Add number', fields: [{ key: 'icon', placeholder: 'Icon (optional)', width: 'col-md-2' }, { key: 'value', placeholder: 'Value (12,400+)', width: 'col-md-4' }, { key: 'label', placeholder: 'Label', width: 'col-md-6' }] },
    ANCHOR,
  ],
  CommonCards: [
    KICKER, HEADING, SUB, ALIGN, COLUMNS('3'),
    { key: 'style', label: 'Card style', type: 'select', options: [{ value: 'card', label: 'Cards with border' }, { value: 'plain', label: 'Plain (no box)' }] },
    { key: 'items', label: 'Cards', type: 'list', addLabel: 'Add card', fields: [{ key: 'icon', placeholder: 'Icon / image', width: 'col-md-3' }, { key: 'title', placeholder: 'Title', width: 'col-md-4' }, { key: 'url', placeholder: 'Link (optional)', width: 'col-md-5' }, { key: 'text', placeholder: 'Text', width: 'col-md-8', textarea: true }, { key: 'linkText', placeholder: 'Link text (Learn more →)', width: 'col-md-4' }] },
    ANCHOR,
  ],
  CommonLogos: [
    KICKER, HEADING,
    { key: 'grayscale', label: 'Logos in grey (colour on hover)', type: 'select', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No, always in colour' }] },
    { key: 'items', label: 'Logos', type: 'list', addLabel: 'Add logo', hint: imageHint('clientLogo'), fields: [{ key: 'image', placeholder: 'Logo', width: 'col-md-5' }, { key: 'name', placeholder: 'Name', width: 'col-md-3' }, { key: 'url', placeholder: 'Link (optional)', width: 'col-md-4' }] },
    ANCHOR,
  ],
  CommonButtons: [
    KICKER, HEADING,
    { key: 'align', label: 'Alignment', type: 'select', options: [{ value: 'center', label: 'Centre' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
    { key: 'buttons', label: 'Buttons', type: 'list', addLabel: 'Add button', fields: [{ key: 'text', placeholder: 'Text', width: 'col-md-4' }, { key: 'url', placeholder: 'Link', width: 'col-md-5' }, { key: 'style', placeholder: 'primary / ghost', width: 'col-md-3' }] },
    ANCHOR,
  ],
  CommonSpacer: [
    { key: 'size', label: 'Space', type: 'select', options: [{ value: 'md', label: 'Medium (40px)' }, { value: 'sm', label: 'Small (16px)' }, { value: 'lg', label: 'Large (72px)' }, { value: 'xl', label: 'Extra large (120px)' }] },
    { key: 'line', label: 'Divider line', type: 'select', options: [{ value: 'no', label: 'No line' }, { value: 'yes', label: 'Show a line' }] },
  ],
  CommonEmbed: [
    { key: 'kind', label: 'What to embed', type: 'select', options: [{ value: 'map', label: 'Google Map / any https page (link)' }, { value: 'html', label: 'Embed code (HTML)' }] },
    { key: 'url', label: 'Embed link (https://…)', type: 'text', width: 'col-12', hint: 'Google Maps: Share → Embed a map → copy the link inside src="…".', showIf: (d) => d.kind !== 'html' },
    { key: 'html', label: 'Embed code', type: 'textarea', hint: 'Scripts and event handlers are removed for safety; iframes and plain HTML work.', showIf: (d) => d.kind === 'html' },
    { key: 'height', label: 'Height (px)', type: 'text', placeholder: '420', showIf: (d) => d.kind !== 'html' },
    KICKER, HEADING,
    { key: 'caption', label: 'Caption', type: 'text' },
    ANCHOR,
  ],
  // A free tool's calculator on this page (website CommonBlocks.jsx Tool). Where it sits: the
  // block's Placement (Main content, Right sidebar, Top / Bottom full width; homepage: column / full width).
  CommonTool: [
    { key: 'source', label: 'Calculator from', type: 'select', options: [{ value: 'page', label: 'A published tool page (its settings)' }, { value: 'calculator', label: 'A calculator type (default settings)' }] },
    { key: 'toolSlug', label: 'Tool page', type: 'toolPage', hint: "Uses that page's calculator and settings (slabs, rates, defaults); edits there show here too.", showIf: (d) => d.source !== 'calculator' },
    { key: 'calculator', label: 'Calculator', type: 'select', options: CALCULATORS, hint: 'Default settings (website toolDefaults.js). For your own rates, build a tool page and pick it instead.', showIf: (d) => d.source === 'calculator' },
    KICKER, HEADING, SUB,
    { key: 'button', label: 'Button under the calculator (optional)', type: 'button', width: 'col-12' },
    ANCHOR,
    { key: 'placementNote', type: 'note', label: "Where it shows: use this block's Placement setting (Main content, Right sidebar, or full width above / below). In the right sidebar the calculator stacks into one column." },
  ],
};

// Starting content, so a new block shows something sensible straight away.
const DEFAULTS = {
  CommonText: { kicker: '', heading: 'Your heading here', text: 'Write a short paragraph here. A blank line starts a new paragraph, and **double asterisks** make words bold.', align: 'left', anchorId: '', primaryButton: { text: '', url: '' }, secondaryButton: { text: '', url: '' } },
  CommonImageText: { image: '', imageSide: 'left', imageAlt: '', kicker: 'Why choose us', heading: 'A heading next to your image', text: 'Explain the picture in a few lines.', points: [{ text: 'First benefit' }, { text: 'Second benefit' }], primaryButton: { text: '🎧 Talk to an expert', url: '/talk-to-expert' }, secondaryButton: { text: '', url: '' }, anchorId: '' },
  CommonImage: { image: '', alt: '', size: 'wide', caption: '', link: '', anchorId: '' },
  CommonVideo: { url: '', kicker: '', heading: '', sub: '', caption: '', poster: '', anchorId: '' },
  CommonGallery: { kicker: '', heading: 'Gallery', sub: '', columns: '3', items: [], anchorId: '' },
  CommonStats: { kicker: '', heading: '', sub: '', columns: '4', items: [{ icon: '🏢', value: '12,400+', label: 'Businesses served' }, { icon: '⭐', value: '4.8/5', label: 'Average rating' }, { icon: '⚡', value: '7–10 days', label: 'Average turnaround' }, { icon: '🧑‍💼', value: '700+', label: 'Expert services' }], anchorId: '' },
  CommonCards: { kicker: '', heading: 'What we offer', sub: '', align: 'center', columns: '3', style: 'card', items: [{ icon: '📝', title: 'Card title', text: 'Short description of this card.', url: '', linkText: '' }, { icon: '⚖️', title: 'Card title', text: 'Short description of this card.', url: '', linkText: '' }, { icon: '📊', title: 'Card title', text: 'Short description of this card.', url: '', linkText: '' }], anchorId: '' },
  CommonLogos: { kicker: '', heading: 'Trusted by', grayscale: 'yes', items: [], anchorId: '' },
  CommonButtons: { kicker: '', heading: '', align: 'center', buttons: [{ text: '🎧 Talk to an expert', url: '/talk-to-expert', style: 'primary' }, { text: '📅 Book a meeting', url: '/book-meeting', style: 'ghost' }], anchorId: '' },
  CommonSpacer: { size: 'md', line: 'no' },
  CommonEmbed: { kind: 'map', url: '', html: '', height: '420', kicker: '', heading: '', caption: '', anchorId: '' },
  CommonTool: { source: 'page', toolSlug: '', calculator: 'gst', kicker: 'Free tool', heading: 'Try our calculator', sub: '', button: { text: '', url: '' }, anchorId: '' },
};

export const commonDefaultPayload = (type) => JSON.parse(JSON.stringify(DEFAULTS[type] || {}));

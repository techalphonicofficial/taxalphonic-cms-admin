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
  // From the reference design (uirefrence.html).
  { type: 'CommonFormHero', label: 'Hero with Form', icon: 'bi-person-lines-fill' },
  { type: 'CommonTextSide', label: 'Text + Side Card', icon: 'bi-layout-sidebar-reverse' },
  { type: 'CommonTabs', label: 'Tabs', icon: 'bi-segmented-nav' },
  { type: 'CommonTimeline', label: 'Timeline / Steps', icon: 'bi-signpost-split' },
  { type: 'CommonCaseStudy', label: 'Case Study', icon: 'bi-graph-up-arrow' },
  { type: 'CommonStory', label: 'Before → After Story', icon: 'bi-arrow-right-circle' },
  { type: 'CommonAwards', label: 'Awards / Certifications', icon: 'bi-trophy' },
  { type: 'CommonTrust', label: 'Trust Badges', icon: 'bi-shield-check' },
  { type: 'CommonContact', label: 'Contact Card (call / WhatsApp)', icon: 'bi-telephone' },
  { type: 'CommonMiniFaq', label: 'Quick FAQ', icon: 'bi-patch-question' },
  { type: 'CommonExploreHub', label: 'Explore Links Grid', icon: 'bi-grid-1x2' },
  { type: 'CommonQna', label: 'Questions & Answers + Knowledge Tabs', icon: 'bi-chat-square-text' },
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
    KICKER, HEADING, SUB,
    { key: 'subLink', label: 'Link after the sub text (optional)', type: 'button' },
    ALIGN,
    { key: 'columns', label: 'Cards per row (laptop / desktop)', type: 'select', hint: 'At least 4 per row at 100% zoom (fewer only when the block has fewer cards); 3 on small laptops, 2 on tablets, 1 on phones, 1 in a sidebar.', options: [{ value: '4', label: '4 (default)' }, { value: '5', label: '5' }, { value: '6', label: '6' }] },
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
    { key: 'buttons', label: 'Buttons', type: 'list', addLabel: 'Add button', fields: [{ key: 'icon', placeholder: 'Icon (optional)', width: 'col-md-3' }, { key: 'text', placeholder: 'Text', width: 'col-md-3' }, { key: 'url', placeholder: 'Link', width: 'col-md-4' }, { key: 'style', placeholder: 'primary / ghost', width: 'col-md-2' }] },
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

  // ---- From the reference design (uirefrence.html); website CommonBlocks.jsx ----
  CommonFormHero: [
    { key: 'kicker', label: 'Small pill above the heading', type: 'text', placeholder: '🎧 Free consultation · No obligation' },
    { key: 'heading', label: 'Heading', type: 'text', width: 'col-md-8' },
    { key: 'highlight', label: 'Highlighted words', type: 'text', width: 'col-md-4', hint: 'Must be the end of the heading.' },
    { key: 'text', label: 'Text', type: 'textarea' },
    { key: 'points', label: 'Points (icon, title, text)', type: 'list', addLabel: 'Add point', fields: [{ key: 'icon', placeholder: 'Icon', width: 'col-md-2' }, { key: 'title', placeholder: 'Title', width: 'col-md-4' }, { key: 'text', placeholder: 'Text', width: 'col-md-6' }] },
    { key: 'chips', label: 'Trust chips', type: 'list', addLabel: 'Add chip', fields: [{ key: 'icon', placeholder: 'Icon', width: 'col-md-3' }, { key: 'text', placeholder: 'e.g. Callback within hours', width: 'col-md-9' }] },
    { key: 'rating', label: 'Rating line (after ★★★★★)', type: 'text', width: 'col-12', placeholder: '4.8/5 from 2,100+ consultations' },
    { key: 'formId', label: 'CMS form', type: 'form', hint: 'Shown in the card. Leads go to CRM → Leads.' },
    { key: 'formSide', label: 'Form side', type: 'select', options: [{ value: 'right', label: 'Form on the right' }, { value: 'left', label: 'Form on the left' }] },
    { key: 'formHeading', label: 'Form card heading', type: 'text' },
    { key: 'formSub', label: 'Form card sub text', type: 'text' },
    { key: 'formNote', label: 'Note under the form', type: 'text', width: 'col-12' },
    ANCHOR,
    { key: 'placementNote', type: 'note', label: 'Full width. On service and landing pages it goes under the hero (Top area) by default; it can also replace the hero look on a plain page.' },
  ],
  CommonTextSide: [
    KICKER, HEADING,
    { key: 'lead', label: 'Lead paragraph (bigger)', type: 'textarea' },
    TEXT,
    { key: 'cardTitle', label: 'Side card title', type: 'text' },
    { key: 'button', label: 'Side card button', type: 'button' },
    { key: 'points', label: 'Side card points', type: 'list', addLabel: 'Add point', fields: [{ key: 'icon', placeholder: 'Icon (empty = ✓)', width: 'col-md-3' }, { key: 'text', placeholder: 'Point', width: 'col-md-9' }] },
    ANCHOR,
  ],
  CommonTabs: [
    KICKER, HEADING, SUB,
    { key: 'tabs', label: 'Tabs', type: 'list', addLabel: 'Add tab', hint: 'Text: a blank line starts a new paragraph; lines starting with "- " become a ticked list.', fields: [{ key: 'icon', placeholder: 'Icon', width: 'col-md-2' }, { key: 'label', placeholder: 'Tab name', width: 'col-md-4' }, { key: 'heading', placeholder: 'Heading in the panel', width: 'col-md-6' }, { key: 'text', placeholder: 'Text', width: 'col-12', textarea: true }, { key: 'buttonText', placeholder: 'Button text (optional)', width: 'col-md-6' }, { key: 'buttonUrl', placeholder: 'Button link (#form, /page, tel:…)', width: 'col-md-6' }] },
    ANCHOR,
  ],
  CommonTimeline: [
    KICKER, HEADING, SUB,
    { key: 'layout', label: 'Layout', type: 'select', options: [{ value: 'columns', label: 'Side by side (up to 4 per row)' }, { value: 'vertical', label: 'Down the page' }] },
    { key: 'items', label: 'Steps', type: 'list', addLabel: 'Add step', fields: [{ key: 'icon', placeholder: 'Icon (empty = number)', width: 'col-md-3' }, { key: 'tag', placeholder: 'Tag (e.g. Past, Day 1)', width: 'col-md-3' }, { key: 'title', placeholder: 'Title', width: 'col-md-4' }, { key: 'color', type: 'color', width: 'col-md-2' }, { key: 'text', placeholder: 'Text', width: 'col-12', textarea: true }] },
    ANCHOR,
  ],
  CommonCaseStudy: [
    KICKER, HEADING,
    { key: 'tag', label: 'Tag', type: 'text', placeholder: '📈 Client success story' },
    { key: 'client', label: 'Client / business name', type: 'text' },
    TEXT,
    { key: 'stats', label: 'Result numbers', type: 'list', addLabel: 'Add number', fields: [{ key: 'value', placeholder: 'e.g. 40%', width: 'col-md-4' }, { key: 'label', placeholder: 'e.g. faster than expected', width: 'col-md-8' }] },
    { key: 'note', label: 'Small note (optional)', type: 'text', width: 'col-12' },
    ANCHOR,
  ],
  CommonStory: [
    KICKER, HEADING,
    { key: 'icon', label: 'Client icon', type: 'text', width: 'col-md-3' },
    { key: 'client', label: 'Client / business', type: 'text', width: 'col-md-9' },
    { key: 'before', label: 'Before', type: 'textarea' },
    { key: 'did', label: 'What we did', type: 'textarea' },
    { key: 'after', label: 'The result', type: 'textarea' },
    { key: 'beforeLabel', label: 'Label: Before', type: 'text', width: 'col-md-4', placeholder: '😟 Before' },
    { key: 'didLabel', label: 'Label: What we did', type: 'text', width: 'col-md-4', placeholder: '🛠️ What we did' },
    { key: 'afterLabel', label: 'Label: Result', type: 'text', width: 'col-md-4', placeholder: '🎉 The result' },
    { key: 'note', label: 'Small note (optional)', type: 'text', width: 'col-12' },
    ANCHOR,
  ],
  CommonAwards: [
    KICKER, HEADING, SUB,
    { key: 'items', label: 'Awards / certifications', type: 'list', addLabel: 'Add item', fields: [{ key: 'icon', placeholder: 'Icon / image', width: 'col-md-3' }, { key: 'title', placeholder: 'Title', width: 'col-md-4' }, { key: 'text', placeholder: 'Small text', width: 'col-md-5' }] },
    ANCHOR,
  ],
  CommonTrust: [
    { key: 'heading', label: 'Title', type: 'text' },
    { key: 'columns', label: 'Columns', type: 'select', options: ['1', '2', '3', '4'].map(v => ({ value: v, label: v === '2' ? '2 (default)' : v })) },
    { key: 'items', label: 'Badges', type: 'list', addLabel: 'Add badge', fields: [{ key: 'icon', placeholder: 'Icon', width: 'col-md-3' }, { key: 'text', placeholder: 'e.g. Data encrypted', width: 'col-md-9' }] },
    ANCHOR,
    { key: 'placementNote', type: 'note', label: 'Small block: fits the right sidebar (Placement) next to a form.' },
  ],
  CommonContact: [
    { key: 'icon', label: 'Icon', type: 'text', width: 'col-md-3' },
    { key: 'heading', label: 'Heading', type: 'text', width: 'col-md-9' },
    { key: 'text', label: 'Text', type: 'textarea' },
    { key: 'button', label: 'Main button', type: 'button', width: 'col-12' },
    { key: 'phone', label: 'Phone number', type: 'text', placeholder: '+91 88826 75689' },
    { key: 'phoneText', label: 'Call link text (empty = the number)', type: 'text' },
    { key: 'whatsapp', label: 'WhatsApp number (with country code)', type: 'text', placeholder: '918882675689' },
    { key: 'whatsappText', label: 'WhatsApp link text', type: 'text', placeholder: 'Chat on WhatsApp' },
    { key: 'whatsappMessage', label: 'WhatsApp first message', type: 'text', width: 'col-12', placeholder: 'Hi, I need help with…' },
    { key: 'note', label: 'Small note', type: 'text', width: 'col-12' },
    ANCHOR,
    { key: 'placementNote', type: 'note', label: 'Small block: fits the right sidebar (Placement). Empty phone / WhatsApp = that link is hidden. On landing pages the WhatsApp link opens the form instead (landing pages never link away).' },
  ],
  CommonMiniFaq: [
    { key: 'heading', label: 'Title', type: 'text' },
    { key: 'firstOpen', label: 'First answer open', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
    { key: 'items', label: 'Questions', type: 'list', addLabel: 'Add question', fields: [{ key: 'question', placeholder: 'Question', width: 'col-12' }, { key: 'answer', placeholder: 'Answer', width: 'col-12', textarea: true }] },
    ANCHOR,
    { key: 'placementNote', type: 'note', label: 'Small block: fits the right sidebar (Placement). For a full FAQ section use the FAQ block.' },
  ],
  // Reference .xhub "Explore everything for your business": link cards, 4 per row on a laptop.
  CommonExploreHub: [
    KICKER, HEADING, SUB, ALIGN, COLUMNS('4'),
    {
      key: 'cards', label: 'Cards', type: 'list', addLabel: 'Add card',
      fields: [
        { key: 'icon', placeholder: 'Icon', width: 'col-md-3' },
        { key: 'title', placeholder: 'Card title (e.g. Registrations)', width: 'col-md-4' },
        { key: 'url', placeholder: 'Title link (optional)', width: 'col-md-5' },
        { key: 'links', type: 'list', label: 'Links in this card', addLabel: 'Add link', fields: [{ key: 'icon', placeholder: 'Icon', width: 'col-md-3' }, { key: 'text', placeholder: 'Link text', width: 'col-md-4' }, { key: 'url', placeholder: 'Link (/gst-registration)', width: 'col-md-5' }] },
      ],
    },
    ANCHOR,
    { key: 'placementNote', type: 'note', label: 'Wide block: use it full width (service pages: Bottom). Empty links or cards are not shown.' },
  ],
  // Reference .sp-qna + Taxpedia tabs (.tpx): ask box, answered questions, knowledge panel.
  CommonQna: [
    KICKER, HEADING, SUB, ALIGN,
    { key: 'askPlaceholder', label: 'Ask box placeholder', type: 'text', width: 'col-12' },
    { key: 'askButton', label: 'Ask button ("Post question")', type: 'button' },
    { key: 'askFormHeading', label: 'Popup heading when asking (optional)', type: 'text' },
    { key: 'askNote', label: 'Message under a posted question', type: 'text', width: 'col-12', hint: 'The question goes into the message box of the button\'s form (popup or the form on this page) and is sent with the visitor\'s details as a CRM lead. Leave the button text empty to hide the ask box.' },
    { key: 'firstOpen', label: 'First answered question open', type: 'select', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
    { key: 'items', label: 'Answered questions (optional)', type: 'list', addLabel: 'Add question', fields: [{ key: 'question', placeholder: 'Question', width: 'col-12' }, { key: 'answer', placeholder: 'Answer', width: 'col-12', textarea: true }] },
    { key: 'showPanel', label: 'Knowledge panel (tabs)', type: 'select', options: [{ value: 'yes', label: 'Show' }, { value: 'no', label: 'Hide' }] },
    { key: 'panelIcon', label: 'Panel icon', type: 'text', showIf: (d) => d.showPanel !== 'no' },
    { key: 'panelTitle', label: 'Panel title', type: 'text', showIf: (d) => d.showPanel !== 'no' },
    { key: 'panelSub', label: 'Panel sub text', type: 'text', width: 'col-12', showIf: (d) => d.showPanel !== 'no' },
    { key: 'panelButton', label: 'Panel button (e.g. Open Taxpedia →)', type: 'button', showIf: (d) => d.showPanel !== 'no' },
    {
      key: 'tabs', label: 'Tabs', type: 'list', addLabel: 'Add tab', showIf: (d) => d.showPanel !== 'no',
      fields: [
        { key: 'icon', placeholder: 'Icon', width: 'col-md-3' },
        { key: 'label', placeholder: 'Tab name (Articles, News…)', width: 'col-md-9' },
        { key: 'cards', type: 'list', label: 'Cards in this tab', addLabel: 'Add card', fields: [{ key: 'title', placeholder: 'Title', width: 'col-md-6' }, { key: 'url', placeholder: 'Link (optional)', width: 'col-md-6' }, { key: 'text', placeholder: 'Short text', width: 'col-md-8', textarea: true }, { key: 'linkText', placeholder: 'Link text (Read more →)', width: 'col-md-4' }] },
      ],
    },
    { key: 'topicsLabel', label: 'Topics label', type: 'text', showIf: (d) => d.showPanel !== 'no' },
    { key: 'topics', label: 'Related topics (chips)', type: 'list', addLabel: 'Add topic', showIf: (d) => d.showPanel !== 'no', fields: [{ key: 'icon', placeholder: 'Icon', width: 'col-md-3' }, { key: 'text', placeholder: 'Topic', width: 'col-md-4' }, { key: 'url', placeholder: 'Link', width: 'col-md-5' }] },
    ANCHOR,
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
  CommonCards: { kicker: '', heading: 'What we offer', sub: 'Everything your business needs, handled by experts.', subLink: { text: 'View all services', url: '/services', icon: '→', iconSide: 'right' }, align: 'center', columns: '4', style: 'card', items: [{ icon: '📝', title: 'Registrations', text: 'Company, GST, MSME and 28+ registrations.', url: '', linkText: '' }, { icon: '🧾', title: 'Tax & filing', text: 'GST, income tax and TDS returns on time.', url: '', linkText: '' }, { icon: '⚖️', title: 'Legal', text: 'Agreements, notices and lawyer support.', url: '', linkText: '' }, { icon: '📊', title: 'Advisory', text: 'CFO, fundraising and growth advice.', url: '', linkText: '' }], anchorId: '' },
  CommonLogos: { kicker: '', heading: 'Trusted by', grayscale: 'yes', items: [], anchorId: '' },
  CommonButtons: { kicker: '', heading: '', align: 'center', buttons: [{ icon: '🎧', text: 'Talk to an expert', url: '/talk-to-expert', style: 'primary' }, { icon: '📅', text: 'Book a meeting', url: '/book-meeting', style: 'ghost' }], anchorId: '' },
  CommonSpacer: { size: 'md', line: 'no' },
  CommonEmbed: { kind: 'map', url: '', html: '', height: '420', kicker: '', heading: '', caption: '', anchorId: '' },
  CommonTool: { source: 'page', toolSlug: '', calculator: 'gst', kicker: 'Free tool', heading: 'Try our calculator', sub: '', button: { text: '', url: '' }, anchorId: '' },
  // Reference design blocks: starting content taken from uirefrence.html.
  CommonFormHero: {
    kicker: '🎧 Free consultation · No obligation', heading: 'Talk to an expert — free', highlight: 'expert — free',
    text: 'Get a free 15-minute call with a qualified CA, CS or lawyer. Clear, honest advice with no cost and no pressure.',
    points: [
      { icon: '🎯', title: 'Matched to your need', text: 'We assign the right expert for your requirement.' },
      { icon: '⚡', title: 'Fast callback', text: 'We reach out within hours during working time.' },
      { icon: '💸', title: 'Transparent quote', text: 'Clear, upfront pricing with no hidden charges.' },
    ],
    chips: [{ icon: '🔒', text: '100% confidential' }, { icon: '🇮🇳', text: 'Across India' }],
    rating: '4.8/5 from 2,100+ consultations',
    formId: '', formSide: 'right', formHeading: 'Request a callback', formSub: 'Share your details and we will call you back.', formNote: '🔒 Your details are safe. We never spam.', anchorId: '',
  },
  CommonTextSide: {
    kicker: 'Why Tax Alphonic', heading: 'Running a business is hard. We make the paperwork easy.',
    lead: 'Registrations, licences, tax filing and yearly compliance: most business owners find this confusing and time-consuming.',
    text: 'We handle every legal, tax and compliance need your business has, from the idea to steady revenue. You stay focused on your business; we handle the paperwork.',
    cardTitle: 'What you get', points: [{ icon: '', text: 'Real CA / CS experts' }, { icon: '', text: 'Transparent, upfront pricing' }, { icon: '', text: '100% online, no office visits' }],
    button: { text: '🎧 Talk to an expert', url: '#form' }, anchorId: '',
  },
  CommonTabs: {
    kicker: '', heading: 'Everything in one place', sub: '',
    tabs: [
      { icon: '📝', label: 'Overview', heading: 'What it is', text: 'Explain the service in a few lines.\n\n- Who needs it\n- What is included', buttonText: '', buttonUrl: '' },
      { icon: '📂', label: 'Documents', heading: 'Documents you need', text: '- PAN and Aadhaar\n- Address proof\n- Business details', buttonText: '', buttonUrl: '' },
      { icon: '⏱️', label: 'Timeline', heading: 'How long it takes', text: 'Most cases are done in 7–10 working days once the documents are ready.', buttonText: 'Get started', buttonUrl: '#form' },
    ],
    anchorId: '',
  },
  CommonTimeline: {
    kicker: '', heading: 'How it has changed', sub: '', layout: 'columns',
    items: [
      { icon: '📜', tag: 'Past', title: 'Paper and office visits', text: 'Long queues, physical forms and weeks of waiting.', color: '#64748b' },
      { icon: '⚡', tag: 'Present', title: 'Online filing', text: 'Most work is online, but the rules change often.', color: '#0e96ac' },
      { icon: '🚀', tag: 'Future', title: 'Automated compliance', text: 'Reminders and filings handled for you, on time.', color: '#16a34a' },
    ],
    anchorId: '',
  },
  CommonCaseStudy: {
    kicker: 'Real results', heading: 'Case study', tag: '📈 Client success story', client: '',
    text: 'A growing business came to us worried about delays, paperwork and hidden costs. Our team handled everything end to end and delivered ahead of schedule.',
    stats: [{ value: '40%', label: 'faster than expected' }, { value: '₹0', label: 'hidden charges' }, { value: '100%', label: 'compliant outcome' }],
    note: '', anchorId: '',
  },
  CommonStory: {
    kicker: 'A real example', heading: 'How we helped', icon: '🏪', client: 'A small retail business',
    before: 'Unsure which registrations applied and worried about penalties.',
    did: 'Mapped every requirement, prepared the documents and filed everything.',
    after: 'Fully compliant in two weeks, with reminders set for every due date.',
    beforeLabel: '', didLabel: '', afterLabel: '', note: '', anchorId: '',
  },
  CommonAwards: {
    kicker: '', heading: 'Recognised & trusted', sub: '',
    items: [
      { icon: '🏆', title: 'Top Rated', text: 'Business services 2025' },
      { icon: '🛡️', title: 'ISO 27001', text: 'Data security certified' },
      { icon: '⭐', title: '4.8/5 Rating', text: '2,100+ reviews' },
      { icon: '🤝', title: 'Startup India', text: 'Recognised partner' },
    ],
    anchorId: '',
  },
  CommonTrust: {
    heading: '🔒 Safe & trusted', columns: '2',
    items: [{ icon: '🛡️', text: 'Data encrypted' }, { icon: '👨‍💼', text: 'CA/CS verified' }, { icon: '💯', text: 'No hidden fees' }, { icon: '🔁', text: 'Free revisions' }],
    anchorId: '',
  },
  CommonContact: {
    icon: '🎧', heading: 'Need help right now?', text: 'Talk to an expert for free. No cost, no obligation.',
    button: { text: 'Get a call back', url: '#form' }, phone: '', phoneText: '', whatsapp: '', whatsappText: 'Chat on WhatsApp', whatsappMessage: 'Hi, I need help', note: '', anchorId: '',
  },
  CommonMiniFaq: {
    heading: '❓ Quick answers', firstOpen: 'no',
    items: [
      { question: 'How long does it take?', answer: 'Usually 7–10 working days, depending on documents and government processing.' },
      { question: 'Is the process fully online?', answer: 'Yes. Everything is handled online.' },
      { question: 'What if my documents are missing?', answer: 'Our experts give you a personalised checklist so nothing is missed.' },
    ],
    anchorId: '',
  },
  CommonExploreHub: {
    kicker: '', heading: 'Explore everything for your business', align: 'center', columns: '4',
    sub: 'One platform — registrations, tax, compliance, legal, notices and growth. Hand-picked for this page.',
    cards: [
      { icon: '🛠️', title: 'Related services', url: '', links: [{ icon: '🛡️', text: 'Trust Registration', url: '/trust-registration' }, { icon: '🍽️', text: 'FSSAI Registration', url: '/fssai-registration' }, { icon: '🚢', text: 'ICEGATE Registration', url: '/icegate-registration' }, { icon: '🏅', text: 'ISO Registration', url: '/iso-registration' }, { icon: '🏦', text: 'PF Registration', url: '/pf-registration' }, { icon: '🩺', text: 'ESI Registration', url: '/esi-registration' }] },
      { icon: '🏢', title: 'Registrations', url: '', links: [{ icon: '🏢', text: 'Private Limited Company', url: '/private-limited-company-registration' }, { icon: '🤝', text: 'Partnership', url: '/partnership-firm-registration' }, { icon: '⚖️', text: 'Limited Liability Partnership', url: '/llp-registration' }, { icon: '👤', text: 'One Person Company', url: '/one-person-company-registration' }, { icon: '🏭', text: 'MSME / Udyam', url: '/udyam-registration' }, { icon: '🌐', text: 'Import Export Code', url: '/import-export-code' }] },
      { icon: '📜', title: 'Licenses', url: '', links: [{ icon: '🍽️', text: 'FSSAI License', url: '/fssai-license' }, { icon: '🔄', text: 'FSSAI Renewal', url: '/fssai-renewal' }, { icon: '📋', text: 'FSSAI Return Filing', url: '/fssai-return-filing' }, { icon: '🪪', text: 'Trade License', url: '/trade-license' }, { icon: '🏭', text: 'Factory License', url: '/factory-license' }] },
      { icon: '™️', title: 'Trademark & IP', url: '', links: [{ icon: '™️', text: 'Trademark Registration', url: '/trademark-registration' }, { icon: '📝', text: 'Trademark Objection', url: '/trademark-objection' }, { icon: '🔄', text: 'Trademark Renewal', url: '/trademark-renewal' }, { icon: '©️', text: 'Copyright Registration', url: '/copyright-registration' }] },
      { icon: '🧾', title: 'Tax & filing', url: '', links: [{ icon: '🧾', text: 'GST Registration', url: '/gst-registration' }, { icon: '📊', text: 'GST Return Filing', url: '/gst-return-filing' }, { icon: '📈', text: 'Income Tax E-Filing', url: '/income-tax-filing' }, { icon: '⚠️', text: 'Income Tax Notice', url: '/income-tax-notice' }] },
      { icon: '🛡️', title: 'Business compliance', url: '', links: [{ icon: '🛡️', text: 'Annual Compliance Plan', url: '/annual-compliance' }, { icon: '🏛️', text: 'ROC Compliance', url: '/roc-compliance' }, { icon: '👷', text: 'Labour Law Compliance', url: '/labour-law-compliance' }] },
      { icon: '💼', title: 'Business advisory', url: '', links: [{ icon: '💼', text: 'Business Plan', url: '/business-plan' }, { icon: '📊', text: 'Virtual CFO', url: '/virtual-cfo' }, { icon: '📒', text: 'Bookkeeping', url: '/bookkeeping' }] },
      { icon: '🧰', title: 'Tools & calculators', url: '/tools', links: [{ icon: '🧮', text: 'GST Calculator', url: '/tool/gst-calculator' }, { icon: '💰', text: 'Income Tax Calculator', url: '/tool/income-tax-calculator' }, { icon: '🏦', text: 'EMI Calculator', url: '/tool/emi-calculator' }, { icon: '🧰', text: 'All tools', url: '/tools' }] },
    ],
    anchorId: '',
  },
  CommonQna: {
    kicker: '', heading: 'Questions & answers', sub: '', align: 'center',
    askPlaceholder: 'Ask a question — our experts answer within 24 hours',
    askButton: { text: 'Post question', url: '#form' },
    askFormHeading: 'Ask our expert',
    askNote: '🕐 Add your contact details in the form and send it — a Tax Alphonic expert answers within 24 hours.',
    firstOpen: 'no',
    items: [],
    showPanel: 'yes',
    panelIcon: '📚', panelTitle: 'Taxpedia — everything in one place',
    panelSub: 'Articles, news, judiciary, acts, notifications, forms, calendars & more — in one place',
    panelButton: { text: 'Open Taxpedia', url: '/taxpedia', icon: '→', iconSide: 'right' },
    tabs: [
      { icon: '📚', label: 'Articles', cards: [{ title: 'The complete guide', text: 'Eligibility, documents, fees, timeline and process — explained step by step.', linkText: 'Read on Taxpedia →', url: '/taxpedia' }, { title: 'Documents & eligibility', text: 'Exactly what you need before you apply, and who qualifies.', linkText: 'Read on Taxpedia →', url: '/taxpedia' }, { title: 'Common mistakes', text: 'The errors that cause rejection or delay — and how to avoid them.', linkText: 'Read on Taxpedia →', url: '/taxpedia' }, { title: 'Fees & timeline explained', text: 'Government fees versus professional fees, and realistic timelines.', linkText: 'Read on Taxpedia →', url: '/taxpedia' }] },
      { icon: '📰', label: 'News', cards: [{ title: 'Latest news', text: 'Policy changes, portal updates and deadlines, updated by our editorial team.', linkText: 'Read on Taxpedia →', url: '/taxpedia' }, { title: 'What changed this quarter', text: 'A quick digest of recent changes.', linkText: 'Read on Taxpedia →', url: '/taxpedia' }] },
      { icon: '⚖️', label: 'Judiciary', cards: [{ title: 'Supreme Court rulings', text: 'Curated summaries of apex-court rulings.', linkText: 'View summaries →', url: '/taxpedia' }, { title: 'High Court decisions', text: 'Practical takeaways from High Court judgments.', linkText: 'View summaries →', url: '/taxpedia' }] },
      { icon: '📜', label: 'Acts', cards: [{ title: 'The governing Act', text: 'Key sections explained in plain language.', linkText: 'Read on Taxpedia →', url: '/taxpedia' }] },
      { icon: '🏛️', label: 'Notifications', cards: [{ title: 'Notification tracker', text: 'Department notifications, tracked as they are issued.', linkText: 'Read on Taxpedia →', url: '/taxpedia' }, { title: 'Rate & threshold changes', text: 'Notified changes to rates, limits and exemptions.', linkText: 'Read on Taxpedia →', url: '/taxpedia' }] },
    ],
    topicsLabel: 'Related topics:',
    topics: [{ icon: '📖', text: 'Eligibility', url: '/taxpedia' }, { icon: '📖', text: 'Process', url: '/taxpedia' }, { icon: '📖', text: 'Amendment', url: '/taxpedia' }, { icon: '📖', text: 'Cancellation', url: '/taxpedia' }],
    anchorId: '',
  },
};

export const commonDefaultPayload = (type) => JSON.parse(JSON.stringify(DEFAULTS[type] || {}));

// Header and footer regions of a landing page (Landing Pages module, PageBuilder blockSet="landing").
// They are normal blocks in the page's single section list; the builder keeps them in their own
// Header / Footer areas (layoutZones.js), the backend allows one of each
// (services/landing/landingValidation.js) and the website renders them with
// components/tax-alphonic/landing/LandingChrome.jsx (types in landingBlockTypes.js: keep in sync).
import { imageHint } from '../../config/imageSizes';

export const LANDING_HEADER = 'LandingHeader';
export const LANDING_FOOTER = 'LandingFooter';

export const LANDING_BLOCKS = [
  { type: LANDING_HEADER, label: 'Header', icon: 'bi-window-dock' },
  { type: LANDING_FOOTER, label: 'Footer', icon: 'bi-window-desktop' },
];

export const isLandingRegion = (type) => type === LANDING_HEADER || type === LANDING_FOOTER;

const MODE = (what) => ({
  key: 'mode',
  label: `${what} style`,
  type: 'select',
  options: [
    { value: 'simple', label: `Landing page ${what.toLowerCase()} (set below)` },
    { value: 'site', label: `Website ${what.toLowerCase()} (Menus & Navigation + Settings)` },
    { value: 'none', label: `No ${what.toLowerCase()}` },
  ],
});
const simple = (d) => (d.mode || 'site') === 'simple';
// Landing pages never navigate away (website lib/landingLinks.js): links may only point to a
// section of the page (#process), a form popup (#form) or tel: / mailto:; others open the form popup.
const LINK_FIELDS = [{ key: 'text', placeholder: 'Text', width: 'col-md-5' }, { key: 'url', placeholder: '#process, #faq, #form, tel:… or mailto:…', width: 'col-md-7' }];
const NO_LEAVING = { key: 'linkNote', type: 'note', label: 'Landing pages never send visitors to another page (ads policy): links can only go to a section of this page (#process, #faq), open the form (#form), call (tel:) or email (mailto:). Any other link opens the form popup instead.', showIf: simple };

export const LANDING_SCHEMAS = {
  [LANDING_HEADER]: [
    MODE('Header'),
    { key: 'siteNote', type: 'note', label: 'Shows the website header with the header menu and logo. On a landing page its menu links do not leave the page (they open the form popup), so the landing page header is the better choice.', link: { to: '/pages/menus', text: 'Menus & Navigation' }, showIf: (d) => !simple(d) && d.mode !== 'none' },
    NO_LEAVING,
    { key: 'logo', label: 'Logo (empty = Organization logo)', type: 'image', hint: imageHint('logo'), showIf: simple },
    { key: 'logoAlt', label: 'Logo description (alt text)', type: 'text', showIf: simple },
    { key: 'links', label: 'Menu links (optional; anchors on this page work best: #details, #enquiry)', type: 'list', addLabel: 'Add link', fields: LINK_FIELDS, showIf: simple },
    { key: 'phone', label: 'Phone (empty = none)', type: 'text', placeholder: '+91 98765 43210', showIf: simple },
    { key: 'showPhone', label: 'When the phone is empty', type: 'select', options: [{ value: 'no', label: 'Show no phone' }, { value: 'yes', label: 'Use Settings → Contact phone' }], showIf: simple },
    { key: 'button', label: 'Button (e.g. Enquire Now: "Opens a form popup")', type: 'button', width: 'col-12', showIf: simple },
    { key: 'sticky', label: 'Stays at the top while scrolling', type: 'select', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], showIf: simple },
    { key: 'theme', label: 'Colours', type: 'select', options: [{ value: 'light', label: 'Light (white bar)' }, { value: 'dark', label: 'Dark (navy bar)' }], showIf: simple },
  ],
  [LANDING_FOOTER]: [
    MODE('Footer'),
    { key: 'siteNote', type: 'note', label: 'Shows the website footer (footer menu, contact). On a landing page its links do not leave the page (they open the form popup), so the landing page footer is the better choice.', link: { to: '/pages/menus', text: 'Menus & Navigation' }, showIf: (d) => !simple(d) && d.mode !== 'none' },
    NO_LEAVING,
    { key: 'layout', label: 'Layout', type: 'select', options: [{ value: 'minimal', label: 'Minimal (logo left, contact details right)' }, { value: 'center', label: 'Centred (everything in the middle)' }, { value: 'columns', label: 'Columns (logo | links | contact)' }], hint: 'Minimal hides the short text and headings; links and legal links go in the bottom row.', showIf: simple },
    { key: 'logo', label: 'Logo (empty = Organization dark logo)', type: 'image', hint: imageHint('logo'), showIf: simple },
    { key: 'about', label: 'Short text under the logo', type: 'textarea', showIf: simple },
    { key: 'linksTitle', label: 'Links heading', type: 'text', placeholder: 'Quick links', showIf: simple },
    { key: 'links', label: 'Links', type: 'list', addLabel: 'Add link', fields: LINK_FIELDS, showIf: simple },
    { key: 'contactTitle', label: 'Contact heading', type: 'text', placeholder: 'Get in touch', showIf: simple },
    { key: 'showContact', label: 'Contact details', type: 'select', options: [{ value: 'yes', label: 'From Settings → Contact / Address (fields below override)' }, { value: 'no', label: 'Only the fields below' }], showIf: simple },
    { key: 'phone', label: 'Phone', type: 'text', showIf: simple },
    { key: 'email', label: 'Email', type: 'text', showIf: simple },
    { key: 'address', label: 'Address', type: 'text', width: 'col-12', showIf: simple },
    { key: 'copyright', label: 'Copyright line', type: 'text', width: 'col-12', placeholder: '© {year} {company}. All rights reserved.', hint: '{year} = current year, {company} = Organization name.', showIf: simple },
    { key: 'legalLinks', label: 'Legal links (bottom row)', type: 'list', addLabel: 'Add legal link', fields: LINK_FIELDS, showIf: simple },
    { key: 'theme', label: 'Colours', type: 'select', options: [{ value: 'dark', label: 'Dark (navy)' }, { value: 'light', label: 'Light' }], showIf: simple },
  ],
};

const DEFAULTS = {
  [LANDING_HEADER]: {
    mode: 'simple', logo: '', logoAlt: '',
    links: [],
    phone: '', showPhone: 'yes', button: { text: 'Enquire Now', url: '#form' }, sticky: 'yes', theme: 'light',
  },
  [LANDING_FOOTER]: {
    mode: 'simple', layout: 'minimal', logo: '', about: '', linksTitle: 'Quick links',
    links: [],
    contactTitle: 'Get in touch', showContact: 'yes', phone: '', email: '', address: '',
    copyright: '© {year} {company}. All rights reserved.',
    legalLinks: [],
    theme: 'dark',
  },
};

export const landingDefaultPayload = (type) => JSON.parse(JSON.stringify(DEFAULTS[type] || {}));

// New pages start from a layout: landingLayouts.js (LANDING_LAYOUTS, buildLandingLayout, landingTemplate).

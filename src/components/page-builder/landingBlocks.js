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
const LINK_FIELDS = [{ key: 'text', placeholder: 'Text', width: 'col-md-5' }, { key: 'url', placeholder: '#enquiry, /about or https://…', width: 'col-md-7' }];

export const LANDING_SCHEMAS = {
  [LANDING_HEADER]: [
    MODE('Header'),
    { key: 'siteNote', type: 'note', label: 'Shows the website header with the header menu and logo. Edit them in Menus & Navigation and Settings → Organization; every landing page using this style changes with them.', link: { to: '/pages/menus', text: 'Menus & Navigation' }, showIf: (d) => !simple(d) && d.mode !== 'none' },
    { key: 'logo', label: 'Logo (empty = Organization logo)', type: 'image', hint: imageHint('logo'), showIf: simple },
    { key: 'logoAlt', label: 'Logo description (alt text)', type: 'text', showIf: simple },
    { key: 'links', label: 'Menu links (anchors on this page work best: #details, #enquiry)', type: 'list', addLabel: 'Add link', fields: LINK_FIELDS, showIf: simple },
    { key: 'phone', label: 'Phone (empty = none)', type: 'text', placeholder: '+91 98765 43210', showIf: simple },
    { key: 'showPhone', label: 'When the phone is empty', type: 'select', options: [{ value: 'no', label: 'Show no phone' }, { value: 'yes', label: 'Use Settings → Contact phone' }], showIf: simple },
    { key: 'button', label: 'Button', type: 'button', showIf: simple },
    { key: 'sticky', label: 'Stays at the top while scrolling', type: 'select', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], showIf: simple },
    { key: 'theme', label: 'Colours', type: 'select', options: [{ value: 'light', label: 'Light (white bar)' }, { value: 'dark', label: 'Dark (navy bar)' }], showIf: simple },
  ],
  [LANDING_FOOTER]: [
    MODE('Footer'),
    { key: 'siteNote', type: 'note', label: 'Shows the website footer: the footer menu and its Footer Display options, plus Settings contact and social links.', link: { to: '/pages/menus', text: 'Menus & Navigation' }, showIf: (d) => !simple(d) && d.mode !== 'none' },
    { key: 'logo', label: 'Logo (empty = Organization dark logo)', type: 'image', hint: imageHint('logo'), showIf: simple },
    { key: 'about', label: 'Short text under the logo', type: 'textarea', showIf: simple },
    { key: 'linksTitle', label: 'Links heading', type: 'text', placeholder: 'Quick links', showIf: simple },
    { key: 'links', label: 'Links', type: 'list', addLabel: 'Add link', fields: LINK_FIELDS, showIf: simple },
    { key: 'contactTitle', label: 'Contact heading', type: 'text', placeholder: 'Get in touch', showIf: simple },
    { key: 'showContact', label: 'Contact details', type: 'select', options: [{ value: 'yes', label: 'From Settings → Contact / Address (fields below override)' }, { value: 'no', label: 'Only the fields below' }], showIf: simple },
    { key: 'phone', label: 'Phone', type: 'text', showIf: simple },
    { key: 'email', label: 'Email', type: 'text', showIf: simple },
    { key: 'address', label: 'Address', type: 'text', width: 'col-12', showIf: simple },
    { key: 'showSocial', label: 'Social links (Settings → Social Media)', type: 'select', options: [{ value: 'yes', label: 'Show' }, { value: 'no', label: 'Hide' }], showIf: simple },
    { key: 'copyright', label: 'Copyright line', type: 'text', width: 'col-12', placeholder: '© {year} {company}. All rights reserved.', hint: '{year} = current year, {company} = Organization name.', showIf: simple },
    { key: 'legalLinks', label: 'Legal links (bottom row)', type: 'list', addLabel: 'Add legal link', fields: LINK_FIELDS, showIf: simple },
    { key: 'theme', label: 'Colours', type: 'select', options: [{ value: 'dark', label: 'Dark (navy)' }, { value: 'light', label: 'Light' }], showIf: simple },
  ],
};

const DEFAULTS = {
  [LANDING_HEADER]: {
    mode: 'simple', logo: '', logoAlt: '',
    links: [{ text: 'Overview', url: '#details' }, { text: 'Get started', url: '#enquiry' }],
    phone: '', showPhone: 'yes', button: { text: 'Talk to an expert', url: '#enquiry' }, sticky: 'yes', theme: 'light',
  },
  [LANDING_FOOTER]: {
    mode: 'simple', logo: '', about: '', linksTitle: 'Quick links',
    links: [{ text: 'Main website', url: '/' }, { text: 'About us', url: '/about' }],
    contactTitle: 'Get in touch', showContact: 'yes', phone: '', email: '', address: '', showSocial: 'yes',
    copyright: '© {year} {company}. All rights reserved.',
    legalLinks: [{ text: 'Privacy policy', url: '/privacy-policy' }, { text: 'Terms', url: '/terms-and-conditions' }],
    theme: 'dark',
  },
};

export const landingDefaultPayload = (type) => JSON.parse(JSON.stringify(DEFAULTS[type] || {}));

const uid = (n) => `sec_${Date.now()}_${n}`;

/**
 * Blocks of a new landing page: header, a hero and overview for the service, an enquiry form in
 * the right sidebar (pick the form), and the footer. With "Copy the service's blocks" the backend
 * replaces everything between header and footer with the service's own blocks.
 */
export function landingTemplate({ title = '', serviceTitle = '' } = {}) {
  const name = serviceTitle || title || 'Our service';
  return [
    { id: uid(0), type: LANDING_HEADER, config: {}, data: { payload: landingDefaultPayload(LANDING_HEADER) } },
    { id: uid(1), type: 'HeroBanner', config: {}, data: { payload: { eyebrow: name, heading: title || `${name} made simple`, subHeading: `Expert help with ${name}, start to finish. Share your details and our team will call you back.`, primaryButton: { text: 'Get started', url: '#enquiry' }, imageMode: 'auto', showMeta: false } } },
    { id: uid(2), type: 'Overview', config: { placement: 'main', anchorId: 'details' }, data: { payload: { title: `About ${name}`, content: `<p>Describe ${name} here: who needs it, what is included and why customers choose Tax Alphonic.</p>` } } },
    { id: uid(3), type: 'Form', config: { placement: 'sidebar', anchorId: 'enquiry' }, data: { payload: { formId: '', formName: '', formSlug: '' } } },
    { id: uid(4), type: LANDING_FOOTER, config: {}, data: { payload: landingDefaultPayload(LANDING_FOOTER) } },
  ];
}

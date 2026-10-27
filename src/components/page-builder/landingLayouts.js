// Ready-made layouts for landing pages: a set of blocks with their order, placement and starting
// content. Picked when a page is created (LandingPageForm "Layout") or later from the Builder's
// "Change layout" (the body is replaced; Header, Footer, theme and the enquiry form are kept).
// Every block stays a normal Page Builder block: edit, move, remove or add more afterwards.
// Buttons use "#form", which opens the page's form (its Form block) in a popup on the website.
import { LANDING_FOOTER, LANDING_HEADER, landingDefaultPayload } from './landingBlocks';
import { homeDefaultPayload } from './homeBlocks';
import { servicePlacementOf } from './layoutZones';

const ENQUIRE = { text: 'Enquire Now', url: '#form' };

// Homepage blocks link to main-site pages (/talk-to-expert, /services/...); on a landing page their
// buttons open the enquiry form instead.
function toPopup(value) {
  if (Array.isArray(value)) return value.map(toPopup);
  if (value && typeof value === 'object') {
    const out = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPopup(v)]));
    if (typeof out.url === 'string' && out.url.startsWith('/') && 'text' in out) out.url = '#form';
    return out;
  }
  return value;
}
const home = (type, patch = {}) => ({ ...toPopup(homeDefaultPayload(type)), ...patch });

// Block factories: (ctx) => { type, payload, config }. ctx = { name, title, formId }.
const B = {
  hero: (c, patch = {}) => ({
    type: 'HeroBanner',
    payload: {
      eyebrow: c.name,
      heading: c.title || `${c.name} made simple`,
      subHeading: `Expert help with ${c.name}, start to finish. Share your details and our team will call you back.`,
      primaryButton: ENQUIRE,
      secondaryButton: { text: 'How it works', url: '#process' },
      badges: [{ icon: '✅', text: 'CA / CS verified experts' }, { icon: '⚡', text: 'Fast turnaround' }, { icon: '🔒', text: '100% online & secure' }],
      imageMode: 'auto',
      showMeta: false,
      ...patch,
    },
  }),
  overview: (c, placement = 'main') => ({
    type: 'Overview',
    payload: { title: `About ${c.name}`, content: `<p>Describe ${c.name} here: who needs it, what is included and why customers choose Tax Alphonic.</p>` },
    config: { placement, anchorId: 'details' },
  }),
  form: (c, placement = 'sidebar', heading = 'Get a free consultation') => ({
    type: 'Form',
    payload: { formId: c.formId || '', formName: '', formSlug: '', heading, subHeading: 'Share your details and our expert will call you back.' },
    config: { placement, anchorId: 'enquiry' },
  }),
  why: (c, placement = 'main') => ({
    type: 'WhyUs',
    payload: {
      title: `Why choose us for ${c.name}`,
      reasons: [
        { icon: '🎯', title: 'Dedicated expert', description: 'One CA / CS handles your case from the first call to the final filing.' },
        { icon: '💰', title: 'Transparent pricing', description: 'A fixed quote up front, with no hidden charges.' },
        { icon: '⏱️', title: 'On-time delivery', description: 'Clear timelines and status updates at every step.' },
        { icon: '🛡️', title: 'Secure & compliant', description: 'Your documents stay private and every filing is checked twice.' },
      ],
    },
    config: { placement },
  }),
  process: (c, placement = 'main') => ({
    type: 'OurProcess',
    payload: {
      title: 'How it works',
      steps: [
        { title: 'Share your details', description: 'Fill in the enquiry form or call us.', duration: 'Day 1' },
        { title: 'Free consultation', description: 'An expert understands your needs and confirms the documents.', duration: 'Day 1' },
        { title: 'We do the work', description: 'We prepare and file everything on your behalf.', duration: 'Day 2–5' },
        { title: 'Done', description: 'You receive the final documents and ongoing support.', duration: '' },
      ],
      button: ENQUIRE,
    },
    config: { placement, anchorId: 'process' },
  }),
  included: (c, placement = 'main') => ({
    type: 'ServicesIncluded',
    payload: {
      title: `What's included in ${c.name}`,
      services: [
        { icon: '📝', title: 'Eligibility check', description: 'We confirm what applies to your business before we start.' },
        { icon: '📂', title: 'Document preparation', description: 'Drafting, review and a clear checklist of what we need from you.' },
        { icon: '🏛️', title: 'Filing & follow-up', description: 'We file with the department and handle every query.' },
        { icon: '📄', title: 'Final certificate', description: 'You get the final documents with guidance on next steps.' },
      ],
    },
    config: { placement },
  }),
  highlights: (c, placement = 'top') => ({
    type: 'Highlights',
    payload: {
      title: '',
      variant: 'tinted',
      items: [
        { icon: '🧑‍💼', title: 'Expert CA / CS', text: 'Qualified professionals' },
        { icon: '⚡', title: 'Quick turnaround', text: 'Most cases in days' },
        { icon: '💰', title: 'Fixed pricing', text: 'No hidden charges' },
        { icon: '🔒', title: '100% confidential', text: 'Bank-grade security' },
      ],
    },
    config: { placement },
  }),
  checklist: (c, placement = 'sidebar') => ({
    type: 'Checklist',
    payload: { title: '✅ What you get', items: [{ icon: '✔️', text: 'Free expert consultation' }, { icon: '✔️', text: 'Document checklist for your case' }, { icon: '✔️', text: 'End-to-end filing' }, { icon: '✔️', text: 'Support after completion' }] },
    config: { placement },
  }),
  cta: (c, placement = 'bottom') => ({
    type: 'CallToAction',
    payload: { variant: 'dark', icon: '🎧', title: `Ready to start your ${c.name}?`, text: 'Talk to an expert for free. No cost, no obligation.', buttons: [ENQUIRE], note: '' },
    config: { placement },
  }),
  faq: (c, placement = 'bottom') => ({
    type: 'Faq',
    payload: {
      title: 'Frequently asked questions',
      faqs: [
        { question: `How long does ${c.name} take?`, answer: 'Most cases are completed within a few working days once the documents are ready.' },
        { question: 'Which documents do I need?', answer: 'Our expert shares the exact checklist for your case during the free consultation.' },
        { question: 'Can I do everything online?', answer: 'Yes. The whole process is online; you never need to visit an office.' },
        { question: 'How much does it cost?', answer: 'You get a fixed quote before we start, with no hidden charges.' },
      ],
    },
    config: { placement },
  }),
  stats: (c, placement = 'top') => ({ type: 'CommonStats', payload: { kicker: '', heading: '', sub: '', columns: '4', items: [{ icon: '🏢', value: '12,400+', label: 'Businesses served' }, { icon: '⭐', value: '4.8/5', label: 'Average rating' }, { icon: '⚡', value: '7–10 days', label: 'Average turnaround' }, { icon: '🧑‍💼', value: '700+', label: 'Expert services' }], anchorId: '' }, config: { placement } }),
  imageText: (c, placement = 'main') => ({ type: 'CommonImageText', payload: { image: '', imageSide: 'left', imageAlt: '', kicker: 'Why it matters', heading: `${c.name}, done right`, text: 'Explain the benefit for your customer in a few lines. Add a picture from Media.', points: [{ text: 'Handled by qualified experts' }, { text: 'Clear timelines and updates' }], primaryButton: ENQUIRE, secondaryButton: { text: '', url: '' }, anchorId: '' }, config: { placement } }),
  testimonials: () => ({ type: 'HomeTestimonials', payload: home('HomeTestimonials'), config: { placement: 'bottom' } }),
  trustBar: (c, placement = 'top') => ({ type: 'HomeTrustBar', payload: home('HomeTrustBar'), config: { placement } }),
  clients: () => ({ type: 'HomeClients', payload: home('HomeClients'), config: { placement: 'bottom' } }),
  security: () => ({ type: 'HomeSecurity', payload: home('HomeSecurity'), config: { placement: 'bottom' } }),
  finalCta: () => ({ type: 'HomeFinalCta', payload: home('HomeFinalCta', { button: { text: '🎧 Enquire Now', url: '#form' } }), config: { placement: 'bottom' } }),
  bundles: () => ({ type: 'HomeBundles', payload: home('HomeBundles', { heading: 'Plans & packages' }), config: { placement: 'bottom' } }),
  compare: () => ({ type: 'HomeComparison', payload: home('HomeComparison'), config: { placement: 'bottom' } }),
  // The page form is already in the sidebar: the banner's button opens it in a popup instead of a second form.
  expert: () => ({ type: 'HomeExpertCta', payload: home('HomeExpertCta', { formId: '', anchorId: 'talk', primaryButton: ENQUIRE, secondaryButton: { text: '', url: '' } }), config: { placement: 'bottom' } }),
};

/**
 * key, name, description, theme (suggested colour theme, landingThemes.js) and the body blocks
 * between Header and Footer.
 */
export const LANDING_LAYOUTS = [
  {
    key: 'classic', name: 'Classic lead page', theme: 'default',
    description: 'Hero, about + sticky form, why us, process, reviews, FAQ. Works for most services.',
    body: (c) => [B.hero(c), B.overview(c), B.form(c), B.why(c), B.process(c), B.testimonials(c), B.faq(c)],
  },
  {
    key: 'quick', name: 'Quick enquiry', theme: 'ocean',
    description: 'Short and focused for ads: hero, highlights, about with form and checklist, one call to action.',
    body: (c) => [B.hero(c, { secondaryButton: { text: '', url: '' } }), B.highlights(c), B.overview(c), B.form(c), B.checklist(c), B.cta(c)],
  },
  {
    key: 'trust', name: 'Trust & proof', theme: 'midnight',
    description: 'Numbers, clients, reviews and security up front for buyers who compare providers.',
    body: (c) => [B.hero(c, { secondaryButton: { text: 'Why choose us', url: '#whychoose' } }), B.trustBar(c), B.why(c), B.form(c), B.stats(c, 'main'), B.clients(c), B.testimonials(c), B.security(c), B.faq(c), B.finalCta(c)],
  },
  {
    key: 'pricing', name: 'Plans & pricing', theme: 'emerald',
    description: 'Packages and a comparison table next to the process, for price-led services.',
    body: (c) => [B.hero(c), B.highlights(c), B.process(c), B.form(c), B.bundles(c), B.compare(c), B.faq(c), B.cta(c)],
  },
  {
    key: 'consult', name: 'Expert consultation', theme: 'royal',
    description: 'Image + text story, what is included and a big expert banner, with the form next to the content.',
    body: (c) => [B.hero(c, { secondaryButton: { text: 'Talk to an expert', url: '#talk' } }), B.overview(c), B.imageText(c), B.included(c), B.form(c), B.expert(c), B.testimonials(c), B.faq(c)],
  },
  {
    key: 'detailed', name: 'Detailed service guide', theme: 'slate',
    description: 'Long-form page for SEO: highlights, about, included, why us, process, form + checklist, FAQ.',
    body: (c) => [B.hero(c), B.highlights(c), B.overview(c), B.included(c), B.why(c), B.process(c), B.form(c), B.checklist(c), B.faq(c), B.testimonials(c), B.cta(c)],
  },
  {
    key: 'minimal', name: 'Minimal form page', theme: 'sunset',
    description: 'Just the hero, the form full width and a few highlights. Fastest to publish.',
    body: (c) => [B.hero(c, { secondaryButton: { text: '', url: '' } }), B.form(c, 'main', 'Tell us what you need'), B.highlights(c, 'main')],
  },
];

const uid = (n) => `sec_${Date.now()}_${n}_${Math.random().toString(36).slice(2, 6)}`;
const toSection = (b, n) => ({ id: uid(n), type: b.type, config: b.config || {}, data: { payload: b.payload } });

/** Body blocks (no Header / Footer) of a layout. */
export function layoutBody(key, { title = '', serviceTitle = '', formId = '' } = {}) {
  const layout = LANDING_LAYOUTS.find((l) => l.key === key) || LANDING_LAYOUTS[0];
  const ctx = { name: serviceTitle || title || 'Our service', title, formId };
  return layout.body(ctx).map((b, i) => toSection(b, i + 1));
}

/** All blocks of a new page: default Header (with the theme) + layout body + default Footer. */
export function landingTemplate({ layout = 'classic', title = '', serviceTitle = '', formId = '', theme = 'default', customTheme = null } = {}) {
  // customTheme: the colours when theme is "custom" (landingThemes.js).
  const themePayload = theme === 'custom' && customTheme ? { pageTheme: 'custom', customTheme } : { pageTheme: theme };
  return [
    toSection({ type: LANDING_HEADER, payload: { ...landingDefaultPayload(LANDING_HEADER), ...themePayload } }, 0),
    ...layoutBody(layout, { title, serviceTitle, formId }),
    toSection({ type: LANDING_FOOTER, payload: landingDefaultPayload(LANDING_FOOTER) }, 99),
  ];
}

/**
 * The page's blocks with the body replaced by a layout. Header, Footer (and so the theme) are
 * kept, and the enquiry form of the current Form block carries over.
 */
export function applyLayout(sections, key, { title = '', serviceTitle = '' } = {}) {
  const list = Array.isArray(sections) ? sections : [];
  const header = list.filter((s) => s.type === LANDING_HEADER);
  const footer = list.filter((s) => s.type === LANDING_FOOTER);
  const formId = list.find((s) => s.type === 'Form' && s.data?.payload?.formId)?.data?.payload?.formId || '';
  return [...header, ...layoutBody(key, { title, serviceTitle, formId }), ...footer];
}

/** Rows of a layout for its thumbnail: [{ zone, types: [...] }], columns for main | sidebar. */
export function layoutSketch(key) {
  const body = layoutBody(key);
  const zone = (z) => body.filter((s) => servicePlacementOf(s) === z).map((s) => s.type);
  return { hero: zone('hero'), top: zone('top'), main: zone('main'), sidebar: zone('sidebar'), bottom: zone('bottom') };
}

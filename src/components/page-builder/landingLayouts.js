// Ready-made layouts for landing pages: a set of blocks with their order, placement and starting
// content. Picked when a page is created (LandingPageForm "Layout") or later from the Builder's
// "Change layout" (the body is replaced; Header, Footer, theme and the enquiry form are kept).
// Every block stays a normal Page Builder block: edit, move, remove or add more afterwards.
// Buttons use "#form", which opens the page's form (its Form block) in a popup on the website.
import { LANDING_FOOTER, LANDING_HEADER, landingDefaultPayload } from './landingBlocks';
import { homeDefaultPayload } from './homeBlocks';
import { servicePlacementOf } from './layoutZones';

const ENQUIRE = { text: 'Enquire Now', url: '#form' };
const NO_BUTTON = { text: '', url: '' };

// Starting photos (free Unsplash images, loaded from their CDN): editors swap them for their own
// from Media. Each layout uses different ones so the layouts don't look alike.
const photo = (id, w = 1600, h = 0) => `https://images.unsplash.com/photo-${id}?w=${w}${h ? `&h=${h}` : ''}&q=70&auto=format&fit=crop`;
const PHOTOS = {
  meeting: '1556761175-5973dc0f32e7',
  office: '1497366216548-37526070297c',
  handshake: '1521791136064-7986c2920216',
  team: '1600880292203-757bb62b4baf',
  analytics: '1460925895917-afdab827c52f',
  charts: '1454165804606-c3d57bc86b40',
  calculator: '1554224155-6726b3ff858f',
  signing: '1450101499163-c8848c66ca85',
  advisor: '1573497019940-1c28c88b4f3e',
  building: '1486406146926-c627a92ad1ab',
};

// Block backgrounds (BackgroundSettings.jsx → section.config.background). Neutral colours, so
// they suit every page theme.
const BG = {
  photo: (id, overlay = 60, extra = {}) => ({ image: photo(PHOTOS[id]), position: 'center', size: 'cover', overlayColor: '#0b1220', overlayOpacity: overlay, textTheme: 'light', ...extra }),
  soft: { color: '#f3f6fb', padding: 'lg', rounded: 'yes' },
  deep: { color: '#0f172a', textTheme: 'light', padding: 'lg', rounded: 'yes' },
};
const withBg = (block, background) => ({ ...block, config: { ...(block.config || {}), background } });

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
    config: {},
  }),
  // Text left, photo right (or left with imageSide: 'left').
  heroSplit: (c, id, patch = {}) => B.hero(c, { imageMode: 'custom', backgroundImage: photo(PHOTOS[id], 900), ...patch }),
  // Photo behind the hero with a dark overlay: centred heading, text and button.
  heroPhoto: (c, id, patch = {}) => withBg(
    B.hero(c, { imageMode: 'none', align: 'center', height: 'lg', badges: [], secondaryButton: NO_BUTTON, ...patch }),
    BG.photo(id, 62),
  ),
  // Photo only: "Text on the hero" = buttons / hide (the heading stays hidden for Google).
  heroBanner: (c, id, textMode, patch = {}) => withBg(
    B.hero(c, { textMode, height: textMode === 'hide' ? 'r31' : 'lg', buttonsAlign: 'left', secondaryButton: NO_BUTTON, ...patch }),
    BG.photo(id, textMode === 'hide' ? 0 : 25, { textTheme: '' }),
  ),
  // Just the heading (and a line), centred, no image.
  heroHeading: (c, patch = {}, background = null) => {
    const block = B.hero(c, { imageMode: 'none', align: 'center', badges: [], secondaryButton: NO_BUTTON, ...patch });
    return background ? withBg(block, background) : block;
  },
  text: (c, placement, patch = {}) => ({
    type: 'CommonText',
    payload: { kicker: '', heading: '', text: '', align: 'center', anchorId: '', primaryButton: NO_BUTTON, secondaryButton: NO_BUTTON, ...patch },
    config: { placement },
  }),
  cards: (c, placement, patch = {}) => ({
    type: 'CommonCards',
    payload: {
      kicker: 'Why customers pick us', heading: `${c.name} without the paperwork stress`, sub: '', align: 'center', columns: '3', style: 'plain',
      items: [
        { icon: '🧾', title: 'One fixed price', text: 'Know the full cost before we start.', url: '', linkText: '' },
        { icon: '🧑‍💼', title: 'A named expert', text: 'The same CA / CS from start to finish.', url: '', linkText: '' },
        { icon: '📲', title: 'Updates on WhatsApp', text: 'Status at every step, no chasing.', url: '', linkText: '' },
      ],
      anchorId: '',
      ...patch,
    },
    config: { placement },
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
  highlights: (c, placement = 'top', variant = 'tinted') => ({
    type: 'Highlights',
    payload: {
      title: '',
      variant,
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
  cta: (c, placement = 'bottom', variant = 'dark') => ({
    type: 'CallToAction',
    payload: { variant, icon: '🎧', title: `Ready to start your ${c.name}?`, text: 'Talk to an expert for free. No cost, no obligation.', buttons: [ENQUIRE], note: '' },
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
  imageText: (c, placement = 'main', patch = {}) => ({ type: 'CommonImageText', payload: { image: '', imageSide: 'left', imageAlt: '', kicker: 'Why it matters', heading: `${c.name}, done right`, text: 'Explain the benefit for your customer in a few lines. Add a picture from Media.', points: [{ text: 'Handled by qualified experts' }, { text: 'Clear timelines and updates' }], primaryButton: ENQUIRE, secondaryButton: NO_BUTTON, anchorId: '', ...patch }, config: { placement } }),
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
  // Every layout has its own hero style and section look (description starts with the hero).
  {
    key: 'classic', name: 'Classic lead page', theme: 'default',
    description: 'Hero: text left, photo right. About + sticky form, why us on a soft band, process, reviews, FAQ.',
    body: (c) => [
      B.heroSplit(c, 'meeting'),
      B.overview(c), B.form(c),
      withBg(B.why(c), BG.soft),
      B.process(c), B.testimonials(c), B.faq(c),
    ],
  },
  {
    key: 'quick', name: 'Quick enquiry', theme: 'ocean',
    description: 'Hero: photo background with a centred heading and one button. Highlights strip, about with form + checklist, dark call to action.',
    body: (c) => [
      B.heroPhoto(c, 'office'),
      B.highlights(c, 'top', 'plain'),
      B.overview(c), B.form(c), B.checklist(c),
      B.cta(c),
    ],
  },
  {
    key: 'trust', name: 'Trust & proof', theme: 'midnight',
    description: 'Hero: photo left, text right. Numbers on a dark band, why us, clients, reviews, security, FAQ.',
    body: (c) => [
      B.heroSplit(c, 'handshake', {
        imageSide: 'left',
        badges: [],
        secondaryButton: { text: 'Why choose us', url: '#whychoose' },
      }),
      withBg(B.stats(c, 'top'), BG.deep),
      B.why(c), B.form(c),
      B.clients(c), B.testimonials(c), B.security(c), B.faq(c), B.finalCta(c),
    ],
  },
  {
    key: 'pricing', name: 'Plans & pricing', theme: 'emerald',
    description: 'Hero: just the heading and a button, centred on a light band. Benefit cards, process + form, packages, comparison, FAQ.',
    body: (c) => [
      B.heroHeading(c, { subHeading: 'Simple, fixed prices. Pick a plan or ask for a custom quote.' }, { color: '#f3f6fb' }),
      B.cards(c, 'top'),
      B.process(c), B.form(c, 'sidebar', 'Get your quote'),
      B.bundles(c), B.compare(c), B.faq(c),
      B.cta(c, 'bottom', 'light'),
    ],
  },
  {
    key: 'consult', name: 'Expert consultation', theme: 'royal',
    description: 'Hero: a big photo with only the buttons. Intro heading, photo + text left and right, included, expert banner, reviews, FAQ.',
    body: (c) => [
      B.heroBanner(c, 'team', 'buttons', { secondaryButton: { text: 'Talk to an expert', url: '#talk' } }),
      B.text(c, 'top', { kicker: c.name, heading: c.title || `Talk to a ${c.name} expert today`, text: 'Real chartered accountants and company secretaries, one call away. Tell us your case and get a clear plan, a fixed quote and a named expert.', primaryButton: ENQUIRE }),
      B.imageText(c, 'main', { image: photo(PHOTOS.advisor, 900, 640), imageSide: 'left', imageAlt: 'Expert advisor', kicker: 'Personal advice', heading: 'An expert who knows your case' }),
      B.imageText(c, 'main', { image: photo(PHOTOS.signing, 900, 640), imageSide: 'right', imageAlt: 'Signing documents', kicker: 'Done for you', heading: 'We prepare, file and follow up', points: [{ text: 'Document checklist for your case' }, { text: 'Filing and every department query handled' }], primaryButton: NO_BUTTON }),
      B.included(c), B.form(c),
      B.expert(c), B.testimonials(c), B.faq(c),
    ],
  },
  {
    key: 'detailed', name: 'Detailed service guide', theme: 'slate',
    description: 'Hero: a wide banner image only (put your own banner with its text). Heading on a soft band, long guide with form + checklist, photo call to action.',
    body: (c) => [
      B.heroBanner(c, 'analytics', 'hide'),
      withBg(B.text(c, 'top', { kicker: c.name, heading: c.title || `${c.name}: the complete guide`, text: 'Everything you need to know, what it costs and how we get it done for you.', primaryButton: ENQUIRE, secondaryButton: { text: 'How it works', url: '#process' } }), BG.soft),
      B.highlights(c),
      B.overview(c), B.included(c), B.why(c), B.process(c),
      B.form(c), B.checklist(c),
      B.imageText(c, 'bottom', { image: photo(PHOTOS.charts, 900, 640), imageSide: 'right', imageAlt: 'Business reports', kicker: 'After filing', heading: 'Support that continues after the work is done', points: [{ text: 'Reminders before every due date' }, { text: 'One expert for follow-up questions' }] }),
      B.faq(c), B.testimonials(c),
      withBg(B.text(c, 'bottom', { heading: `Ready to start your ${c.name}?`, text: 'Free consultation. No cost, no obligation.', primaryButton: ENQUIRE }), BG.photo('calculator', 65, { padding: 'xl', rounded: 'yes' })),
    ],
  },
  {
    key: 'minimal', name: 'Minimal form page', theme: 'sunset',
    description: 'Hero: just the heading on a dark colour band, no image. The form full width and a few highlights. Fastest to publish.',
    body: (c) => [
      B.heroHeading(c, { primaryButton: NO_BUTTON, height: 'sm' }, { color: '#111827', textTheme: 'light' }),
      B.form(c, 'main', 'Tell us what you need'),
      B.highlights(c, 'main', 'plain'),
    ],
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

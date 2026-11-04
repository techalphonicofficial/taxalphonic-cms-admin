// Sample content for the palette's eye button (BlockPreviewModal.jsx): blocks that start empty still
// show their design before they are added. Only for that preview; a block added to the page gets
// its normal starting content (defaultPayloadFor in PageBuilder.jsx).

const placeholder = (label, width = 1200, height = 675) => `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#e2e8f0"/><text x="50%" y="50%" fill="#64748b" font-family="sans-serif" font-size="${Math.round(height / 9)}" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
)}`;

const SAMPLES = {
  HeroBanner: {
    eyebrow: 'Sample category', heading: 'Your service heading goes here', highlight: 'goes here',
    subHeading: 'A short line that explains what the visitor gets from this service.',
    primaryButton: { text: 'Get started', url: '#' }, secondaryButton: { text: 'Talk to an expert', url: '#' },
    badges: [{ icon: '✅', text: 'Expert assisted' }, { icon: '⚡', text: 'Fast turnaround' }],
    stats: [{ value: '12,400+', label: 'Businesses served' }, { value: '4.8/5', label: 'Average rating' }],
  },
  Overview: {
    heading: 'Overview',
    content: '<p>Your introduction goes here. Explain what the service is, who needs it and what is included.</p><p>The editor supports <strong>bold text</strong>, lists, links and tables.</p>',
  },
  WhyUs: {
    title: 'Why choose us',
    reasons: [
      { icon: '🧑‍💼', title: 'Qualified experts', description: 'Reason one in a short sentence.' },
      { icon: '💸', title: 'Clear pricing', description: 'Reason two in a short sentence.' },
      { icon: '⚡', title: 'Fast delivery', description: 'Reason three in a short sentence.' },
      { icon: '🔒', title: 'Safe and private', description: 'Reason four in a short sentence.' },
    ],
  },
  Faq: {
    title: 'Frequently asked questions',
    faqs: [
      { question: 'Your first question?', answer: 'The answer shows here when the question is opened.' },
      { question: 'Your second question?', answer: 'The answer shows here when the question is opened.' },
      { question: 'Your third question?', answer: 'The answer shows here when the question is opened.' },
    ],
  },
  ServicesIncluded: {
    title: 'What is included',
    services: [
      { icon: '📝', title: 'First item', description: 'What this item covers.' },
      { icon: '🧾', title: 'Second item', description: 'What this item covers.' },
      { icon: '📊', title: 'Third item', description: 'What this item covers.' },
    ],
  },
  OurProcess: {
    title: 'How it works',
    steps: [
      { title: 'Share your details', description: 'What happens in this step.', duration: 'Day 1' },
      { title: 'Expert review', description: 'What happens in this step.', duration: 'Day 2' },
      { title: 'Work completed', description: 'What happens in this step.', duration: 'Day 5' },
    ],
  },
  Form: { heading: 'Request a callback', subHeading: 'Share your details and we will call you back.', note: '🔒 Your details are safe.' },
  Highlights: {
    items: [
      { icon: '🏆', title: 'First highlight', text: 'A short supporting line.' },
      { icon: '🛡️', title: 'Second highlight', text: 'A short supporting line.' },
      { icon: '⭐', title: 'Third highlight', text: 'A short supporting line.' },
    ],
  },
  Checklist: {
    title: 'Your checklist',
    items: [{ icon: '✅', text: 'First point' }, { icon: '✅', text: 'Second point' }, { icon: '✅', text: 'Third point' }],
  },
  CallToAction: {
    variant: 'dark', icon: '🎧', title: 'Ready to get started?', text: 'One line that invites the visitor to act.',
    buttons: [{ text: 'Talk to an expert', url: '#' }],
  },
  CommonImage: { image: placeholder('Your image'), alt: 'Sample image', caption: 'Optional caption' },
  CommonVideo: { url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', heading: 'Your video heading', caption: 'Sample video: use your own YouTube, Vimeo or MP4 link.' },
  CommonGallery: { items: [1, 2, 3].map((n) => ({ image: placeholder(`Photo ${n}`, 800, 600), caption: `Photo ${n}` })) },
  CommonLogos: { items: [1, 2, 3, 4, 5].map((n) => ({ image: placeholder(`Logo ${n}`, 320, 120), name: `Logo ${n}` })) },
  CommonEmbed: {
    kind: 'html', heading: 'Map or embedded page',
    html: '<div style="padding:90px 16px;background:#e2e8f0;color:#64748b;text-align:center;border-radius:12px">Your Google Map or embedded page shows here</div>',
  },
  CommonTool: { source: 'calculator', calculator: 'gst' },
  ToolHero: { title: 'Your tool name goes here', description: 'A short line that explains what this calculator does.' },
  // Sample links; on the website they come from the service's location pages.
  LocationsServed: { previewLocations: ['Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai'].map((name) => ({ name, href: `#${name.toLowerCase()}` })) },
  JourneySteps: { items: [{ text: 'First step' }, { text: 'Second step' }, { text: 'Third step' }] },
  ToolFaq: { items: [{ question: 'Your first question?', answer: 'The answer shows here.' }, { question: 'Your second question?', answer: 'The answer shows here.' }] },
};

// A form for the preview only: the website never submits from the preview.
const SAMPLE_FORM = {
  id: 'sample-form',
  name: 'Sample form',
  fields: [
    { id: 'f1', name: 'name', label: 'Your name', type: 'text', required: true, placeholder: 'Enter your name' },
    { id: 'f2', name: 'phone', label: 'Phone number', type: 'tel', required: true, placeholder: '98765 43210' },
    { id: 'f3', name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { id: 'f4', name: 'message', label: 'How can we help?', type: 'textarea', placeholder: 'Tell us what you need' },
  ],
  settings: { submitButtonText: 'Request a callback' },
};

const samplePlan = (duration, monthlyPrice, originalTotal, savePercentage) => ({
  duration, monthlyPrice, originalTotal, savePercentage, keywords: 'First feature\nSecond feature\nThird feature',
});

const SAMPLE_PACKAGES = [
  { id: 'sample-1', name: 'Starter', description: 'A sample package for new businesses.', features: ['First benefit', 'Second benefit'], pricingPlans: [samplePlan('1 month', 4999, 5999, 15)] },
  { id: 'sample-2', name: 'Growth', description: 'A sample package most clients choose.', features: ['First benefit', 'Second benefit', 'Third benefit'], isRecommended: true, pricingPlans: [samplePlan('3 months', 9999, 12999, 25)] },
];

// Blocks that read a CMS module on the website: sample records instead (config.previewSample).
const MODULE_SAMPLES = {
  HomeTestimonials: {
    heading: 'What our clients say', sub: 'Sample reviews',
    items: [
      { quote: 'A sample review from a happy client, in a sentence or two.', rating: 5, name: 'Client One', role: 'Founder, Sample Co' },
      { quote: 'Another sample review, about how easy the process was.', rating: 5, name: 'Client Two', role: 'Director, Example Ltd' },
      { quote: 'A third sample review, about the support they received.', rating: 4, name: 'Client Three', role: 'Owner, Demo Traders' },
    ],
  },
  HomeFaq: {
    heading: 'Frequently asked questions', sub: 'Sample questions',
    items: [
      { question: 'Your first question?', answer: 'The answer shows here when the question is opened.' },
      { question: 'Your second question?', answer: 'The answer shows here when the question is opened.' },
      { question: 'Your third question?', answer: 'The answer shows here when the question is opened.' },
    ],
  },
  HomeClients: { heading: 'Trusted by', items: ['Sample Co', 'Example Ltd', 'Demo Traders', 'Acme Foods', 'Blue Ventures', 'Green Works'].map((name) => ({ name, logo: '🏢' })) },
  HomeTeam: {
    heading: 'Meet the team', sub: 'Sample team members',
    items: [
      { name: 'Team Member One', role: 'Chartered Accountant', bio: 'A short sample bio.' },
      { name: 'Team Member Two', role: 'Company Secretary', bio: 'A short sample bio.' },
      { name: 'Team Member Three', role: 'Legal Advisor', bio: 'A short sample bio.' },
      { name: 'Team Member Four', role: 'Tax Consultant', bio: 'A short sample bio.' },
    ],
  },
  HomeBanners: {
    items: [
      { image: placeholder('Banner 1', 1600, 500), title: 'Your first banner', subtitle: 'A short supporting line', buttonText: 'Learn more', buttonUrl: '#', align: 'left' },
      { image: placeholder('Banner 2', 1600, 500), title: 'Your second banner', subtitle: 'A short supporting line', buttonText: 'Learn more', buttonUrl: '#', align: 'left' },
    ],
  },
  HomeBranches: {
    heading: 'Our offices', sub: 'Sample offices', headOfficeLabel: 'Head office',
    items: [
      { name: 'Delhi office', isHeadOffice: true, address: '123 Sample Road, New Delhi', country: 'India', phone: '+91 98765 43210', email: 'delhi@example.com', hours: 'Mon to Sat, 10 to 7' },
      { name: 'Mumbai office', address: '45 Example Street, Mumbai', country: 'India', phone: '+91 98765 43211', email: 'mumbai@example.com', hours: 'Mon to Sat, 10 to 7' },
      { name: 'Bengaluru office', address: '67 Demo Avenue, Bengaluru', country: 'India', phone: '+91 98765 43212', email: 'blr@example.com', hours: 'Mon to Sat, 10 to 7' },
    ],
  },
  HomeGlobalPresence: { heading: 'Our global presence', sub: 'Sample countries', items: ['India', 'United Arab Emirates', 'Singapore', 'United Kingdom', 'United States', 'Australia'].map((name) => ({ name })) },
  HomePortfolio: {
    heading: 'Our work', sub: 'Sample projects',
    items: [1, 2, 3, 4].map((n) => ({ id: `sample-${n}`, image: placeholder(`Project ${n}`, 800, 600), title: `Project ${n}`, group: { id: n % 2 ? 'g1' : 'g2', name: n % 2 ? 'Websites' : 'Branding' } })),
  },
  ToolsGrid: { tools: [{ slug: 'tool/sample', url: '#', calculator: 'gst', title: 'Sample calculator', icon: '🧮', tag: 'Tax', description: 'A short description of the tool.' }, { slug: 'tool/sample-2', url: '#', calculator: 'emi', title: 'Another calculator', icon: '📊', tag: 'Finance', description: 'A short description of the tool.' }] },
  ToolMore: { tools: [{ slug: 'tool/sample', url: '#', calculator: 'gst', title: 'Sample calculator', icon: '🧮', tag: 'Tax', description: 'A short description of the tool.' }, { slug: 'tool/sample-2', url: '#', calculator: 'emi', title: 'Another calculator', icon: '📊', tag: 'Finance', description: 'A short description of the tool.' }] },
};

// Blocks that show a CMS form: a sample form.
const FORM_BLOCKS = new Set(['Form', 'HomeForm', 'CommonFormHero', 'ToolForm']);

/** The block for the preview: its starting content with sample content over it. Never saved. */
export function sampleSection(type, payload) {
  const sample = { ...payload, ...SAMPLES[type], ...MODULE_SAMPLES[type] };
  if (FORM_BLOCKS.has(type)) {
    sample.formId = '';
    sample.form = SAMPLE_FORM;
  }
  if (type === 'Packages') {
    sample.packageIds = [];
    sample.packages = SAMPLE_PACKAGES;
  }
  return { id: `sample_${type}`, type, config: { previewSample: true }, data: { payload: sample } };
}

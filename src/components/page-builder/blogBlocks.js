// Blog post blocks and page settings (BlogForm → PageBuilder blockSet="blog").
// Keep in sync with the website's components/tax-alphonic/blog/blogLayout.js (types, defaults,
// settings keys) and BlogBlocks.jsx (how each block is drawn).
//
// The blog builder uses the service canvas (Hero, Top, Main | Sidebar, Bottom). The sidebar cards
// of a post are blocks, so editors place them: On this page, Share this article, Expert help card.
// Page settings (sidebar side / width, sticky part, cover image, text width, progress bar, phone
// table of contents) are saved as one "BlogSettings" entry in the same sections list; BlogForm
// takes it out before the builder sees the list and puts it back on save.

export const BLOG_BLOCKS = [
  { type: 'BlogToc', label: 'On this page (table of contents)', icon: 'bi-list-nested' },
  { type: 'BlogShare', label: 'Share this article', icon: 'bi-share' },
  { type: 'BlogExpertCta', label: 'Expert help card', icon: 'bi-headset' },
];
export const BLOG_TYPES = BLOG_BLOCKS.map(b => b.type);
export const isBlogType = (type) => BLOG_TYPES.includes(type);
export const BLOG_SETTINGS = 'BlogSettings';

const DEFAULTS = {
  BlogToc: { title: 'On this page', icon: '📑', levels: 'h2h3' },
  BlogShare: { title: 'Share this article', copyLink: 'yes' },
  BlogExpertCta: {
    heading: 'Need expert help?',
    text: 'Get a free consultation with a Tax Alphonic expert.',
    button: { text: '🎧 Talk to an expert', url: '/talk-to-expert' },
  },
};
export const blogDefaultPayload = (type) => JSON.parse(JSON.stringify(DEFAULTS[type] || {}));

const PLACE_NOTE = { key: 'placeNote', type: 'note', label: 'Drag this block between Sidebar and Main content (or use Placement). In the sidebar it is a card; in the article it runs full width.' };

export const BLOG_SCHEMAS = {
  BlogToc: [
    { key: 'icon', label: 'Icon', type: 'text', width: 'col-md-2' },
    { key: 'title', label: 'Title (empty = no title)', type: 'text', width: 'col-md-6' },
    { key: 'levels', label: 'Headings listed', type: 'select', width: 'col-md-4', options: [{ value: 'h2h3', label: 'Headings and sub-headings (H2 + H3)' }, { value: 'h2', label: 'Main headings only (H2)' }] },
    { key: 'tocNote', type: 'note', label: 'The list is built from the article headings by itself. Shown when the post has at least 2 headings.' },
    PLACE_NOTE,
  ],
  BlogShare: [
    { key: 'title', label: 'Title (empty = no title)', type: 'text', width: 'col-md-8' },
    { key: 'copyLink', label: '"Copy link" button', type: 'select', width: 'col-md-4', options: [{ value: 'yes', label: 'Show' }, { value: 'no', label: 'Hide' }] },
    { key: 'shareNote', type: 'note', label: 'WhatsApp, LinkedIn, X and Facebook share this post\'s address and title.' },
    PLACE_NOTE,
  ],
  BlogExpertCta: [
    { key: 'heading', label: 'Heading', type: 'text', width: 'col-md-6' },
    { key: 'text', label: 'Text', type: 'textarea' },
    { key: 'button', label: 'Button (a link or a form popup)', type: 'button', width: 'col-12' },
    PLACE_NOTE,
  ],
};

export const BLOG_SETTINGS_DEFAULT = {
  sidebar: 'right',
  sidebarWidth: 300,
  sticky: 'toc',
  cover: 'beside',
  textWidth: 'full',
  progress: 'yes',
  tocMobile: 'yes',
  foot: 'full',
};

const newId = (type) => `sec_${Date.now()}_${type}_${Math.random().toString(36).slice(2, 7)}`;

/**
 * Loaded post content → { settings, sections } for the editor. A post saved before this layout has
 * no BlogSettings: its blocks get placement "main" (one column, as the website showed it) and the
 * three sidebar cards are added to the Sidebar, which is how the website draws such posts.
 */
export function readBlogContent(list) {
  const all = Array.isArray(list) ? list : [];
  const entry = all.find(s => s?.type === BLOG_SETTINGS);
  const rest = all.filter(s => s?.type !== BLOG_SETTINGS);
  if (entry) {
    return { settings: { ...BLOG_SETTINGS_DEFAULT, ...(entry.data?.payload || entry.payload || {}) }, sections: rest, upgraded: false };
  }
  const kept = rest.map(s => (s.config?.placement || s.type === 'LayoutSection' ? s : { ...s, config: { ...(s.config || {}), placement: 'main' } }));
  const cards = BLOG_TYPES.map(type => ({ id: newId(type), type, config: { placement: 'sidebar' }, data: { payload: blogDefaultPayload(type) } }));
  const marker = kept.findIndex(s => s.type === 'LayoutSection');
  const at = marker < 0 ? kept.length : marker;
  return { settings: { ...BLOG_SETTINGS_DEFAULT }, sections: [...kept.slice(0, at), ...cards, ...kept.slice(at)], upgraded: true };
}

/** Sections to save: the editor's list plus the settings entry (last, never drawn). */
export const writeBlogContent = (sections, settings) => [
  ...sections.filter(s => s?.type !== BLOG_SETTINGS),
  { id: 'blog-settings', type: BLOG_SETTINGS, config: {}, data: { payload: { ...BLOG_SETTINGS_DEFAULT, ...settings } } },
];

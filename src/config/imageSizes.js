// Recommended upload sizes for every image the website shows, taken from how the website renders
// it (frame shape, crop and display size). Shown under each image field via <ImageSizeHint>.
// Sizes are about 2x the displayed size so images stay sharp on high-DPI screens.
// When the website's layout changes, update the matching entry here.

export const IMAGE_SIZES = {
  // Settings → Organization
  logo: { size: '460 × 200 px', ratio: 'about 2.3:1 (wide)', format: 'transparent PNG or SVG', note: 'Header shows it 52px tall; the footer shows it on a white badge.' },
  lightLogo: { size: '460 × 200 px', ratio: 'about 2.3:1 (wide)', format: 'transparent PNG or SVG', note: 'Dark text/colours, for white backgrounds.' },
  darkLogo: { size: '460 × 200 px', ratio: 'about 2.3:1 (wide)', format: 'transparent PNG or SVG', note: 'Light text/colours, for dark backgrounds.' },
  favicon: { size: '512 × 512 px', ratio: '1:1 (square)', format: 'PNG or ICO', note: 'Browser tab icon; keep it simple, it is shown at 16–32px.' },
  appleTouchIcon: { size: '180 × 180 px', ratio: '1:1 (square)', format: 'PNG, no transparency' },
  emailLogo: { size: '600 × 200 px', ratio: '3:1', format: 'PNG or JPG' },
  invoiceLogo: { size: '600 × 200 px', ratio: '3:1', format: 'PNG or JPG' },
  watermarkLogo: { size: '1000 × 1000 px', ratio: '1:1', format: 'transparent PNG' },
  ogImage: { size: '1200 × 630 px', ratio: '1.91:1', format: 'JPG or PNG, under 1 MB', note: 'Shown when the page is shared on WhatsApp, Facebook, LinkedIn or X.' },
  defaultImage: { size: '1200 × 800 px', ratio: '3:2', format: 'JPG or WebP' },
  signature: { size: '600 × 200 px', ratio: '3:1', format: 'transparent PNG' },
  qrCode: { size: '512 × 512 px', ratio: '1:1 (square)', format: 'PNG' },

  // Homepage
  heroImage: { size: '1200 × 1000 px', ratio: '6:5 (or square)', format: 'transparent PNG or WebP', note: 'Right side of the hero, up to 580px wide (680px on Extra large).' },
  bannerDesktop: { size: '1920 × 600 px', ratio: '16:5 (wide strip)', format: 'JPG or WebP, under 400 KB', note: 'The slider crops to 16:5; keep text and faces in the centre.' },
  bannerMobile: { size: '1080 × 1350 px', ratio: '4:5 (portrait)', format: 'JPG or WebP, under 300 KB', note: 'Used on phones; without it the desktop image is cropped.' },
  clientLogo: { size: '360 × 120 px', ratio: '3:1 (wide)', format: 'transparent PNG or SVG', note: 'Shown at most 120 × 38px.' },
  pressLogo: { size: '320 × 80 px', ratio: '4:1 (wide)', format: 'transparent PNG or SVG', note: 'Shown 28px tall.' },
  avatar: { size: '200 × 200 px', ratio: '1:1 (square)', format: 'JPG or WebP', note: 'Cropped to a circle; keep the face centred.' },
  teamPhoto: { size: '400 × 400 px', ratio: '1:1 (square)', format: 'JPG or WebP', note: 'Cropped to a 96px circle; keep the face centred.' },
  flag: { size: '120 × 120 px', ratio: '1:1 (square)', format: 'PNG or SVG', note: 'Shown in a 44px square box, shape kept: a round or square flag fills it, a 3:2 flag shows smaller.' },
  icon: { size: '96 × 96 px', ratio: '1:1 (square)', format: 'transparent PNG or SVG', note: 'An emoji also works.' },

  // Service pages, CMS pages, About page
  serviceHero: { size: '1200 × 1000 px', ratio: '6:5', format: 'JPG or WebP', note: 'Right side of the page hero, cropped to 6:5, up to 400px wide.' },
  serviceThumb: { size: '1200 × 1000 px', ratio: '6:5', format: 'JPG or WebP', note: 'Used in the page hero when the Hero block has no image.' },
  aboutImage: { size: '1200 × 1000 px', ratio: '6:5', format: 'JPG or WebP', note: 'About page hero, cropped to 6:5.' },
  aboutHomeImage: { size: '1200 × 900 px', ratio: '4:3', format: 'JPG or WebP' },

  // Blogs and portfolio
  blogFeatured: { size: '1200 × 630 px', ratio: '1.91:1', format: 'JPG or WebP', note: 'Also used when the post is shared.' },
  blogGallery: { size: '1200 × 800 px', ratio: '3:2', format: 'JPG or WebP' },
  portfolio: { size: '1200 × 900 px', ratio: '4:3', format: 'JPG or WebP' },
};

/** One-line text, e.g. "1920 × 600 px · 16:5 (wide strip) · JPG or WebP, under 400 KB". */
export const imageSizeText = (kind) => {
  const s = IMAGE_SIZES[kind];
  if (!s) return '';
  return [s.size, s.ratio, s.format].filter(Boolean).join(' · ');
};

/** Hint for schema/list fields: "Recommended 1920 × 600 px · 16:5 … — note". */
export const imageHint = (kind) => {
  const s = IMAGE_SIZES[kind];
  if (!s) return '';
  return `Recommended ${imageSizeText(kind)}${s.note ? `. ${s.note}` : ''}`;
};

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.join(here, 'website');
const SHIMS = path.join(here, 'shims');
const posix = (p) => p.split(path.sep).join('/');
const SITE_PREFIX = `${posix(SITE_DIR)}/`;

const MODULE_SHIMS = {
  'next/link': 'Link.jsx',
  'next/navigation': 'navigation.js',
  'next/headers': 'headers.js',
  '@/service/apiClient': 'apiClient.js',
  '@/service/formSubmission': 'formSubmission.js',
};
const EMPTY_CSS = '\0site-preview-empty-css';

const inSite = (id) => Boolean(id) && posix(id.split('?')[0]).startsWith(SITE_PREFIX);

/**
 * Lets the website files copied into src/site-preview/website (scripts/sync-site-preview.mjs) run
 * unchanged inside the admin:
 * - "@/..." resolves inside the copy; next/* and the server-only modules resolve to ./shims.
 * - Their own `import "x.css"` become empty: the CSS goes into the preview iframe instead (styles.js),
 *   so it never touches the admin's page.
 * - process.env.BASE_URL / IMAGE_BASE_URL become VITE_APP_URL, and `window.` / `document.` point at
 *   the preview frame.
 */
export default function sitePreviewPlugin(env) {
  const apiOrigin = (env.VITE_APP_URL || (env.VITE_API_URL || '').replace(/\/api\/v\d+\/?$/, '')).replace(/\/$/, '');
  const processEnv = { BASE_URL: apiOrigin, IMAGE_BASE_URL: apiOrigin, NODE_ENV: 'production' };

  return {
    name: 'ta-site-preview',
    enforce: 'pre',

    resolveId(source, importer, options) {
      if (!importer || !inSite(importer)) return null;
      if (MODULE_SHIMS[source]) return path.join(SHIMS, MODULE_SHIMS[source]);
      if (/\.css$/.test(source)) return EMPTY_CSS;
      if (source.startsWith('@/')) {
        return this.resolve(path.join(SITE_DIR, source.slice(2)), importer, { ...options, skipSelf: true });
      }
      return null;
    },

    load(id) {
      return id === EMPTY_CSS ? 'export default ""' : null;
    },

    transform(code, id) {
      if (!inSite(id) || !/\.(jsx?|mjs)$/.test(id.split('?')[0])) return null;
      let out = code
        .replace(/^\s*["']use (client|server)["'];?/, '')
        .replace(/\bprocess\.env\.(\w+)/g, (_, key) => JSON.stringify(processEnv[key] ?? ''));
      if (/(?<![\w$.])(window|document)\./.test(out)) {
        out = `import { previewWindow as __previewWindow, previewDocument as __previewDocument } from ${JSON.stringify(posix(path.join(SHIMS, 'frameGlobals.js')))};\n`
          + out
            .replace(/(?<![\w$.])window\./g, '__previewWindow().')
            .replace(/(?<![\w$.])document\./g, '__previewDocument().');
      }
      return { code: out, map: null };
    },
  };
}

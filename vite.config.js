import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import sitePreview from './src/site-preview/vitePlugin.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Tailwind only compiles the website styles of the in-admin Live Preview (src/site-preview).
  plugins: [sitePreview(loadEnv(mode, process.cwd(), 'VITE_')), react(), tailwindcss()],
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        api: 'modern-compiler',
        silenceDeprecations: ['color-functions', 'global-builtin', 'import', 'legacy-js-api'],
      },
    },
  },
}))

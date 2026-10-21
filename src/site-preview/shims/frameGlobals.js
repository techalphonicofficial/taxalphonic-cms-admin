// The website code runs in the admin's JS realm but renders into the preview iframe, so its
// `window.` / `document.` calls are rewritten (vitePlugin.js) to these, which return the frame's.
let frameWindow = null;

export const setPreviewFrame = (win) => { frameWindow = win; };
export const previewWindow = () => frameWindow || window;
export const previewDocument = () => (frameWindow || window).document;

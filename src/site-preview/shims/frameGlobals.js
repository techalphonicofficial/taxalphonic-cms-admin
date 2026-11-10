// The website code runs in the admin's JS realm but renders into the preview iframe, so its
// `window.` / `document.` calls are rewritten (vitePlugin.js) to these, which return the frame's.
let frameWindow = null;

export const setPreviewFrame = (win) => {
  frameWindow = win;
  // Website code may check it (e.g. the Auto Popup block shows a note instead of opening by itself).
  if (win) win.__taPreview = true;
};
export const previewWindow = () => frameWindow || window;
export const previewDocument = () => (frameWindow || window).document;

// Reading a local folder (picker with webkitdirectory, or drag & drop) into
// [{ file, dirs }] where dirs is the folder path of the file, e.g. ['Brochures', '2026'].
// MediaLibraryContext.uploadFolder recreates those folders in the Media library.

// Same types as the Upload button; the server limit is 50 MB per file (routes/mediaRoutes.js).
export const ACCEPT = 'image/*,video/*,audio/*,.pdf,.doc,.docx';
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
const DOC_EXT = /\.(pdf|docx?)$/i;
// OS clutter that is never meant to be uploaded.
const IGNORED = /^(\.|thumbs\.db$|desktop\.ini$)/i;

export const isAcceptedFile = (file) =>
  /^(image|video|audio)\//.test(file.type || '') || DOC_EXT.test(file.name);

/** Splits the picked / dropped files into what will upload and what is skipped (with the reason). */
export function sortEntries(entries) {
  const upload = [];
  const skipped = [];
  entries.forEach((entry) => {
    if (IGNORED.test(entry.file.name)) return;
    if (!isAcceptedFile(entry.file)) skipped.push({ ...entry, reason: 'type not supported' });
    else if (entry.file.size > MAX_FILE_SIZE) skipped.push({ ...entry, reason: 'larger than 50 MB' });
    else upload.push(entry);
  });
  return { upload, skipped };
}

/** Files from <input webkitdirectory>: their webkitRelativePath is "Folder/sub/file.png". */
export function entriesFromFileList(fileList) {
  return Array.from(fileList).map((file) => {
    const parts = (file.webkitRelativePath || file.name).split('/').filter(Boolean);
    return { file, dirs: parts.slice(0, -1) };
  });
}

const readEntries = (reader) => new Promise((resolve, reject) => reader.readEntries(resolve, reject));
const entryFile = (entry) => new Promise((resolve, reject) => entry.file(resolve, reject));

async function walk(entry, dirs, out) {
  if (entry.isFile) {
    out.push({ file: await entryFile(entry), dirs });
    return;
  }
  if (!entry.isDirectory) return;
  const reader = entry.createReader();
  // readEntries returns at most ~100 entries per call, so read until it comes back empty.
  for (let batch = await readEntries(reader); batch.length; batch = await readEntries(reader)) {
    for (const child of batch) await walk(child, [...dirs, entry.name], out);
  }
}

/**
 * Files from a drop, including whole folders. Must be called synchronously in the drop handler
 * (the DataTransfer items are gone after the event). Returns { entries, hasFolders } as a promise.
 */
export function entriesFromDrop(dataTransfer) {
  const roots = Array.from(dataTransfer.items || [])
    .filter((item) => item.kind === 'file')
    .map((item) => item.webkitGetAsEntry?.())
    .filter(Boolean);

  if (!roots.length) {
    return Promise.resolve({ entries: Array.from(dataTransfer.files || []).map((file) => ({ file, dirs: [] })), hasFolders: false });
  }

  return (async () => {
    const entries = [];
    for (const root of roots) await walk(root, [], entries);
    return { entries, hasFolders: roots.some((root) => root.isDirectory) };
  })();
}

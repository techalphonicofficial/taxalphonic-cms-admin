/**
 * Promise-based replacement for window.confirm, shown with the themed ConfirmDialog.
 *
 *   if (!(await confirmDialog({ title: 'Delete "Diwali offer"?', note: 'This cannot be undone.' }))) return;
 *   await confirmDialog('Plain question?');           // a string works too
 *
 * Options: title, message, items[], note, tone ('danger' | 'warning'), confirmText, cancelText.
 * confirmDelete(name, { trash, what, extra }) asks the usual delete question.
 * ConfirmHost.jsx (mounted once in App.jsx) renders the dialog; without it this falls back to
 * window.confirm.
 */

let openDialog = null;

/** Called by ConfirmHost: the function that opens the dialog (null when unmounted). */
export function setConfirmOpener(opener) {
  openDialog = opener;
}

export function confirmDialog(options) {
  const opts = typeof options === 'string' ? { title: 'Are you sure?', message: options } : options || {};
  if (!openDialog) return Promise.resolve(window.confirm([opts.title, opts.message].filter(Boolean).join('\n\n')));
  return new Promise((resolve) => openDialog({ ...opts, resolve }));
}

/**
 * The usual "delete X?" question. trash: true = the record goes to the Trash (restorable).
 * what: the kind of record ("FAQ"); extra: a sentence about side effects.
 */
export function confirmDelete(name, { trash = false, what = '', extra = '' } = {}) {
  const label = name ? `"${name}"` : `this ${what || 'item'}`;
  return confirmDialog({
    title: trash ? `Move ${label} to the Trash?` : `Delete ${label}?`,
    message: extra || (trash ? 'It disappears from the website and this list.' : `This ${what || 'item'} will be removed from the website and the admin.`),
    note: trash ? 'You can restore it any time from Trash.' : 'This cannot be undone.',
    tone: trash ? 'warning' : 'danger',
    confirmText: trash ? 'Move to Trash' : 'Delete',
  });
}

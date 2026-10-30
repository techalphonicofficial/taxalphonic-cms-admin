import { toast } from 'react-toastify';
import api from '../services/api';
import { confirmDialog } from '../components/common/confirm';

// Clone a service or a CMS page (backend POST /services|pages/:id/clone): a DRAFT copy with every
// block, text, image and SEO field, titled "<title> (Copy)" with slug "<slug>-copy", then its edit
// page opens so the editor changes the title, slug and whatever differs before publishing.
const KINDS = {
  service: { api: (id) => `/services/${id}/clone`, edit: (id) => `/services/edit/${id}`, label: 'service' },
  page: { api: (id) => `/pages/${id}/clone`, edit: (id) => `/pages/edit/${id}`, label: 'page' },
};

/** Pages the backend refuses to clone (one homepage; landing page drafts have Versions). */
export const canClonePage = (page) => Boolean(page) && page.slug !== 'home' && !String(page.slug || '').startsWith('landing-page/');

/**
 * Asks, clones, opens the copy. `fromEditor`: called from the edit page, where changes may not be
 * saved yet (the copy is made from the saved version). Returns the new record, or null.
 */
export async function cloneRecord(kind, record, navigate, { fromEditor = false } = {}) {
  const k = KINDS[kind];
  if (!k || !record?.id) return null;
  const ok = await confirmDialog({
    title: `Clone "${record.title || `this ${k.label}`}"?`,
    message: `A draft copy is created with every block, text, image and SEO setting, and opens for editing. Change its title, slug (it starts as "${record.slug ? `${record.slug}-copy` : '…-copy'}", or -copy-2 … when that is taken) and what differs, then publish it.`,
    note: fromEditor ? 'The copy is made from the last saved version of this page. Save first if your latest changes should be in it.' : undefined,
    tone: 'primary',
    confirmText: 'Clone as draft',
  });
  if (!ok) return null;
  try {
    const response = await api.post(k.api(record.id));
    const copy = response.data?.data || response.data;
    if (!copy?.id) throw new Error('The copy was not created.');
    toast.success(`Draft copy created: ${copy.title}. Change the title and slug, then publish.`);
    navigate(k.edit(copy.id));
    return copy;
  } catch (error) {
    toast.error(error.response?.data?.message || error.message || `Could not clone this ${k.label}.`);
    return null;
  }
}

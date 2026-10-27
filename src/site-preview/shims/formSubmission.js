import { apiClient } from './apiClient';
// The website's form Server Action, for the preview: nothing is sent, so trying a form in the
// admin never creates a CRM lead.
export async function submitCmsForm() {
  return {
    status: 'error',
    message: 'Preview only: submissions are not sent from the admin. The form works on the live website.',
    fieldErrors: {},
  };
}

// Form popups load the form from the backend, as the website's Server Action does.
export async function loadPublicForm(identifier) {
  const id = String(identifier ?? '').trim();
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return null;
  try {
    const payload = await apiClient(`/api/v1/forms/public/${encodeURIComponent(id)}`);
    return payload?.success ? payload.data : null;
  } catch {
    return null;
  }
}

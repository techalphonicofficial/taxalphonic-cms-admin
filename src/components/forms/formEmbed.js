const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.166:5000/api/v1';

// Public endpoints the website uses to render and submit a form (cms-backend routes/formRoutes.js)
export const publicFormEndpoints = (slug) => [
  { label: 'Load form definition', method: 'GET', url: `${API_URL}/forms/public/${slug || 'your-slug'}` },
  { label: 'Submit (creates a CRM lead)', method: 'POST', url: `${API_URL}/forms/public/${slug || 'your-slug'}/submit` },
];

const SAMPLE_VALUES = {
  text: 'Sample text',
  email: 'jane@example.com',
  phone: '+91 98765 43210',
  number: 1,
  textarea: 'Sample message',
  date: '2026-01-31',
};

// Example JSON body matching the backend's submission validation
export const sampleSubmission = (fields = []) => {
  const body = {};
  fields.forEach(f => {
    if (!f.name) return;
    if (f.type === 'hidden') body[f.name] = f.defaultValue || '';
    else if (f.type === 'checkbox') body[f.name] = f.options?.length ? [f.options[0].value] : true;
    else if (f.type === 'select' || f.type === 'radio') body[f.name] = f.options?.[0]?.value || '';
    else body[f.name] = SAMPLE_VALUES[f.type] ?? '';
  });
  body._hp = '';
  return body;
};

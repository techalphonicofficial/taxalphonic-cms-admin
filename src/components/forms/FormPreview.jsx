import React from 'react';
import { useLiveOptionFields } from './optionSources';

const INPUT_TYPES = { text: 'text', email: 'email', phone: 'tel', number: 'number', date: 'date' };

// Renders a form definition the way the website will. `interactive` lets the
// admin type into the preview; otherwise inputs are disabled (Page Builder block).
const FormPreview = ({ form, interactive = false, compact = false }) => {
  // "Options from" fields show the current site list, as on the website.
  const fields = useLiveOptionFields(form?.fields || []).filter(f => f.type !== 'hidden');
  const disabled = !interactive;

  if (fields.length === 0) {
    return <p className="text-muted mb-0">This form has no visible fields yet.</p>;
  }

  const renderControl = (field) => {
    const id = `preview_${field.id || field.name}`;
    const common = { id, name: field.name, disabled, required: field.required };

    switch (field.type) {
      case 'textarea':
        return <textarea {...common} className="form-control" rows={compact ? 2 : 4} placeholder={field.placeholder} defaultValue={field.defaultValue || ''} />;
      case 'select':
        return (
          <select {...common} className="form-select" defaultValue="">
            <option value="" disabled>{field.placeholder || 'Select an option'}</option>
            {(field.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      case 'radio':
        return (
          <div>
            {(field.options || []).map(o => (
              <div className="form-check" key={o.value}>
                <input className="form-check-input" type="radio" name={`${id}_radio`} id={`${id}_${o.value}`} value={o.value} disabled={disabled} />
                <label className="form-check-label" htmlFor={`${id}_${o.value}`}>{o.label}</label>
              </div>
            ))}
          </div>
        );
      case 'checkbox':
        if (!field.options?.length) {
          return (
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id={id} disabled={disabled} />
              <label className="form-check-label" htmlFor={id}>
                {field.label}{field.required && <span className="text-danger"> *</span>}
              </label>
            </div>
          );
        }
        return (
          <div>
            {field.options.map(o => (
              <div className="form-check" key={o.value}>
                <input className="form-check-input" type="checkbox" id={`${id}_${o.value}`} value={o.value} disabled={disabled} />
                <label className="form-check-label" htmlFor={`${id}_${o.value}`}>{o.label}</label>
              </div>
            ))}
          </div>
        );
      default:
        return (
          <input
            {...common}
            type={INPUT_TYPES[field.type] || 'text'}
            className="form-control"
            placeholder={field.placeholder}
            defaultValue={field.defaultValue || ''}
          />
        );
    }
  };

  return (
    <form onSubmit={e => e.preventDefault()} noValidate>
      {!compact && form?.name && <h4 className="fw-bold mb-1">{form.name}</h4>}
      {!compact && form?.description && <p className="text-muted mb-4">{form.description}</p>}
      <div className="row g-3">
        {fields.map(field => {
          const isSingleCheckbox = field.type === 'checkbox' && !field.options?.length;
          return (
            <div key={field.id || field.name} className={field.width === 'half' ? 'col-md-6' : 'col-12'}>
              {!isSingleCheckbox && (
                <label className="form-label fw-medium" htmlFor={`preview_${field.id || field.name}`}>
                  {field.label}{field.required && <span className="text-danger"> *</span>}
                </label>
              )}
              {renderControl(field)}
              {field.helpText && <div className="form-text">{field.helpText}</div>}
            </div>
          );
        })}
        {/* The website adds an arithmetic captcha to every form (MathCaptcha); shown here as a sample. */}
        <div className="col-12">
          <label className="form-label fw-medium" htmlFor="preview_captcha">
            Security check<span className="text-danger"> *</span>
          </label>
          <div className="d-flex align-items-center gap-2">
            <span className="px-3 py-2 rounded border bg-body-tertiary fw-bold text-nowrap" style={{ borderStyle: 'dashed' }}>7 + 4 =</span>
            <input id="preview_captcha" className="form-control text-center" style={{ width: 90 }} placeholder="?" disabled={disabled} />
            <button type="button" className="btn btn-outline-secondary btn-sm" disabled title="New question"><i className="bi bi-arrow-clockwise" /></button>
          </div>
          {!compact && <div className="form-text">Added automatically on the website; the form cannot be sent without the right answer.</div>}
        </div>
        <div className="col-12">
          <button type="submit" className="btn btn-primary px-4" disabled>
            {form?.settings?.submitButtonText || 'Submit'}
          </button>
          {interactive && <span className="text-muted small ms-3">Preview only, submissions are disabled here.</span>}
        </div>
      </div>
    </form>
  );
};

export default FormPreview;

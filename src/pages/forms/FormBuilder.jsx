import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Breadcrumb from '../../components/common/Breadcrumb';
import SlugStatus from '../../components/common/SlugStatus';
import FormPreview from '../../components/forms/FormPreview';
import { publicFormEndpoints } from '../../components/forms/formEmbed';
import { FormService } from '../../services/form.service';
import { useOptionSources, useServiceCategories, useSourceOptions } from '../../components/forms/optionSources';
import { toast } from 'react-toastify';

const FIELD_TYPES = [
  { type: 'text', label: 'Text', icon: 'bi-input-cursor-text' },
  { type: 'email', label: 'Email', icon: 'bi-envelope' },
  { type: 'phone', label: 'Phone', icon: 'bi-telephone' },
  { type: 'number', label: 'Number', icon: 'bi-123' },
  { type: 'textarea', label: 'Textarea', icon: 'bi-textarea-t' },
  { type: 'select', label: 'Dropdown', icon: 'bi-menu-button-wide' },
  { type: 'radio', label: 'Radio Group', icon: 'bi-ui-radios' },
  { type: 'checkbox', label: 'Checkbox', icon: 'bi-ui-checks' },
  { type: 'date', label: 'Date', icon: 'bi-calendar-event' },
  { type: 'hidden', label: 'Hidden', icon: 'bi-eye-slash' },
];

// Every submission becomes a CRM lead: name + email mapping is required
const MAP_TARGETS = [
  { value: '', label: '— Not mapped (stored in form data) —' },
  { value: 'name', label: 'Lead Name *' },
  { value: 'email', label: 'Lead Email *' },
  { value: 'phone', label: 'Lead Phone' },
  { value: 'website', label: 'Lead Website' },
  { value: 'subject', label: 'Lead Subject' },
  { value: 'message', label: 'Lead Message' },
];

const OPTION_TYPES = ['select', 'radio', 'checkbox'];
const LENGTH_TYPES = ['text', 'email', 'phone', 'textarea'];

const newId = () => `fld_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const toFieldName = (label) => {
  const base = String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_|_$)+/g, '');
  if (!base) return 'field';
  return /^[a-z]/.test(base) ? base : `field_${base}`;
};

const uniqueName = (name, fields, selfId) => {
  let candidate = name;
  let counter = 2;
  while (fields.some(f => f.id !== selfId && f.name === candidate)) {
    candidate = `${name}_${counter++}`;
  }
  return candidate;
};

const makeField = (type, overrides = {}) => ({
  id: newId(),
  type,
  label: FIELD_TYPES.find(t => t.type === type)?.label || 'Field',
  name: '',
  placeholder: '',
  helpText: '',
  required: false,
  width: 'full',
  options: OPTION_TYPES.includes(type) && type !== 'checkbox'
    ? [{ label: 'Option 1', value: 'option_1' }, { label: 'Option 2', value: 'option_2' }]
    : [],
  defaultValue: '',
  validation: {},
  mapTo: '',
  ...overrides,
});

const STARTER_FIELDS = [
  makeField('text', { label: 'Full Name', name: 'fullName', placeholder: 'Your full name', required: true, width: 'half', mapTo: 'name' }),
  makeField('email', { label: 'Email Address', name: 'email', placeholder: 'you@example.com', required: true, width: 'half', mapTo: 'email' }),
  makeField('phone', { label: 'Phone Number', name: 'phone', placeholder: '+91 98765 43210', width: 'half', mapTo: 'phone' }),
  makeField('textarea', { label: 'Message', name: 'message', placeholder: 'How can we help?', mapTo: 'message' }),
];

const DEFAULT_SETTINGS = {
  submitButtonText: 'Submit',
  successMessage: 'Thank you! Your submission has been received.',
  redirectUrl: '',
  source: '',
  sendEmailNotification: true,
};

// ---------------------------------------------------------------------------
// "Options from": typed options, or a live list from the site (services, landing pages, ...)
// ---------------------------------------------------------------------------

const isPlaceholderOptions = (options = []) => options.every((o, i) => o.label === `Option ${i + 1}` && o.value === `option_${i + 1}`);

const OptionsFromSite = ({ field, set }) => {
  const sources = useOptionSources();
  const source = sources?.find(s => s.key === field.optionsSource);
  const categories = useServiceCategories(field.optionsSource === 'services');
  const { options, loading } = useSourceOptions(field);
  const [showAll, setShowAll] = useState(false);

  const pick = (key) => {
    if (key) {
      // The starter "Option 1 / Option 2" make no sense next to a site list.
      set({ optionsSource: key, optionsFilter: {}, ...(isPlaceholderOptions(field.options) ? { options: [] } : {}) });
    } else {
      set({ optionsSource: '', optionsFilter: {}, ...(field.type !== 'checkbox' && !field.options.length ? { options: [{ label: 'Option 1', value: 'option_1' }, { label: 'Option 2', value: 'option_2' }] } : {}) });
    }
  };

  return (
    <div className="col-12">
      <div className="row g-2 align-items-end">
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Options from</label>
          <select className="form-select" value={field.optionsSource || ''} onChange={e => pick(e.target.value)} disabled={!sources}>
            <option value="">Typed by hand (below)</option>
            {(sources || []).map(s => <option key={s.key} value={s.key}>{s.label} ({s.count})</option>)}
          </select>
        </div>
        {source?.filter === 'categoryId' && (
          <div className="col-md-6">
            <label className="form-label small fw-semibold">Only one category</label>
            <select className="form-select" value={field.optionsFilter?.categoryId || ''} onChange={e => set({ optionsFilter: e.target.value ? { categoryId: e.target.value } : {} })}>
              <option value="">All published services</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>
      {field.optionsSource && (
        <div className="mt-2 p-2 px-3 rounded-3 bg-body-tertiary small">
          <div className="mb-1">
            <i className="bi bi-arrow-repeat text-primary me-1"></i>
            {loading ? 'Loading…' : <><b>{options.length}</b> {source?.label?.toLowerCase() || 'items'} right now.</>} The list updates by itself: anything published later appears in the form, anything removed disappears.
          </div>
          {!loading && options.length > 0 && (
            <div className="d-flex flex-wrap gap-1">
              {(showAll ? options : options.slice(0, 12)).map(o => <span key={o.value} className="badge bg-body border text-body fw-normal">{o.label}</span>)}
              {options.length > 12 && (
                <button type="button" className="btn btn-link btn-sm p-0 ms-1" onClick={() => setShowAll(v => !v)}>
                  {showAll ? 'Show less' : `+${options.length - 12} more`}
                </button>
              )}
            </div>
          )}
          {!loading && options.length === 0 && <div className="text-warning-emphasis">Nothing published here yet: the field shows only the extra options below.</div>}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Field editor (one card in the canvas)
// ---------------------------------------------------------------------------

const FieldEditor = ({ field, fields, onChange }) => {
  const set = (patch) => onChange({ ...field, ...patch });
  const setValidation = (key, value) => set({ validation: { ...field.validation, [key]: value } });
  const takenTargets = fields.filter(f => f.id !== field.id && f.mapTo).map(f => f.mapTo);

  const handleLabelChange = (label) => {
    // Keep generating the key from the label until the admin edits it by hand
    const autoName = !field.name || field.name === uniqueName(toFieldName(field.label), fields, field.id);
    set({ label, ...(autoName ? { name: uniqueName(toFieldName(label), fields, field.id) } : {}) });
  };

  const updateOption = (index, key, value) => {
    const options = field.options.map((o, i) => {
      if (i !== index) return o;
      const next = { ...o, [key]: value };
      // Value follows the label until it is edited by hand
      if (key === 'label' && (!o.value || o.value === toFieldName(o.label))) next.value = toFieldName(value);
      return next;
    });
    set({ options });
  };

  return (
    <div className="row g-3">
      <div className="col-md-6">
        <label className="form-label small fw-semibold">{field.type === 'hidden' ? 'Label (internal)' : 'Label'}</label>
        <input type="text" className="form-control" value={field.label} onChange={e => handleLabelChange(e.target.value)} />
      </div>
      <div className="col-md-6">
        <label className="form-label small fw-semibold">Field Key</label>
        <input
          type="text"
          className="form-control font-monospace"
          value={field.name}
          onChange={e => set({ name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
          placeholder="e.g. companyName"
        />
        <div className="form-text">Sent by the website on submit. Letters, numbers, underscores.</div>
      </div>

      {!['hidden', 'checkbox', 'radio'].includes(field.type) && (
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Placeholder</label>
          <input type="text" className="form-control" value={field.placeholder} onChange={e => set({ placeholder: e.target.value })} />
        </div>
      )}

      {field.type !== 'hidden' && (
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Help Text</label>
          <input type="text" className="form-control" value={field.helpText} onChange={e => set({ helpText: e.target.value })} placeholder="Shown below the field" />
        </div>
      )}

      {(field.type === 'hidden' || !OPTION_TYPES.includes(field.type)) && (
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Default Value</label>
          <input type="text" className="form-control" value={field.defaultValue ?? ''} onChange={e => set({ defaultValue: e.target.value })} placeholder={field.type === 'hidden' ? 'e.g. campaign name' : ''} />
        </div>
      )}

      <div className="col-md-6">
        <label className="form-label small fw-semibold">Save to CRM Lead as</label>
        <select className="form-select" value={field.mapTo} onChange={e => set({ mapTo: e.target.value, ...(['name', 'email'].includes(e.target.value) ? { required: true } : {}) })}>
          {MAP_TARGETS.map(t => (
            <option key={t.value} value={t.value} disabled={Boolean(t.value) && (takenTargets.includes(t.value) || (t.value === 'email' && field.type !== 'email'))}>
              {t.label}{t.value && takenTargets.includes(t.value) ? ' (used)' : ''}{t.value === 'email' && field.type !== 'email' ? ' (Email fields only)' : ''}
            </option>
          ))}
        </select>
      </div>

      {field.type !== 'hidden' && (
        <>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Width</label>
            <select className="form-select" value={field.width} onChange={e => set({ width: e.target.value })}>
              <option value="full">Full</option>
              <option value="half">Half</option>
            </select>
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <div className="form-check form-switch mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id={`req_${field.id}`}
                checked={field.required}
                disabled={['name', 'email'].includes(field.mapTo)}
                onChange={e => set({ required: e.target.checked })}
              />
              <label className="form-check-label small fw-semibold" htmlFor={`req_${field.id}`}>Required</label>
            </div>
          </div>
        </>
      )}

      {OPTION_TYPES.includes(field.type) && <OptionsFromSite field={field} set={set} />}

      {OPTION_TYPES.includes(field.type) && (
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label small fw-semibold mb-0">
              {field.optionsSource
                ? <>Extra options <span className="text-muted fw-normal">(optional, shown after the list, e.g. "Other")</span></>
                : <>Options {field.type === 'checkbox' && <span className="text-muted fw-normal">(leave empty for a single "I agree" checkbox)</span>}</>}
            </label>
            <button
              type="button"
              className="btn btn-sm btn-light text-primary rounded-pill px-3 fw-medium"
              onClick={() => set({ options: [...field.options, { label: `Option ${field.options.length + 1}`, value: `option_${field.options.length + 1}` }] })}
            >
              <i className="bi bi-plus me-1"></i> Add Option
            </button>
          </div>
          {field.options.map((opt, idx) => (
            <div key={idx} className="d-flex gap-2 mb-2">
              <input type="text" className="form-control" placeholder="Label" value={opt.label} onChange={e => updateOption(idx, 'label', e.target.value)} />
              <input type="text" className="form-control font-monospace" placeholder="Value" value={opt.value} onChange={e => updateOption(idx, 'value', e.target.value)} />
              <button
                type="button"
                className="btn btn-sm btn-light text-danger rounded-circle p-2 d-flex align-items-center justify-content-center"
                style={{ width: '38px', height: '38px' }}
                onClick={() => set({ options: field.options.filter((_, i) => i !== idx) })}
                title="Remove option"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {LENGTH_TYPES.includes(field.type) && (
        <>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Min Length</label>
            <input type="number" min="0" className="form-control" value={field.validation?.minLength ?? ''} onChange={e => setValidation('minLength', e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Max Length</label>
            <input type="number" min="1" className="form-control" value={field.validation?.maxLength ?? ''} onChange={e => setValidation('maxLength', e.target.value)} placeholder={field.type === 'textarea' ? '5000' : '500'} />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Pattern (regex)</label>
            <input type="text" className="form-control font-monospace" value={field.validation?.pattern ?? ''} onChange={e => setValidation('pattern', e.target.value)} placeholder="^[A-Z0-9]{15}$" />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Pattern Error</label>
            <input type="text" className="form-control" value={field.validation?.patternMessage ?? ''} onChange={e => setValidation('patternMessage', e.target.value)} placeholder="Invalid GSTIN" />
          </div>
        </>
      )}

      {field.type === 'number' && (
        <>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Min</label>
            <input type="number" className="form-control" value={field.validation?.min ?? ''} onChange={e => setValidation('min', e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Max</label>
            <input type="number" className="form-control" value={field.validation?.max ?? ''} onChange={e => setValidation('max', e.target.value)} />
          </div>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Builder page
// ---------------------------------------------------------------------------

const FormBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [activeTab, setActiveTab] = useState('builder');
  const [meta, setMeta] = useState({ name: '', slug: '', description: '', status: 'active' });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [fields, setFields] = useState(isEditMode ? [] : STARTER_FIELDS);
  const [expandedId, setExpandedId] = useState(null);
  const [usages, setUsages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showLivePreview, setShowLivePreview] = useState(true);

  useEffect(() => {
    if (!isEditMode) return;
    const fetchForm = async () => {
      setIsLoading(true);
      try {
        const res = await FormService.getById(id);
        const form = res.data;
        setMeta({
          name: form.name || '',
          slug: form.slug || '',
          description: form.description || '',
          status: form.status || 'active',
        });
        setSettings({ ...DEFAULT_SETTINGS, ...(form.settings || {}) });
        setFields((form.fields || []).map(f => ({ ...makeField(f.type), ...f, id: f.id || newId() })));
        setUsages(form.usages || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load form.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchForm();
  }, [id, isEditMode]);

  const addField = (type) => {
    const mapped = fields.map(f => f.mapTo);
    // Auto-map the first email/phone field to the CRM lead
    const autoMap = (type === 'email' || type === 'phone') && !mapped.includes(type) ? type : '';
    const label = FIELD_TYPES.find(t => t.type === type)?.label || 'Field';
    const field = makeField(type, {
      label,
      name: uniqueName(toFieldName(label), fields),
      mapTo: autoMap,
      required: autoMap === 'email',
    });
    setFields([...fields, field]);
    setExpandedId(field.id);
  };

  const updateField = (updated) => setFields(prev => prev.map(f => f.id === updated.id ? updated : f));
  const removeField = (fieldId) => setFields(prev => prev.filter(f => f.id !== fieldId));
  const duplicateField = (field) => {
    const copy = { ...field, id: newId(), label: `${field.label} (copy)`, name: uniqueName(field.name, fields), mapTo: '' };
    const index = fields.findIndex(f => f.id === field.id);
    const next = [...fields];
    next.splice(index + 1, 0, copy);
    setFields(next);
    setExpandedId(copy.id);
  };
  const moveField = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setFields(next);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const next = Array.from(fields);
    const [item] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, item);
    setFields(next);
  };

  const mappedTargets = fields.map(f => f.mapTo).filter(Boolean);
  const missingTargets = ['name', 'email'].filter(t => !mappedTargets.includes(t));

  const handleSave = async () => {
    setServerErrors([]);
    setFieldErrors({});
    if (!meta.name.trim()) {
      toast.error('Form name is required.');
      setActiveTab('settings');
      return;
    }
    if (missingTargets.length > 0) {
      toast.error(`Map a field to the lead ${missingTargets.join(' and ')} before saving.`);
      setActiveTab('builder');
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...meta, settings, fields };
      if (isEditMode) {
        await FormService.update(id, payload);
        toast.success('Form updated successfully.');
      } else {
        await FormService.create(payload);
        toast.success('Form created successfully.');
      }
      navigate('/forms');
    } catch (err) {
      const res = err.response?.data;
      const errors = Array.isArray(res?.errors) ? res.errors : [];
      setServerErrors(errors);

      // Backend reports field problems as "fields[3].name"; pin them to the field ids
      // of the payload that was sent, so they stay on the right card after reordering
      const byField = {};
      errors.forEach(e => {
        const match = /^fields\[(\d+)\]/.exec(e.field || '');
        const field = match && fields[Number(match[1])];
        if (field) (byField[field.id] = byField[field.id] || []).push(e.message);
      });
      setFieldErrors(byField);

      // Jump to where the first problem is
      const firstFieldId = Object.keys(byField)[0];
      if (firstFieldId) {
        setExpandedId(firstFieldId);
        setActiveTab('builder');
      } else if (errors.some(e => ['name', 'slug'].includes(e.field) || String(e.field).startsWith('settings'))) {
        setActiveTab('settings');
      }
      toast.error(res?.message || 'Failed to save form.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="pb-5">
      {/* Header */}
      <div className="ta-editor-bar d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div className="w-100">
          <Breadcrumb items={[
            { label: 'Services', link: '/services' },
            { label: 'Forms', link: '/forms' },
            { label: isEditMode ? 'Edit' : 'New' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>
            {isEditMode ? `Edit Form${meta.name ? `: ${meta.name}` : ''}` : 'Create New Form'}
          </h2>
        </div>
        <div className="d-flex gap-2 w-100 justify-content-end justify-content-md-auto">
          <Link to="/forms" className="btn btn-outline-secondary shadow-sm">Discard</Link>
          <button type="button" className="btn btn-primary shadow-sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...</>
            ) : (
              <><i className="bi bi-save me-1"></i> Save Form</>
            )}
          </button>
        </div>
      </div>

      {serverErrors.length > 0 && (
        <div className="alert alert-danger">
          <div className="fw-semibold mb-1">Please fix the following:</div>
          <ul className="mb-0 ps-3">
            {serverErrors.map((e, i) => <li key={i}>{e.message || String(e)}</li>)}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 gap-2">
        {[
          { key: 'builder', label: 'Fields', icon: 'bi-ui-checks-grid' },
          { key: 'settings', label: 'Settings', icon: 'bi-sliders' },
          { key: 'preview', label: 'Preview', icon: 'bi-eye' },
        ].map(tab => (
          <li className="nav-item" key={tab.key}>
            <button type="button" className={`nav-link rounded-pill ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
              <i className={`bi ${tab.icon} me-1`}></i> {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Builder Tab */}
      {activeTab === 'builder' && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="d-flex flex-column flex-md-row gap-4">
            <div className="flex-grow-1 w-100" style={{ minWidth: 0 }}>
              {missingTargets.length > 0 && (
                <div className="alert alert-warning py-2 small">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Submissions are saved as CRM leads. Set "Save to CRM Lead as" to <strong>{missingTargets.join(' and ')}</strong> on one field each.
                </div>
              )}
              <Droppable droppableId="form-canvas">
                {(provided, snapshot) => (
                  <div
                    className={`p-1 rounded ${snapshot.isDraggingOver ? 'bg-light' : ''}`}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{ minHeight: '400px' }}
                  >
                    {fields.length === 0 && (
                      <div className="text-center py-5 text-muted border border-dashed rounded">
                        <i className="bi bi-ui-checks-grid display-4"></i>
                        <p className="mt-3">Click a field type from the sidebar to start building your form.</p>
                      </div>
                    )}

                    {fields.map((field, index) => {
                      const typeMeta = FIELD_TYPES.find(t => t.type === field.type);
                      const isOpen = expandedId === field.id;
                      return (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`card mb-3 shadow-sm rounded-4 ${fieldErrors[field.id] ? 'border border-danger' : 'border-0'} ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                            >
                              <div className="card-header d-flex justify-content-between align-items-center bg-transparent border-bottom-0 py-3 px-4">
                                <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
                                  <span {...provided.dragHandleProps} className="text-muted cursor-pointer" title="Drag to reorder">
                                    <i className="bi bi-grip-vertical fs-5"></i>
                                  </span>
                                  <button type="button" className="btn btn-link text-decoration-none text-dark p-0 d-flex align-items-center gap-2 text-start" style={{ minWidth: 0 }} onClick={() => setExpandedId(isOpen ? null : field.id)}>
                                    <i className={`bi ${typeMeta?.icon || 'bi-input-cursor'} text-primary`}></i>
                                    <span className="fw-bold text-truncate">{field.label || field.name || 'Untitled field'}</span>
                                    {field.required && <span className="text-danger">*</span>}
                                  </button>
                                  <span className="badge bg-light text-muted border">{typeMeta?.label}</span>
                                  {field.mapTo && <span className="badge bg-primary-subtle text-primary border border-primary-subtle">CRM: {field.mapTo}</span>}
                                  {field.width === 'half' && <span className="badge bg-light text-muted border">½</span>}
                                  {fieldErrors[field.id] && <span className="badge bg-danger-subtle text-danger border border-danger-subtle"><i className="bi bi-exclamation-circle me-1"></i>Fix</span>}
                                </div>
                                <div className="d-flex align-items-center gap-1">
                                  <button type="button" className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} onClick={() => moveField(index, -1)} disabled={index === 0} title="Move Up">
                                    <i className="bi bi-arrow-up text-secondary"></i>
                                  </button>
                                  <button type="button" className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} onClick={() => moveField(index, 1)} disabled={index === fields.length - 1} title="Move Down">
                                    <i className="bi bi-arrow-down text-secondary"></i>
                                  </button>
                                  <button type="button" className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} onClick={() => duplicateField(field)} title="Duplicate Field">
                                    <i className="bi bi-files text-secondary"></i>
                                  </button>
                                  <button type="button" className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} onClick={() => setExpandedId(isOpen ? null : field.id)} title={isOpen ? 'Collapse' : 'Edit Field'}>
                                    <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-pencil'} text-secondary`}></i>
                                  </button>
                                  <button type="button" className="btn btn-sm btn-light text-danger rounded-circle p-2 d-flex align-items-center justify-content-center ms-2" style={{ width: '32px', height: '32px' }} onClick={() => removeField(field.id)} title="Remove Field">
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              </div>
                              {isOpen && (
                                <div className="card-body px-4 pt-0 pb-4">
                                  {fieldErrors[field.id] && (
                                    <div className="alert alert-danger py-2 small">
                                      {fieldErrors[field.id].map((m, i) => <div key={i}>{m}</div>)}
                                    </div>
                                  )}
                                  <FieldEditor field={field} fields={fields} onChange={updateField} />
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Sidebar: Field palette */}
            <div className="flex-shrink-0 w-100" style={{ maxWidth: '400px' }}>
              <div className="sticky-top ta-below-bar d-flex flex-column gap-3" style={{ zIndex: 10, maxHeight: 'calc(100vh - var(--ta-sticky-offset, 0px) - 7rem)', overflowY: 'auto' }}>
                <div className="premium-form-card w-100">
                  <div className="card-body p-4">
                    <h6 className="mb-3 fw-bold text-muted text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>Add Field</h6>
                    <div className="row g-2">
                      {FIELD_TYPES.map(ft => (
                        <div className="col-6" key={ft.type}>
                          <button type="button" className="premium-block-btn w-100" onClick={() => addField(ft.type)} title={`Add ${ft.label} field`}>
                            <i className={`bi ${ft.icon} me-2`}></i>
                            <span className="flex-grow-1 text-start text-truncate">{ft.label}</span>
                            <i className="bi bi-plus ms-1"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="premium-form-card w-100">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0 fw-bold text-muted text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>Live Preview</h6>
                      <button type="button" className="btn btn-sm btn-link text-decoration-none p-0" onClick={() => setShowLivePreview(v => !v)}>
                        {showLivePreview ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {showLivePreview && (
                      <div style={{ fontSize: '0.875rem' }}>
                        <FormPreview form={{ name: meta.name, description: meta.description, fields, settings }} interactive compact />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DragDropContext>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent border-bottom-0 pb-0 pt-4">
                <h5 className="fw-bold mb-0">General</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Form Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))} placeholder="e.g. GST Registration Enquiry" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Slug</label>
                    <input type="text" className="form-control font-monospace" value={meta.slug} onChange={e => setMeta(m => ({ ...m, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} placeholder="auto-generated from name" />
                    <div className="form-text">Used by the website: <code>/forms/public/{meta.slug || 'your-slug'}</code></div>
                    <SlugStatus type="form" slug={meta.slug} id={id} prefix="" onUseSuggestion={(next) => setMeta((m) => ({ ...m, slug: next }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea className="form-control" rows="2" value={meta.description} onChange={e => setMeta(m => ({ ...m, description: e.target.value }))} placeholder="Internal note, also returned to the website" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom-0 pb-0 pt-4">
                <h5 className="fw-bold mb-0">After Submission</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Submit Button Text</label>
                    <input type="text" className="form-control" value={settings.submitButtonText} onChange={e => setSettings(s => ({ ...s, submitButtonText: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Redirect URL <span className="text-muted fw-normal">(optional)</span></label>
                    <input type="text" className="form-control" value={settings.redirectUrl} onChange={e => setSettings(s => ({ ...s, redirectUrl: e.target.value }))} placeholder="/thank-you or https://..." />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Success Message</label>
                    <textarea className="form-control" rows="2" value={settings.successMessage} onChange={e => setSettings(s => ({ ...s, successMessage: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">CRM Lead Source</label>
                    <input type="text" className="form-control" value={settings.source} onChange={e => setSettings(s => ({ ...s, source: e.target.value }))} placeholder={`Form: ${meta.name || 'Form name'}`} />
                    <div className="form-text">Shown as "Source" in CRM → Leads.</div>
                  </div>
                  <div className="col-md-6 d-flex align-items-center">
                    <div className="form-check form-switch mt-3">
                      <input className="form-check-input" type="checkbox" id="sendEmailNotification" checked={settings.sendEmailNotification} onChange={e => setSettings(s => ({ ...s, sendEmailNotification: e.target.checked }))} />
                      <label className="form-check-label fw-semibold" htmlFor="sendEmailNotification">Email admin on every submission</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-transparent border-bottom pb-3 pt-4">
                <h6 className="fw-bold text-uppercase mb-0 text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Publishing</h6>
              </div>
              <div className="card-body">
                <label className="form-label fw-semibold">Status</label>
                <select className="form-select" value={meta.status} onChange={e => setMeta(m => ({ ...m, status: e.target.value }))}>
                  <option value="active">Active (accepting submissions)</option>
                  <option value="inactive">Inactive (hidden on website)</option>
                </select>
              </div>
            </div>

            {isEditMode && (
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-bottom pb-3 pt-4">
                  <h6 className="fw-bold text-uppercase mb-0 text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Attached To</h6>
                </div>
                <div className="card-body">
                  {usages.length === 0 ? (
                    <p className="text-muted small mb-0">Not attached to any page yet. Add a "Form" block in the Page Builder of a page, service or blog.</p>
                  ) : (
                    <ul className="list-unstyled mb-0">
                      {usages.map(u => (
                        <li key={`${u.type}_${u.id}`} className="mb-2 d-flex align-items-center gap-2">
                          <span className="badge bg-light text-muted border text-capitalize">{u.type}</span>
                          <Link to={u.type === 'page' ? `/pages/edit/${u.id}` : u.type === 'service' ? `/services/edit/${u.id}` : `/blogs/edit/${u.id}`} className="text-decoration-none text-truncate">
                            {u.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <hr />
                  <Link to={`/crm/leads?formId=${id}`} className="small text-decoration-none">
                    <i className="bi bi-inbox me-1"></i> View submissions in CRM
                  </Link>
                </div>
              </div>
            )}

            {isEditMode && (
              <div className="card border-0 shadow-sm mt-4">
                <div className="card-header bg-transparent border-bottom pb-3 pt-4">
                  <h6 className="fw-bold text-uppercase mb-0 text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Website / API</h6>
                </div>
                <div className="card-body small">
                  {publicFormEndpoints(meta.slug).map(ep => (
                    <div key={ep.label} className="mb-2">
                      <div className="text-muted">{ep.label}</div>
                      <code className="text-break">{ep.method} {ep.url}</code>
                    </div>
                  ))}
                  {meta.status === 'inactive' && <div className="text-warning mt-2"><i className="bi bi-exclamation-triangle me-1"></i>Inactive forms return 404 to the website.</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4 p-md-5" style={{ maxWidth: 760 }}>
            <FormPreview form={{ name: meta.name, description: meta.description, fields, settings }} interactive />
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilder;

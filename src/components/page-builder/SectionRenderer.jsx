import React, { useMemo } from 'react';
import JoditEditor from 'jodit-react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import { FormService } from '../../services/form.service';
import { PackageService } from '../../services/package.service';
import FormPreview from '../forms/FormPreview';
import { ButtonField, ICON_HINT, RepeaterField, SelectField, TextField } from './blockFields';
import SchemaFields from './SchemaFields';
import SearchableSelect from '../common/SearchableSelect';
import { HOME_SCHEMAS } from './homeBlocks';
import { JOURNEY_SCHEMAS } from './journeyBlocks';
import { COMMON_SCHEMAS } from './commonBlocks';
import { LANDING_SCHEMAS } from './landingBlocks';
import { TOOL_SCHEMAS, toolSchemaFor } from './toolBlocks';
import { DEFAULT_SETTINGS } from '../../site-preview/website/components/tax-alphonic/tools/toolDefaults';
import { imageHint } from '../../config/imageSizes';
import { JODIT_CLEAN_PASTE } from './cleanPastedHtml';

const joditConfig = {
  enter: 'P',
  toolbarAdaptive: false,
  toolbarSticky: false,
  showCharsCounter: false,
  showWordsCounter: false,
  showXPathInStatusbar: false,
  height: 400,
  buttons: [
    'paragraph', '|',
    'bold', 'italic', 'underline', 'brush', '|',
    'ul', 'ol', '|',
    'outdent', 'indent', '|',
    'link', 'image', '|',
    'align', 'undo', 'redo'
  ],
  controls: {
    paragraph: {
      text: 'Format',
      icon: false,
      list: {
        p: 'Normal',
        h1: 'Heading 1',
        h2: 'Heading 2',
        h3: 'Heading 3',
        h4: 'Heading 4',
        h5: 'Heading 5',
        h6: 'Heading 6'
      }
    }
  }
};

// Helper: editor props bound to one payload key.
const usePayload = (data, onChange) => {
  const payload = data?.payload || {};
  const set = (key) => (value) => onChange({ ...data, payload: { ...payload, [key]: value } });
  return [payload, set];
};

// Form controls for specific blocks
const HeroBannerForm = ({ data, onChange }) => {
  const [p, set] = usePayload(data, onChange);
  const metaId = React.useId();
  // "Text on the hero" (website ApiServicePage Hero): with a background image that has its own
  // text, the hero can show only the image, or only the buttons on it.
  const textMode = p.textMode || 'show';
  const bare = textMode !== 'show';

  return (
    <div className="row g-3">
      <SelectField
        label="Text on the hero"
        value={textMode}
        onChange={set('textMode')}
        options={[
          { value: 'show', label: 'Show text (heading, text, buttons…)' },
          { value: 'buttons', label: 'Only the buttons (no text)' },
          { value: 'hide', label: 'Hide everything (only the background image)' },
        ]}
        hint="For a background image that already has its text on it (Background panel above). The heading stays hidden in the page for Google."
      />
      {bare && (
        <SelectField
          label="Hero height"
          value={p.height || 'md'}
          onChange={set('height')}
          options={[
            { value: 'sm', label: 'Small (280 px)' },
            { value: 'md', label: 'Medium (400 px)' },
            { value: 'lg', label: 'Large (520 px)' },
            { value: 'xl', label: 'Extra large (640 px)' },
            { value: 'r31', label: 'Image shape 3:1 (wide banner, e.g. 1920 × 640)' },
            { value: 'r169', label: 'Image shape 16:9 (e.g. 1920 × 1080)' },
          ]}
          hint="Image with text on it: pick the shape of your image, so phones show the whole image. Fixed heights crop the sides on phones. Background size: “cover”."
        />
      )}
      {textMode === 'buttons' && (
        <SelectField
          label="Buttons position"
          value={p.buttonsAlign || 'center'}
          onChange={set('buttonsAlign')}
          options={[{ value: 'left', label: 'Bottom left' }, { value: 'center', label: 'Bottom centre' }, { value: 'right', label: 'Bottom right' }]}
        />
      )}
      {!bare && <>
      <TextField label="Eyebrow" value={p.eyebrow} onChange={set('eyebrow')} placeholder="e.g. 📑 GST" hint="Small label above the heading. Empty = service category name." />
      <TextField label="Highlighted words" value={p.highlight} onChange={set('highlight')} placeholder="e.g. made simple" hint="Must be the end of the heading. Empty = last two words." />
      </>}
      <TextField className="col-12" label={bare ? 'Heading (hidden, for Google)' : 'Heading'} value={p.heading} onChange={set('heading')} placeholder="e.g. GST Registration made simple" />
      {!bare && <>
      <TextField className="col-12" label="Sub Heading" value={p.subHeading} onChange={set('subHeading')} textarea />
      <SelectField
        label="Right-side image"
        value={p.imageMode || 'auto'}
        onChange={set('imageMode')}
        options={[
          { value: 'auto', label: 'Automatic (this image, else the service banner/thumbnail)' },
          { value: 'custom', label: 'Only the image chosen here' },
          { value: 'none', label: 'No image (text full width)' },
        ]}
        hint="With a background (Background panel above), Automatic shows only the image chosen here, not the service thumbnail."
      />
      {(p.imageMode || 'auto') !== 'none' && (
        <TextField label="Image" media value={p.backgroundImage} onChange={set('backgroundImage')} placeholder="Choose from Media or paste a URL" hint={`Shown on the right. ${imageHint('serviceHero')}`} />
      )}
      </>}
      {textMode !== 'hide' && <>
      <TextField label="Price on main button" value={p.price} onChange={set('price')} placeholder="e.g. 1999" hint="Appended as “— ₹1,999”." />
      <ButtonField label="Main button" value={p.primaryButton} onChange={set('primaryButton')} />
      <ButtonField label="Second button" value={p.secondaryButton} onChange={set('secondaryButton')} />
      </>}
      {!bare && <>
      <div className="col-12">
        <div className="form-check">
          <input className="form-check-input" type="checkbox" id={metaId} checked={p.showMeta !== false} onChange={e => set('showMeta')(e.target.checked)} />
          <label className="form-check-label" htmlFor={metaId}>Show reading time pill (when the service has a reading time)</label>
        </div>
      </div>
      <RepeaterField label="Badges (pills under the heading)" items={p.badges} onChange={set('badges')} addLabel="Add badge"
        fields={[{ key: 'icon', placeholder: 'Icon', width: 'col-3' }, { key: 'text', placeholder: 'e.g. 100% Online Process', width: 'col-9' }]} />
      <RepeaterField label="Stats (under the buttons)" items={p.stats} onChange={set('stats')} addLabel="Add stat"
        fields={[{ key: 'value', placeholder: 'e.g. 12,400+', width: 'col-4' }, { key: 'label', placeholder: 'e.g. businesses served', width: 'col-8' }]} />
      <RepeaterField label="Floating chips around the image" items={p.chips} onChange={set('chips')} addLabel="Add chip"
        fields={[{ key: 'icon', placeholder: ICON_HINT }]} />
      </>}
    </div>
  );
};



const FaqForm = ({ data, onChange }) => {
  const faqs = data?.payload?.faqs || [];

  const addFaq = () => {
    onChange({
      ...data,
      payload: {
        ...data.payload,
        faqs: [...faqs, { question: '', answer: '' }]
      }
    });
  };

  const updateFaq = (index, key, value) => {
    const updated = [...faqs];
    updated[index][key] = value;
    onChange({
      ...data,
      payload: { ...data.payload, faqs: updated }
    });
  };

  const removeFaq = (index) => {
    const updated = [...faqs];
    updated.splice(index, 1);
    onChange({
      ...data,
      payload: { ...data.payload, faqs: updated }
    });
  };

  return (
    <div>
      <div className="mb-4">
        <label className="form-label text-muted text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>FAQ Section Title</label>
        <input 
          type="text" 
          className="premium-input" 
          value={data?.payload?.title || ''} 
          placeholder="e.g. Frequently Asked Questions"
          onChange={e => onChange({ ...data, payload: { ...data.payload, title: e.target.value } })} 
        />
      </div>
      <div className="d-flex justify-content-between align-items-center mb-2 mb-3">
        <label className="form-label text-muted text-uppercase mb-0" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>
          Questions & Answers
        </label>
        <button type="button" className="btn btn-sm btn-light text-primary rounded-pill px-3 fw-medium transition-all" onClick={addFaq}>
          <i className="bi bi-plus me-1"></i> Add FAQ
        </button>
      </div>
      
      {faqs.map((faq, idx) => (
        <div key={idx} className="p-3 mb-3 border rounded-4 bg-white transition-all hover-shadow-sm">
          <div className="d-flex gap-3">
            <div className="flex-grow-1">
              <input type="text" className="form-control mb-2" placeholder="Question" value={faq.question} onChange={e => updateFaq(idx, 'question', e.target.value)} />
              <textarea className="form-control" placeholder="Answer" rows="2" value={faq.answer} onChange={e => updateFaq(idx, 'answer', e.target.value)}></textarea>
            </div>
            <div className="d-flex flex-column align-items-center justify-content-center">
              <button 
                type="button" 
                className="btn btn-sm btn-light text-danger rounded-circle p-2 d-flex align-items-center justify-content-center transition-all"
                style={{ width: '32px', height: '32px' }}
                onClick={() => removeFaq(idx)}
                title="Remove FAQ"
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// New form for Overview
const OverviewForm = ({ data, onChange }) => {
  const { theme } = useTheme();
  const editorConfig = useMemo(() => ({
    ...joditConfig,
    ...JODIT_CLEAN_PASTE,
    theme: theme === 'dark' ? 'dark' : 'default'
  }), [theme]);

  return (
    <div className="row g-3">
      <div className="col-12">
        <label className="form-label">Heading</label>
        <input 
          type="text" 
          className="form-control" 
          value={data?.payload?.heading || ''} 
          onChange={e => onChange({ ...data, payload: { ...data.payload, heading: e.target.value } })} 
          placeholder="e.g., Service Overview" 
        />
      </div>
      <div className="col-12">
        <label className="form-label">Content (HTML)</label>
        <div>
          <JoditEditor 
            value={data?.payload?.content || ''} 
            config={editorConfig}
            onBlur={(content) => onChange({ ...data, payload: { ...data.payload, content } })} 
          />
        </div>
      </div>
    </div>
  );
};

// New form for WhyUs
const WhyUsForm = ({ data, onChange }) => {
  const reasons = data?.payload?.reasons || [];
  const addReason = () => onChange({ ...data, payload: { ...data.payload, reasons: [...reasons, { title: '', description: '', icon: '' }] } });
  const updateReason = (i, k, v) => { const r = [...reasons]; r[i][k] = v; onChange({ ...data, payload: { ...data.payload, reasons: r } }); };
  const removeReason = (i) => { const r = [...reasons]; r.splice(i, 1); onChange({ ...data, payload: { ...data.payload, reasons: r } }); };

  return (
    <div>
      <div className="mb-4">
        <label className="form-label text-muted text-uppercase">Section Title</label>
        <input type="text" className="premium-input" value={data?.payload?.title || ''} onChange={e => onChange({ ...data, payload: { ...data.payload, title: e.target.value } })} placeholder="e.g., Why Choose Us" />
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <label className="form-label text-muted text-uppercase mb-0">Reasons</label>
        <button type="button" className="btn btn-sm btn-light text-primary rounded-pill px-3 fw-medium" onClick={addReason}><i className="bi bi-plus me-1"></i> Add Reason</button>
      </div>
      {reasons.map((feat, idx) => (
        <div key={idx} className="p-3 mb-3 border rounded-4 bg-white hover-shadow-sm d-flex gap-3">
          <div className="flex-grow-1">
            <input type="text" className="form-control mb-2" placeholder="Title" value={feat.title} onChange={e => updateReason(idx, 'title', e.target.value)} />
            <input type="text" className="form-control mb-2" placeholder="Description" value={feat.description} onChange={e => updateReason(idx, 'description', e.target.value)} />
            <input type="text" className="form-control" placeholder={ICON_HINT} value={feat.icon} onChange={e => updateReason(idx, 'icon', e.target.value)} />
          </div>
          <button type="button" className="btn btn-sm btn-light text-danger rounded-circle p-2" onClick={() => removeReason(idx)}><i className="bi bi-trash"></i></button>
        </div>
      ))}
    </div>
  );
};

// New form for Services Included
const ServicesIncludedForm = ({ data, onChange }) => {
  const services = data?.payload?.services || [];
  const addService = () => onChange({ ...data, payload: { ...data.payload, services: [...services, { title: '', description: '', icon: '' }] } });
  const updateService = (i, k, v) => { const s = [...services]; s[i][k] = v; onChange({ ...data, payload: { ...data.payload, services: s } }); };
  const removeService = (i) => { const s = [...services]; s.splice(i, 1); onChange({ ...data, payload: { ...data.payload, services: s } }); };

  return (
    <div>
      <div className="mb-4">
        <label className="form-label text-muted text-uppercase">Section Title</label>
        <input type="text" className="premium-input" value={data?.payload?.title || ''} onChange={e => onChange({ ...data, payload: { ...data.payload, title: e.target.value } })} placeholder="e.g., Services Included" />
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <label className="form-label text-muted text-uppercase mb-0">Services</label>
        <button type="button" className="btn btn-sm btn-light text-primary rounded-pill px-3 fw-medium" onClick={addService}><i className="bi bi-plus me-1"></i> Add Service</button>
      </div>
      {services.map((svc, idx) => (
        <div key={idx} className="p-3 mb-3 border rounded-4 bg-white hover-shadow-sm d-flex gap-3">
          <div className="flex-grow-1">
            <input type="text" className="form-control mb-2" placeholder="Title" value={svc.title} onChange={e => updateService(idx, 'title', e.target.value)} />
            <textarea className="form-control mb-2" placeholder="Description" rows="2" value={svc.description} onChange={e => updateService(idx, 'description', e.target.value)} />
            <input type="text" className="form-control" placeholder={ICON_HINT} value={svc.icon} onChange={e => updateService(idx, 'icon', e.target.value)} />
          </div>
          <button type="button" className="btn btn-sm btn-light text-danger rounded-circle p-2" onClick={() => removeService(idx)}><i className="bi bi-trash"></i></button>
        </div>
      ))}
    </div>
  );
};

// New form for Our Process
const OurProcessForm = ({ data, onChange }) => {
  const steps = data?.payload?.steps || [];
  const addStep = () => onChange({ ...data, payload: { ...data.payload, steps: [...steps, { title: '', description: '', duration: '' }] } });
  const updateStep = (i, k, v) => { const s = [...steps]; s[i][k] = v; onChange({ ...data, payload: { ...data.payload, steps: s } }); };
  const removeStep = (i) => { const s = [...steps]; s.splice(i, 1); onChange({ ...data, payload: { ...data.payload, steps: s } }); };

  return (
    <div>
      <div className="mb-4">
        <label className="form-label text-muted text-uppercase">Section Title</label>
        <input type="text" className="premium-input" value={data?.payload?.title || ''} onChange={e => onChange({ ...data, payload: { ...data.payload, title: e.target.value } })} placeholder="e.g., Our Process" />
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <label className="form-label text-muted text-uppercase mb-0">Steps</label>
        <button type="button" className="btn btn-sm btn-light text-primary rounded-pill px-3 fw-medium" onClick={addStep}><i className="bi bi-plus me-1"></i> Add Step</button>
      </div>
      {steps.map((step, idx) => (
        <div key={idx} className="p-3 mb-3 border rounded-4 bg-white hover-shadow-sm d-flex gap-3">
          <div className="d-flex align-items-center justify-content-center text-muted fw-bold" style={{ width: '40px' }}>#{idx + 1}</div>
          <div className="flex-grow-1">
            <input type="text" className="form-control mb-2" placeholder="Title" value={step.title} onChange={e => updateStep(idx, 'title', e.target.value)} />
            <textarea className="form-control mb-2" placeholder="Description" rows="2" value={step.description} onChange={e => updateStep(idx, 'description', e.target.value)} />
            <input type="text" className="form-control" placeholder="Duration chip (optional, e.g. Day 1)" value={step.duration || ''} onChange={e => updateStep(idx, 'duration', e.target.value)} />
          </div>
          <button type="button" className="btn btn-sm btn-light text-danger rounded-circle p-2" onClick={() => removeStep(idx)}><i className="bi bi-trash"></i></button>
        </div>
      ))}
      <div className="row g-3">
        <ButtonField className="col-12" label="Button under the steps" value={data?.payload?.button} onChange={button => onChange({ ...data, payload: { ...data.payload, button } })} />
      </div>
    </div>
  );
};


// Form block: attaches a Form Builder form. Only formId is the source of truth;
// formName/formSlug are kept as a readable snapshot. The public APIs resolve the
// live form definition into payload.form.
const FormBlockForm = ({ data, onChange }) => {
  const payload = data?.payload || {};
  const { data: forms = [], isLoading, isError } = useQuery({
    queryKey: ['forms', 'active'],
    queryFn: async () => (await FormService.getAll({ status: 'active', limit: 1000, sortBy: 'name', sortOrder: 'ASC' })).data || [],
  });

  const selected = forms.find(f => f.id === payload.formId);
  const setPayload = (patch) => onChange({ ...data, payload: { ...payload, ...patch } });

  const handleSelect = (formId) => {
    const form = forms.find(f => f.id === formId);
    setPayload({ formId: formId || '', formName: form?.name || '', formSlug: form?.slug || '' });
  };

  return (
    <div className="row g-3">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label className="form-label mb-0">Select Form</label>
          <div className="d-flex gap-3 small">
            {payload.formId && (
              <a href={`/forms/edit/${payload.formId}`} target="_blank" rel="noreferrer" className="text-decoration-none">
                <i className="bi bi-pencil me-1"></i>Edit form
              </a>
            )}
            <a href="/forms/new" target="_blank" rel="noreferrer" className="text-decoration-none">
              <i className="bi bi-plus-lg me-1"></i>Create new form
            </a>
          </div>
        </div>
        <SearchableSelect
          value={payload.formId || ''}
          onChange={handleSelect}
          loading={isLoading}
          spaced={false}
          placeholder="— Choose a form —"
          emptyLabel="— No form —"
          searchPlaceholder="Search forms..."
          options={forms.map(f => ({ value: f.id, label: f.name, sub: `${(f.fields || []).length} fields · ${f.slug}` }))}
        />
        {isError && <div className="text-danger small mt-1">Could not load forms. Check that your role has the Forms read permission.</div>}
        {!isLoading && payload.formId && !selected && (
          <div className="alert alert-warning py-2 small mt-2 mb-0">
            <i className="bi bi-exclamation-triangle me-1"></i>
            The attached form{payload.formName ? ` "${payload.formName}"` : ''} is inactive or deleted, so it will not render on the website.
          </div>
        )}
      </div>
      <div className="col-md-6">
        <label className="form-label">Section Heading <span className="text-muted">(optional)</span></label>
        <input type="text" className="form-control" value={payload.heading || ''} onChange={e => setPayload({ heading: e.target.value })} placeholder="e.g. Get a Free Consultation" />
      </div>
      <div className="col-md-6">
        <label className="form-label">Sub Heading <span className="text-muted">(optional)</span></label>
        <input type="text" className="form-control" value={payload.subHeading || ''} onChange={e => setPayload({ subHeading: e.target.value })} placeholder="e.g. Our experts reply within 24 hours" />
      </div>
      <TextField className="col-12" label="Note under the form (optional)" value={payload.note} onChange={note => setPayload({ note })} placeholder="e.g. 🔒 Your details are safe. We never spam." />
      {selected && (
        <div className="col-12">
          <div className="p-3 border rounded-4 bg-body-tertiary">
            <div className="text-muted text-uppercase small fw-semibold mb-3" style={{ letterSpacing: '0.5px' }}>Preview</div>
            {payload.heading && <h5 className="fw-bold mb-1">{payload.heading}</h5>}
            {payload.subHeading && <p className="text-muted">{payload.subHeading}</p>}
            <FormPreview form={selected} compact />
          </div>
        </div>
      )}
    </div>
  );
};

// Packages block: attaches one or more packages in the chosen order. Only packageIds
// is the source of truth; packageNames is kept as a readable snapshot. The public
// APIs resolve the live package definitions into payload.packages.
const firstPlan = (pkg) => (pkg.pricingPlans || [])[0] || (pkg.keywordTiers || [])[0]?.pricingPlans?.[0];

const PackagesBlockForm = ({ data, onChange }) => {
  const payload = data?.payload || {};
  const selectedIds = payload.packageIds || [];
  const [category, setCategory] = React.useState('');
  const [query, setQuery] = React.useState('');
  const { data: packages = [], isLoading, isError } = useQuery({
    queryKey: ['packages', 'active'],
    queryFn: async () => (await PackageService.getAll({ status: 'active', limit: 1000, sortBy: 'displayOrder', sortOrder: 'ASC' })).data || [],
  });

  const byId = useMemo(() => new Map(packages.map(p => [p.id, p])), [packages]);
  const categories = useMemo(() => [...new Set(packages.map(p => p.category).filter(Boolean))], [packages]);
  const term = query.trim().toLowerCase();
  const visible = packages
    .filter(p => !category || p.category === category)
    .filter(p => !term || `${p.name} ${p.category || ''}`.toLowerCase().includes(term));
  const missing = isLoading ? [] : selectedIds.filter(id => !byId.has(id));

  const setPayload = (patch) => onChange({ ...data, payload: { ...payload, ...patch } });
  const setSelected = (ids) => setPayload({
    packageIds: ids,
    packageNames: ids.map(id => byId.get(id)?.name || (payload.packageNames || [])[selectedIds.indexOf(id)] || '')
  });

  const toggle = (id) => setSelected(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  const addAllVisible = () => setSelected([...selectedIds, ...visible.map(p => p.id).filter(id => !selectedIds.includes(id))]);
  const move = (index, delta) => {
    const ids = [...selectedIds];
    const [id] = ids.splice(index, 1);
    ids.splice(index + delta, 0, id);
    setSelected(ids);
  };

  const selectedPackages = selectedIds.map(id => byId.get(id)).filter(Boolean);

  return (
    <div className="row g-3">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <label className="form-label mb-0">Select Packages</label>
          <div className="d-flex gap-3 small">
            <a href="/packages" target="_blank" rel="noreferrer" className="text-decoration-none">
              <i className="bi bi-box-seam me-1"></i>Manage packages
            </a>
            <a href="/packages/new" target="_blank" rel="noreferrer" className="text-decoration-none">
              <i className="bi bi-plus-lg me-1"></i>Create new package
            </a>
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2 mb-2">
          <div className="input-group input-group-sm flex-grow-1" style={{ minWidth: 200, width: 'auto' }}>
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input type="search" className="form-control" value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${packages.length} packages...`} disabled={isLoading} />
          </div>
          <select className="form-select form-select-sm" style={{ width: 'auto' }} value={category} onChange={e => setCategory(e.target.value)} disabled={isLoading}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="button" className="btn btn-sm btn-light border text-nowrap" onClick={addAllVisible} disabled={isLoading || visible.length === 0}>
            Add all{term ? ' matching' : category ? ` in ${category}` : ''}
          </button>
        </div>
        <div className="border rounded-3 p-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
          {isLoading && <div className="text-muted small p-1">Loading packages...</div>}
          {!isLoading && visible.length === 0 && <div className="text-muted small p-1">{term ? `No packages match "${query}".` : 'No active packages found.'}</div>}
          {visible.map(p => (
            <div className="form-check" key={p.id}>
              <input className="form-check-input" type="checkbox" id={`pkg_${p.id}`} checked={selectedIds.includes(p.id)} onChange={() => toggle(p.id)} />
              <label className="form-check-label" htmlFor={`pkg_${p.id}`}>
                {p.name} <span className="text-muted small">({p.category || 'Uncategorized'})</span>
                {p.isRecommended && <span className="badge bg-warning-subtle text-warning-emphasis ms-2">Recommended</span>}
              </label>
            </div>
          ))}
        </div>
        {isError && <div className="text-danger small mt-1">Could not load packages. Check that your role has the Packages read permission.</div>}
        {missing.length > 0 && (
          <div className="alert alert-warning py-2 small mt-2 mb-0">
            <i className="bi bi-exclamation-triangle me-1"></i>
            {missing.length} attached package(s) are inactive or deleted, so they will not render on the website.
            <button type="button" className="btn btn-link btn-sm p-0 ms-2 align-baseline" onClick={() => setSelected(selectedIds.filter(id => byId.has(id)))}>Remove them</button>
          </div>
        )}
      </div>
      {selectedPackages.length > 0 && (
        <div className="col-12">
          <label className="form-label">Display Order</label>
          <ul className="list-group">
            {selectedIds.map((id, idx) => byId.get(id) && (
              <li key={id} className="list-group-item d-flex align-items-center justify-content-between py-2">
                <span>{idx + 1}. {byId.get(id).name}</span>
                <div className="btn-group btn-group-sm">
                  <button type="button" className="btn btn-light border" onClick={() => move(idx, -1)} disabled={idx === 0} title="Move up"><i className="bi bi-arrow-up"></i></button>
                  <button type="button" className="btn btn-light border" onClick={() => move(idx, 1)} disabled={idx === selectedIds.length - 1} title="Move down"><i className="bi bi-arrow-down"></i></button>
                  <button type="button" className="btn btn-light border text-danger" onClick={() => toggle(id)} title="Remove"><i className="bi bi-x-lg"></i></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="col-md-6">
        <label className="form-label">Section Heading <span className="text-muted">(optional)</span></label>
        <input type="text" className="form-control" value={payload.heading || ''} onChange={e => setPayload({ heading: e.target.value })} placeholder="e.g. Choose Your Plan" />
      </div>
      <div className="col-md-6">
        <label className="form-label">Sub Heading <span className="text-muted">(optional)</span></label>
        <input type="text" className="form-control" value={payload.subHeading || ''} onChange={e => setPayload({ subHeading: e.target.value })} placeholder="e.g. Transparent pricing, no hidden fees" />
      </div>
      <TextField label="Plan button text" value={payload.buttonText} onChange={buttonText => setPayload({ buttonText })} placeholder="e.g. Choose plan" hint="Empty = no button." />
      <TextField label="Button link" value={payload.buttonUrl} onChange={buttonUrl => setPayload({ buttonUrl })} placeholder="e.g. #enquiry or /talk-to-expert" hint="Used when a plan has no link of its own." />
      <TextField label="Price suffix" value={payload.priceSuffix} onChange={priceSuffix => setPayload({ priceSuffix })} placeholder="e.g. / month" />
      <TextField label="Best value badge" value={payload.bestValueLabel} onChange={bestValueLabel => setPayload({ bestValueLabel })} placeholder="e.g. BEST VALUE" hint="Marks the plan with the biggest saving. Empty = no badge." />
      <TextField label="Features heading" value={payload.featuresTitle} onChange={featuresTitle => setPayload({ featuresTitle })} placeholder="e.g. What's included" />
      <TextField label="Recommended package badge" value={payload.recommendedLabel} onChange={recommendedLabel => setPayload({ recommendedLabel })} placeholder="e.g. POPULAR" hint="Shown on packages marked Recommended (multi-package layout)." />
      {selectedPackages.length > 0 && (
        <div className="col-12">
          <div className="p-3 border rounded-4 bg-body-tertiary">
            <div className="text-muted text-uppercase small fw-semibold mb-3" style={{ letterSpacing: '0.5px' }}>Preview</div>
            {payload.heading && <h5 className="fw-bold mb-1">{payload.heading}</h5>}
            {payload.subHeading && <p className="text-muted">{payload.subHeading}</p>}
            <div className="row g-2">
              {selectedPackages.map(p => {
                const plan = firstPlan(p);
                return (
                  <div className="col-md-4" key={p.id}>
                    <div className={`border rounded-3 p-3 h-100 bg-body ${p.isRecommended ? 'border-primary' : ''}`}>
                      {p.isRecommended && <span className="badge bg-primary mb-2">Recommended</span>}
                      <div className="fw-semibold">{p.name}</div>
                      <div className="text-muted small">{p.category}</div>
                      {plan?.monthlyPrice && <div className="fw-bold mt-2">{plan.monthlyPrice}<span className="text-muted small fw-normal"> / {plan.duration || 'month'}</span></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// Highlights: icon + title + text items. Main/top/bottom: a strip of items; sidebar: a compact grid.
const HighlightsForm = ({ data, onChange }) => {
  const [p, set] = usePayload(data, onChange);

  return (
    <div className="row g-3">
      <TextField label="Heading (optional)" value={p.title} onChange={set('title')} placeholder="e.g. Safe & trusted" />
      <SelectField label="Style" value={p.variant} onChange={set('variant')} options={[
        { value: 'cards', label: 'White card with icon boxes' },
        { value: 'tinted', label: 'Tinted strip' },
      ]} hint="Applies in Main / Top / Bottom. Sidebar always uses the compact grid." />
      <RepeaterField label="Items" items={p.items} onChange={set('items')} addLabel="Add item"
        fields={[
          { key: 'icon', placeholder: ICON_HINT, width: 'col-md-3' },
          { key: 'title', placeholder: 'Title (e.g. 100% Confidential)', width: 'col-md-4' },
          { key: 'text', placeholder: 'Text (e.g. Bank-grade security)', width: 'col-md-5' },
        ]} />
    </div>
  );
};

// Checklist: a heading and a list of icon + text lines.
const ChecklistForm = ({ data, onChange }) => {
  const [p, set] = usePayload(data, onChange);

  return (
    <div className="row g-3">
      <TextField className="col-12" label="Heading" value={p.title} onChange={set('title')} placeholder="e.g. ✅ Why Tax Alphonic" />
      <RepeaterField label="Items" items={p.items} onChange={set('items')} addLabel="Add item"
        fields={[{ key: 'icon', placeholder: 'Icon (optional)', width: 'col-md-3' }, { key: 'text', placeholder: 'e.g. Real CA/CS experts', width: 'col-md-9' }]} />
    </div>
  );
};

// Call to action: heading, text and buttons. Dark = CTA strip / dark sidebar card,
// Light = white card, Success = green "promise" card.
const CallToActionForm = ({ data, onChange }) => {
  const [p, set] = usePayload(data, onChange);

  return (
    <div className="row g-3">
      <SelectField label="Style" value={p.variant} onChange={set('variant')} options={[
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light (white card)' },
        { value: 'success', label: 'Success (green tint)' },
      ]} />
      <TextField label="Icon (optional)" media value={p.icon} onChange={set('icon')} placeholder={ICON_HINT} />
      <TextField className="col-12" label="Heading" value={p.title} onChange={set('title')} placeholder="e.g. Ready to get started?" />
      <TextField className="col-12" label="Text" value={p.text} onChange={set('text')} textarea placeholder="e.g. Talk to an expert for free — no cost, no obligation." />
      <RepeaterField label="Buttons" items={p.buttons} onChange={set('buttons')} addLabel="Add button"
        fields={[{ key: 'text', placeholder: 'Button text', width: 'col-md-5' }, { key: 'url', placeholder: 'Link (/talk-to-expert, tel:…, https://…)', width: 'col-md-7' }]} />
      <TextField className="col-12" label="Note under the buttons (optional)" value={p.note} onChange={set('note')} placeholder="e.g. 📞 Or call us: +91 …" />
    </div>
  );
};

// Locations We Serve: links to this service's PUBLISHED location pages (SEO Pages), A-Z.
// The website adds it with these defaults at the top of the bottom area when the block isn't used.
// Keep the defaults in sync with LOCATIONS_DEFAULTS in the website's ApiServicePage.jsx.
const LocationsServedForm = ({ data, onChange }) => {
  const [p, set] = usePayload(data, onChange);
  const yesNo = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];

  return (
    <div className="row g-3">
      <div className="col-12">
        <div className="alert alert-info small py-2 mb-0">
          <i className="bi bi-info-circle me-1"></i>
          Lists this service's <b>published</b> location pages from <a href="/seo-pages" target="_blank" rel="noreferrer">SEO Pages</a> (e.g. /india/seo-services-noida), A–Z.
          Hidden while there are none. Without this block the website still shows it at the bottom with the default texts; add the block to move it, change its texts or hide it.
        </div>
      </div>
      <SelectField label="Show on the page" value={p.show} onChange={set('show')} options={yesNo} />
      <SelectField label="Show the count badge" value={p.showCount} onChange={set('showCount')} options={yesNo} />
      <TextField className="col-12" label="Heading" value={p.title} onChange={set('title')} placeholder="Locations We Serve" />
      <TextField className="col-12" label="Sub-heading ({service} = service name)" value={p.subHeading} onChange={set('subHeading')} placeholder="Explore localized {service} across target cities & hubs" />
      <TextField label="Count badge ({count} = number of locations)" value={p.countLabel} onChange={set('countLabel')} placeholder="{count} Available" />
    </div>
  );
};

const SectionRenderer = ({ section, onChange }) => {
  switch (section.type) {
    case 'HeroBanner':
      return <HeroBannerForm data={section.data} onChange={newData => onChange(section.id, newData)} />;
    case 'Overview':
      return <OverviewForm data={section.data} onChange={newData => onChange(section.id, newData)} />;
    case 'WhyUs':
      return <WhyUsForm data={section.data} onChange={newData => onChange(section.id, newData)} />;
    case 'ServicesIncluded':
      return <ServicesIncludedForm data={section.data} onChange={newData => onChange(section.id, newData)} />;
    case 'OurProcess':
      return <OurProcessForm data={section.data} onChange={newData => onChange(section.id, newData)} />;
    case 'Faq':
      return <FaqForm data={section.data} onChange={newData => onChange(section.id, newData)} />;
    case 'Form':
      return <FormBlockForm data={section.data} onChange={newData => onChange(section.id, newData)} />;
    case 'Packages':
      return <PackagesBlockForm data={section.data} onChange={newData => onChange(section.id, newData)} />;
    case 'Highlights':
      return <HighlightsForm data={section.data} onChange={newData => onChange(section.id, newData)} />;
    case 'Checklist':
      return <ChecklistForm data={section.data} onChange={newData => onChange(section.id, newData)} />;
    case 'CallToAction':
      return <CallToActionForm data={section.data} onChange={newData => onChange(section.id, newData)} />;
    case 'LocationsServed':
      return <LocationsServedForm data={section.data} onChange={newData => onChange(section.id, newData)} />;
    default:
      // Homepage, Journey Stage and general-purpose blocks are schema-driven (homeBlocks.js, journeyBlocks.js, commonBlocks.js).
      if (HOME_SCHEMAS[section.type] || JOURNEY_SCHEMAS[section.type] || COMMON_SCHEMAS[section.type] || LANDING_SCHEMAS[section.type]) {
        return (
          <SchemaFields
            fields={HOME_SCHEMAS[section.type] || JOURNEY_SCHEMAS[section.type] || COMMON_SCHEMAS[section.type] || LANDING_SCHEMAS[section.type]}
            value={section.data?.payload}
            onChange={payload => onChange(section.id, { ...section.data, payload })}
          />
        );
      }
      // Free tool blocks (toolBlocks.js); the Calculator block's settings follow its calculator.
      if (TOOL_SCHEMAS[section.type]) {
        const payload = section.data?.payload || {};
        return (
          <SchemaFields
            fields={toolSchemaFor(section.type, payload)}
            value={payload}
            onChange={next => {
              const changedCalculator = section.type === 'ToolCalculator' && next.calculator !== payload.calculator;
              const value = changedCalculator ? { ...next, settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS[next.calculator] || {})) } : next;
              onChange(section.id, { ...section.data, payload: value });
            }}
          />
        );
      }
      return (
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Form for <strong>{section.type}</strong> is not implemented yet.
        </div>
      );
  }
};

export default SectionRenderer;


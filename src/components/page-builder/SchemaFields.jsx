import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FormService } from '../../services/form.service';
import { Link } from 'react-router-dom';
import { ButtonField, MEDIA_KEY, RepeaterField, SelectField, TextField } from './blockFields';
import MediaPickerModal from '../media/MediaPickerModal';
import SearchableSelect from '../common/SearchableSelect';
import api from '../../services/api';

const MEDIA_BASE = (import.meta.env.VITE_APP_URL || 'http://localhost:5000').replace(/\/$/, '');
const previewUrl = (url) => (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') ? url : `${MEDIA_BASE}/${url.replace(/^\/+/, '')}`);

// An image from the Media library (or a pasted URL), with a small preview.
const ImageField = ({ label, hint, value, onChange, className = 'col-md-6' }) => {
  const [picking, setPicking] = useState(false);
  const url = String(value || '').trim();
  return (
    <div className={className}>
      <label className="form-label">{label}</label>
      <div className="d-flex gap-2 align-items-start">
        {url && <img src={previewUrl(url)} alt="" className="rounded border bg-white flex-shrink-0" style={{ width: 64, height: 64, objectFit: 'contain' }} />}
        <div className="flex-grow-1">
          <div className="input-group">
            <input type="text" className="form-control" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Choose from Media or paste a URL" />
            <button type="button" className="btn btn-outline-primary" onClick={() => setPicking(true)}><i className="bi bi-images me-1"></i>Choose</button>
            {url && <button type="button" className="btn btn-outline-danger" onClick={() => onChange('')} title="Remove image"><i className="bi bi-x-lg"></i></button>}
          </div>
          {hint && <div className="form-text">{hint}</div>}
        </div>
      </div>
      <MediaPickerModal show={picking} onClose={() => setPicking(false)} onSelect={(item) => { onChange(item.url); setPicking(false); }} title="Select image" />
    </div>
  );
};

// Picks a portfolio category (main categories first, sub-categories under them); empty = all.
const PortfolioCategoryPicker = ({ label, hint, value, onChange, className = 'col-md-6' }) => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['portfolio-categories', 'all'],
    queryFn: async () => (await api.get('/portfolio-categories', { params: { limit: 1000, sortBy: 'name', sortOrder: 'ASC' } })).data?.data || [],
  });
  const parents = categories.filter(c => !c.parentId);
  const options = parents.flatMap(p => [
    { value: p.id, label: p.name, sub: 'Main category (with its sub-categories)' },
    ...categories.filter(c => c.parentId === p.id).map(c => ({ value: c.id, label: `${p.name} › ${c.name}` })),
  ]);
  return (
    <div className={className}>
      <label className="form-label">{label}</label>
      <SearchableSelect
        value={value || ''}
        onChange={onChange}
        loading={isLoading}
        spaced={false}
        placeholder="All categories"
        emptyLabel="All categories"
        searchPlaceholder="Search categories..."
        options={options}
      />
      {hint && <div className="form-text">{hint}</div>}
    </div>
  );
};

// Picks an active CMS form; the backend attaches its definition to the block (payload.form).
const FormPicker = ({ label, hint, value, onChange, className = 'col-md-6' }) => {
  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['forms', 'active'],
    queryFn: async () => (await FormService.getAll({ status: 'active', limit: 1000, sortBy: 'name', sortOrder: 'ASC' })).data || [],
  });

  return (
    <div className={className}>
      <div className="d-flex justify-content-between align-items-center">
        <label className="form-label">{label}</label>
        {value && <a href={`/forms/edit/${value}`} target="_blank" rel="noreferrer" className="small text-decoration-none"><i className="bi bi-pencil me-1"></i>Edit form</a>}
      </div>
      <SearchableSelect
        value={value || ''}
        onChange={onChange}
        loading={isLoading}
        spaced={false}
        placeholder="— No form —"
        emptyLabel="— No form —"
        searchPlaceholder="Search forms..."
        options={[
          ...forms.map(f => ({ value: f.id, label: f.name, sub: `${(f.fields || []).length} fields · ${f.slug}` })),
          ...(value && !isLoading && !forms.some(f => f.id === value) ? [{ value, label: 'Unknown or inactive form' }] : []),
        ]}
      />
      {hint && <div className="form-text">{hint}</div>}
    </div>
  );
};

/**
 * Renders a block editor from a field schema (see HOME_SCHEMAS in homeBlocks.js).
 * Field types: text, textarea, button, list, group, form, select, note, image, color; any field may set showIf(data).
 * and writes into `value` (the block payload, or a nested group object).
 */
const SchemaFields = ({ fields, value, onChange }) => {
  const data = value || {};
  const set = (key) => (next) => onChange({ ...data, [key]: next });

  return (
    <div className="row g-3">
      {fields.map(field => {
        // Fields can depend on another value, e.g. hand-written items only when source is "manual".
        if (field.showIf && !field.showIf(data)) return null;
        switch (field.type) {
          case 'note':
            return (
              <div key={field.key} className={field.width || 'col-12'}>
                <div className="alert alert-info small py-2 mb-0 d-flex flex-wrap align-items-center gap-2">
                  <i className="bi bi-info-circle"></i>
                  <span>{field.label}</span>
                  {field.link && <Link to={field.link.to} target="_blank" className="alert-link">{field.link.text} <i className="bi bi-box-arrow-up-right"></i></Link>}
                </div>
              </div>
            );
          case 'select':
            return (
              <SelectField
                key={field.key}
                className={field.width || 'col-md-6'}
                label={field.label}
                value={data[field.key] ?? field.options[0]?.value}
                onChange={set(field.key)}
                options={field.options}
                hint={field.hint}
              />
            );
          case 'button':
            return <ButtonField key={field.key} className={field.width || 'col-md-6'} label={field.label} value={data[field.key]} onChange={set(field.key)} />;
          case 'portfolioCategory':
            return <PortfolioCategoryPicker key={field.key} className={field.width || 'col-md-6'} label={field.label} hint={field.hint} value={data[field.key]} onChange={set(field.key)} />;
          case 'form':
            return <FormPicker key={field.key} className={field.width || 'col-md-6'} label={field.label} hint={field.hint} value={data[field.key]} onChange={set(field.key)} />;
          case 'list':
            return (
              <React.Fragment key={field.key}>
                <RepeaterField
                  label={field.label}
                  items={data[field.key]}
                  onChange={set(field.key)}
                  fields={field.fields}
                  addLabel={field.addLabel}
                />
                {field.hint && <div className="col-12 form-text mt-n2"><i className="bi bi-aspect-ratio me-1 text-primary"></i>{field.hint}</div>}
              </React.Fragment>
            );
          case 'image':
            return <ImageField key={field.key} className={field.width || 'col-md-6'} label={field.label} hint={field.hint} value={data[field.key]} onChange={set(field.key)} />;
          case 'color': {
            const hex = /^#[0-9a-f]{6}$/i.test(data[field.key] || '') ? data[field.key] : '#0e96ac';
            return (
              <div key={field.key} className={field.width || 'col-md-6'}>
                <label className="form-label">{field.label}</label>
                <div className="input-group">
                  <input type="color" className="form-control form-control-color flex-grow-0" style={{ width: 48 }} value={hex} onChange={e => set(field.key)(e.target.value)} title="Pick a colour" />
                  <input type="text" className="form-control" value={data[field.key] || ''} placeholder="#0E96AC" onChange={e => set(field.key)(e.target.value)} />
                </div>
                {field.hint && <div className="form-text">{field.hint}</div>}
              </div>
            );
          }
          case 'group':
            return (
              <div key={field.key} className="col-12">
                <div className="border rounded-4 p-3 bg-body-tertiary">
                  <div className="fw-semibold mb-1">{field.label}</div>
                  {field.hint && <div className="form-text mt-0 mb-2">{field.hint}</div>}
                  <SchemaFields fields={field.fields} value={data[field.key]} onChange={set(field.key)} />
                </div>
              </div>
            );
          default:
            return (
              <TextField
                key={field.key}
                className={field.width || (field.type === 'textarea' ? 'col-12' : 'col-md-6')}
                label={field.label}
                value={data[field.key]}
                onChange={set(field.key)}
                placeholder={field.placeholder}
                textarea={field.type === 'textarea'}
                media={field.type !== 'textarea' && (field.media ?? MEDIA_KEY.test(field.key))}
                hint={field.hint}
              />
            );
        }
      })}
    </div>
  );
};

export default SchemaFields;

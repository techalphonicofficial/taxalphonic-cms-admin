import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import FormPreview from './FormPreview';
import { StatusBadge } from '../datagrid/CellRenderers';
import { publicFormEndpoints, sampleSubmission } from './formEmbed';
import { toast } from 'react-toastify';

const copy = (text) => {
  navigator.clipboard?.writeText(text)
    .then(() => toast.success('Copied to clipboard'))
    .catch(() => toast.error('Could not copy'));
};

// Read-only look at a saved form: rendered preview plus what the website needs to use it
const FormPreviewModal = ({ form, show, onHide }) => {
  const [tab, setTab] = useState('preview');
  if (!form) return null;

  const endpoints = publicFormEndpoints(form.slug);
  const sample = JSON.stringify(sampleSubmission(form.fields), null, 2);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable onExited={() => setTab('preview')}>
      <Modal.Header closeButton>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Modal.Title as="h5" className="fw-bold mb-0">{form.name}</Modal.Title>
          <StatusBadge status={form.status} />
          <span className="badge bg-light text-dark border">{(form.fields || []).length} fields</span>
        </div>
      </Modal.Header>
      <Modal.Body className="p-4">
        <ul className="nav nav-pills mb-4 gap-2">
          {[
            { key: 'preview', label: 'Preview', icon: 'bi-eye' },
            { key: 'api', label: 'Website / API', icon: 'bi-code-slash' },
          ].map(t => (
            <li className="nav-item" key={t.key}>
              <button type="button" className={`nav-link rounded-pill ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                <i className={`bi ${t.icon} me-1`}></i> {t.label}
              </button>
            </li>
          ))}
        </ul>

        {tab === 'preview' && (
          <>
            {form.status === 'inactive' && (
              <div className="alert alert-warning py-2 small">
                <i className="bi bi-eye-slash me-1"></i> This form is inactive, so the website cannot load or submit it.
              </div>
            )}
            <FormPreview form={form} interactive />
          </>
        )}

        {tab === 'api' && (
          <div className="small">
            <p className="text-muted">Add a <strong>Form</strong> block in the Page Builder of a page, service or blog, or call the API directly from the website.</p>
            {endpoints.map(ep => (
              <div key={ep.label} className="mb-3">
                <div className="fw-semibold mb-1">{ep.label}</div>
                <div className="d-flex gap-2 align-items-center">
                  <code className="flex-grow-1 bg-body-tertiary border rounded px-2 py-2 text-break">{ep.method} {ep.url}</code>
                  <button type="button" className="btn btn-sm btn-light border" onClick={() => copy(ep.url)} title="Copy URL">
                    <i className="bi bi-clipboard"></i>
                  </button>
                </div>
              </div>
            ))}
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="fw-semibold">Sample submission body</span>
              <button type="button" className="btn btn-sm btn-light border" onClick={() => copy(sample)}>
                <i className="bi bi-clipboard me-1"></i> Copy
              </button>
            </div>
            <pre className="bg-body-tertiary border rounded p-3 mb-2" style={{ maxHeight: 260 }}>{sample}</pre>
            <div className="text-muted">
              Keep the empty <code>_hp</code> field as a hidden input: bots fill it and their submissions are silently dropped.
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Link to={`/crm/leads?formId=${form.id}`} className="btn btn-outline-secondary me-auto">
          <i className="bi bi-inbox me-1"></i> Submissions ({form.submissionCount || 0})
        </Link>
        <button type="button" className="btn btn-light" onClick={onHide}>Close</button>
        <Link to={`/forms/edit/${form.id}`} className="btn btn-primary">
          <i className="bi bi-pencil me-1"></i> Edit Form
        </Link>
      </Modal.Footer>
    </Modal>
  );
};

export default FormPreviewModal;

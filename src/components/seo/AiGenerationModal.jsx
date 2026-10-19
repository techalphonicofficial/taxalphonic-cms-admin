import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const fmt = (n) => Number(n || 0).toLocaleString();

// Sections, tiers, tones and the active provider/model come from pSEO > AI Settings
// targetItem = one page; selectedCount = pages picked in the list (bulk on those, no batch limit); neither = the draft queue.
const AiGenerationModal = ({ show, onClose, onGenerate, isPending, targetItem = null, selectedCount = 0 }) => {
  const { data: config, isLoading, isError } = useQuery({
    queryKey: ['seo-ai-config'],
    queryFn: async () => (await api.get('/seo-pages/ai-config')).data.data,
    enabled: show,
  });
  const sections = config?.availableSections || [];
  const tiers = config?.wordCountTiers || [];
  const tones = config?.toneOptions || [];
  const engine = config?.engine;

  const [tier, setTier] = useState('');
  const [selectedSections, setSelectedSections] = useState([]);
  const [tone, setTone] = useState('');
  const [updateMetadata, setUpdateMetadata] = useState(true);
  const [bulkLimit, setBulkLimit] = useState(5);

  // Apply the configured defaults once the config arrives
  useEffect(() => {
    if (!config) return;
    setTier(config.defaultTier || config.wordCountTiers?.[0]?.key || '');
    setTone(config.defaultTone || config.toneOptions?.[0]?.key || '');
    setSelectedSections(config.defaultSections || []);
  }, [config]);

  const toggleSection = (id) => {
    setSelectedSections(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => setSelectedSections(sections.map(s => s.id));
  const handleDeselectAll = () => setSelectedSections(sections.slice(0, 1).map(s => s.id));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSections.length === 0) {
      alert('Please select at least one section to generate.');
      return;
    }
    onGenerate({
      wordCountTier: tier,
      sections: selectedSections,
      tone,
      updateMetadata,
      limit: bulkLimit
    });
  };

  if (!show) return null;

  // Rendered into <body> so no transformed parent can shift this position:fixed modal.
  return createPortal(
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1070 }}></div>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1075 }} onClick={onClose}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
          <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
            
            {/* Header */}
            <div className="modal-header bg-gradient bg-primary text-white border-bottom-0 py-3 px-4">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-center">
                  <i className="bi bi-robot fs-5 text-white"></i>
                </div>
                <div>
                  <h5 className="modal-title fw-bold mb-0">
                    {targetItem ? 'AI Content Studio & Tuning' : 'Bulk AI Generation Engine'}
                  </h5>
                  <small className="text-white-50">
                    {targetItem
                      ? `Targeting: ${targetItem.title || targetItem.slug}`
                      : selectedCount
                        ? `Write content for the ${selectedCount} selected page${selectedCount === 1 ? '' : 's'}`
                        : 'Mass-generate long-form multi-section content for pending draft permutations'}
                  </small>
                </div>
              </div>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={isPending}></button>
            </div>

            {/* Body */}
            <div className="modal-body p-4 bg-light">
              <form onSubmit={handleSubmit} id="ai-gen-form">
                
                {/* 1. Target Length / Word Count Tiers */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-bold text-dark mb-0">
                      <i className="bi bi-file-earmark-text text-primary me-2"></i>
                      1. Select Content Depth & Word Count Target
                    </label>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                      {(() => { const t = tiers.find(x => x.key === tier); return t ? `~${fmt(t.minWords)} - ${fmt(t.targetWords)} words` : ''; })()}
                    </span>
                  </div>

                  <div className="row g-2">
                    {isLoading && <div className="text-muted small">Loading AI settings...</div>}
                    {isError && <div className="text-danger small">Could not load AI settings.</div>}
                    {tiers.map(t => (
                      <div className="col-md-4" key={t.key}>
                        <div
                          onClick={() => setTier(t.key)}
                          className={`card h-100 border cursor-pointer transition-all p-3 ${
                            tier === t.key
                              ? 'border-primary bg-white shadow-sm ring-2'
                              : 'bg-white bg-opacity-75 border-light-subtle hover:bg-white'
                          }`}
                          style={{
                            cursor: 'pointer',
                            outline: tier === t.key ? '2px solid #0d6efd' : 'none'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <h6 className="fw-bold mb-0 text-dark">{t.label}</h6>
                            <span className={`badge ${tier === t.key ? 'bg-primary' : 'bg-secondary bg-opacity-25 text-dark'}`} style={{ fontSize: '0.7rem' }}>
                              {t.badge || t.key}
                            </span>
                          </div>
                          <div className="text-primary fw-semibold small mb-1">~{fmt(t.minWords)} - {fmt(t.targetWords)} words</div>
                          <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>{t.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Sections Categorization */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-bold text-dark mb-0">
                      <i className="bi bi-diagram-2 text-primary me-2"></i>
                      2. Content Sections ({selectedSections.length}/{sections.length} Active)
                    </label>
                    <div className="btn-group btn-group-sm">
                      <button type="button" className="btn btn-outline-secondary btn-sm py-0 px-2" onClick={handleSelectAll}>Select All</button>
                      <button type="button" className="btn btn-outline-secondary btn-sm py-0 px-2" onClick={handleDeselectAll}>Reset Minimum</button>
                    </div>
                  </div>

                  <div className="row g-2">
                    {sections.map(sec => {
                      const isChecked = selectedSections.includes(sec.id);
                      return (
                        <div className="col-md-6" key={sec.id}>
                          <div
                            onClick={() => toggleSection(sec.id)}
                            className={`p-2 px-3 rounded-3 border d-flex align-items-center gap-2 transition-all ${
                              isChecked ? 'bg-white border-primary-subtle shadow-xs' : 'bg-light text-muted border-light'
                            }`}
                            style={{ cursor: 'pointer' }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input mt-0"
                              checked={isChecked}
                              onChange={() => {}} // handled by container click
                            />
                            <i className={`bi ${sec.icon || 'bi-card-text'} ${isChecked ? 'text-primary' : 'text-muted'} fs-5`}></i>
                            <div className="overflow-hidden">
                              <div className={`fw-semibold text-truncate small ${isChecked ? 'text-dark' : 'text-muted'}`}>
                                {sec.name}
                              </div>
                              <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>
                                {sec.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Tone & Extra Configuration */}
                <div className="row g-3 mb-2">
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-dark small mb-1">
                      <i className="bi bi-chat-quote text-primary me-1"></i>
                      Brand Tone & Voice
                    </label>
                    <select className="form-select form-select-sm" value={tone} onChange={e => setTone(e.target.value)}>
                      {tones.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
                    </select>
                  </div>

                  {!targetItem && !selectedCount && (
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-dark small mb-1">
                        <i className="bi bi-layers text-primary me-1"></i>
                        Batch Processing Limit
                      </label>
                      <select className="form-select form-select-sm" value={bulkLimit} onChange={e => setBulkLimit(Number(e.target.value))}>
                        <option value={3}>3 Drafts per batch</option>
                        <option value={5}>5 Drafts per batch (Default)</option>
                        <option value={10}>10 Drafts per batch</option>
                      </select>
                    </div>
                  )}

                  <div className="col-12 mt-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="updateMetaSwitch"
                        checked={updateMetadata}
                        onChange={e => setUpdateMetadata(e.target.checked)}
                      />
                      <label className="form-check-label small fw-semibold text-dark" htmlFor="updateMetaSwitch">
                        Auto-populate Meta Title & Meta Description from generated content
                      </label>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-white border-top py-3 px-4 d-flex justify-content-between">
              <div className="text-muted small">
                {engine ? (
                  <>
                    <i className="bi bi-shield-check text-success me-1"></i>
                    Powered by {engine.label} · {engine.model}
                    {engine.source === 'env' && <span className="ms-1">(from .env)</span>}
                  </>
                ) : !isLoading && (
                  <span className="text-danger">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    No AI provider configured. <Link to="/seo-pages/ai-settings" onClick={onClose}>Open AI Settings</Link>
                  </span>
                )}
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-light rounded-pill px-4" onClick={onClose} disabled={isPending}>
                  Cancel
                </button>
                <button
                  type="submit"
                  form="ai-gen-form"
                  className="btn btn-primary rounded-pill px-4 fw-medium shadow-sm"
                  disabled={isPending || isLoading || !engine || selectedSections.length === 0}
                >
                  {isPending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Generating Long-Form Content...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-magic me-2"></i>
                      {targetItem
                        ? 'Generate Long-Form Page'
                        : selectedCount
                          ? `Generate ${selectedCount} selected page${selectedCount === 1 ? '' : 's'}`
                          : `Execute Bulk Queue (${bulkLimit} pages)`}
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default AiGenerationModal;

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import AiGenerationModal from '../components/seo/AiGenerationModal';
import { siteUrl } from '../config/siteUrl';
import SeoContentEditor from '../components/seo/SeoContentEditor';
import TailwindPreview from '../components/seo/TailwindPreview';
import HtmlCodeEditor from '../components/common/code/HtmlCodeEditor';

const SeoPageEditForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [activeTab, setActiveTab] = useState('visual'); // 'visual' | 'code' | 'preview'
    const [contentReset, setContentReset] = useState(0); // reloads the visual editor when AI replaces the content
    const [dirty, setDirty] = useState(false);
    const [data, setData] = useState({
        title: '',
        slug: '',
        status: 'DRAFT',
        contentSource: 'MANUAL',
        aiGenerationStatus: 'NOT_GENERATED',
        qualityScore: 0,
        longDescription: '',
        metaTitle: '',
        metaDescription: ''
    });

    useEffect(() => {
        api.get(`/seo-pages/${id}`).then(res => {
            setData(res.data.data);
        }).catch(err => {
            toast.error('Failed to load SEO Page variant.');
        }).finally(() => setLoading(false));
    }, [id]);

    const wordStats = useMemo(() => {
        if (!data.longDescription) return { count: 0, readTime: 0, tier: 'Empty' };
        const textOnly = data.longDescription.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const count = textOnly ? textOnly.split(/\s+/).filter(Boolean).length : 0;
        const readTime = Math.max(1, Math.ceil(count / 200));
        let tier = 'Concise';
        if (count >= 1400) tier = 'Comprehensive / Pillar';
        else if (count >= 800) tier = 'Standard';
        return { count, readTime, tier };
    }, [data.longDescription]);

    const handleChange = (e) => {
        setData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setDirty(true);
    };

    const setContent = (html) => {
        setData(prev => ({ ...prev, longDescription: html }));
        setDirty(true);
    };

    // Warn before closing the tab with unsaved edits.
    useEffect(() => {
        if (!dirty) return undefined;
        const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    // stay = true (Ctrl+S in the code editor): save and keep editing.
    const save = async (stay) => {
        if (saving) return;
        setSaving(true);
        try {
            await api.put(`/seo-pages/${id}`, data);
            setDirty(false);
            toast.success(stay ? 'Saved' : 'Landing page variant updated successfully');
            if (!stay) navigate('/seo-pages');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update variant');
        } finally {
            setSaving(false);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        save(false);
    };

    const handleAiGenerate = async (config) => {
        setRegenerating(true);
        try {
            const res = await api.post(`/seo-pages/generate-ai/${id}`, config);
            const updated = res.data.data;
            setData(prev => ({
                ...prev,
                longDescription: updated.longDescription,
                contentSource: 'AI',
                aiGenerationStatus: 'GENERATED',
                qualityScore: updated.qualityScore || prev.qualityScore,
                metaTitle: updated.metaTitle || prev.metaTitle,
                metaDescription: updated.metaDescription || prev.metaDescription
            }));
            setContentReset(n => n + 1);
            setDirty(true);
            toast.success(`Generated${updated.wordCount || wordStats.count} words across ${updated.sectionsGenerated?.length || 8} sections!`);
            setAiModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'AI Generation failed');
        } finally {
            setRegenerating(false);
        }
    };

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container-fluid p-0">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-1 fw-bold">Edit Canonical Variant</h4>
                    <p className="text-muted mb-0">Inspect, regenerate with AI, and fine-tune multi-section outputs mapping to this endpoint.</p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        type="button"
                        onClick={() => setAiModalOpen(true)}
                        className="btn btn-outline-dark rounded-pill px-4 shadow-sm"
                    >
                        <i className="bi bi-robot me-2 text-primary"></i> AI Content Studio
                    </button>
                    <Link to="/seo-pages" className="btn btn-light border shadow-sm rounded-pill px-4">
                        <i className="bi bi-arrow-left me-2"></i> Back to Matrix
                    </Link>
                </div>
            </div>

            <div className="card shadow-sm border-0 rounded-4">
                <div className="card-body p-4 p-md-5">
                    <form onSubmit={handleSave}>
                        <div className="row g-4 mb-4">

                            <div className="col-md-8">
                                <label className="form-label fw-semibold">Target Landing URL/Slug (Locked)</label>
                                <input type="text" className="form-control bg-light" value={data.slug || ''} disabled readOnly />
                                <small className="text-muted d-block mt-1">
                                    Website URL: <code>{siteUrl(data.slug)}</code>
                                    {data.status === 'PUBLISHED' && data.longDescription ? (
                                        <a href={siteUrl(data.slug)} target="_blank" rel="noreferrer" className="ms-2">View <i className="bi bi-box-arrow-up-right"></i></a>
                                    ) : (
                                        <span className="ms-2">(live once PUBLISHED with content and saved)</span>
                                    )}
                                </small>
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Publish Status</label>
                                <select className="form-select border-primary" name="status" value={data.status} onChange={handleChange}>
                                    <option value="DRAFT">DRAFT (Hidden)</option>
                                    <option value="PUBLISHED">PUBLISHED (Live)</option>
                                    <option value="ARCHIVED">ARCHIVED</option>
                                </select>
                                <div className="form-check form-switch mt-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        id="seo-indexable"
                                        checked={!!data.indexable}
                                        onChange={e => setData(prev => ({ ...prev, indexable: e.target.checked }))}
                                    />
                                    <label className="form-check-label small" htmlFor="seo-indexable">Allow Google to index this page</label>
                                </div>
                                <small className="text-muted d-block">Off = the page is live but marked <code>noindex</code>.</small>
                            </div>

                            {/* AI Content Studio Banner & Statistics */}
                            <div className="col-12 mt-4">
                                <div className="p-3 bg-light rounded-4 border d-flex flex-wrap align-items-center justify-content-between gap-3">
                                    <div className="d-flex align-items-center gap-3 flex-wrap">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="badge bg-primary px-3 py-2 fs-6 rounded-pill">
                                                <i className="bi bi-file-text me-1"></i>
                                                {wordStats.count.toLocaleString()} Words
                                            </span>
                                            <span className="badge bg-secondary-subtle text-dark border px-2 py-2 rounded-pill">
                                                ~{wordStats.readTime} min read
                                            </span>
                                        </div>
                                        <span className={`badge ${wordStats.count >= 1400 ? 'bg-success' : wordStats.count >= 800 ? 'bg-info' : 'bg-warning'} px-3 py-2 rounded-pill`}>
                                            Tier: {wordStats.tier}
                                        </span>
                                        {data.qualityScore > 0 && (
                                            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
                                                <i className="bi bi-award me-1"></i> Quality: {data.qualityScore}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAiModalOpen(true)}
                                            className="btn btn-sm btn-primary rounded-pill px-3 shadow-xs"
                                        >
                                            <i className="bi bi-magic me-1"></i> Regenerate Multi-Section AI
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Editor Section with Code & Preview Tabs */}
                            <div className="col-12 mt-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="fw-bold mb-0">Primary Multi-Section Content</h6>
                                    <ul className="nav nav-pills nav-fill bg-light p-1 rounded-pill border">
                                        <li className="nav-item">
                                            <button
                                                type="button"
                                                className={`nav-link rounded-pill py-1 px-3 ${activeTab === 'visual' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('visual')}
                                            >
                                                <i className="bi bi-pencil-square me-1"></i> Visual Editor
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button
                                                type="button"
                                                className={`nav-link rounded-pill py-1 px-3 ${activeTab === 'code' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('code')}
                                            >
                                                <i className="bi bi-code-slash me-1"></i> HTML Source
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button
                                                type="button"
                                                className={`nav-link rounded-pill py-1 px-3 ${activeTab === 'preview' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('preview')}
                                            >
                                                <i className="bi bi-eye me-1"></i> Live Visual Preview
                                            </button>
                                        </li>
                                    </ul>
                                </div>

                                {activeTab === 'visual' ? (
                                    <SeoContentEditor html={data.longDescription || ''} onChange={setContent} resetKey={contentReset} />
                                ) : activeTab === 'code' ? (
                                    <HtmlCodeEditor
                                        value={data.longDescription || ''}
                                        onChange={setContent}
                                        onSave={() => save(true)}
                                        fileName={`${(data.slug || 'content').split('/').pop()}.html`}
                                        path={`seo-page-${id}.html`}
                                        height={620}
                                    />
                                ) : (
                                    <TailwindPreview html={data.longDescription || ''} />
                                )}
                            </div>

                            {/* SEO Meta Constraints */}
                            <div className="col-12 mt-4">
                                <h6 className="fw-bold mb-3 border-bottom pb-2">SEO Meta Headers & Constraints</h6>
                                <div className="row g-3">
                                    <div className="col-md-12">
                                        <label className="form-label fw-semibold">H1 Headline Header</label>
                                        <input type="text" className="form-control" name="title" value={data.title} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">
                                            Meta Title Tag
                                            <small className="text-muted ms-2">({(data.metaTitle || '').length}/60 chars)</small>
                                        </label>
                                        <input type="text" className="form-control" name="metaTitle" value={data.metaTitle || ''} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">
                                            Meta Description Tag
                                            <small className="text-muted ms-2">({(data.metaDescription || '').length}/160 chars)</small>
                                        </label>
                                        <input type="text" className="form-control" name="metaDescription" value={data.metaDescription || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                        </div>

                        <hr className="my-5 opacity-10" />

                        <div className="d-flex justify-content-end align-items-center gap-3 seo-save-bar">
                            {dirty && <span className="text-warning-emphasis small me-auto"><i className="bi bi-circle-fill me-1" style={{ fontSize: 8 }}></i>Unsaved changes</span>}
                            <Link to="/seo-pages" className="btn btn-light rounded-pill px-4">Cancel</Link>
                            <button type="submit" disabled={saving} className="btn btn-primary rounded-pill px-5 fw-medium shadow-sm">
                                {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
                                Save Variant Constraints
                            </button>
                        </div>

                    </form>
                </div>
            </div>

            {/* In-Page AI Modal */}
            <AiGenerationModal
                show={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                onGenerate={handleAiGenerate}
                isPending={regenerating}
                targetItem={data}
            />
        </div>
    );
};

export default SeoPageEditForm;

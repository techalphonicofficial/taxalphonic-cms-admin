import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import { toast } from 'react-toastify';
import api from '../services/api';
import IncludedServices from '../components/packages/IncludedServices';
import '../components/common/PremiumForms.css';

// A plan's details (saved as plan.keywords, the field older SEO packages used for "10 Keywords").
// The website shows one line as text and several lines as a ticked list (PackagesBlock PlanDetails).
const PlanDetailsInput = ({ value, onChange, category }) => {
  const cat = (category || '').toLowerCase();
  const example = cat.includes('smo') || cat.includes('social media')
    ? 'e.g. Facebook + Instagram\n12 posts a month'
    : cat.includes('seo') ? 'e.g. 10 keywords\nMonthly ranking report' : 'e.g. Document review\nApplication filing\nCertificate in 7 days';
  const lines = String(value || '').split('\n').length;
  return (
    <div className="mt-2">
      <textarea
        className="form-control form-control-sm"
        rows={Math.min(8, Math.max(2, lines))}
        placeholder={example}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
      <div className="form-text mt-1">Details under the price (optional). Press Enter for a new line; several lines show as a ticked list on the website.</div>
    </div>
  );
};

const PackageForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [availableCategories, setAvailableCategories] = useState(['SEO Packages', 'Social Media Optimization Packages', 'Design and Development Packages']);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'SEO',
    description: '',
    isRecommended: false,
    displayOrder: 0
  });

  const [pricingPlans, setPricingPlans] = useState([]);
  const [keywordTiers, setKeywordTiers] = useState([]);
  const [features, setFeatures] = useState({ sections: [], collapsedCount: 3 });
  const [hasTiers, setHasTiers] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchPackage();
    }
  }, [id]);

  const fetchPackage = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/packages/${id}`);
      const data = res.data?.data || res.data;
      
      setFormData({
        name: data.name || '',
        category: data.category || 'SEO',
        description: data.description || '',
        isRecommended: data.isRecommended || false,
        displayOrder: data.displayOrder || 0
      });

      let kTiers = data.keywordTiers || [];
      if (typeof kTiers === 'string') {
        try { kTiers = JSON.parse(kTiers); } catch(e) { kTiers = []; }
      }

      let pPlans = data.pricingPlans || [];
      if (typeof pPlans === 'string') {
        try { pPlans = JSON.parse(pPlans); } catch(e) { pPlans = []; }
      }

      setKeywordTiers(kTiers);
      setPricingPlans(pPlans);
      setHasTiers(kTiers.length > 0);

      let feats = data.features || { sections: [], collapsedCount: 3 };
      if (typeof feats === 'string') {
        try { feats = JSON.parse(feats); } catch(e) { feats = { sections: [], collapsedCount: 3 }; }
      }
      // Migrate old format (sections + hiddenSections) → new format (single sections + collapsedCount)
      if (feats.hiddenSections && feats.hiddenSections.length > 0 && !feats.collapsedCount) {
        feats = {
          includedServices: feats.includedServices,
          sections: [...(feats.sections || []), ...(feats.hiddenSections || [])],
          collapsedCount: (feats.sections || []).length > 0 ? (feats.sections || []).reduce((acc, s) => acc + (s.items?.length || 0), 0) : 3
        };
      }
      if (!feats.collapsedCount) feats.collapsedCount = 3;
      setFeatures(feats);

    } catch (error) {
      console.error('Failed to fetch package:', error);
      toast.error('Failed to load package data.');
      navigate('/packages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        features
      };

      if (hasTiers) {
        payload.keywordTiers = keywordTiers;
        payload.pricingPlans = null;
      } else {
        payload.pricingPlans = pricingPlans;
        payload.keywordTiers = null;
      }

      if (isEditMode) {
        await api.put(`/packages/${id}`, payload);
        toast.success('Package updated successfully');
      } else {
        await api.post('/packages', payload);
        toast.success('Package created successfully');
      }
      navigate('/packages');
    } catch (error) {
      console.error('Failed to save package:', error);
      toast.error(error.response?.data?.message || 'Failed to save package');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Helpers for Tiers and Plans ---
  const addTier = () => {
    setKeywordTiers([...keywordTiers, { label: '', pricingPlans: [] }]);
  };
  const removeTier = (index) => {
    setKeywordTiers(keywordTiers.filter((_, i) => i !== index));
  };
  const updateTierLabel = (index, val) => {
    const newTiers = [...keywordTiers];
    newTiers[index].label = val;
    setKeywordTiers(newTiers);
  };

  const addPlanToTier = (tierIndex) => {
    const newTiers = [...keywordTiers];
    newTiers[tierIndex].pricingPlans.push({ duration: '1 Month', monthlyPrice: '', originalTotal: '', savePercentage: '', link: '' });
    setKeywordTiers(newTiers);
  };
  const updatePlanInTier = (tierIndex, planIndex, field, value) => {
    const newTiers = [...keywordTiers];
    newTiers[tierIndex].pricingPlans[planIndex][field] = value;
    setKeywordTiers(newTiers);
  };
  const removePlanFromTier = (tierIndex, planIndex) => {
    const newTiers = [...keywordTiers];
    newTiers[tierIndex].pricingPlans.splice(planIndex, 1);
    setKeywordTiers(newTiers);
  };

  // --- Helpers for non-tiered Plans ---
  const addPlan = () => {
    setPricingPlans([...pricingPlans, { duration: '1 Month', keywords: '', monthlyPrice: '', originalTotal: '', savePercentage: '', link: '' }]);
  };
  const updatePlan = (index, field, value) => {
    const newPlans = [...pricingPlans];
    newPlans[index][field] = value;
    setPricingPlans(newPlans);
  };
  const removePlan = (index) => {
    setPricingPlans(pricingPlans.filter((_, i) => i !== index));
  };

  // --- Helpers for Features (single list) ---
  const addFeatureSection = () => {
    setFeatures(prev => ({
      ...prev,
      sections: [...(prev.sections || []), { title: 'New Section', items: [] }]
    }));
  };
  const removeFeatureSection = (index) => {
    setFeatures(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== index) }));
  };
  const updateFeatureSection = (index, field, value) => {
    const newArr = [...features.sections];
    newArr[index][field] = value;
    setFeatures({ ...features, sections: newArr });
  };
  const addFeatureItem = (sectionIndex) => {
    const newArr = [...features.sections];
    newArr[sectionIndex].items.push({ text: 'New Feature', included: true });
    setFeatures({ ...features, sections: newArr });
  };
  const removeFeatureItem = (sectionIndex, itemIndex) => {
    const newArr = [...features.sections];
    newArr[sectionIndex].items.splice(itemIndex, 1);
    setFeatures({ ...features, sections: newArr });
  };
  const updateFeatureItem = (sectionIndex, itemIndex, field, value) => {
    const newArr = [...features.sections];
    newArr[sectionIndex].items[itemIndex][field] = value;
    setFeatures({ ...features, sections: newArr });
  };

  const renameCategory = async (oldName) => {
    if (!oldName || oldName === '__custom__') return;
    const newName = window.prompt(`Rename category "${oldName}" across ALL packages to:`, oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;
    
    try {
      const res = await api.put('/packages/categories/rename', { oldName, newName: newName.trim() });
      if (res.data.success) {
        toast.success(`Category renamed to ${newName.trim()}`);
        setAvailableCategories(prev => prev.map(c => c === oldName ? newName.trim() : c));
        if (formData.category === oldName) {
          setFormData(prev => ({ ...prev, category: newName.trim() }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename category');
    }
  };

  return (
    <div className="premium-form-layout">
      {/* Header */}
      <div className="ta-editor-bar d-flex justify-content-between align-items-center mb-4">
        <div>
          <Breadcrumb items={[
            { label: 'Services', link: '/services' },
            { label: 'Packages', link: '/packages' },
            { label: isEditMode ? 'Edit Package' : 'New Package' }
          ]} />
          <h2 className="premium-title mb-0 fs-5">{isEditMode ? 'Edit Package' : 'Create Package'}</h2>
        </div>
        <div className="d-flex gap-2">
          <Link to="/packages" className="btn btn-light border">Cancel</Link>
          <button 
            type="submit" 
            form="packageForm" 
            className="premium-btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <><span className="spinner-border spinner-border-sm me-2" /> Saving...</>
            ) : (
              <><i className="bi bi-check-lg me-2" /> Save Package</>
            )}
          </button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          {/* Tabs */}
          {/* Sticky under the editor header (global.scss .ta-sticky-tabs). */}
          <div className="ta-sticky-tabs mb-4">
          <ul className="nav nav-tabs premium-tabs mb-0">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                General
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === 'pricing' ? 'active' : ''}`}
                onClick={() => setActiveTab('pricing')}
              >
                Pricing & Tiers
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === 'features' ? 'active' : ''}`}
                onClick={() => setActiveTab('features')}
              >
                Features
              </button>
            </li>
          </ul>
          </div>

          <form id="packageForm" onSubmit={onSubmit}>
            {/* GENERAL TAB */}
            <div style={{ display: activeTab === 'general' ? 'block' : 'none' }}>
              <div className="premium-card mb-4">
                <div className="premium-card-header">
                  <h5 className="premium-card-title">Basic Information</h5>
                </div>
                <div className="premium-card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Package Name <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="form-control" 
                        placeholder="e.g. Local SEO" 
                        required 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Category</label>
                      <div className="d-flex gap-2">
                        <select 
                          name="category"
                          value={showCustomInput ? '__custom__' : formData.category}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setShowCustomInput(true);
                            } else {
                              setShowCustomInput(false);
                              handleChange(e);
                            }
                          }}
                          className="form-select"
                        >
                          {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="__custom__">+ Add New Category...</option>
                        </select>
                        {!showCustomInput && formData.category && formData.category !== '__custom__' && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => renameCategory(formData.category)}
                            title={`Rename ${formData.category} across all packages`}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                      </div>
                      {showCustomInput && (
                        <div className="d-flex gap-2 mt-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter new category name (e.g. Email Marketing)"
                            value={customCategory}
                            onChange={e => setCustomCategory(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-success text-nowrap"
                            onClick={() => {
                              const trimmed = customCategory.trim();
                              if (trimmed && !availableCategories.includes(trimmed)) {
                                setAvailableCategories(prev => [...prev, trimmed]);
                              }
                              if (trimmed) {
                                setFormData(prev => ({ ...prev, category: trimmed }));
                              }
                              setShowCustomInput(false);
                              setCustomCategory('');
                            }}
                          >
                            <i className="bi bi-plus-lg me-1" /> Add
                          </button>
                          <button
                            type="button"
                            className="btn btn-light border text-nowrap"
                            onClick={() => { setShowCustomInput(false); setCustomCategory(''); }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      <small className="text-muted">Select existing or create a new category</small>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium">Description</label>
                      <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="form-control" 
                        rows="3" 
                        placeholder="Package description or subtitle..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bundle: several services in one package (saved in features.includedServices) */}
              <div className="premium-card mb-4">
                <div className="premium-card-header d-flex justify-content-between align-items-center">
                  <h5 className="premium-card-title">Services in this package</h5>
                  {(features.includedServices || []).length > 0 && (
                    <span className="badge bg-primary-subtle text-primary-emphasis">
                      Bundle · {(features.includedServices || []).length} services
                    </span>
                  )}
                </div>
                <div className="premium-card-body">
                  <IncludedServices
                    value={features.includedServices || []}
                    onChange={(includedServices) => setFeatures((prev) => ({ ...prev, includedServices }))}
                  />
                </div>
              </div>
            </div>

            {/* PRICING TAB */}
            <div style={{ display: activeTab === 'pricing' ? 'block' : 'none' }}>
              <div className="premium-card mb-4">
                <div className="premium-card-header d-flex justify-content-between align-items-center">
                  <h5 className="premium-card-title">Pricing Structure</h5>
                  {!(formData.category?.toLowerCase()?.includes('design') || formData.category?.toLowerCase()?.includes('development')) && (
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      checked={hasTiers}
                      onChange={(e) => setHasTiers(e.target.checked)}
                      id="hasTiersSwitch" 
                    />
                    <label className="form-check-label" htmlFor="hasTiersSwitch">
                      Use Keyword Tiers (e.g. 10 Keywords, 30 Keywords)
                    </label>
                  </div>
                  )}
                </div>
                <div className="premium-card-body">
                  
                  {hasTiers ? (
                    <div>
                      {keywordTiers.map((tier, tIdx) => (
                        <div key={tIdx} className="border rounded p-3 mb-3 bg-light">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div className="w-50">
                              <label className="form-label small">Tier Label (e.g. "30 Keywords")</label>
                              <input 
                                type="text" 
                                className="form-control form-control-sm"
                                value={tier.label}
                                onChange={(e) => updateTierLabel(tIdx, e.target.value)}
                              />
                            </div>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeTier(tIdx)}>
                              <i className="bi bi-trash"></i> Remove Tier
                            </button>
                          </div>

                          <h6>Pricing Plans</h6>
                          {tier.pricingPlans.map((plan, pIdx) => (
                            <div key={pIdx} className="mb-2 bg-white p-2 border rounded">
                              <div className="d-flex gap-2 align-items-center">
                                <input type="text" className="form-control form-control-sm" placeholder="Duration (e.g. 1 Month)" value={plan.duration} onChange={e => updatePlanInTier(tIdx, pIdx, 'duration', e.target.value)} />
                                <input type="text" className="form-control form-control-sm" placeholder="Price (₹)" value={plan.monthlyPrice} onChange={e => updatePlanInTier(tIdx, pIdx, 'monthlyPrice', e.target.value)} />
                                <input type="text" className="form-control form-control-sm" placeholder="Original (₹)" value={plan.originalTotal} onChange={e => updatePlanInTier(tIdx, pIdx, 'originalTotal', e.target.value)} />
                                <input type="text" className="form-control form-control-sm" placeholder="Save %" value={plan.savePercentage} onChange={e => updatePlanInTier(tIdx, pIdx, 'savePercentage', e.target.value)} />
                                <button type="button" className="btn btn-sm btn-light text-danger" onClick={() => removePlanFromTier(tIdx, pIdx)} title="Remove plan"><i className="bi bi-x-lg"></i></button>
                              </div>
                              <PlanDetailsInput value={plan.keywords} onChange={v => updatePlanInTier(tIdx, pIdx, 'keywords', v)} category={formData.category} />
                            </div>
                          ))}
                          <button type="button" className="btn btn-sm btn-secondary mt-2" onClick={() => addPlanToTier(tIdx)}>
                            + Add Plan to Tier
                          </button>
                        </div>
                      ))}
                      <button type="button" className="btn btn-outline-primary" onClick={addTier}>
                        + Add Keyword Tier
                      </button>
                    </div>
                  ) : (
                    <div>
                      {pricingPlans.map((plan, pIdx) => (
                        <div key={pIdx} className="mb-2 bg-light p-2 border rounded">
                          <div className="d-flex gap-2 align-items-center">
                            <input type="text" className="form-control form-control-sm" placeholder="Plan name / duration" value={plan.duration} onChange={e => updatePlan(pIdx, 'duration', e.target.value)} />
                            <input type="text" className="form-control form-control-sm" placeholder="Price (₹)" value={plan.monthlyPrice} onChange={e => updatePlan(pIdx, 'monthlyPrice', e.target.value)} />
                            <input type="text" className="form-control form-control-sm" placeholder="Original (₹)" value={plan.originalTotal} onChange={e => updatePlan(pIdx, 'originalTotal', e.target.value)} />
                            <input type="text" className="form-control form-control-sm" placeholder="Save %" value={plan.savePercentage} onChange={e => updatePlan(pIdx, 'savePercentage', e.target.value)} />
                            <button type="button" className="btn btn-sm btn-light text-danger" onClick={() => removePlan(pIdx)} title="Remove plan"><i className="bi bi-trash"></i></button>
                          </div>
                          <PlanDetailsInput value={plan.keywords} onChange={v => updatePlan(pIdx, 'keywords', v)} category={formData.category} />
                        </div>
                      ))}
                      <button type="button" className="btn btn-outline-primary mt-2" onClick={addPlan}>
                        + Add Pricing Plan
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* FEATURES TAB */}
            <div style={{ display: activeTab === 'features' ? 'block' : 'none' }}>
              <div className="premium-card mb-4">
                <div className="premium-card-header d-flex justify-content-between align-items-center">
                  <h5 className="premium-card-title">Features List</h5>
                  <div className="d-flex align-items-center gap-2">
                    <label className="form-label mb-0 small fw-semibold">Collapsed mein dikhao:</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      style={{ width: '70px' }}
                      min={1}
                      value={features.collapsedCount || 3}
                      onChange={e => setFeatures(prev => ({ ...prev, collapsedCount: parseInt(e.target.value) || 3 }))}
                      title="Kitne sections collapse state mein dikhao"
                    />
                    <span className="text-muted small">sections</span>
                  </div>
                </div>
                <div className="premium-card-body">
                  <p className="text-muted small mb-3">
                    <i className="bi bi-info-circle me-1" />
                    Pehle <strong>{features.collapsedCount || 3}</strong> sections collapsed state mein dikhenge. 
                    "See All Features" click karne par baaki sab dikhenge.
                  </p>
                  {features.sections?.map((section, sIdx) => (
                    <div key={sIdx} className={`border rounded p-3 mb-3 ${sIdx < (features.collapsedCount || 3) ? 'border-success bg-light' : 'border-warning'}`}>
                      <div className="d-flex justify-content-between mb-2 align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge ${sIdx < (features.collapsedCount || 3) ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '10px' }}>
                            {sIdx < (features.collapsedCount || 3) ? '👁 Visible' : '🔒 Hidden'}
                          </span>
                          <input type="text" className="form-control form-control-sm fw-bold" style={{ width: '220px' }} value={section.title} onChange={e => updateFeatureSection(sIdx, 'title', e.target.value)} />
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeFeatureSection(sIdx)}>Remove</button>
                      </div>
                      <div className="ps-3 border-start">
                        {section.items?.map((item, iIdx) => (
                          <div key={iIdx} className="d-flex gap-2 mb-1 align-items-center">
                            <input type="checkbox" className="form-check-input" checked={item.included} onChange={e => updateFeatureItem(sIdx, iIdx, 'included', e.target.checked)} />
                            <input type="text" className="form-control form-control-sm" value={item.text} onChange={e => updateFeatureItem(sIdx, iIdx, 'text', e.target.value)} />
                            <button type="button" className="btn btn-sm text-danger border-0 bg-transparent" onClick={() => removeFeatureItem(sIdx, iIdx)}><i className="bi bi-x" /></button>
                          </div>
                        ))}
                        <button type="button" className="btn btn-sm btn-link" onClick={() => addFeatureItem(sIdx)}>+ Add Item</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline-primary" onClick={addFeatureSection}>+ Add Section</button>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="col-lg-4">
          <div className="premium-card mb-4">
            <div className="premium-card-header">
              <h5 className="premium-card-title">Publish Options</h5>
            </div>
            <div className="premium-card-body">
              <div className="mb-3">
                <div className="form-check form-switch">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="isRecommended" 
                    name="isRecommended"
                    checked={formData.isRecommended}
                    onChange={handleChange}
                  />
                  <label className="form-check-label fw-medium" htmlFor="isRecommended">Recommended Badge</label>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium">Display Order</label>
                <input 
                  type="number" 
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleChange}
                  className="form-control" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageForm;

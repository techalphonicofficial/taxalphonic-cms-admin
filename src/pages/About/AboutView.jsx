import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AboutPageService from '../../services/aboutpage.service';
import RichTextEditor from '../../components/common/RichTextEditor';
import ImageSizeHint from '../../components/common/ImageSizeHint';
import { mediaUrl } from '../../utils/mediaUrl';
import MediaPickButton from '../../components/media/MediaPickButton';

const AboutView = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    heroTitle: '', heroSubtitle: '',
    overviewHeading: '', overviewDescription: '',
    missionText: '', visionText: '',
    statYears: '', statYearsLabel: '', statYearsDesc: '', statProjects: '', statProjectsLabel: '', statProjectsDesc: '',
    statExperts: '', statExpertsLabel: '', statExpertsDesc: '', statRetention: '', statRetentionLabel: '', statRetentionDesc: '',
    aboutImage: '',
    homeAboutHeading: '',
    homeAboutDescription: '',
    homeAboutImage: ''
  });

  const [coreValues, setCoreValues] = useState([]);
  const [historyTimeline, setHistoryTimeline] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [homeImageFile, setHomeImageFile] = useState(null);
  const [homeImagePreview, setHomeImagePreview] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await AboutPageService.getSettings();
      if (res.success && res.data) {
        const d = res.data;
        setFormData({
          heroTitle: d.heroTitle || '', heroSubtitle: d.heroSubtitle || '',
          overviewHeading: d.overviewHeading || '', overviewDescription: d.overviewDescription || '',
          missionText: d.missionText || '', visionText: d.visionText || '',
          statYears: d.statYears || '', statYearsLabel: d.statYearsLabel || '', statYearsDesc: d.statYearsDesc || '', statProjects: d.statProjects || '', statProjectsLabel: d.statProjectsLabel || '', statProjectsDesc: d.statProjectsDesc || '',
          statExperts: d.statExperts || '', statExpertsLabel: d.statExpertsLabel || '', statExpertsDesc: d.statExpertsDesc || '', statRetention: d.statRetention || '', statRetentionLabel: d.statRetentionLabel || '', statRetentionDesc: d.statRetentionDesc || '',
          homeAboutHeading: d.homeAboutHeading || '',
          homeAboutDescription: d.homeAboutDescription || ''
        });

        if (d.aboutImage) {
          setImagePreview(mediaUrl(d.aboutImage));
        }
        if (d.homeAboutImage) {
          setHomeImagePreview(mediaUrl(d.homeAboutImage));
        }

        // Parse Core Values
        let parsedCV = [];
        try { parsedCV = typeof d.coreValues === 'string' ? JSON.parse(d.coreValues) : (d.coreValues || []); } catch(e){}
        if(typeof parsedCV === 'string') { try { parsedCV = JSON.parse(parsedCV); } catch(e){ parsedCV = []; } }
        setCoreValues(Array.isArray(parsedCV) ? parsedCV : []);

        // Parse History Timeline
        let parsedHT = [];
        try { parsedHT = typeof d.historyTimeline === 'string' ? JSON.parse(d.historyTimeline) : (d.historyTimeline || []); } catch(e){}
        if(typeof parsedHT === 'string') { try { parsedHT = JSON.parse(parsedHT); } catch(e){ parsedHT = []; } }
        setHistoryTimeline(Array.isArray(parsedHT) ? parsedHT : []);
      }
    } catch (error) {
      toast.error('Failed to load About page data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleHomeImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHomeImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setHomeImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // -- Core Values Handlers --
  const addCoreValue = () => setCoreValues([...coreValues, { title: '', desc: '', icon: 'fa-solid fa-star', color: '#0066bf' }]);
  const updateCoreValue = (index, field, value) => {
    const newArr = [...coreValues];
    newArr[index][field] = value;
    setCoreValues(newArr);
  };
  const removeCoreValue = (index) => setCoreValues(coreValues.filter((_, i) => i !== index));

  // -- History Timeline Handlers --
  const addHistory = () => setHistoryTimeline([...historyTimeline, { year: '', points: [''] }]);
  const updateHistory = (index, field, value) => {
    const newArr = [...historyTimeline];
    newArr[index][field] = value;
    setHistoryTimeline(newArr);
  };
  const addHistoryPoint = (historyIndex) => {
    const newArr = [...historyTimeline];
    newArr[historyIndex].points.push('');
    setHistoryTimeline(newArr);
  };
  const updateHistoryPoint = (historyIndex, pointIndex, value) => {
    const newArr = [...historyTimeline];
    newArr[historyIndex].points[pointIndex] = value;
    setHistoryTimeline(newArr);
  };
  const removeHistoryPoint = (historyIndex, pointIndex) => {
    const newArr = [...historyTimeline];
    newArr[historyIndex].points.splice(pointIndex, 1);
    setHistoryTimeline(newArr);
  };
  const removeHistory = (index) => setHistoryTimeline(historyTimeline.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const submitData = new FormData();
      Object.keys(formData).forEach(key => submitData.append(key, formData[key] || ''));
      submitData.append('coreValues', JSON.stringify(coreValues));
      submitData.append('historyTimeline', JSON.stringify(historyTimeline));
      if (imageFile) {
        submitData.append('aboutImage', imageFile);
      }
      if (homeImageFile) {
        submitData.append('homeAboutImage', homeImageFile);
      }

      const res = await AboutPageService.updateSettings(submitData);
      if (res.success) {
        toast.success('About page updated successfully');
      }
    } catch (error) {
      toast.error('Failed to save About page data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  return (
    <div className="container-fluid pb-4">
      <div className="ta-editor-bar d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h2 className="mb-1 fw-bold fs-3">About Page Management</h2>
          <p className="text-body-secondary mb-0">Manage the content of your About Agency page dynamically.</p>
        </div>
        <button type="submit" form="about-form" className="btn btn-primary px-4" disabled={saving}>
          {saving ? 'Saving...' : <><i className="bi bi-save me-2"></i>Save About Page</>}
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
          <ul className="nav nav-tabs border-bottom">
            <li className="nav-item">
              <button type="button" className={`nav-link ${activeTab === 'general' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('general')}>General & Hero</button>
            </li>
            <li className="nav-item">
              <button type="button" className={`nav-link ${activeTab === 'stats' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('stats')}>Stats Section</button>
            </li>
            <li className="nav-item">
              <button type="button" className={`nav-link ${activeTab === 'core_values' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('core_values')}>Core Values</button>
            </li>
            <li className="nav-item">
              <button type="button" className={`nav-link ${activeTab === 'history' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('history')}>History Timeline</button>
            </li>
            <li className="nav-item">
              <button type="button" className={`nav-link ${activeTab === 'home_about' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('home_about')}>Home Page About</button>
            </li>
          </ul>
        </div>
        <div className="card-body p-4">
          <form id="about-form" onSubmit={handleSubmit}>
            
            {/* Home Page About Tab */}
            {activeTab === 'home_about' && (
              <div className="row">
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Home Page Heading</label>
                  <input type="text" className="form-control" name="homeAboutHeading" value={formData.homeAboutHeading || ''} onChange={handleInputChange} placeholder="e.g. about us" />
                </div>
                
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Home Page Image</label>
                  <ImageSizeHint kind="aboutHomeImage" className="form-text mt-0 mb-2" />
                  <div className="text-center mb-3 bg-light rounded-4 d-flex align-items-center justify-content-center" style={{ minHeight: '150px', border: '2px dashed #ddd', width: '250px' }}>
                    {homeImagePreview ? (
                      <img src={homeImagePreview} alt="Preview" className="img-fluid rounded-4" style={{ maxHeight: '150px' }} />
                    ) : (
                      <span className="text-muted small">No image selected</span>
                    )}
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <label className="btn btn-outline-primary btn-sm mb-3">
                      <i className="bi bi-upload me-2"></i> Upload Home Image
                      <input type="file" accept="image/*" className="d-none" onChange={handleHomeImageChange} />
                    </label>
                  <MediaPickButton
                    label="Choose from Media"
                    className="btn btn-outline-secondary btn-sm mb-3"
                    onPick={url => { setFormData(prev => ({ ...prev, homeAboutImage: url })); setHomeImageFile(null); setHomeImagePreview(mediaUrl(url)); }}
                  />
                  </div>
                </div>
                
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Home Page Description</label>
                  <RichTextEditor 
                    value={formData.homeAboutDescription || ''} 
                    onChange={(val) => setFormData(prev => ({ ...prev, homeAboutDescription: val }))} 
                  />
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="row">
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Hero Title</label>
                  <input type="text" className="form-control" name="heroTitle" value={formData.heroTitle || ''} onChange={handleInputChange} />
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Hero Subtitle</label>
                  <textarea className="form-control" name="heroSubtitle" rows="2" value={formData.heroSubtitle || ''} onChange={handleInputChange}></textarea>
                </div>
                <hr className="my-4" />
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Overview Heading</label>
                  <input type="text" className="form-control" name="overviewHeading" value={formData.overviewHeading || ''} onChange={handleInputChange} />
                </div>
                
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Overview Image</label>
                  <ImageSizeHint kind="aboutImage" className="form-text mt-0 mb-2" />
                  <div className="text-center mb-3 bg-light rounded-4 d-flex align-items-center justify-content-center" style={{ minHeight: '150px', border: '2px dashed #ddd', width: '250px' }}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="img-fluid rounded-4" style={{ maxHeight: '150px' }} />
                    ) : (
                      <span className="text-muted small">No image selected</span>
                    )}
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <label className="btn btn-outline-primary btn-sm mb-3">
                      <i className="bi bi-upload me-2"></i> Upload Image
                      <input type="file" accept="image/*" className="d-none" onChange={handleImageChange} />
                    </label>
                  <MediaPickButton
                    label="Choose from Media"
                    className="btn btn-outline-secondary btn-sm mb-3"
                    onPick={url => { setFormData(prev => ({ ...prev, aboutImage: url })); setImageFile(null); setImagePreview(mediaUrl(url)); }}
                  />
                  </div>
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Overview Description</label>
                  <RichTextEditor 
                    value={formData.overviewDescription || ''} 
                    onChange={(val) => setFormData(prev => ({ ...prev, overviewDescription: val }))} 
                  />
                </div>
                <hr className="my-4" />
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Mission Text</label>
                  <textarea className="form-control" name="missionText" rows="3" value={formData.missionText || ''} onChange={handleInputChange}></textarea>
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Vision Text</label>
                  <textarea className="form-control" name="visionText" rows="3" value={formData.visionText || ''} onChange={handleInputChange}></textarea>
                </div>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Years of Experience Stat (e.g. 8+)</label>
                  <input type="text" className="form-control" name="statYears" value={formData.statYears || ''} onChange={handleInputChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Years Label & Desc</label>
                  <input type="text" className="form-control mb-2" name="statYearsLabel" value={formData.statYearsLabel || ''} onChange={handleInputChange} placeholder="Label" />
                  <textarea className="form-control" name="statYearsDesc" value={formData.statYearsDesc || ''} onChange={handleInputChange} rows="2" placeholder="Description"></textarea>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Projects Delivered Stat (e.g. 1000+)</label>
                  <input type="text" className="form-control" name="statProjects" value={formData.statProjects || ''} onChange={handleInputChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Projects Label & Desc</label>
                  <input type="text" className="form-control mb-2" name="statProjectsLabel" value={formData.statProjectsLabel || ''} onChange={handleInputChange} placeholder="Label" />
                  <textarea className="form-control" name="statProjectsDesc" value={formData.statProjectsDesc || ''} onChange={handleInputChange} rows="2" placeholder="Description"></textarea>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Digital Experts Stat (e.g. 50+)</label>
                  <input type="text" className="form-control" name="statExperts" value={formData.statExperts || ''} onChange={handleInputChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Experts Label & Desc</label>
                  <input type="text" className="form-control mb-2" name="statExpertsLabel" value={formData.statExpertsLabel || ''} onChange={handleInputChange} placeholder="Label" />
                  <textarea className="form-control" name="statExpertsDesc" value={formData.statExpertsDesc || ''} onChange={handleInputChange} rows="2" placeholder="Description"></textarea>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Client Retention Stat (e.g. 99%)</label>
                  <input type="text" className="form-control" name="statRetention" value={formData.statRetention || ''} onChange={handleInputChange} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Retention Label & Desc</label>
                  <input type="text" className="form-control mb-2" name="statRetentionLabel" value={formData.statRetentionLabel || ''} onChange={handleInputChange} placeholder="Label" />
                  <textarea className="form-control" name="statRetentionDesc" value={formData.statRetentionDesc || ''} onChange={handleInputChange} rows="2" placeholder="Description"></textarea>
                </div>
              </div>
            )}

            {/* Core Values Tab */}
            {activeTab === 'core_values' && (
              <div className="row">
                <div className="col-12 d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 fw-bold">Core Values ({coreValues.length})</h5>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={addCoreValue}>
                    <i className="bi bi-plus-lg me-1"></i> Add Core Value
                  </button>
                </div>
                
                {coreValues.map((cv, idx) => (
                  <div key={idx} className="col-12 mb-3 p-3 border rounded position-relative bg-white">
                    <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2" onClick={() => removeCoreValue(idx)}>
                      <i className="bi bi-trash"></i>
                    </button>
                    <div className="row g-2 pe-5">
                      <div className="col-md-4">
                        <label className="form-label small fw-bold">Title</label>
                        <input type="text" className="form-control form-control-sm" value={cv.title} onChange={e => updateCoreValue(idx, 'title', e.target.value)} placeholder="e.g. Uncompromising Quality" required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold">Icon Class (FontAwesome)</label>
                        <input type="text" className="form-control form-control-sm" value={cv.icon} onChange={e => updateCoreValue(idx, 'icon', e.target.value)} placeholder="e.g. fa-solid fa-medal" />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold">Gradient Color</label>
                        <input type="color" className="form-control form-control-sm form-control-color w-100" value={cv.color || '#0066bf'} onChange={e => updateCoreValue(idx, 'color', e.target.value)} />
                      </div>
                      <div className="col-12 mt-2">
                        <label className="form-label small fw-bold">Description</label>
                        <textarea className="form-control form-control-sm" rows="2" value={cv.desc} onChange={e => updateCoreValue(idx, 'desc', e.target.value)} placeholder="Short description..." required></textarea>
                      </div>
                    </div>
                  </div>
                ))}
                {coreValues.length === 0 && <p className="text-muted text-center py-4">No core values added yet.</p>}
              </div>
            )}

            {/* History Timeline Tab */}
            {activeTab === 'history' && (
              <div className="row">
                <div className="col-12 d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 fw-bold">History Timeline ({historyTimeline.length})</h5>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={addHistory}>
                    <i className="bi bi-plus-lg me-1"></i> Add Timeline Year
                  </button>
                </div>
                
                {historyTimeline.map((item, idx) => (
                  <div key={idx} className="col-12 mb-3 p-3 border rounded position-relative bg-white">
                    <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2" onClick={() => removeHistory(idx)}>
                      <i className="bi bi-trash"></i>
                    </button>
                    <div className="row g-3 pe-5">
                      <div className="col-md-3">
                        <label className="form-label small fw-bold">Year</label>
                        <input type="text" className="form-control form-control-sm" value={item.year} onChange={e => updateHistory(idx, 'year', e.target.value)} placeholder="e.g. 2024" required />
                      </div>
                      <div className="col-md-9">
                        <label className="form-label small fw-bold mb-2 d-flex justify-content-between align-items-center">
                          Bullet Points
                          <button type="button" className="btn btn-sm btn-link p-0 text-decoration-none" onClick={() => addHistoryPoint(idx)}>+ Add Point</button>
                        </label>
                        {item.points.map((point, pIdx) => (
                          <div key={pIdx} className="input-group input-group-sm mb-2">
                            <input type="text" className="form-control" value={point} onChange={e => updateHistoryPoint(idx, pIdx, e.target.value)} placeholder="Enter bullet point..." required />
                            <button type="button" className="btn btn-outline-danger" onClick={() => removeHistoryPoint(idx, pIdx)} disabled={item.points.length <= 1}>
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {historyTimeline.length === 0 && <p className="text-muted text-center py-4">No history timeline events added yet.</p>}
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};

export default AboutView;

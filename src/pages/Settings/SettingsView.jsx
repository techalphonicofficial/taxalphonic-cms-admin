import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { settingsSchemas } from './settingsSchemas';
import SettingService from '../../services/setting.service';
import MediaPickerModal from '../../components/media/MediaPickerModal';
import ImageSizeHint from '../../components/common/ImageSizeHint';

// Settings image fields → their recommended size (config/imageSizes.js).
const IMAGE_KIND = {
  logo: 'logo', lightLogo: 'lightLogo', darkLogo: 'darkLogo', favicon: 'favicon', appleTouchIcon: 'appleTouchIcon',
  emailLogo: 'emailLogo', invoiceLogo: 'invoiceLogo', watermarkLogo: 'watermarkLogo',
  openGraphImage: 'ogImage', twitterCardImage: 'ogImage', defaultImage: 'defaultImage', signature: 'signature', qrCode: 'qrCode',
};

const SettingsView = () => {
  const { group } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [mediaPickerConfig, setMediaPickerConfig] = useState({ show: false, field: null });

  const schema = settingsSchemas[group];

  useEffect(() => {
    if (!group || !settingsSchemas[group]) {
      navigate('/settings/organization', { replace: true });
      return;
    }
    fetchSettings();
  }, [group, navigate]);

  const fetchSettings = async () => {
    if (!group) return;
    try {
      setLoading(true);
      const res = await SettingService.getGroupSettings(group);
      if (res.success) {
        setFormData(res.data || {});
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await SettingService.updateGroupSettings(group, formData);
      if (res.success) {
        toast.success(res.message || 'Settings saved successfully');
        setFormData(res.data);
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!schema) return null;

  return (
    <div className="container-fluid pb-4">
      <div className="ta-editor-bar d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1 small">
              <li className="breadcrumb-item">
                <a href="/" className="text-decoration-none text-body-secondary">
                  <i className="bi bi-house-door me-1"></i>Dashboard
                </a>
              </li>
              <li className="breadcrumb-item text-body-secondary">Settings</li>
              <li className="breadcrumb-item active fw-medium" aria-current="page">{schema.title}</li>
            </ol>
          </nav>
          <div className="d-flex align-items-center">
            <div className="me-3 bg-primary bg-opacity-10 text-primary p-3 rounded-3 d-flex align-items-center justify-content-center">
              <i className={`bi ${group === 'organization' ? 'bi-building' : group === 'contact' ? 'bi-telephone' : group === 'social' ? 'bi-share' : group === 'seo' ? 'bi-search' : 'bi-gear'} fs-4`}></i>
            </div>
            <div>
              <h2 className="mb-1 fw-bold fs-3">{schema.title}</h2>
              <p className="text-body-secondary mb-0">{schema.description}</p>
            </div>
          </div>
        </div>
        <button type="submit" form="settings-form" className="btn btn-primary px-4 py-2" disabled={saving}>
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Saving...
            </>
          ) : (
            <>
              <i className="bi bi-save me-2"></i>
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="row">
        <div className="col-12">
          <form id="settings-form" onSubmit={handleSubmit}>
            {(() => {
              const groupedFields = [];
              let currentGroup = { heading: null, fields: [] };

              schema.fields.forEach(field => {
                if (field.type === 'heading') {
                  if (currentGroup.fields.length > 0 || currentGroup.heading) {
                    groupedFields.push(currentGroup);
                  }
                  currentGroup = { heading: field, fields: [] };
                } else {
                  currentGroup.fields.push(field);
                }
              });
              if (currentGroup.fields.length > 0 || currentGroup.heading) {
                groupedFields.push(currentGroup);
              }

              return (
                <div className="row">
                  {groupedFields.map((section, idx) => (
                    <div className={`${group === 'payment' ? 'col-12 col-xl-6' : 'col-12'} mb-2`} key={idx}>
                      <div className="card shadow-sm border-0 h-100">
                        {section.heading && (
                          <div
                            className="card-header py-3 border-0 rounded-top"
                            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
                          >
                            <h6 className="mb-0 text-white fw-bold">{section.heading.label}</h6>
                          </div>
                        )}
                        <div className="card-body p-4">
                          <div className="row">
                            {section.fields.map((field) => (
                              <div className={`${(field.type === 'textarea' || field.fullWidth) ? 'col-12' : (group === 'payment' ? 'col-md-12' : 'col-md-6')} mb-2`} key={field.name}>
                                <div className={`${field.halfWidth ? 'bg-light border rounded p-3 h-100' : 'h-100'}`}>
                                  {field.type !== 'switch' && (
                                    <label className="form-label fw-bold">
                                      {field.label}
                                      {field.example && <span className="ms-2 text-body-secondary fw-normal small">{field.example}</span>}
                                    </label>
                                  )}

                                  {field.type === 'text' || field.type === 'email' || field.type === 'password' || field.type === 'number' ? (
                                    <>
                                      {(field.name.toLowerCase().includes('logo') || field.name.toLowerCase().includes('icon') || field.name.toLowerCase().includes('image')) ? (
                                        <div className="input-group">
                                          <input
                                            type={field.type}
                                            className="form-control"
                                            name={field.name}
                                            placeholder={field.placeholder || ''}
                                            value={formData[field.name] !== undefined ? formData[field.name] : ''}
                                            onChange={handleInputChange}
                                            readOnly={field.readOnly}
                                          />
                                          <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setMediaPickerConfig({ show: true, field: field.name })}
                                          >
                                            <i className="bi bi-image me-1"></i> Browse...
                                          </button>
                                          {formData[field.name] && (
                                            <button
                                              type="button"
                                              className="btn btn-outline-danger px-3"
                                              onClick={() => handleInputChange({ target: { name: field.name, type: 'text', value: '' } })}
                                              title="Clear Image"
                                            >
                                              <i className="bi bi-x-lg"></i>
                                            </button>
                                          )}
                                        </div>
                                      ) : (
                                        <input
                                          type={field.type}
                                          className="form-control"
                                          name={field.name}
                                          placeholder={field.placeholder || ''}
                                          value={formData[field.name] !== undefined ? formData[field.name] : ''}
                                          onChange={handleInputChange}
                                          readOnly={field.readOnly}
                                        />
                                      )}
                                      {/* Image Preview */}
                                      {(field.name.toLowerCase().includes('logo') || field.name.toLowerCase().includes('icon') || field.name.toLowerCase().includes('image')) && formData[field.name] && (
                                        <div className="mt-2">
                                          <img
                                            src={formData[field.name].startsWith('http') ? formData[field.name] : `${import.meta.env.VITE_APP_URL || (import.meta.env.VITE_APP_URL || 'http://localhost:5000')}${formData[field.name].startsWith('/') ? '' : '/'}${formData[field.name]}`}
                                            alt={`${field.label} Preview`}
                                            style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }}
                                            className="rounded border bg-body-tertiary p-1 shadow-sm"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                            onLoad={(e) => { e.target.style.display = 'block'; }}
                                          />
                                        </div>
                                      )}
                                      {IMAGE_KIND[field.name] && <ImageSizeHint kind={IMAGE_KIND[field.name]} />}
                                    </>
                                  ) : field.type === 'textarea' ? (
                                    <>
                                      <textarea
                                        className="form-control"
                                        name={field.name}
                                        rows="4"
                                        placeholder={field.placeholder || ''}
                                        value={formData[field.name] !== undefined ? formData[field.name] : ''}
                                        onChange={handleInputChange}
                                        readOnly={field.readOnly}
                                      ></textarea>
                                    </>
                                  ) : field.type === 'switch' ? (
                                    <div className="form-check form-switch">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        role="switch"
                                        id={`switch-${field.name}`}
                                        name={field.name}
                                        checked={!!formData[field.name]}
                                        onChange={handleInputChange}
                                        disabled={field.readOnly}
                                      />
                                      <label className="form-check-label fw-bold" htmlFor={`switch-${field.name}`}>
                                        {field.label}
                                      </label>
                                      {(field.description || field.example) && (
                                        <div className="form-text text-body-secondary">{field.description || field.example}</div>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </form>
        </div>
      </div>
      <MediaPickerModal
        show={mediaPickerConfig.show}
        onClose={() => setMediaPickerConfig({ show: false, field: null })}
        onSelect={(item) => {
          // Store the URL of the selected media
          handleInputChange({
            target: {
              name: mediaPickerConfig.field,
              type: 'text',
              value: item.url
            }
          });
          setMediaPickerConfig({ show: false, field: null });
        }}
        title="Select Media"
      />
    </div>
  );
};

export default SettingsView;

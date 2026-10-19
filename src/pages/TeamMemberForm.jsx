import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import api from '../services/api';
import { toast } from 'react-toastify';
import ImageSizeHint from '../components/common/ImageSizeHint';
import { mediaUrl } from '../utils/mediaUrl';
import MediaPickButton from '../components/media/MediaPickButton';

const TeamMemberForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  // A photo chosen from the Media library (sent as imageUrl when no file is uploaded).
  const [pickedImageUrl, setPickedImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      role: '',
      bio: '',
      displayOrder: 0,
      status: 'published',
      socialLinks: [{ platform: 'linkedin', url: '' }, { platform: 'twitter', url: '' }, { platform: 'github', url: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "socialLinks"
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchMember = async () => {
        try {
          const res = await api.get(`/team/${id}`);
          const data = res.data.data;

          let socialArray = [];
          if (data.socialLinks) {
            if (Array.isArray(data.socialLinks)) {
              socialArray = data.socialLinks;
            } else if (typeof data.socialLinks === 'object') {
              socialArray = Object.entries(data.socialLinks).map(([platform, url]) => ({ platform, url }));
            }
          }

          if (socialArray.length === 0) {
            socialArray = [{ platform: 'linkedin', url: '' }, { platform: 'twitter', url: '' }, { platform: 'github', url: '' }];
          }

          reset({
            name: data.name,
            role: data.role,
            bio: data.bio,
            displayOrder: data.displayOrder,
            status: data.status,
            socialLinks: socialArray
          });

          if (data.imageUrl) {
            setImagePreview(mediaUrl(data.imageUrl));
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to load team member');
          navigate('/cms/team');
        }
      };
      fetchMember();
    }
  }, [id, isEditMode, reset, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('role', data.role);
      formData.append('bio', data.bio);
      formData.append('displayOrder', data.displayOrder);
      formData.append('status', data.status);

      const socialObj = {};
      data.socialLinks.forEach(link => {
        if (link.platform && link.url) {
          socialObj[link.platform.toLowerCase()] = link.url;
        }
      });
      formData.append('socialLinks', JSON.stringify(socialObj));

      if (selectedFile) {
        formData.append('image', selectedFile);
      } else if (pickedImageUrl) {
        formData.append('imageUrl', pickedImageUrl);
      }

      if (isEditMode) {
        await api.put(`/team/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Team member updated successfully');
      } else {
        await api.post('/team', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Team member created successfully');
      }
      navigate('/cms/team');
    } catch (err) {
      console.error(err);
      toast.error('Error saving team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-4 max-w-5xl">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div className="w-100">
          <Breadcrumb items={[
            { label: 'Team Members', link: '/cms/team' },
            { label: isEditMode ? 'Edit' : 'New' }
          ]} />
          <h2 className="fw-bold mb-0 text-dark fs-5" style={{ letterSpacing: '-0.5px' }}>{isEditMode ? 'Edit Team Member' : 'Add Team Member'}</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row g-4">
          {/* Main Content Column */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">Basic Information</h5>

                <div className="mb-4">
                  <label className="form-label fw-medium">Full Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    {...register('name', {
                      required: 'Name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                      maxLength: { value: 100, message: 'Name must be at most 100 characters' }
                    })}
                    placeholder="e.g. Jane Doe"
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Role / Position <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.role ? 'is-invalid' : ''}`}
                    {...register('role', {
                      required: 'Role is required',
                      maxLength: { value: 100, message: 'Role must be at most 100 characters' }
                    })}
                    placeholder="e.g. Chief Executive Officer"
                  />
                  {errors.role && <div className="invalid-feedback">{errors.role.message}</div>}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Biography</label>
                  <textarea
                    className={`form-control ${errors.bio ? 'is-invalid' : ''}`}
                    rows="5"
                    {...register('bio', {
                      maxLength: { value: 500, message: 'Bio must be at most 500 characters' }
                    })}
                    placeholder="Enter a brief biography..."
                  ></textarea>
                  {errors.bio && <div className="invalid-feedback">{errors.bio.message}</div>}
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="card-title fw-bold mb-0">Social Links</h5>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => append({ platform: '', url: '' })}>
                    <i className="bi bi-plus"></i> Add Link
                  </button>
                </div>

                {fields.map((item, index) => (
                  <div key={item.id} className="row g-2 mb-3 align-items-center">
                    <div className="col-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Platform (e.g. LinkedIn)"
                        {...register(`socialLinks.${index}.platform`)}
                      />
                    </div>
                    <div className="col-7">
                      <input
                        type="url"
                        className={`form-control ${errors.socialLinks?.[index]?.url ? 'is-invalid' : ''}`}
                        placeholder="https://..."
                        {...register(`socialLinks.${index}.url`, {
                          pattern: { value: /^https?:\/\/[^\s$.?#].[^\s]*$/i, message: 'Must be a valid URL' }
                        })}
                      />
                    </div>
                    <div className="col-1 text-end">
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => remove(index)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                    {errors.socialLinks?.[index]?.url && <div className="col-12 mt-1 text-danger small">{errors.socialLinks[index].url.message}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-2">Profile Photo</h5>
                <ImageSizeHint kind="teamPhoto" className="form-text mt-0 mb-3" />

                <div className="text-center mb-3">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="rounded-circle object-fit-cover shadow-sm mb-3" style={{ width: '150px', height: '150px' }} />
                  ) : (
                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '150px', height: '150px' }}>
                      <i className="bi bi-person text-secondary" style={{ fontSize: '4rem' }}></i>
                    </div>
                  )}

                  <div>
                    <label htmlFor="avatar-upload" className="btn btn-outline-primary btn-sm">
                      <i className="bi bi-upload me-2"></i> Upload Photo
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      className="d-none"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <MediaPickButton
                      label="Choose from Media"
                      className="btn btn-outline-secondary btn-sm ms-2"
                      onPick={url => { setPickedImageUrl(url); setSelectedFile(null); setImagePreview(mediaUrl(url)); }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">Publishing</h5>

                <div className="mb-3">
                  <label className="form-label fw-medium">Status</label>
                  <select className="form-select" {...register('status')}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Display Order</label>
                  <input type="number" className="form-control" {...register('displayOrder')} />
                  <div className="form-text">Lower numbers appear first.</div>
                </div>

                <div className="d-grid gap-2">
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...</>
                    ) : (
                      <><i className="bi bi-check-circle me-2"></i> Save Team Member</>
                    )}
                  </button>
                  <Link to="/cms/team" className="btn btn-light border">Cancel</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TeamMemberForm;

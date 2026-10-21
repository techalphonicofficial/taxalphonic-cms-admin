import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { PermissionService } from '../services/permission.service';
import { toast } from 'react-toastify';

const PermissionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    module: '',
    action: '',
    description: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      fetchPermission();
    }
  }, [id]);

  const fetchPermission = async () => {
    try {
      const res = await PermissionService.getById(id);
      const data = res.data;
      setFormData({
        module: data.module || '',
        action: data.action || '',
        description: data.description || '',
      });
    } catch (error) {
      toast.error('Failed to fetch permission');
      navigate('/permissions');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode) {
        await PermissionService.update(id, formData);
        toast.success('Permission updated successfully');
      } else {
        await PermissionService.create(formData);
        toast.success('Permission created successfully');
      }
      navigate('/permissions');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving permission');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container-fluid p-0">
      <div className="ta-editor-bar d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div>
          <h4 className="mb-1 fw-bold">{isEditMode ? 'Edit Permission' : 'Add New Permission'}</h4>
          <p className="text-muted mb-0">Define an action limit in a specific module</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/permissions" className="btn btn-light border rounded-pill px-4">Cancel</Link>
          <button type="submit" form="permission-form" className="btn btn-primary rounded-pill px-5 fw-medium" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
            {isEditMode ? 'Update Permission' : 'Create Permission'}
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-4 max-w-2xl">
        <div className="card-body p-4 p-md-5">
          <form id="permission-form" onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label fw-medium">Module <span className="text-danger">*</span></label>
                <input type="text" className="form-control form-control-lg bg-light border-0" name="module" value={formData.module} onChange={handleChange} required placeholder="e.g. Users" />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-medium">Action <span className="text-danger">*</span></label>
                <input type="text" className="form-control form-control-lg bg-light border-0" name="action" value={formData.action} onChange={handleChange} required placeholder="e.g. read, write, delete" />
              </div>
              <div className="col-12">
                <label className="form-label fw-medium">Description</label>
                <input type="text" className="form-control form-control-lg bg-light border-0" name="description" value={formData.description} onChange={handleChange} />
              </div>
            </div>

            <hr className="my-5 opacity-10" />

          </form>
        </div>
      </div>
    </div>
  );
};

export default PermissionForm;

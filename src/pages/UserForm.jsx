import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service';
import { toast } from 'react-toastify';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true,
  });
  
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchRoles();
    if (isEditMode) {
      fetchUser();
    }
  }, [id]);

  const fetchRoles = async () => {
    try {
      const res = await RoleService.getAll();
      setRoles(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (error) {
      toast.error('Failed to fetch roles');
    }
  };

  const fetchUser = async () => {
    try {
      const res = await UserService.getById(id);
      const data = res.data;
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        password: '', // Keep empty for edit
        roleId: data.roleId || '',
        isActive: data.isActive,
      });
    } catch (error) {
      toast.error('Failed to fetch user');
      navigate('/users');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Remove password if empty in edit mode
    const payload = { ...formData };
    if (isEditMode && !payload.password) {
        delete payload.password;
    }

    try {
      if (isEditMode) {
        await UserService.update(id, payload);
        toast.success('User updated successfully');
      } else {
        await UserService.create(payload);
        toast.success('User created successfully');
      }
      navigate('/users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving user');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container-fluid p-0">
      <div className="ta-editor-bar d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div>
          <h4 className="mb-1 fw-bold">{isEditMode ? 'Edit User' : 'Add New User'}</h4>
          <p className="text-muted mb-0">Fill in the details below</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/users" className="btn btn-light border rounded-pill px-4">Cancel</Link>
          <button type="submit" form="user-form" className="btn btn-primary rounded-pill px-5 fw-medium" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
            {isEditMode ? 'Update User' : 'Create User'}
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-4 max-w-2xl">
        <div className="card-body p-4 p-md-5">
          <form id="user-form" onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label fw-medium">First Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control form-control-lg bg-light border-0" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-medium">Last Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control form-control-lg bg-light border-0" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
              
              <div className="col-md-6">
                <label className="form-label fw-medium">Email <span className="text-danger">*</span></label>
                <input type="email" className="form-control form-control-lg bg-light border-0" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-medium">Password {isEditMode ? '' : <span className="text-danger">*</span>}</label>
                <div className="position-relative">
                  <input type={showPassword ? "text" : "password"} className="form-control form-control-lg bg-light border-0 pe-5" name="password" value={formData.password} onChange={handleChange} required={!isEditMode} placeholder={isEditMode ? 'Leave blank to keep current password' : ''} autoComplete="new-password" />
                  <button 
                    type="button" 
                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ zIndex: 10 }}
                    tabIndex="-1"
                  >
                    <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium">Role <span className="text-danger">*</span></label>
                <select className="form-select form-select-lg bg-light border-0" name="roleId" value={formData.roleId} onChange={handleChange} required>
                  <option value="">Select a Role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 mt-4">
                <div className="form-check form-switch form-check-lg d-flex align-items-center gap-2">
                  <input className="form-check-input mt-0" style={{ width: '3em', height: '1.5em' }} type="checkbox" role="switch" name="isActive" checked={formData.isActive} onChange={handleChange} />
                  <label className="form-check-label fw-medium mb-0">Active Account</label>
                </div>
              </div>
            </div>

            <hr className="my-5 opacity-10" />

          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;

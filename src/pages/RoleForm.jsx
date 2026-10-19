import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';
import { toast } from 'react-toastify';

const RoleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    permissions: []
  });

  const [permissionsData, setPermissionsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  useEffect(() => {
    fetchPermissions();
    if (isEditMode) {
      fetchRole();
    }
  }, [id]);

  const fetchPermissions = async () => {
    try {
      const res = await PermissionService.getAll();
      setPermissionsData(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (error) {
      toast.error('Failed to fetch permissions');
    }
  };

  const fetchRole = async () => {
    try {
      const res = await RoleService.getById(id);
      const data = res.data;
      setFormData({
        name: data.name || '',
        description: data.description || '',
        isActive: data.isActive,
        permissions: data.permissions ? data.permissions.map(p => p.id) : []
      });
    } catch (error) {
      toast.error('Failed to fetch role');
      navigate('/roles');
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

  const handlePermissionChange = (permId, isChecked) => {
    setFormData(prev => {
      const newPerms = isChecked
        ? [...prev.permissions, permId]
        : prev.permissions.filter(id => id !== permId);
      return { ...prev, permissions: newPerms };
    });
  };

  // Group permissions by module
  const groupedPermissions = permissionsData.reduce((acc, curr) => {
    acc[curr.module] = acc[curr.module] || [];
    acc[curr.module].push(curr);
    return acc;
  }, {});

  const handleModuleSelectAll = (moduleName, isChecked) => {
    const modulePermIds = groupedPermissions[moduleName].map(p => p.id);
    setFormData(prev => {
      let newPerms = new Set(prev.permissions);
      if (isChecked) {
        modulePermIds.forEach(id => newPerms.add(id));
      } else {
        modulePermIds.forEach(id => newPerms.delete(id));
      }
      return { ...prev, permissions: Array.from(newPerms) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode) {
        await RoleService.update(id, formData);
        toast.success('Role updated successfully');
      } else {
        await RoleService.create(formData);
        toast.success('Role created successfully');
      }
      navigate('/roles');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving role');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h4 className="mb-1 fw-bold">{isEditMode ? 'Edit Role' : 'Add New Role'}</h4>
          <p className="text-muted mb-0">Define role details and permissions</p>
        </div>
        <Link to="/roles" className="btn btn-light border shadow-sm rounded-pill px-4">
          <i className="bi bi-arrow-left me-2"></i> Back to Roles
        </Link>
      </div>

      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-4 p-md-5">
          <form onSubmit={handleSubmit}>
            <div className="row g-4 mb-5">
              <div className="col-md-6">
                <label className="form-label fw-medium">Role Name <span className="text-danger">*</span></label>
                <input type="text" className="form-control form-control-lg bg-light border-0" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-medium">Description</label>
                <input type="text" className="form-control form-control-lg bg-light border-0" name="description" value={formData.description} onChange={handleChange} />
              </div>
              <div className="col-12 mt-4">
                <div className="form-check form-switch form-check-lg d-flex align-items-center gap-2">
                  <input className="form-check-input mt-0" style={{ width: '3em', height: '1.5em' }} type="checkbox" role="switch" name="isActive" checked={formData.isActive} onChange={handleChange} />
                  <label className="form-check-label fw-medium mb-0">Active Role</label>
                </div>
              </div>
            </div>

            <h5 className="fw-bold mb-4 border-bottom pb-3">Assign Permissions</h5>
            <div className="row g-4">
              {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                const allSelected = perms.every(p => formData.permissions.includes(p.id));
                return (
                  <div key={moduleName} className="col-md-4">
                    <div className="card h-100 bg-light border-0 rounded-3">
                      <div className="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center mb-2 py-3">
                        <h6 className="mb-0 fw-bold">{moduleName}</h6>
                        <div className="form-check m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={allSelected}
                            onChange={(e) => handleModuleSelectAll(moduleName, e.target.checked)}
                          />
                          <label className="form-check-label small text-muted">All</label>
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="d-flex flex-column gap-2">
                          {perms.map(perm => (
                            <div className="form-check" key={perm.id}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`perm-${perm.id}`}
                                checked={formData.permissions.includes(perm.id)}
                                onChange={(e) => handlePermissionChange(perm.id, e.target.checked)}
                              />
                              <label className="form-check-label" htmlFor={`perm-${perm.id}`}>
                                {perm.action.charAt(0).toUpperCase() + perm.action.slice(1)}
                                <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>{perm.description}</small>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <hr className="my-5 opacity-10" />

            <div className="d-flex justify-content-end gap-3">
              <Link to="/roles" className="btn btn-light rounded-pill px-4">Cancel</Link>
              <button type="submit" className="btn btn-primary rounded-pill px-5 fw-medium" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
                {isEditMode ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoleForm;

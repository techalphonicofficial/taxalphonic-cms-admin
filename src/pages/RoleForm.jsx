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
  const [permSearch, setPermSearch] = useState('');
  // An older backend sends GET /roles/:id without the role's permissions: the boxes would all be
  // unticked and saving would remove every permission of the role, so saving is blocked then.
  const [permissionsMissing, setPermissionsMissing] = useState(false);

  useEffect(() => {
    fetchPermissions();
    if (isEditMode) {
      fetchRole();
    }
  }, [id]);

  const fetchPermissions = async () => {
    try {
      // The list API returns 10 rows by default: ask for all of them.
      const res = await PermissionService.getAll({ limit: 1000, sortBy: 'module', sortOrder: 'ASC' });
      setPermissionsData(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (error) {
      toast.error('Failed to fetch permissions');
    }
  };

  const fetchRole = async () => {
    try {
      const res = await RoleService.getById(id);
      const data = res.data;
      setPermissionsMissing(!Array.isArray(data.permissions));
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

  // Group permissions by module (A–Z), actions in a fixed order: read, create, update, delete, others.
  const ACTION_ORDER = ['read', 'create', 'update', 'delete'];
  const actionRank = (a) => (ACTION_ORDER.includes(a) ? ACTION_ORDER.indexOf(a) : ACTION_ORDER.length);
  const groupedPermissions = [...permissionsData]
    .sort((a, b) => a.module.localeCompare(b.module) || actionRank(a.action) - actionRank(b.action) || a.action.localeCompare(b.action))
    .reduce((acc, curr) => {
      acc[curr.module] = acc[curr.module] || [];
      acc[curr.module].push(curr);
      return acc;
    }, {});
  const term = permSearch.trim().toLowerCase();
  const visibleModules = Object.entries(groupedPermissions).filter(([moduleName, perms]) => !term
    || moduleName.toLowerCase().includes(term)
    || perms.some((p) => `${p.action} ${p.description || ''}`.toLowerCase().includes(term)));
  const setAllPermissions = (ids, isChecked) => setFormData((prev) => {
    const next = new Set(prev.permissions);
    ids.forEach((pid) => (isChecked ? next.add(pid) : next.delete(pid)));
    return { ...prev, permissions: Array.from(next) };
  });

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
    if (permissionsMissing) {
      toast.error("Not saved: the server did not send this role's current permissions. Deploy the latest backend first.");
      return;
    }
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
      <div className="ta-editor-bar d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div>
          <h4 className="mb-1 fw-bold">{isEditMode ? 'Edit Role' : 'Add New Role'}</h4>
          <p className="text-muted mb-0">Define role details and permissions</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/roles" className="btn btn-light border rounded-pill px-4">Cancel</Link>
          <button type="submit" form="role-form" className="btn btn-primary rounded-pill px-5 fw-medium" disabled={loading || permissionsMissing}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
            {isEditMode ? 'Update Role' : 'Create Role'}
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body p-4 p-md-5">
          <form id="role-form" onSubmit={handleSubmit}>
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

            {permissionsMissing && (
              <div className="alert alert-warning d-flex gap-2 align-items-start" role="alert">
                <i className="bi bi-exclamation-triangle-fill mt-1"></i>
                <div>
                  <b>This role's permissions could not be loaded.</b> The API server is running an older backend that does not send them
                  (GET /roles/:id), so the boxes below show nothing ticked even though the role has permissions. Saving is turned off
                  so the role keeps its permissions. Deploy the latest backend, then reload this page.
                </div>
              </div>
            )}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-4 border-bottom pb-3">
              <h5 className="fw-bold mb-0 me-auto">
                Assign Permissions
                <span className="badge bg-primary-subtle text-primary-emphasis ms-2 align-middle" style={{ fontSize: '0.75rem' }}>
                  {formData.permissions.filter((pid) => permissionsData.some((p) => p.id === pid)).length} / {permissionsData.length} selected
                </span>
              </h5>
              <input
                type="search"
                className="form-control form-control-sm"
                style={{ maxWidth: 240 }}
                placeholder="Search module or action..."
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
              />
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setAllPermissions(visibleModules.flatMap(([, perms]) => perms.map((p) => p.id)), true)}>
                Select all{term ? ' shown' : ''}
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setAllPermissions(visibleModules.flatMap(([, perms]) => perms.map((p) => p.id)), false)}>
                Clear{term ? ' shown' : ' all'}
              </button>
            </div>
            {visibleModules.length === 0 && <p className="text-muted">No permission matches "{permSearch}".</p>}
            <div className="row g-4">
              {visibleModules.map(([moduleName, perms]) => {
                const allSelected = perms.every(p => formData.permissions.includes(p.id));
                return (
                  <div key={moduleName} className="col-md-6 col-xl-4">
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

          </form>
        </div>
      </div>
    </div>
  );
};

export default RoleForm;

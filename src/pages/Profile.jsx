import React, { useState, useEffect } from 'react';
import { ProfileService } from '../services/profile.service';
import { toast } from 'react-toastify';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await ProfileService.getProfile();
      const user = res.data;
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ProfileService.updateProfile(profileData);
      toast.success('Profile updated successfully');
      
      const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
      const userStr = storage.getItem('user');
      if (userStr) {
          const user = JSON.parse(userStr);
          user.firstName = profileData.firstName;
          user.lastName = profileData.lastName;
          storage.setItem('user', JSON.stringify(user));
          window.dispatchEvent(new Event('user-updated'));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    
    setLoading(true);
    try {
      await ProfileService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container-fluid p-0 max-w-6xl mx-auto">
      {/* Decorative Header */}
      <div className="rounded-4 mb-4 position-relative overflow-hidden shadow-sm" style={{ height: '120px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
        <div className="position-absolute top-0 start-0 w-100 h-100 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at top right, #ffffff 0%, transparent 40%)' }}></div>
      </div>

      <div className="row px-3" style={{ marginTop: '-70px' }}>
        {/* Left Sidebar */}
        <div className="col-12 col-lg-4 mb-4 mb-lg-0 z-1">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body text-center p-4">
              <div 
                className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mx-auto mb-3" 
                style={{ width: '120px', height: '120px', padding: '5px' }}
              >
                <div className="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary fw-bold display-4">
                  {(profileData.firstName?.[0] || '')}{(profileData.lastName?.[0] || '')}
                </div>
              </div>
              <h4 className="fw-bold mb-1">{profileData.firstName} {profileData.lastName}</h4>
              <p className="text-muted mb-4">{profileData.email}</p>
              
              <div className="d-flex flex-column gap-2 text-start">
                <button 
                  className={`btn btn-lg rounded-4 px-4 text-start d-flex align-items-center gap-3 transition-all ${activeTab === 'details' ? 'btn-primary shadow' : 'btn-light text-secondary border'}`}
                  onClick={() => setActiveTab('details')}
                >
                  <i className="bi bi-person-lines-fill fs-5"></i> Personal Details
                </button>
                <button 
                  className={`btn btn-lg rounded-4 px-4 text-start d-flex align-items-center gap-3 transition-all ${activeTab === 'password' ? 'btn-primary shadow' : 'btn-light text-secondary border'}`}
                  onClick={() => setActiveTab('password')}
                >
                  <i className="bi bi-shield-lock-fill fs-5"></i> Security Settings
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Content Area */}
        <div className="col-12 col-lg-8 z-1">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body p-4 p-md-5">
              {activeTab === 'details' ? (
                <div>
                  <div className="mb-4">
                    <h4 className="fw-bold mb-1">Personal Details</h4>
                    <p className="text-muted small">Update your personal information and contact details here.</p>
                  </div>
                  
                  <form onSubmit={handleProfileSubmit}>
                    <div className="row g-4">
                      <div className="col-md-6">
                        <label className="form-label fw-medium text-secondary small">First Name</label>
                        <div className="input-group input-group-lg shadow-sm rounded-4 overflow-hidden">
                          <span className="input-group-text bg-light border-0 text-muted"><i className="bi bi-person"></i></span>
                          <input type="text" className="form-control bg-light border-0" name="firstName" value={profileData.firstName} onChange={handleProfileChange} required />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium text-secondary small">Last Name</label>
                        <div className="input-group input-group-lg shadow-sm rounded-4 overflow-hidden">
                          <span className="input-group-text bg-light border-0 text-muted"><i className="bi bi-person"></i></span>
                          <input type="text" className="form-control bg-light border-0" name="lastName" value={profileData.lastName} onChange={handleProfileChange} required />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium text-secondary small">Email Address (Read Only)</label>
                        <div className="input-group input-group-lg shadow-sm rounded-4 overflow-hidden">
                          <span className="input-group-text bg-light border-0 text-muted"><i className="bi bi-envelope"></i></span>
                          <input type="email" className="form-control bg-light border-0 text-muted" value={profileData.email} disabled />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-medium text-secondary small">Phone Number</label>
                        <div className="input-group input-group-lg shadow-sm rounded-4 overflow-hidden">
                          <span className="input-group-text bg-light border-0 text-muted"><i className="bi bi-telephone"></i></span>
                          <input type="text" className="form-control bg-light border-0" name="phone" value={profileData.phone} onChange={handleProfileChange} placeholder="+1 234 567 890" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 d-flex justify-content-end">
                      <button type="submit" className="btn btn-primary btn-lg rounded-pill px-5 shadow-sm" disabled={loading}>
                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check2-circle me-2"></i>} Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <h4 className="fw-bold mb-1">Security Settings</h4>
                    <p className="text-muted small">Ensure your account is using a long, random password to stay secure.</p>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="max-w-2xl">
                    {/* Hidden username field for password managers */}
                    <input type="text" name="username" value={profileData.email} autoComplete="username" style={{ display: 'none' }} readOnly />
                    
                    <div className="row g-4">
                      <div className="col-12">
                        <label className="form-label fw-medium text-secondary small">Current Password</label>
                        <div className="position-relative shadow-sm rounded-4 overflow-hidden">
                          <input type={showCurrent ? "text" : "password"} className="form-control form-control-lg bg-light border-0 pe-5" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} required autoComplete="current-password" placeholder="Enter current password" />
                          <button type="button" className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none px-3" onClick={() => setShowCurrent(!showCurrent)} style={{ zIndex: 10 }} tabIndex="-1">
                            <i className={`bi bi-eye${showCurrent ? '-slash' : ''}`}></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="col-12 pt-2">
                        <hr className="opacity-10 m-0" />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-medium text-secondary small">New Password</label>
                        <div className="position-relative shadow-sm rounded-4 overflow-hidden">
                          <input type={showNew ? "text" : "password"} className="form-control form-control-lg bg-light border-0 pe-5" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required minLength="8" autoComplete="new-password" placeholder="Minimum 8 characters" />
                          <button type="button" className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none px-3" onClick={() => setShowNew(!showNew)} style={{ zIndex: 10 }} tabIndex="-1">
                            <i className={`bi bi-eye${showNew ? '-slash' : ''}`}></i>
                          </button>
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-medium text-secondary small">Confirm New Password</label>
                        <div className="position-relative shadow-sm rounded-4 overflow-hidden">
                          <input type={showConfirm ? "text" : "password"} className="form-control form-control-lg bg-light border-0 pe-5" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required minLength="8" autoComplete="new-password" placeholder="Re-type new password" />
                          <button type="button" className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none px-3" onClick={() => setShowConfirm(!showConfirm)} style={{ zIndex: 10 }} tabIndex="-1">
                            <i className={`bi bi-eye${showConfirm ? '-slash' : ''}`}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 d-flex justify-content-end">
                      <button type="submit" className="btn btn-primary btn-lg rounded-pill px-5 shadow-sm" disabled={loading}>
                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-shield-check me-2"></i>} Update Password
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

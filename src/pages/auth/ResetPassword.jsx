import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword({ token, newPassword: password });
      toast.success('Password successfully reset');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="card shadow border-0 rounded-4" style={{ width: '400px' }}>
          <div className="card-body p-5 text-center">
            <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3 d-block"></i>
            <h4 className="fw-bold mb-3">Invalid Link</h4>
            <p className="text-muted mb-4">This password reset link is invalid or has expired.</p>
            <Link to="/forgot-password" className="btn btn-primary rounded-pill px-4">
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow border-0 rounded-4" style={{ width: '400px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary">Reset Password</h2>
            <p className="text-muted">Create a new password for your account</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-muted small fw-medium">New Password</label>
              <div className="position-relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-control form-control-lg bg-light border-0 pe-5" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
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
            
            <div className="mb-4">
              <label className="form-label text-muted small fw-medium">Confirm New Password</label>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control form-control-lg bg-light border-0" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                minLength={6}
              />
            </div>
            
            <button type="submit" className="btn btn-primary btn-lg w-100 rounded-pill fw-medium" disabled={loading || !password || !confirmPassword}>
              {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : null}
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

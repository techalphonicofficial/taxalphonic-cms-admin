import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await AuthService.forgotPassword(email);
      setSubmitted(true);
      if (response?.data?.token) {
        setResetToken(response.data.token);
      }
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow border-0 rounded-4" style={{ width: '400px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary">Forgot Password</h2>
            <p className="text-muted">Enter your email to reset your password</p>
          </div>
          
          {submitted ? (
            <div className="text-center">
              <div className="alert alert-success mb-4 border-0 text-start">
                <i className="bi bi-check-circle-fill me-2"></i>
                We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.
              </div>
              
              {resetToken && (
                <div className="alert alert-warning mb-4 border-0 text-start">
                  <i className="bi bi-tools me-2"></i>
                  <strong>Development Mode:</strong> Since no real email server is configured, click the link below to reset your password:
                  <div className="mt-2 text-break">
                    <Link to={`/reset-password?token=${resetToken}`} className="fw-bold">
                      http://192.168.0.166:5173/reset-password?token={resetToken}
                    </Link>
                  </div>
                </div>
              )}

              <Link to="/login" className="btn btn-outline-primary rounded-pill px-4">
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label text-muted small fw-medium">Email address</label>
                <input 
                  type="email" 
                  className="form-control form-control-lg bg-light border-0" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@example.com"
                  required 
                />
              </div>
              
              <button type="submit" className="btn btn-primary btn-lg w-100 rounded-pill fw-medium mb-3" disabled={loading || !email}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : null}
                Send Reset Link
              </button>
              
              <div className="text-center">
                <Link to="/login" className="small text-decoration-none text-muted">
                  <i className="bi bi-arrow-left me-1"></i> Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await AuthService.login({ email, password, rememberMe });
      toast.success('Login successful');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow border-0 rounded-4" style={{ width: '400px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary">CMS Admin</h2>
            <p className="text-muted">Sign in to your account</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label text-muted small fw-medium">Email address</label>
              <input 
                type="email" 
                className="form-control form-control-lg bg-light border-0" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                autoComplete="username"
                required 
              />
            </div>
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label text-muted small fw-medium mb-0">Password</label>
                <Link to="/forgot-password" className="small text-decoration-none">Forgot Password?</Link>
              </div>
              <div className="position-relative mt-1">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-control form-control-lg bg-light border-0 pe-5" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  autoComplete="current-password"
                  required 
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
            
            <div className="mb-4 form-check">
              <input 
                type="checkbox" 
                className="form-check-input cursor-pointer" 
                id="rememberMe" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="form-check-label text-muted small user-select-none cursor-pointer" htmlFor="rememberMe">
                Remember me
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-100 rounded-pill fw-medium" disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : null}
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

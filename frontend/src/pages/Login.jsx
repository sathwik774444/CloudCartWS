import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate(location.state?.from || '/');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-shell">
        <div className="auth-side">
          <div className="badge">Welcome back</div>
          <div className="auth-brand">CloudCart</div>
          <div className="muted auth-side-text">
            Sign in to view your orders, save your address, and checkout faster.
          </div>
          <div className="auth-side-points">
            <div className="auth-point">
              <div className="auth-point-title">Faster checkout</div>
              <div className="muted small">Saved profile and shipping details.</div>
            </div>
            <div className="auth-point">
              <div className="auth-point-title">Order tracking</div>
              <div className="muted small">See status updates and history.</div>
            </div>
          </div>
        </div>

        <div className="panel auth-card">
          <div className="auth-card-head">
            <h2>Login</h2>
            <div className="muted small">Use your email and password to continue.</div>
          </div>

          {error ? <div className="alert">{error}</div> : null}

          <form className="form" onSubmit={onSubmit}>
            <div className="auth-field">
              <div className="auth-label">Email</div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="auth-field">
              <div className="auth-label">Password</div>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Your password" />
            </div>
            <button className="btn" type="submit" disabled={busy}>
              Login
            </button>
          </form>

          <div className="auth-foot">
            <div className="muted small">
              New here? <Link className="auth-link" to="/register">Create an account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const strength = useMemo(() => {
    const p = password || '';
    const hasLen = p.length >= 8;
    const hasUpper = /[A-Z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    const hasSpecial = /[^A-Za-z0-9]/.test(p);
    const satisfied = [hasLen, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    const label = satisfied <= 1 ? 'Weak' : satisfied === 2 || satisfied === 3 ? 'Medium' : 'Strong';
    const pct = satisfied === 0 ? 10 : satisfied === 1 ? 25 : satisfied === 2 ? 55 : satisfied === 3 ? 80 : 100;
    return { label, pct, hasLen, hasUpper, hasNumber, hasSpecial, satisfied };
  }, [password]);

  const passwordsMatch = password === confirmPassword;
  const passwordMeetsPolicy = strength.hasLen && strength.hasUpper && strength.hasNumber && strength.hasSpecial;
  const canSubmit =
    name.trim() &&
    email.trim() &&
    password &&
    confirmPassword &&
    passwordsMatch &&
    passwordMeetsPolicy;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }
    if (!passwordMeetsPolicy) {
      setError('Password must be 8+ characters and include an uppercase letter, a number, and a special character.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-shell">
        <div className="auth-side">
          <div className="badge">Create your account</div>
          <div className="auth-brand">CloudCart</div>
          <div className="muted auth-side-text">Join to save your cart, manage orders, and get a smoother checkout.</div>
          <div className="auth-side-points">
            <div className="auth-point">
              <div className="auth-point-title">Personal profile</div>
              <div className="muted small">Address details ready for checkout.</div>
            </div>
            <div className="auth-point">
              <div className="auth-point-title">Order history</div>
              <div className="muted small">Track purchases and delivery updates.</div>
            </div>
          </div>
        </div>

        <div className="panel auth-card">
          <div className="auth-card-head">
            <h2>Create account</h2>
            <div className="muted small">It takes less than a minute.</div>
          </div>

          {error ? <div className="alert">{error}</div> : null}

          <form className="form" onSubmit={onSubmit}>
            <div className="auth-field">
              <div className="auth-label">Name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="auth-field">
              <div className="auth-label">Email</div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="auth-field">
              <div className="auth-label">Password</div>
              <div className="auth-input">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                />
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <div className={`pw-strength pw-${strength.label.toLowerCase()}`} aria-label={`Password strength: ${strength.label}`}>
                <div className="pw-strength-top">
                  <div className="muted small">Strength</div>
                  <div className="pw-strength-label">{strength.label}</div>
                </div>
                <div className="pw-strength-bar" aria-hidden="true">
                  <div className="pw-strength-fill" style={{ width: `${strength.pct}%` }} />
                </div>
                <div className="pw-rules" aria-label="Password requirements">
                  <div className={`pw-rule${strength.hasLen ? ' ok' : ''}`}>8+ characters</div>
                  <div className={`pw-rule${strength.hasUpper ? ' ok' : ''}`}>1 uppercase letter</div>
                  <div className={`pw-rule${strength.hasNumber ? ' ok' : ''}`}>1 number</div>
                  <div className={`pw-rule${strength.hasSpecial ? ' ok' : ''}`}>1 special character</div>
                </div>
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label">Confirm password</div>
              <div className="auth-input">
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                />
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {confirmPassword ? (
                passwordsMatch ? (
                  <div className="muted small">Passwords match</div>
                ) : (
                  <div className="muted small">Passwords do not match</div>
                )
              ) : null}
            </div>
            <button className="btn" type="submit" disabled={busy || !canSubmit}>
              Create account
            </button>
          </form>

          <div className="auth-foot">
            <div className="muted small">
              Already have an account? <Link className="auth-link" to="/login">Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

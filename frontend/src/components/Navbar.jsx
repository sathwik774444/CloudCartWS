import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totals } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const initialQ = useMemo(() => params.get('q') || '', [params]);
  const [q, setQ] = useState(initialQ);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  const onSubmit = (e) => {
    e.preventDefault();
    const next = q.trim();
    navigate(next ? `/?q=${encodeURIComponent(next)}` : '/');
  };

  const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  const onLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <div className="navbar-left">
          <Link to="/" className="brand">
            CloudCart
          </Link>

          <form className="search" onSubmit={onSubmit}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." />
            <button className="btn" type="submit">
              Search
            </button>
          </form>
        </div>

        <div className="navbar-right">
          <nav className="nav-actions" aria-label="Primary">
            <NavLink to="/" className={linkClass} end>
              Home
            </NavLink>
            <NavLink to="/help" className={linkClass}>
              Help
            </NavLink>
            <NavLink to="/cart" className={linkClass}>
              Cart
              {totals.count ? <span className="nav-badge">{totals.count}</span> : null}
            </NavLink>

            {user ? (
              <>
                <NavLink to="/orders" className={linkClass}>
                  Orders
                </NavLink>
                <NavLink to="/profile" className={linkClass}>
                  {user.name}
                </NavLink>
                {user.role === 'admin' ? (
                  <NavLink to="/admin" className={linkClass}>
                    Admin
                  </NavLink>
                ) : null}
                <button className="btn btn-ghost nav-cta" type="button" onClick={onLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  Login
                </NavLink>
                <NavLink to="/register" className="btn nav-cta" end>
                  Register
                </NavLink>
              </>
            )}
          </nav>

          <button
            className="nav-toggle"
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
          </button>
        </div>
      </div>

      <div id="mobile-nav" className={`mobile-nav${menuOpen ? ' open' : ''}`}>
        <div className="container mobile-nav-inner">
          <form className="mobile-search" onSubmit={onSubmit}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." />
            <button className="btn" type="submit">
              Search
            </button>
          </form>

          <nav className="mobile-links" aria-label="Mobile">
            <NavLink to="/" className={linkClass} end>
              Home
            </NavLink>
            <NavLink to="/help" className={linkClass}>
              Help
            </NavLink>
            <NavLink to="/cart" className={linkClass}>
              Cart
              {totals.count ? <span className="nav-badge">{totals.count}</span> : null}
            </NavLink>

            {user ? (
              <>
                <NavLink to="/orders" className={linkClass}>
                  Orders
                </NavLink>
                <NavLink to="/profile" className={linkClass}>
                  {user.name}
                </NavLink>
                {user.role === 'admin' ? (
                  <NavLink to="/admin" className={linkClass}>
                    Admin
                  </NavLink>
                ) : null}
                <button className="btn btn-ghost" type="button" onClick={onLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  Login
                </NavLink>
                <NavLink to="/register" className="btn" end>
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

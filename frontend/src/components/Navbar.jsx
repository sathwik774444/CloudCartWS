import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totals } = useCart();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const initialQ = useMemo(() => params.get('q') || '', [params]);
  const [q, setQ] = useState(initialQ);

  const onSubmit = (e) => {
    e.preventDefault();
    const next = q.trim();
    navigate(next ? `/?q=${encodeURIComponent(next)}` : '/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          CloudCart
        </Link>

        <form className="search" onSubmit={onSubmit}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." />
          <button className="btn" type="submit">
            Search
          </button>
        </form>

        <nav className="nav-actions">
          <Link to="/cart" className="link">
            Cart ({totals.count})
          </Link>
          <Link to="/help" className="link">
            Help
          </Link>

          {user ? (
            <>
              <Link to="/orders" className="link">
                Orders
              </Link>
              <Link to="/profile" className="link">
                {user.name}
              </Link>
              {user.role === 'admin' ? (
                <Link to="/admin" className="link">
                  Admin
                </Link>
              ) : null}
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="link">
                Login
              </Link>
              <Link to="/register" className="link">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

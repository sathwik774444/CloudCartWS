import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import Loader from '../components/Loader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { listProducts } from '../services/productService';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const q = params.get('q') || '';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => {
    return {
      q: q || undefined,
      category: params.get('category') || undefined,
      sort: params.get('sort') || 'new',
      page: Number(params.get('page') || 1),
      limit: 12,
    };
  }, [params, q]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await listProducts(query);
        setData(res);
      } catch (e) {
        setError(e?.response?.data?.message || e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [query]);

  const setPage = (page) => {
    const next = new URLSearchParams(params);
    next.set('page', String(page));
    setParams(next);
  };

  const total = data?.total || 0;
  const items = data?.items || [];

  const onAddToCart = async (productId) => {
    if (!user) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    await add(productId, 1);
  };

  return (
    <div className="home">
      <section className="hero hero--home">
        <div className="hero-content">
          <div className="badge">New season picks</div>
          <h1 className="hero-title">
            Discover products you’ll love.
            <span className="hero-title-accent"> Checkout in minutes.</span>
          </h1>
          <p className="muted hero-subtitle">
            Browse curated categories, compare prices, and add to cart instantly. Built to feel like a real storefront.
          </p>

          <div className="hero-actions">
            <a className="btn" href="#products">
              Start shopping
            </a>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete('q');
                next.delete('category');
                next.set('sort', 'new');
                next.set('page', '1');
                setParams(next);
              }}
            >
              Explore latest
            </button>
          </div>

          <div className="hero-metrics" aria-label="Highlights">
            <div className="metric">
              <div className="metric-value">Fast</div>
              <div className="metric-label muted">Add-to-cart flow</div>
            </div>
            <div className="metric">
              <div className="metric-value">Secure</div>
              <div className="metric-label muted">Account & orders</div>
            </div>
            <div className="metric">
              <div className="metric-value">Trusted</div>
              <div className="metric-label muted">Realistic UI</div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-toolbar" aria-label="Filters">
        <div className="toolbar">
          <div className="row gap">
            <select
              className="select-field"
              value={params.get('category') || ''}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                if (e.target.value) next.set('category', e.target.value);
                else next.delete('category');
                next.set('page', '1');
                setParams(next);
              }}
            >
              <option value="">All categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
            </select>

            <select
              className="select-field"
              value={params.get('sort') || 'new'}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                next.set('sort', e.target.value);
                next.set('page', '1');
                setParams(next);
              }}
            >
              <option value="new">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
          </div>

          <div className="results" aria-label="Results summary">
            <div className="muted">
              {q ? (
                <>
                  Showing <span className="results-strong">{total}</span> result{total === 1 ? '' : 's'} for{' '}
                  <span className="results-pill">{q}</span>
                </>
              ) : (
                <>
                  <span className="results-strong">{total}</span> product{total === 1 ? '' : 's'}
                </>
              )}
            </div>
            {q ? (
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.delete('q');
                  next.set('page', '1');
                  setParams(next);
                }}
              >
                Clear search
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      <section id="products" className="home-products" aria-label="Products">
        {loading ? (
          <div className="home-loading">
            <Loader />
          </div>
        ) : items.length ? (
          <div className="grid">
            {items.map((p) => (
              <ProductCard key={p._id} p={p} onAdd={() => onAddToCart(p._id)} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <div className="badge">No products found</div>
            <div className="muted">Try changing filters or searching with a different keyword.</div>
            <button
              className="btn"
              type="button"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete('q');
                next.delete('category');
                next.set('sort', 'new');
                next.set('page', '1');
                setParams(next);
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      {!loading ? (
        <div className="pagination" aria-label="Pagination">
          <button
            className="btn btn-ghost"
            type="button"
            disabled={(data?.page || 1) <= 1}
            onClick={() => setPage((data?.page || 1) - 1)}
          >
            Prev
          </button>
          <div className="muted">
            Page {data?.page || 1} of {data?.pages || 1}
          </div>
          <button
            className="btn btn-ghost"
            type="button"
            disabled={(data?.page || 1) >= (data?.pages || 1)}
            onClick={() => setPage((data?.page || 1) + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

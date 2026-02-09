import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Loader from '../components/Loader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { useCart } from '../context/CartContext.jsx';
import { listProducts } from '../services/productService';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const { add } = useCart();

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

  if (loading) return <Loader />;

  return (
    <div>
      <div className="hero">
        <div className="hero-content">
          <div className="badge">Featured deals</div>
          <h1>Shop smarter with CloudCart</h1>
          <p className="muted">
            Search, filter and buy products with a checkout flow that mirrors real e-commerce platforms.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="row gap">
          <select
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

        <div className="muted">{data?.total || 0} products</div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="grid">
        {(data?.items || []).map((p) => (
          <ProductCard key={p._id} p={p} onAdd={() => add(p._id, 1)} />
        ))}
      </div>

      <div className="pagination">
        <button className="btn btn-ghost" type="button" disabled={(data?.page || 1) <= 1} onClick={() => setPage((data?.page || 1) - 1)}>
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
    </div>
  );
}

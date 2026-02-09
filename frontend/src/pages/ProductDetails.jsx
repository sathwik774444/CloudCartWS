import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import Loader from '../components/Loader.jsx';
import { useCart } from '../context/CartContext.jsx';
import { getProduct } from '../services/productService';

export default function ProductDetails() {
  const { id } = useParams();
  const { add } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getProduct(id);
        setProduct(data.product);
      } catch (e) {
        setError(e?.response?.data?.message || e.message || 'Failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Loader />;
  if (!product) return <div className="alert">{error || 'Not found'}</div>;

  return (
    <div className="details">
      <div className="details-media">
        <img src={product.images?.[0] || 'https://via.placeholder.com/900x600?text=Product'} alt={product.title} />
      </div>
      <div className="details-info">
        <h2>{product.title}</h2>
        <div className="muted">{product.brand ? `${product.brand} · ` : ''}{product.category || 'General'}</div>
        <div className="price big">₹{product.price}</div>
        <p>{product.description}</p>

        <div className="row gap center">
          <label className="muted">Qty</label>
          <input
            className="qty-input"
            type="number"
            min={1}
            max={product.countInStock}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value || 1), product.countInStock)))}
          />
        </div>

        <button
          className="btn"
          type="button"
          disabled={product.countInStock <= 0}
          onClick={() => add(product._id, qty)}
        >
          {product.countInStock <= 0 ? 'Out of stock' : 'Add to cart'}
        </button>

        {error ? <div className="alert">{error}</div> : null}
      </div>
    </div>
  );
}

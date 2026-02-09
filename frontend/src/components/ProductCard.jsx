import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ p, onAdd }) {
  return (
    <div className="card">
      <Link to={`/products/${p._id}`} className="card-media">
        <img src={p.images?.[0] || 'https://via.placeholder.com/600x400?text=Product'} alt={p.title} />
      </Link>
      <div className="card-body">
        <Link className="card-title" to={`/products/${p._id}`}>
          {p.title}
        </Link>
        <div className="muted">{p.category || 'General'}</div>
        <div className="row between center">
          <div className="price">₹{p.price}</div>
          <button className="btn" type="button" onClick={onAdd} disabled={p.countInStock <= 0}>
            {p.countInStock <= 0 ? 'Out of stock' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

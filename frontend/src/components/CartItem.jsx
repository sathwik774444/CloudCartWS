import React from 'react';
import { Link } from 'react-router-dom';

export default function CartItem({ item, onDec, onInc, onRemove }) {
  return (
    <div className="cart-item">
      <img
        className="cart-thumb"
        src={item.image || 'https://via.placeholder.com/120x120?text=Item'}
        alt={item.title}
      />
      <div className="cart-info">
        <div className="cart-top">
          <div>
            <Link className="cart-title" to={`/products/${item.product}`}>
              {item.title}
            </Link>
            <div className="muted small">₹{item.price} each</div>
          </div>
          <div className="cart-total">₹{item.price * item.qty}</div>
        </div>

        <div className="cart-actions">
          <div className="qty-control" aria-label="Quantity">
            <button className="qty-btn" type="button" onClick={onDec} aria-label="Decrease quantity">
              −
            </button>
            <div className="qty">{item.qty}</div>
            <button className="qty-btn" type="button" onClick={onInc} aria-label="Increase quantity">
              +
            </button>
          </div>

          <button className="btn btn-ghost btn-danger-outline" type="button" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

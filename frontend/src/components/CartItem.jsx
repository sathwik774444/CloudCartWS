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
        <Link className="cart-title" to={`/products/${item.product}`}>
          {item.title}
        </Link>
        <div className="muted">₹{item.price} each</div>
        <div className="row gap">
          <button className="btn btn-ghost" type="button" onClick={onDec}>
            -
          </button>
          <div className="qty">{item.qty}</div>
          <button className="btn btn-ghost" type="button" onClick={onInc}>
            +
          </button>
          <button className="btn btn-danger" type="button" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
      <div className="cart-total">₹{item.price * item.qty}</div>
    </div>
  );
}

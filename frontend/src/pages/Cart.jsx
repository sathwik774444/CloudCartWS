import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import CartItem from '../components/CartItem.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Cart() {
  const { user } = useAuth();
  const { cart, totals, updateQty, remove, clear } = useCart();
  const navigate = useNavigate();

  const items = cart?.items || [];

  return (
    <div>
      <div className="page-title">
        <h2>Your Cart</h2>
        {items.length ? (
          <button className="btn btn-ghost" type="button" onClick={clear}>
            Clear
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="muted">Your cart is empty.</div>
          <Link className="btn" to="/">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {items.map((i) => (
              <CartItem
                key={i.product}
                item={i}
                onDec={() => updateQty(i.product, Math.max(1, i.qty - 1))}
                onInc={() => updateQty(i.product, i.qty + 1)}
                onRemove={() => remove(i.product)}
              />
            ))}
          </div>
          <div className="summary">
            <h3>Order Summary</h3>
            <div className="row between">
              <div className="muted">Items</div>
              <div>{totals.count}</div>
            </div>
            <div className="row between">
              <div className="muted">Subtotal</div>
              <div>₹{totals.subtotal}</div>
            </div>
            <div className="muted small">Shipping and taxes are calculated at checkout.</div>
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('/login');
                } else {
                  navigate('/checkout');
                }
              }}
            >
              Proceed to checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

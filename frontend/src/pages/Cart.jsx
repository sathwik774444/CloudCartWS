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
            <div className="summary-head">
              <h3>Order Summary</h3>
              <div className="badge">Secure checkout</div>
            </div>

            <div className="summary-rows" aria-label="Price breakdown">
              <div className="summary-row">
                <div className="muted">Items</div>
                <div className="summary-value">{totals.count}</div>
              </div>
              <div className="summary-row">
                <div className="muted">Subtotal</div>
                <div className="summary-value">₹{totals.subtotal}</div>
              </div>
              <div className="summary-row">
                <div className="muted">Shipping</div>
                <div className="summary-value muted">Calculated at checkout</div>
              </div>
              <div className="summary-divider" aria-hidden="true" />
              <div className="summary-row summary-total">
                <div>Total</div>
                <div className="summary-value">₹{totals.subtotal}</div>
              </div>
            </div>

            <div className="summary-foot">
              <div className="muted small">Taxes, shipping and discounts (if any) will be applied at checkout.</div>
              <button
                className="btn summary-cta"
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
        </div>
      )}
    </div>
  );
}

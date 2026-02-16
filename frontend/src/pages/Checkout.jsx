import React, { useMemo, useState } from 'react';

import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createOrderFromCart } from '../services/orderService';
import { confirmPaymentMock, createPaymentIntent } from '../services/paymentService';

export default function Checkout() {
  const { cart, totals, refresh: refreshCart } = useCart();
  const { user, updateProfile } = useAuth();

  const items = cart?.items || [];

  const defaultAddress = useMemo(
    () =>
      user?.address || {
        fullName: user?.name || '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
      },
    [user]
  );

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState(defaultAddress);
  const [order, setOrder] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const disabled = items.length === 0;

  const placeOrder = async () => {
    setBusy(true);
    setError('');
    try {
      await updateProfile({ address });
      const data = await createOrderFromCart({ shippingAddress: address });
      setOrder(data.order);
      setStep(2);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const startPayment = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await createPaymentIntent({ orderId: order._id });
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setStep(3);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Payment init failed');
    } finally {
      setBusy(false);
    }
  };

  const confirmMock = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await confirmPaymentMock({ orderId: order._id, paymentIntentId });
      setOrder(data.order);
      await refreshCart();
      setStep(4);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Payment confirmation failed');
    } finally {
      setBusy(false);
    }
  };

  const steps = [
    { id: 0, label: 'Cart' },
    { id: 1, label: 'Address' },
    { id: 2, label: 'Payment' },
    { id: 3, label: 'Confirm' },
    { id: 4, label: 'Success' },
  ];

  return (
    <div>
      <div className="page-title">
        <h2>Checkout</h2>
        <div className="muted">Step {step} of 4</div>
      </div>

      <div className="checkout-steps" aria-label="Checkout steps">
        {steps.map((s) => {
          const isDone = s.id < step;
          const isActive = s.id === step;
          return (
            <div key={s.id} className={`checkout-step${isDone ? ' done' : ''}${isActive ? ' active' : ''}`}>
              <div className="checkout-step-dot" aria-hidden="true" />
              <div className="checkout-step-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      {disabled ? <div className="alert">Cart is empty. Add products before checkout.</div> : null}
      {error ? <div className="alert">{error}</div> : null}

      <div className="checkout">
        <div className="panel">
          {step === 1 ? (
            <>
              <h3>Shipping Address</h3>
              <div className="form">
                <input
                  value={address.fullName || ''}
                  onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))}
                  placeholder="Full name"
                />
                <input
                  value={address.line1 || ''}
                  onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                  placeholder="Address line 1"
                />
                <input
                  value={address.line2 || ''}
                  onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                  placeholder="Address line 2 (optional)"
                />
                <div className="row gap">
                  <input
                    value={address.city || ''}
                    onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                    placeholder="City"
                  />
                  <input
                    value={address.state || ''}
                    onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                    placeholder="State"
                  />
                </div>
                <div className="row gap">
                  <input
                    value={address.postalCode || ''}
                    onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))}
                    placeholder="Postal code"
                  />
                  <input
                    value={address.country || ''}
                    onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))}
                    placeholder="Country"
                  />
                </div>
              </div>
              <button className="btn" type="button" onClick={placeOrder} disabled={busy || disabled}>
                Continue to payment
              </button>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h3>Payment</h3>
              <div className="muted">Provider: Stripe</div>
              <button className="btn" type="button" onClick={startPayment} disabled={busy}>
                Create Payment Intent
              </button>
              {clientSecret ? <div className="muted small">Client secret created.</div> : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h3>Confirm</h3>
              <div className="muted small">For local dev, this uses server endpoint `/payments/confirm-mock`.</div>
              <div className="card pad">
                <div className="row between">
                  <div className="muted">PaymentIntent</div>
                  <div className="mono">{paymentIntentId}</div>
                </div>
              </div>
              <button className="btn" type="button" onClick={confirmMock} disabled={busy}>
                Confirm payment (mock)
              </button>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <h3>Success</h3>
              <div className="alert success">Order placed and payment recorded.</div>
              <div className="card pad">
                <div className="row between">
                  <div className="muted">Order</div>
                  <div className="mono">{order?._id}</div>
                </div>
                <div className="row between">
                  <div className="muted">Status</div>
                  <div>{order?.status}</div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="panel">
          <h3>Summary</h3>
          <div className="muted">Items: {items.length}</div>
          <div className="row between">
            <div className="muted">Subtotal</div>
            <div>₹{totals.subtotal}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

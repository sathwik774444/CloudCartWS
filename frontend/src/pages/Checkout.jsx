import React, { useEffect, useMemo, useState } from 'react';

import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createOrderFromCart } from '../services/orderService';
import { confirmPaymentMock, createPaymentIntent, createCashfreePaymentSession, verifyCashfreePayment } from '../services/paymentService';
import CashfreePayment from '../components/CashfreePayment.jsx';

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
  const [paymentSessionId, setPaymentSessionId] = useState('');
  const [paymentProvider, setPaymentProvider] = useState('cashfree');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setError('');
  }, [paymentProvider]);

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

  const startCashfreePayment = async () => {
    setBusy(true);
    setError('');
    try {
      console.log('Creating Cashfree payment session for order:', order._id);
      const data = await createCashfreePaymentSession({ orderId: order._id });
      console.log('Payment session response:', data);
      
      if (!data.paymentSessionId) {
        console.error('No payment session ID in response:', data);
        setError('Payment session creation failed - no session ID received');
        return;
      }
      
      setPaymentSessionId(data.paymentSessionId);
      setOrder(prev => ({ ...prev, paymentSessionId: data.paymentSessionId }));
      console.log('Payment session ID set:', data.paymentSessionId);
      setStep(3);
    } catch (e) {
      console.error('Cashfree payment session creation error:', e);
      const errorMessage = e?.response?.data?.message || e.message || 'Cashfree payment session creation failed';
      
      // If it's a 409 conflict, show retry option
      if (e?.response?.status === 409 || errorMessage.includes('already exists')) {
        setError(errorMessage + ' Click "Retry Payment" to try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setBusy(false);
    }
  };

  
  const handleCashfreeSuccess = async (paymentData) => {
    setBusy(true);
    setError('');
    try {
      const data = await verifyCashfreePayment({ orderId: order._id });
      setOrder(data.order);
      await refreshCart();
      setStep(4);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Payment verification failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCashfreeError = (error) => {
    let errorMessage = 'Payment failed. Please try again.';
    
    if (error?.message) {
      if (error.message.includes('SDK not loaded')) {
        errorMessage = 'Payment system loading error. Please refresh the page and try again.';
      } else if (error.message.includes('payment_session_id') || error.message.includes('session')) {
        errorMessage = 'Payment session is invalid or expired. Please restart the payment process.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('payment_session_id is not present or is invalid')) {
        errorMessage = 'Payment session is invalid. Please restart the payment process.';
      }
    }
    
    setError(errorMessage);
    console.error('Cashfree payment error:', error);
  };

  const testCashfreeConfig = async () => {
    setBusy(true);
    setError('');
    try {
      console.log('Testing Cashfree configuration...');
      const response = await fetch('/api/payments/cashfree/test-config', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('Cashfree config test result:', data);
      
      if (data.success) {
        alert(`✅ Cashfree configured successfully!\nEnvironment: ${data.config.environment}\nBase URL: ${data.config.baseUrl}`);
      } else {
        alert(`❌ Cashfree configuration failed!\nError: ${data.error}\nEnvironment Variables:\n- CASHFREE_APP_ID: ${data.envVars.CASHFREE_APP_ID}\n- CASHFREE_SECRET_KEY: ${data.envVars.CASHFREE_SECRET_KEY}\n- CASHFREE_ENVIRONMENT: ${data.envVars.CASHFREE_ENVIRONMENT}`);
      }
    } catch (e) {
      console.error('Test config error:', e);
      alert(`❌ Failed to test Cashfree configuration: ${e.message}`);
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
              <div className="muted">Provider: Cashfree</div>
              <button className="btn" type="button" onClick={startCashfreePayment} disabled={busy}>
                Create Cashfree Payment Session
              </button>
              {paymentSessionId ? <div className="muted small">Payment session created.</div> : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h3>Confirm</h3>
              <div className="muted small">Complete your payment using Cashfree payment gateway.</div>
              <CashfreePayment order={order} onSuccess={handleCashfreeSuccess} onError={handleCashfreeError} />
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

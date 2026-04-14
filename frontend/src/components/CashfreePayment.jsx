import React, { useEffect, useRef, useState } from 'react';

export default function CashfreePayment({ order, onSuccess, onError }) {
  const [cashfree, setCashfree] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        setLoading(true);
        console.log('Loading Cashfree SDK...');
        
        // Dynamically import and load Cashfree SDK
        const { load } = await import('@cashfreepayments/cashfree-js');
        const cashfreeInstance = await load({
          mode: "sandbox" // Change to "production" for live
        });
        
        setCashfree(cashfreeInstance);
        console.log('Cashfree SDK loaded successfully');
        setLoading(false);
      } catch (error) {
        console.error('Failed to load Cashfree SDK:', error);
        onError(new Error('Failed to load payment gateway'));
        setLoading(false);
      }
    };

    initializeSDK();
  }, [onError]);

  const doPayment = async () => {
    if (!cashfree || !order?.paymentSessionId) {
      console.error('Payment gateway not ready. Cashfree:', !!cashfree, 'Session ID:', order?.paymentSessionId);
      onError(new Error('Payment gateway not ready'));
      return;
    }

    try {
      console.log('Order object:', order);
      console.log('Starting payment with session ID:', order.paymentSessionId);
      console.log('Session ID type:', typeof order.paymentSessionId);
      console.log('Session ID length:', order.paymentSessionId?.length);
      
      const checkoutOptions = {
        paymentSessionId: order.paymentSessionId,
        redirectTarget: "_modal", // Opens in popup
      };

      const result = await cashfree.checkout(checkoutOptions);
      
      if (result && result.error) {
        console.error('Payment error:', result.error);
        onError(result.error);
      } else {
        console.log('Payment completed:', result);
        // Payment successful - the result will be handled by the redirect/success flow
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError(error);
    }
  };

  if (loading) {
    return (
      <div className="cashfree-payment-container">
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          Loading payment gateway...
        </div>
      </div>
    );
  }

  if (!order?.paymentSessionId) {
    return (
      <div className="alert">
        Payment session not available. Please try again.
      </div>
    );
  }

  return (
    <div className="cashfree-payment-container">
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Click below to open the secure payment page
        </p>
        <button 
          type="button" 
          className="btn" 
          onClick={doPayment}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Pay Now - ₹{order.total || order.amount}
        </button>
      </div>
    </div>
  );
}

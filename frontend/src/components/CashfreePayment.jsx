import React, { useEffect, useRef, useState } from 'react';

export default function CashfreePayment({ order, onSuccess, onError }) {
  const [cashfree, setCashfree] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleCashfreeError = (error) => {
    console.error('Cashfree payment error:', error);
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
      } else {
        errorMessage = error.message;
      }
    }
    
    onError(new Error(errorMessage));
  };

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        setLoading(true);
        console.log('Loading Cashfree SDK...');
        
        // Detect environment
        const isProduction = window.location.hostname === 'cloudcart.sarxlabs.online';
        const mode = isProduction ? "production" : "sandbox";
        
        console.log('Environment detected:', { hostname: window.location.hostname, isProduction, mode });
        
        // Dynamically import and load Cashfree SDK
        const { load } = await import('@cashfreepayments/cashfree-js');
        const cashfreeInstance = await load({
          mode: mode
        });
        
        // Verify the instance was loaded correctly
        if (!cashfreeInstance) {
          throw new Error('Cashfree SDK failed to initialize');
        }
        
        console.log('Cashfree SDK loaded successfully in', mode, 'mode');
        setCashfree(cashfreeInstance);
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
      onError(new Error('Payment gateway not ready - missing session ID'));
      return;
    }

    try {
      console.log('Order object:', order);
      console.log('Starting payment with session ID:', order.paymentSessionId);
      console.log('Session ID type:', typeof order.paymentSessionId);
      console.log('Session ID length:', order.paymentSessionId?.length);
      console.log('Session ID value:', JSON.stringify(order.paymentSessionId));
      console.log('SDK Mode: production');
      
      const checkoutOptions = {
        paymentSessionId: order.paymentSessionId,
        redirectTarget: "_self", // Redirects in same window
      };

      console.log('Checkout options:', checkoutOptions);
      console.log('Initiating Cashfree checkout...');
      
      const result = await cashfree.checkout(checkoutOptions);
      
      console.log('Cashfree checkout result:', result);
      
      // Handle the result directly
      if (result && result.status === 'SUCCESS') {
        console.log('Payment successful:', result);
        onSuccess(result);
      } else if (result && result.status === 'FAILED') {
        console.log('Payment failed:', result);
        handleCashfreeError(result);
      } else {
        console.log('Payment status unknown:', result);
        // For modal/popup flow, the result might be undefined
        // The payment will be handled by redirect callbacks
        console.log('Payment modal opened - waiting for redirect completion...');
      }
    } catch (error) {
      console.error('Payment error details:', error);
      handleCashfreeError(error);
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

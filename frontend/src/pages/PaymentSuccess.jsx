import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const orderId = searchParams.get('order_id');
        if (!orderId) {
          setStatus('error');
          setMessage('Order ID not found');
          return;
        }

        // Verify payment status with backend
        const response = await axios.post('/api/payments/cashfree/verify', {
          orderId: orderId
        }, {
          withCredentials: true
        });

        if (response.data.order?.isPaid) {
          setStatus('success');
          setMessage('Payment successful! Your order has been confirmed.');
          // Redirect to orders page after 3 seconds
          setTimeout(() => {
            navigate('/orders');
          }, 3000);
        } else {
          setStatus('pending');
          setMessage('Payment is being processed. Please wait...');
          // Retry verification after 5 seconds
          setTimeout(() => {
            window.location.reload();
          }, 5000);
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Payment verification failed. Please contact support.');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '⏳';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#28a745';
      case 'error':
        return '#dc3545';
      case 'pending':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  return (
    <div style={{ 
      minHeight: '60vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>
          {getStatusIcon()}
        </div>
        
        <h2 style={{ 
          color: getStatusColor(),
          marginBottom: '16px',
          fontSize: '24px'
        }}>
          {status === 'success' && 'Payment Successful!'}
          {status === 'error' && 'Payment Failed'}
          {status === 'pending' && 'Processing Payment'}
          {status === 'loading' && 'Verifying Payment...'}
        </h2>
        
        <p style={{ 
          color: '#666',
          marginBottom: '24px',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          {message}
        </p>
        
        {status === 'success' && (
          <p style={{ color: '#666', fontSize: '14px' }}>
            Redirecting to your orders page in a few seconds...
          </p>
        )}
        
        {status === 'error' && (
          <div>
            <button 
              onClick={() => navigate('/checkout')}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                marginRight: '10px'
              }}
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/orders')}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              View Orders
            </button>
          </div>
        )}
        
        {status === 'pending' && (
          <p style={{ color: '#666', fontSize: '14px' }}>
            Please wait while we confirm your payment status...
          </p>
        )}
      </div>
    </div>
  );
}

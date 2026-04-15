import { asyncHandler } from '../utils/asyncHandler.js';
import { getStripeClient, getCashfreeConfig } from '../config/payment.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { markOrderPaid } from './orderController.js';

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) {
    res.status(500);
    throw new Error('Stripe is not configured');
  }

  const { orderId } = req.validated.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Forbidden');
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error('Order already paid');
  }

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(order.total * 100),
    currency: 'inr',
    metadata: { orderId: String(order._id), userId: String(req.user._id) },
    automatic_payment_methods: { enabled: true },
  });

  await Payment.findOneAndUpdate(
    { order: order._id },
    {
      user: req.user._id,
      order: order._id,
      provider: 'stripe',
      paymentIntentId: intent.id,
      amount: order.total,
      currency: 'inr',
      status: intent.status,
      raw: intent,
    },
    { upsert: true, new: true }
  );

  order.paymentIntentId = intent.id;
  await order.save();

  res.status(201).json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
});

export const confirmPaymentMock = asyncHandler(async (req, res) => {
  // For local dev without Stripe webhooks: mark paid by providing paymentIntentId.
  const { orderId, paymentIntentId } = req.validated.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Forbidden');
  }

  const payment = await Payment.findOne({ order: order._id });
  if (payment) {
    payment.status = 'succeeded';
    payment.raw = { ...payment.raw, paymentIntentId };
    await payment.save();
  }

  const updated = await markOrderPaid(order._id, { id: paymentIntentId });
  res.json({ order: updated });
});

export const createCashfreePaymentSession = asyncHandler(async (req, res) => {
  console.log('Creating Cashfree payment session...');
  
  const cashfree = getCashfreeConfig();
  if (!cashfree) {
    console.error('Cashfree configuration missing. Check CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env file');
    console.error('Current env vars:', {
      CASHFREE_APP_ID: process.env.CASHFREE_APP_ID ? 'SET' : 'MISSING',
      CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY ? 'SET' : 'MISSING',
      CASHFREE_ENVIRONMENT: process.env.CASHFREE_ENVIRONMENT || 'MISSING'
    });
    res.status(500);
    throw new Error('Cashfree payment gateway is not configured. Please contact administrator.');
  }

  const { orderId } = req.validated.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Forbidden');
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error('Order already paid');
  }

  // Generate a unique order ID with timestamp to avoid conflicts
    const timestamp = Date.now();
    const uniqueOrderId = `order_${order._id}_${timestamp}`;
    
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://cloudcart.sarxlabs.online' 
      : 'http://localhost:3000';
    
    const paymentSessionRequest = {
      order_id: uniqueOrderId,
      order_amount: order.total,
      order_currency: 'INR',
      customer_details: {
        customer_id: String(req.user._id),
        customer_email: req.user.email,
        customer_phone: req.user.phone || '9999999999',
      },
      order_meta: {
        return_url: `${frontendUrl}/payment/cashfree/success?order_id=${order._id}`,
        notify_url: `${process.env.PRODUCTION_BACKEND_URL || 'http://localhost:5000'}/api/payments/cashfree/webhook`,
        payment_methods: "cc,dc,upi,nb,_wallet,paylater"
      }
    };

  try {
    console.log('Creating Cashfree order with request:', paymentSessionRequest);
    console.log('Cashfree config:', {
      baseUrl: cashfree.baseUrl,
      headers: { ...cashfree.headers, 'x-client-secret': '***HIDDEN***' }
    });
    
    // First create the order
    const orderResp = await fetch(`${cashfree.baseUrl}/pg/orders`, {
      method: 'POST',
      headers: cashfree.headers,
      body: JSON.stringify(paymentSessionRequest),
    });

    console.log('Cashfree order API response status:', orderResp.status);
    console.log('Cashfree order API response headers:', Object.fromEntries(orderResp.headers.entries()));
    
    let orderResponse;
    try {
      orderResponse = await orderResp.json();
      console.log('Cashfree order creation response:', orderResponse);
    } catch (parseError) {
      console.error('Failed to parse Cashfree order response as JSON:', parseError);
      console.log('Raw response text:', await orderResp.text());
      throw new Error(`Invalid response from Cashfree API: ${parseError.message}`);
    }
    
    if (!orderResp.ok) {
      const details = orderResponse?.message || orderResponse?.error || orderResponse?.type || 'Cashfree order creation failed';
      if (orderResp.status === 401 || orderResp.status === 403) {
        console.error('Cashfree auth error (create order):', { status: orderResp.status, body: orderResponse });
        res.status(401);
        throw new Error(
          `${details} (Cashfree auth failed: verify CASHFREE_APP_ID/CASHFREE_SECRET_KEY and CASHFREE_ENVIRONMENT)`
        );
      }
      if (orderResp.status === 409) {
        console.error('Cashfree duplicate order error:', { status: orderResp.status, body: orderResponse });
        res.status(409);
        throw new Error('Payment session already exists for this order. Please try again in a few minutes or contact support.');
      }
      console.error('Cashfree API error (create order):', { status: orderResp.status, body: orderResponse });
      res.status(502);
      throw new Error(`${details} (HTTP ${orderResp.status})`);
    }

    // Cashfree now returns payment_session_id directly in the order creation response
    // No need for separate session creation call
    console.log('Payment session ID found in order response:', orderResponse.payment_session_id);

    // Extract payment session ID from the order response (Cashfree now includes it directly)
    const paymentSessionId = orderResponse.payment_session_id;
    const orderId = orderResponse.order_id;
    
    console.log('Extracted session ID:', paymentSessionId);
    console.log('Extracted order ID:', orderId);

    if (!paymentSessionId) {
      console.error('No payment session ID found in order response:', orderResponse);
      res.status(500);
      throw new Error('Payment session ID not found in Cashfree order response');
    }

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        user: req.user._id,
        order: order._id,
        provider: 'cashfree',
        paymentIntentId: orderResponse.order_id,
        amount: order.total,
        currency: 'INR',
        status: orderResponse.order_status || 'created',
        raw: { order: orderResponse, paymentSessionId: paymentSessionId },
      },
      { upsert: true, new: true }
    );

    order.paymentIntentId = orderResponse.order_id;
    await order.save();

    res.status(201).json({ 
      paymentSessionId: paymentSessionId,
      orderId: orderId,
      cfOrderId: orderId
    });
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(`Cashfree payment session creation failed: ${error.message}`);
  }
});

export const retryCashfreePayment = asyncHandler(async (req, res) => {
  console.log('Retrying Cashfree payment session...');
  
  const cashfree = getCashfreeConfig();
  if (!cashfree) {
    res.status(500);
    throw new Error('Cashfree payment gateway is not configured');
  }

  const { orderId } = req.validated.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Forbidden');
  }

  // Generate a unique order ID with timestamp to avoid conflicts
  const timestamp = Date.now();
  const uniqueOrderId = `order_${order._id}_${timestamp}`;
  
  const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://cloudcart.sarxlabs.online' 
      : 'http://localhost:3000';
    
    const paymentSessionRequest = {
      order_id: uniqueOrderId,
      order_amount: order.total,
      order_currency: 'INR',
      customer_details: {
        customer_id: String(req.user._id),
        customer_email: req.user.email,
        customer_phone: req.user.phone || '9999999999',
      },
      order_meta: {
        return_url: `${frontendUrl}/payment/cashfree/success?order_id=${order._id}`,
        notify_url: `${process.env.PRODUCTION_BACKEND_URL || 'http://localhost:5000'}/api/payments/cashfree/webhook`,
        payment_methods: "cc,dc,upi,nb,_wallet,paylater"
      }
    };

  try {
    const orderResp = await fetch(`${cashfree.baseUrl}/pg/orders`, {
      method: 'POST',
      headers: cashfree.headers,
      body: JSON.stringify(paymentSessionRequest),
    });

    const orderResponse = await orderResp.json();
    
    if (!orderResp.ok) {
      const details = orderResponse?.message || orderResponse?.error || 'Cashfree order creation failed';
      if (orderResp.status === 409) {
        res.status(409);
        throw new Error('Payment session conflict. Please wait a few minutes and try again.');
      }
      res.status(502);
      throw new Error(`${details} (HTTP ${orderResp.status})`);
    }

    // Extract payment session ID from the order response (Cashfree now includes it directly)
    const paymentSessionId = orderResponse.payment_session_id;
    
    if (!paymentSessionId) {
      console.error('No payment session ID found in order response:', orderResponse);
      res.status(500);
      throw new Error('Payment session ID not found in Cashfree order response');
    }

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        user: req.user._id,
        order: order._id,
        provider: 'cashfree',
        paymentIntentId: orderResponse.order_id,
        amount: order.total,
        currency: 'INR',
        status: orderResponse.order_status || 'created',
        raw: { order: orderResponse, paymentSessionId: paymentSessionId },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ 
      paymentSessionId: paymentSessionId,
      orderId: orderResponse.order_id,
      cfOrderId: orderResponse.order_id
    });
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(`Cashfree payment retry failed: ${error.message}`);
  }
});

export const testCashfreeConfig = asyncHandler(async (req, res) => {
  console.log('Testing Cashfree configuration...');
  
  const cashfree = getCashfreeConfig();
  if (!cashfree) {
    console.error('Cashfree configuration missing');
    return res.status(500).json({
      success: false,
      error: 'Cashfree not configured',
      envVars: {
        CASHFREE_APP_ID: process.env.CASHFREE_APP_ID ? 'SET' : 'MISSING',
        CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY ? 'SET' : 'MISSING',
        CASHFREE_ENVIRONMENT: process.env.CASHFREE_ENVIRONMENT || 'MISSING'
      }
    });
  }

  // Test API connectivity
  try {
    console.log('Testing connectivity to Cashfree API...');
    const testResp = await fetch(`${cashfree.baseUrl}/pg/orders`, {
      method: 'POST',
      headers: cashfree.headers,
      body: JSON.stringify({
        order_id: `test_${Date.now()}`,
        order_amount: 1,
        order_currency: 'INR',
        customer_details: {
          customer_id: 'test',
          customer_email: 'test@example.com',
          customer_phone: '9999999999',
        },
      }),
    });

    console.log('Cashfree API test response status:', testResp.status);
    
    let testResponse;
    try {
      testResponse = await testResp.json();
    } catch (e) {
      testResponse = await testResp.text();
    }

    res.json({
      success: true,
      message: 'Cashfree configured successfully',
      config: {
        baseUrl: cashfree.baseUrl,
        environment: process.env.CASHFREE_ENVIRONMENT
      },
      apiTest: {
        status: testResp.status,
        statusText: testResp.statusText,
        response: testResponse
      }
    });
  } catch (error) {
    console.error('Cashfree API connectivity test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Cashfree API connectivity failed',
      details: error.message
    });
  }
});

export const verifyCashfreePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.validated.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Forbidden');
  }

  const cashfree = getCashfreeConfig();
  if (!cashfree) {
    console.error('Cashfree configuration missing during payment verification');
    res.status(500);
    throw new Error('Cashfree payment gateway is not configured. Please contact administrator.');
  }
  
  try {
    // Get the actual Cashfree order ID from the payment record
    const payment = await Payment.findOne({ order: order._id });
    if (!payment || !payment.paymentIntentId) {
      res.status(404);
      throw new Error('Payment record not found for this order');
    }
    
    const cfOrderId = payment.paymentIntentId; // Use the actual Cashfree order ID
    console.log('Verifying payment with Cashfree order ID:', cfOrderId);
    
    const resp = await fetch(`${cashfree.baseUrl}/pg/orders/${encodeURIComponent(cfOrderId)}`, {
      method: 'GET',
      headers: cashfree.headers,
    });
    const paymentStatus = await resp.json();
    if (!resp.ok) {
      const details =
        paymentStatus?.message || paymentStatus?.error || paymentStatus?.type || 'Cashfree order fetch failed';
      if (resp.status === 401 || resp.status === 403) {
        console.error('Cashfree auth error (fetch order):', { status: resp.status, body: paymentStatus });
        res.status(401);
        throw new Error(
          `${details} (Cashfree auth failed: verify CASHFREE_APP_ID/CASHFREE_SECRET_KEY and CASHFREE_ENVIRONMENT)`
        );
      }
      console.error('Cashfree API error (fetch order):', { status: resp.status, body: paymentStatus });
      res.status(502);
      throw new Error(`${details} (HTTP ${resp.status})`);
    }
    
    // Update payment status using the payment record we already fetched
    payment.status = paymentStatus.order_status || paymentStatus.payment_status || payment.status;
    payment.raw = paymentStatus;
    await payment.save();

    const isPaid = paymentStatus.order_status === 'PAID' || paymentStatus.payment_status === 'SUCCESS';
    if (isPaid) {
      const updated = await markOrderPaid(order._id, { id: paymentStatus.order_id || payment.paymentIntentId });
      res.json({ order: updated, payment: paymentStatus });
    } else {
      res.json({ order, payment: paymentStatus });
    }
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw new Error(`Cashfree payment verification failed: ${error.message}`);
  }
});

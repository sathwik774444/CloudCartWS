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
  const cashfree = getCashfreeConfig();
  if (!cashfree) {
    console.error('Cashfree configuration missing. Check CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env file');
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

  const paymentSessionRequest = {
    order_id: `order_${order._id}`,
    order_amount: order.total,
    order_currency: 'INR',
    customer_details: {
      customer_id: String(req.user._id),
      customer_email: req.user.email,
      customer_phone: req.user.phone || '9999999999',
    },
  };

  try {
    const resp = await fetch(`${cashfree.baseUrl}/pg/orders`, {
      method: 'POST',
      headers: cashfree.headers,
      body: JSON.stringify(paymentSessionRequest),
    });

    const session = await resp.json();
    console.log('Cashfree API response:', session);
    
    if (!resp.ok) {
      const details = session?.message || session?.error || session?.type || 'Cashfree order creation failed';
      if (resp.status === 401 || resp.status === 403) {
        console.error('Cashfree auth error (create order):', { status: resp.status, body: session });
        res.status(401);
        throw new Error(
          `${details} (Cashfree auth failed: verify CASHFREE_APP_ID/CASHFREE_SECRET_KEY and CASHFREE_ENVIRONMENT)`
        );
      }
      console.error('Cashfree API error (create order):', { status: resp.status, body: session });
      res.status(502);
      throw new Error(`${details} (HTTP ${resp.status})`);
    }

    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        user: req.user._id,
        order: order._id,
        provider: 'cashfree',
        paymentIntentId: session.order_id,
        amount: order.total,
        currency: 'INR',
        status: session.order_status || 'created',
        raw: session,
      },
      { upsert: true, new: true }
    );

    order.paymentIntentId = session.order_id;
    await order.save();

    // Extract payment session ID - handle different response formats
    const paymentSessionId = session.payment_session_id || session.paymentSessionId || session.session_id;
    const orderId = session.order_id || session.orderId;
    
    console.log('Extracted session ID:', paymentSessionId);
    console.log('Extracted order ID:', orderId);

    if (!paymentSessionId) {
      console.error('No payment session ID found in response:', session);
      res.status(500);
      throw new Error('Payment session ID not found in Cashfree response');
    }

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
    const cfOrderId = `order_${orderId}`;
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
    
    const payment = await Payment.findOne({ order: order._id });
    if (payment) {
      payment.status = paymentStatus.order_status || paymentStatus.payment_status || payment.status;
      payment.raw = paymentStatus;
      await payment.save();
    }

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

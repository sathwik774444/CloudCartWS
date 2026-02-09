import { asyncHandler } from '../utils/asyncHandler.js';
import { getStripeClient } from '../config/payment.js';
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

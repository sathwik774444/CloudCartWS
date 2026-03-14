import { asyncHandler } from '../utils/asyncHandler.js';
import Razorpay from 'razorpay';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { markOrderPaid } from './orderController.js';
import crypto from 'crypto';

// Initialize Razorpay instance
const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const razorpay = getRazorpayClient();
  if (!razorpay) {
    res.status(500);
    throw new Error('Razorpay is not configured');
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

  // Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(order.total * 100), // Amount in paise
    currency: 'INR',
    receipt: `order_${order._id}`,
    notes: {
      orderId: String(order._id),
      userId: String(req.user._id),
    },
  });

  // Save payment record
  await Payment.findOneAndUpdate(
    { order: order._id },
    {
      user: req.user._id,
      order: order._id,
      provider: 'razorpay',
      paymentIntentId: razorpayOrder.id,
      amount: order.total,
      currency: 'INR',
      status: 'created',
      raw: razorpayOrder,
    },
    { upsert: true, new: true }
  );

  order.paymentIntentId = razorpayOrder.id;
  await order.save();

  res.status(201).json({
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.validated.body;

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Invalid payment signature');
  }

  // Get order details
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Forbidden');
  }

  // Update payment record
  const payment = await Payment.findOne({ order: order._id });
  if (payment) {
    payment.status = 'succeeded';
    payment.paymentId = razorpay_payment_id;
    payment.signature = razorpay_signature;
    payment.raw = {
      ...payment.raw,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature,
    };
    await payment.save();
  }

  // Mark order as paid
  const updatedOrder = await markOrderPaid(order._id, { 
    id: razorpay_payment_id,
    provider: 'razorpay'
  });

  res.json({ 
    success: true,
    order: updatedOrder,
    paymentId: razorpay_payment_id 
  });
});

export const getRazorpayKey = asyncHandler(async (req, res) => {
  const razorpay = getRazorpayClient();
  if (!razorpay) {
    res.status(500);
    throw new Error('Razorpay is not configured');
  }

  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

export const refundRazorpayPayment = asyncHandler(async (req, res) => {
  const razorpay = getRazorpayClient();
  if (!razorpay) {
    res.status(500);
    throw new Error('Razorpay is not configured');
  }

  const { paymentId, amount } = req.validated.body;

  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined, // Amount in paise
    });

    // Update payment record
    const payment = await Payment.findOne({ paymentId });
    if (payment) {
      payment.status = 'refunded';
      payment.refundId = refund.id;
      payment.raw = {
        ...payment.raw,
        refund,
      };
      await payment.save();
    }

    res.json({ success: true, refund });
  } catch (error) {
    res.status(400);
    throw new Error(`Refund failed: ${error.message}`);
  }
});

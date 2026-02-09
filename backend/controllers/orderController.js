import { asyncHandler } from '../utils/asyncHandler.js';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { sendEmail } from '../utils/sendEmail.js';
import { User } from '../models/User.js';

function calcTotals(items) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal > 999 ? 0 : 79;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;
  return { subtotal, shipping, tax, total };
}

export const createOrderFromCart = asyncHandler(async (req, res) => {
  const { shippingAddress } = req.validated.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  const productIds = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const orderItems = cart.items.map((i) => {
    const p = byId.get(String(i.product));
    if (!p) {
      throw new Error('Some cart items are invalid');
    }
    if (p.countInStock < i.qty) {
      throw new Error(`Insufficient stock for ${p.title}`);
    }

    return {
      product: p._id,
      qty: i.qty,
      price: p.price,
      title: p.title,
      image: p.images?.[0] || '',
    };
  });

  const totals = calcTotals(orderItems);

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod: 'stripe',
    ...totals,
    status: 'pending',
  });

  res.status(201).json({ order });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 10), 50);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);

  res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Forbidden');
  }

  res.json({ order });
});

export const adminListOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Order.find().populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(),
  ]);

  res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
});

export const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const { status, tracking } = req.validated.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (typeof status === 'string') order.status = status;
  if (tracking && typeof tracking === 'object') {
    order.tracking = {
      ...order.tracking?.toObject?.(),
      ...tracking,
    };
  }

  await order.save();
  res.json({ order });
});

export async function markOrderPaid(orderId, paymentIntent) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');
  if (order.isPaid) return order;

  for (const item of order.items) {
    const p = await Product.findById(item.product);
    if (!p) continue;
    if (p.countInStock < item.qty) {
      throw new Error(`Insufficient stock for ${p.title}`);
    }
    p.countInStock -= item.qty;
    await p.save();
  }

  order.isPaid = true;
  order.paidAt = new Date();
  order.status = 'paid';
  order.paymentIntentId = paymentIntent?.id || order.paymentIntentId;
  await order.save();

  const user = await User.findById(order.user);
  if (user?.email) {
    await sendEmail({
      to: user.email,
      subject: `Order confirmed: ${order._id}`,
      html: `<p>Your order <b>${order._id}</b> is confirmed.</p><p>Total: ${order.total}</p>`,
    });
  }

  await Cart.updateOne({ user: order.user }, { $set: { items: [] } });

  return order;
}

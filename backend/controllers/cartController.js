import { asyncHandler } from '../utils/asyncHandler.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';

async function getOrCreateCart(userId) {
  const existing = await Cart.findOne({ user: userId });
  if (existing) return existing;
  return Cart.create({ user: userId, items: [] });
}

export const getMyCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  res.json({ cart });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, qty } = req.validated.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (product.countInStock < qty) {
    res.status(400);
    throw new Error('Insufficient stock');
  }

  const cart = await getOrCreateCart(req.user._id);

  const idx = cart.items.findIndex((i) => String(i.product) === String(product._id));
  if (idx >= 0) {
    cart.items[idx].qty = Math.min(cart.items[idx].qty + qty, product.countInStock);
    cart.items[idx].price = product.price;
  } else {
    cart.items.push({
      product: product._id,
      qty,
      price: product.price,
      title: product.title,
      image: product.images?.[0] || '',
    });
  }

  await cart.save();
  res.status(201).json({ cart });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, qty } = req.validated.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (product.countInStock < qty) {
    res.status(400);
    throw new Error('Insufficient stock');
  }

  const cart = await getOrCreateCart(req.user._id);
  const idx = cart.items.findIndex((i) => String(i.product) === String(productId));
  if (idx < 0) {
    res.status(404);
    throw new Error('Item not in cart');
  }

  cart.items[idx].qty = qty;
  cart.items[idx].price = product.price;

  await cart.save();
  res.json({ cart });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.validated.body;

  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => String(i.product) !== String(productId));
  await cart.save();

  res.json({ cart });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ cart });
});

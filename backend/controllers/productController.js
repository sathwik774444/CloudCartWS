import NodeCache from 'node-cache';

import { asyncHandler } from '../utils/asyncHandler.js';
import { Product } from '../models/Product.js';

const cache = new NodeCache({ stdTTL: 30 });

export const listProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 12), 48);
  const skip = (page - 1) * limit;

  const q = String(req.query.q || '').trim();
  const category = String(req.query.category || '').trim();
  const featured = String(req.query.featured || '').trim();
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
  const sort = String(req.query.sort || 'new');

  const key = JSON.stringify({ page, limit, q, category, featured, minPrice, maxPrice, sort });
  const cached = cache.get(key);
  if (cached) {
    res.json(cached);
    return;
  }

  const filter = {};
  if (category) filter.category = category;
  if (featured === 'true') filter.isFeatured = true;
  if (minPrice !== null || maxPrice !== null) {
    filter.price = {};
    if (minPrice !== null) filter.price.$gte = minPrice;
    if (maxPrice !== null) filter.price.$lte = maxPrice;
  }
  if (q) {
    filter.$text = { $search: q };
  }

  const sortObj =
    sort === 'price_asc'
      ? { price: 1 }
      : sort === 'price_desc'
        ? { price: -1 }
        : sort === 'rating'
          ? { rating: -1 }
          : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  const payload = { items, page, limit, total, pages: Math.ceil(total / limit) };
  cache.set(key, payload);
  res.json(payload);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = req.validated.body;
  const product = await Product.create(data);
  cache.flushAll();
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const updates = req.validated.body;
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  Object.assign(product, updates);
  await product.save();
  cache.flushAll();
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await product.deleteOne();
  cache.flushAll();
  res.json({ ok: true });
});

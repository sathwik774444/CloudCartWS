import express from 'express';
import { z } from 'zod';

import { protect } from '../middleware/authMiddleware.js';
import { validate, objectIdSchema } from '../utils/validators.js';
import {
  addToCart,
  clearCart,
  getMyCart,
  removeCartItem,
  updateCartItem,
} from '../controllers/cartController.js';

const router = express.Router();

router.get('/', protect, getMyCart);

router.post(
  '/add',
  protect,
  validate(
    z.object({
      body: z.object({ productId: objectIdSchema, qty: z.number().int().min(1) }),
      query: z.any().optional(),
      params: z.any().optional(),
    })
  ),
  addToCart
);

router.put(
  '/update',
  protect,
  validate(
    z.object({
      body: z.object({ productId: objectIdSchema, qty: z.number().int().min(1) }),
      query: z.any().optional(),
      params: z.any().optional(),
    })
  ),
  updateCartItem
);

router.post(
  '/remove',
  protect,
  validate(
    z.object({
      body: z.object({ productId: objectIdSchema }),
      query: z.any().optional(),
      params: z.any().optional(),
    })
  ),
  removeCartItem
);

router.post('/clear', protect, clearCart);

export default router;

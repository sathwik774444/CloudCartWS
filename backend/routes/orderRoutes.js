import express from 'express';
import { z } from 'zod';

import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { validate } from '../utils/validators.js';
import {
  adminListOrders,
  adminUpdateOrderStatus,
  createOrderFromCart,
  getMyOrders,
  getOrderById,
} from '../controllers/orderController.js';

const router = express.Router();

router.post(
  '/',
  protect,
  validate(
    z.object({
      body: z.object({
        shippingAddress: z.object({
          fullName: z.string().min(2),
          line1: z.string().min(2),
          line2: z.string().optional().default(''),
          city: z.string().min(1),
          state: z.string().optional().default(''),
          postalCode: z.string().min(3),
          country: z.string().min(2),
        }),
      }),
      query: z.any().optional(),
      params: z.any().optional(),
    })
  ),
  createOrderFromCart
);

router.get('/mine', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

router.get('/', protect, adminOnly, adminListOrders);

router.put(
  '/:id/status',
  protect,
  adminOnly,
  validate(
    z.object({
      body: z.object({
        status: z
          .enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
          .optional(),
        tracking: z
          .object({
            carrier: z.string().optional(),
            trackingNumber: z.string().optional(),
            url: z.string().optional(),
          })
          .optional(),
      }),
      query: z.any().optional(),
      params: z.object({ id: z.string() }),
    })
  ),
  adminUpdateOrderStatus
);

export default router;

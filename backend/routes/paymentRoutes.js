import express from 'express';
import { z } from 'zod';

import { protect } from '../middleware/authMiddleware.js';
import { validate, objectIdSchema } from '../utils/validators.js';
import { confirmPaymentMock, createPaymentIntent, createCashfreePaymentSession, verifyCashfreePayment, testCashfreeConfig, retryCashfreePayment } from '../controllers/paymentController.js';

const router = express.Router();

router.post(
  '/intent',
  protect,
  validate(
    z.object({
      body: z.object({ orderId: objectIdSchema }),
      query: z.any().optional(),
      params: z.any().optional(),
    })
  ),
  createPaymentIntent
);

router.post(
  '/confirm-mock',
  protect,
  validate(
    z.object({
      body: z.object({ orderId: objectIdSchema, paymentIntentId: z.string().min(3) }),
      query: z.any().optional(),
      params: z.any().optional(),
    })
  ),
  confirmPaymentMock
);

router.post(
  '/cashfree/create-session',
  protect,
  validate(
    z.object({
      body: z.object({ orderId: objectIdSchema }),
      query: z.any().optional(),
      params: z.any().optional(),
    })
  ),
  createCashfreePaymentSession
);

router.post(
  '/cashfree/verify',
  protect,
  validate(
    z.object({
      body: z.object({ orderId: objectIdSchema }),
      query: z.any().optional(),
      params: z.any().optional(),
    })
  ),
  verifyCashfreePayment
);

router.get(
  '/cashfree/test-config',
  protect,
  testCashfreeConfig
);

router.post(
  '/cashfree/retry',
  protect,
  validate(
    z.object({
      body: z.object({ orderId: objectIdSchema }),
      query: z.any().optional(),
      params: z.any().optional(),
    })
  ),
  retryCashfreePayment
);

export default router;

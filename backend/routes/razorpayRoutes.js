import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayKey,
  refundRazorpayPayment,
} from '../controllers/razorpayController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { body } from 'express-validator';

const router = Router();

// Create Razorpay order
router.post(
  '/create-order',
  protect,
  [
    body('orderId')
      .isMongoId()
      .withMessage('Valid order ID is required'),
  ],
  validate,
  createRazorpayOrder
);

// Verify Razorpay payment
router.post(
  '/verify',
  protect,
  [
    body('razorpay_order_id')
      .notEmpty()
      .withMessage('Razorpay order ID is required'),
    body('razorpay_payment_id')
      .notEmpty()
      .withMessage('Razorpay payment ID is required'),
    body('razorpay_signature')
      .notEmpty()
      .withMessage('Razorpay signature is required'),
    body('orderId')
      .isMongoId()
      .withMessage('Valid order ID is required'),
  ],
  validate,
  verifyRazorpayPayment
);

// Get Razorpay key
router.get('/key', protect, getRazorpayKey);

// Refund payment (admin only)
router.post(
  '/refund',
  protect,
  [
    body('paymentId')
      .notEmpty()
      .withMessage('Payment ID is required'),
    body('amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
  ],
  validate,
  refundRazorpayPayment
);

export default router;

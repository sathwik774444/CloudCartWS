import express from 'express';
import { z } from 'zod';

import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { validate } from '../utils/validators.js';

const router = express.Router();

router.get('/', listProducts);
router.get('/:id', getProductById);

const productBody = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  brand: z.string().optional().default(''),
  category: z.string().optional().default(''),
  price: z.number().nonnegative(),
  images: z.array(z.string()).optional().default([]),
  countInStock: z.number().int().nonnegative().optional().default(0),
  isFeatured: z.boolean().optional().default(false),
});

router.post(
  '/',
  protect,
  adminOnly,
  validate(
    z.object({
      body: productBody,
      query: z.any().optional(),
      params: z.any().optional(),
    })
  ),
  createProduct
);

router.put(
  '/:id',
  protect,
  adminOnly,
  validate(
    z.object({
      body: productBody.partial(),
      query: z.any().optional(),
      params: z.object({ id: z.string() }),
    })
  ),
  updateProduct
);

router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;

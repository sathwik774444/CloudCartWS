import express from 'express';
import { z } from 'zod';

import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { validate } from '../utils/validators.js';
import { getMe, listUsers, updateMe } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', protect, getMe);

router.put(
  '/me',
  protect,
  validate(
    z.object({
      body: z.object({
        name: z.string().min(2).optional(),
        phone: z.string().optional(),
        address: z
          .object({
            fullName: z.string().optional(),
            line1: z.string().optional(),
            line2: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            postalCode: z.string().optional(),
            country: z.string().optional(),
          })
          .optional(),
      }),
      query: z.any().optional(),
      params: z.any().optional(),
    })
  ),
  updateMe
);

router.get('/', protect, adminOnly, listUsers);

export default router;

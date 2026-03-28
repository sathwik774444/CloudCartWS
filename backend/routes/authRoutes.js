import express from 'express';
import { z } from 'zod';

import { login, register, googleAuthCallback } from '../controllers/authController.js';
import { validate } from '../utils/validators.js';
import { passport } from '../config/passport.js';

const router = express.Router();

router.get('/google', passport.authenticate('google'));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CORS_ORIGIN}/login` }),
  googleAuthCallback
);

router.post(
  '/register',
  validate(
    z.object({
      body: z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
      }),
      query: z.any().optional(),
      params: z.any().optional(),
    })
  ),
  register
);

router.post(
  '/login',
  validate(
    z.object({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
      query: z.any().optional(),
      params: z.any().optional(),
    })
  ),
  login
);

export default router;

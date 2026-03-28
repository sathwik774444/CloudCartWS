import { User } from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const googleAuthCallback = asyncHandler(async (req, res) => {
  const token = generateToken({ id: req.user._id });
  
  res.redirect(`${process.env.CORS_ORIGIN}/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  }))}`);
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated.body;

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409);
    throw new Error('Email already registered');
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role: 'user' });

  const token = generateToken({ id: user._id });
  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const token = generateToken({ id: user._id });
  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

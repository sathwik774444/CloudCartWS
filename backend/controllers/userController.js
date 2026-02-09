import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.validated.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (typeof name === 'string') user.name = name;
  if (typeof phone === 'string') user.phone = phone;
  if (address && typeof address === 'object') {
    user.address = {
      ...user.address?.toObject?.(),
      ...address,
    };
  }

  await user.save();

  const updated = await User.findById(req.user._id).select('-passwordHash');
  res.json({ user: updated });
});

export const listUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    User.find().select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
});

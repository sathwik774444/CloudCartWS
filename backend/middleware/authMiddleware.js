import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/generateToken.js';
import { User } from '../models/User.js';

export const protect = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, missing token');
  }

  const decoded = verifyToken(token);
  const user = await User.findById(decoded.id).select('-passwordHash');

  if (!user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  req.user = user;
  next();
});

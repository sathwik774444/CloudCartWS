import { z } from 'zod';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      res.status(400);
      const message = result.error.issues.map((i) => i.message).join(', ');
      next(new Error(message));
      return;
    }

    req.validated = result.data;
    next();
  };
}

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

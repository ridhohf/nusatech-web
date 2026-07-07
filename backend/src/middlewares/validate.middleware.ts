import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodIssue } from 'zod';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((e: ZodIssue) => ({
      field: e.path.map(String).join('.'),
      message: e.message,
    }));
    return res.status(422).json({ success: false, message: 'Validation failed', errors });
  }
  req.body = result.data;
  next();
};

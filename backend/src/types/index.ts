import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include typed user
export interface AuthUser {
  id: string;
  role: 'INTERNAL' | 'CLIENT';
  companyId?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export type AppHandler = (req: AuthRequest, res: Response, next: NextFunction) => Promise<void> | void;

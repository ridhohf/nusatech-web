import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { formatSuccess } from '../utils/response.util';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    if (!result) return res.status(401).json({ success: false, message: 'Email atau password salah' });
    res.json(formatSuccess(result, 'Login berhasil'));
  } catch (error) { next(error); }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(formatSuccess(user, 'Akun berhasil dibuat'));
  } catch (error: any) {
    if (error.message === 'Email sudah terdaftar') return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

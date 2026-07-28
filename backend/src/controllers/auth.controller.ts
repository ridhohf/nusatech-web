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
    const msg = user.role === 'INTERNAL' 
      ? 'Akun Admin berhasil dibuat dan sedang menunggu persetujuan Admin utama.' 
      : 'Akun Klien berhasil dibuat.';
    res.status(201).json(formatSuccess(user, msg));
  } catch (error: any) {
    if (error.message === 'Email sudah terdaftar') return res.status(409).json({ success: false, message: error.message });
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.resetPassword(req.body.email, req.body.newPassword);
    res.json(formatSuccess(result, 'Password berhasil diperbarui. Silakan login kembali.'));
  } catch (error: any) {
    if (error.message === 'Email tidak terdaftar') return res.status(404).json({ success: false, message: error.message });
    next(error);
  }
};

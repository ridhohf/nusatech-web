import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('FATAL: JWT_SECRET environment variable is not set.');

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    if (user.isApproved === false) {
      throw new Error('Akun Admin Anda sedang menunggu persetujuan dari Admin utama.');
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  },

  async register(data: { name: string; email: string; password: string; role: 'INTERNAL' | 'CLIENT' }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email sudah terdaftar');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const isApproved = data.role === 'INTERNAL' ? false : true;

    const user = await prisma.user.create({
      data: { ...data, password: hashedPassword, isApproved },
      select: { id: true, name: true, email: true, role: true, isApproved: true, createdAt: true },
    });
    return user;
  },

  async resetPassword(email: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Email tidak terdaftar');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    return { message: 'Password berhasil diperbarui' };
  },
};

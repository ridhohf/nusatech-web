import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('FATAL: JWT_SECRET environment variable is not set.');

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    if (user.isApproved === false) {
      throw new Error('Akun Admin Anda sedang menunggu persetujuan dari Admin utama.');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, companyId: user.companyId },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  },

  async register(data: { name: string; email: string; password: string; role: 'INTERNAL' | 'CLIENT'; companyId?: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email sudah terdaftar');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const isApproved = data.role === 'INTERNAL' ? false : true;

    const user = await prisma.user.create({
      data: { 
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        companyId: data.companyId || null,
        isApproved,
      },
      include: { company: true },
    });
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
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

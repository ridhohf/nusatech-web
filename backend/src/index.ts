import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/error.middleware';
import { authenticate } from './middlewares/auth.middleware';

import authRoutes from './routes/auth.routes';
import inventoryRoutes from './routes/inventory.routes';
import inspectionRoutes from './routes/inspection.routes';
import supplierRoutes from './routes/supplier.routes';
import userRoutes from './routes/user.routes';
import companyRoutes from './routes/company.routes';

if (!process.env.JWT_SECRET) {
  console.error('WARNING: JWT_SECRET environment variable is not set!');
}

const app = express();
const port = process.env.PORT || 5000;
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Security Middlewares ────────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://nusatech-frontend.vercel.app',
      'http://localhost:3000',
    ];
    // Mengizinkan request tanpa origin (seperti /ping dari browser langsung)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Ditolak oleh kebijakan CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));

// Rate Limiter — General: 100 req per 15 min
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

// Rate Limiter — Auth: 10 attempts per 15 min (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' },
});

// ─── Body Parser ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/ping', (req, res) => {
  res.json({ message: 'pong', status: 'Backend Vercel is alive!' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/inventory', authenticate, inventoryRoutes);
app.use('/api/inspections', authenticate, inspectionRoutes);
app.use('/api/suppliers', authenticate, supplierRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/companies', authenticate, companyRoutes);

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
    console.log(`🌍 Accepting requests from: ${ALLOWED_ORIGIN}`);
  });
}

module.exports = app;

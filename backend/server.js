import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './src/modules/auth/routes.js';
import billingRoutes from './src/modules/billing/routes.js';
import contactRoutes from './src/modules/contact/routes.js';

// Importar middlewares
import { errorHandler } from './src/middleware/errorHandler.js';
import logger from './src/utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// ⚠️ CRÍTICO: Webhook de Stripe ANTES de express.json()
// Stripe necesita el raw body para verificar la firma
app.post('/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res, next) => {
    // Importar la ruta del webhook dinámicamente
    const { default: billing } = await import('./src/modules/billing/routes.js');

    // Crear un mini router temporal solo para esta ruta
    const tempRouter = express.Router();
    tempRouter.post('/webhook', billing.stack.find(layer =>
      layer.route?.path === '/webhook'
    ).route.stack[0].handle);

    // Ajustar la ruta para que coincida
    req.url = '/webhook';
    tempRouter(req, res, next);
  }
);

// JSON parsing DESPUÉS del webhook (para el resto de rutas)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 intentos de login cada 15 minutos
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos de inicio de sesión, intenta de nuevo en 15 minutos' }
});

// Aplicar rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Logging de requests (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });
}

// Root endpoint - Quick server status check
app.get('/', (req, res) => {
  res.json({
    status: 'Backend activo',
    service: 'UX Kit Express API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      billing: '/api/billing/*',
      contact: '/api/contact'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'UX-Kit Express API',
    version: '1.0.0',
    timestamp: new Date(),
    environment: process.env.NODE_ENV
  });
});

// Conectar rutas
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/contact', contactRoutes);

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Manejo de errores (debe ser el último middleware)
app.use(errorHandler);

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err);
  process.exit(1);
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  logger.info(`
  ╔════════════════════════════════════════════╗
  ║   🚀 UX-Kit Express Backend Started       ║
  ╠════════════════════════════════════════════╣
  ║   Port: ${PORT.toString().padEnd(35)}║
  ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(26)}║
  ║   Health: http://localhost:${PORT}/api/health ║
  ╚════════════════════════════════════════════╝
  `);

  logger.info('Available endpoints:');
  logger.info('  POST /api/auth/register');
  logger.info('  POST /api/auth/login');
  logger.info('  GET  /api/auth/profile');
  logger.info('  POST /api/billing/create-checkout-session');
  logger.info('  POST /api/billing/webhook');
  logger.info('  GET  /api/billing/subscription');
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

export default app;

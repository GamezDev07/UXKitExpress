import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

export function authenticate(req, res, next) {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('No authorization header found');
      return res.status(401).json({
        status: 'error',
        message: 'No autenticado. Por favor inicia sesión.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      logger.warn('No token provided');
      return res.status(401).json({
        status: 'error',
        message: 'Token no proporcionado'
      });
    }

    // Verificar token de Supabase usando el JWT secret de Supabase
    const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!supabaseJwtSecret) {
      logger.error('SUPABASE_JWT_SECRET not configured');
      return res.status(500).json({
        status: 'error',
        message: 'Error de configuración del servidor'
      });
    }

    const decoded = jwt.verify(token, supabaseJwtSecret);

    // Tokens de Supabase tienen la estructura:
    // sub: user ID, email: email, role: 'authenticated', etc.
    req.user = {
      userId: decoded.sub,
      email: decoded.email,
      plan: decoded.user_metadata?.plan || 'free',
      sub: decoded.sub,
      id: decoded.sub
    };

    logger.debug(`User authenticated: ${req.user.userId}`);
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.error('Invalid token:', error.message);
      return res.status(401).json({
        status: 'error',
        message: 'Token inválido'
      });
    }

    if (error.name === 'TokenExpiredError') {
      logger.error('Token expired');
      return res.status(401).json({
        status: 'error',
        message: 'Token expirado. Por favor inicia sesión de nuevo.'
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error al verificar autenticación'
    });
  }
}

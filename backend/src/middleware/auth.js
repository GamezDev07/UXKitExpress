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

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // El token puede tener diferentes estructuras dependiendo de cuándo se creó
    // Normalizar la estructura del usuario
    req.user = {
      userId: decoded.userId || decoded.sub || decoded.id,
      email: decoded.email,
      plan: decoded.plan || decoded.current_plan,
      sub: decoded.userId || decoded.sub || decoded.id, // Para compatibilidad
      id: decoded.userId || decoded.sub || decoded.id
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

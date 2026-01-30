import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export const authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new AppError('Acceso no autorizado. Token no proporcionado.', 401);
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token inválido', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expirado', 401));
    }
    next(error);
  }
};

// Middleware para verificar plan
export const requirePlan = (requiredPlan) => {
  return (req, res, next) => {
    const userPlan = req.user?.plan || 'free';
    const planHierarchy = {
      'free': 0,
      'basic': 1,
      'advance': 2,
      'pro': 3,
      'enterprise': 4
    };
    
    if (planHierarchy[userPlan] >= planHierarchy[requiredPlan]) {
      next();
    } else {
      next(new AppError(
        `Esta función requiere el plan ${requiredPlan} o superior`,
        403
      ));
    }
  };
};

import logger from '../utils/logger.js';

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    logger.error({
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      url: req.url,
      method: req.method
    });

    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Producción: no exponer detalles internos
  if (err.isOperational) {
    logger.error({
      message: err.message,
      statusCode: err.statusCode,
      url: req.url
    });

    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Error de programación o desconocido
  logger.error('ERROR CRÍTICO:', err);
  
  return res.status(500).json({
    status: 'error',
    message: 'Algo salió mal'
  });
};

// Wrapper para async functions
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

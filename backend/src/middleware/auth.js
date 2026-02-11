import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger.js';

// Inicializar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function authenticate(req, res, next) {
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

    // Verificar token usando Supabase client
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Invalid token:', error?.message);
      return res.status(401).json({
        status: 'error',
        message: 'Token inválido'
      });
    }

    // Extraer información del usuario
    req.user = {
      userId: user.id,
      email: user.email,
      plan: user.user_metadata?.plan || 'free',
      sub: user.id,
      id: user.id
    };

    logger.debug(`User authenticated: ${req.user.userId}`);
    next();

  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error al verificar autenticación'
    });
  }
}

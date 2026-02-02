import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabaseAdmin from '../../config/supabase.js';
import { userSchemas } from '../../utils/validations.js';
import { authenticate } from '../../middleware/auth.js';
import { catchAsync } from '../../middleware/errorHandler.js';
import logger from '../../utils/logger.js';

const router = express.Router();

// Registro de usuario
router.post('/register', catchAsync(async (req, res) => {
  console.log('=== REGISTER REQUEST RECEIVED ===');
  console.log('Body:', { ...req.body, password: '***' });
  console.log('Headers:', req.headers);

  try {
    // Validar datos de entrada (incluyendo sessionId opcional)
    const { email, password, fullName, sessionId } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    console.log('Validation passed for email:', email);

    // 1. VALIDAR PAGO DE STRIPE (si viene sessionId)
    let planData = { plan: 'free', interval: 'monthly' };
    let stripeCustomerId = null;
    let stripeSubscriptionId = null;

    if (sessionId) {
      console.log('Validating Stripe session:', sessionId);

      try {
        const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        console.log('Stripe session retrieved:', {
          id: session.id,
          payment_status: session.payment_status,
          customer: session.customer,
          subscription: session.subscription
        });

        if (session.payment_status !== 'paid') {
          console.error('Payment not completed for session:', sessionId);
          return res.status(400).json({
            error: 'Pago no completado',
            payment_status: session.payment_status
          });
        }

        // Extraer datos del plan desde metadata
        planData.plan = session.metadata?.plan || 'basic';
        planData.interval = session.metadata?.interval || 'monthly';
        stripeCustomerId = session.customer;
        stripeSubscriptionId = session.subscription;

        console.log('Payment validated successfully:', planData);
      } catch (stripeError) {
        console.error('Error validating Stripe session:', stripeError);
        return res.status(400).json({
          error: 'Error al validar sesión de pago',
          details: stripeError.message
        });
      }
    }

    // 2. CREAR USUARIO EN SUPABASE AUTH (usando Admin API)
    console.log('Creating user in Supabase Auth...');

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);

      // Manejar usuario duplicado
      if (authError.message?.includes('already') || authError.code === '23505') {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }

      return res.status(500).json({
        error: 'Error al crear usuario',
        details: authError.message
      });
    }

    console.log('Auth user created:', authData.user.id);

    // 3. CREAR/ACTUALIZAR REGISTRO EN TABLA USERS
    console.log('Upserting user in public.users table...');

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        current_plan: planData.plan,
        subscription_status: sessionId ? 'active' : 'free',
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (dbError) {
      console.error('Error updating users table:', dbError);
      // Usuario de auth ya existe, pero tabla users falló
      // Podríamos intentar eliminar el usuario de auth aquí si es crítico
      logger.error(`Failed to create user record for ${authData.user.id}: ${dbError.message}`);
    } else {
      console.log('User record created/updated successfully');
    }

    // 4. CREAR TOKEN JWT PARA EL FRONTEND
    console.log('Generating JWT token...');

    const token = jwt.sign(
      {
        userId: authData.user.id,
        email,
        plan: planData.plan
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('JWT generated successfully');
    logger.info(`New user registered: ${email} (plan: ${planData.plan})`);

    // 5. RESPUESTA EXITOSA
    const response = {
      success: true,
      user: {
        id: authData.user.id,
        email,
        fullName,
        plan: planData.plan,
        subscriptionStatus: sessionId ? 'active' : 'free'
      },
      token
    };

    console.log('Sending success response');
    return res.status(201).json(response);

  } catch (error) {
    console.error('=== REGISTER ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);

    return res.status(500).json({
      error: 'Error en el registro',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}));

// Inicio de sesión
router.post('/login', catchAsync(async (req, res) => {
  console.log('=== LOGIN REQUEST RECEIVED ===');
  console.log('Body:', { email: req.body.email, password: '***' });
  console.log('Origin:', req.headers.origin);

  try {
    const { email, password } = userSchemas.login.parse(req.body);
    console.log('Validation passed for email:', email);

    // Obtener usuario
    console.log('Fetching user from database...');
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    console.log('User found:', user.id);

    // Verificar contraseña
    console.log('Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    console.log('Password verified successfully');

    // Crear token JWT
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { userId: user.id, email: user.email, plan: user.current_plan },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('JWT generated successfully');
    logger.info(`Usuario inició sesión: ${email}`);

    const response = {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        plan: user.current_plan,
        subscriptionStatus: user.subscription_status
      },
      token
    };

    console.log('Sending login success response');
    return res.json(response);

  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Datos de login inválidos',
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Error en el inicio de sesión',
      message: error.message
    });
  }
}));

// Obtener perfil de usuario (AHORA CON MIDDLEWARE DE AUTENTICACIÓN)
router.get('/profile', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, avatar_url, current_plan, subscription_status, created_at')
    .eq('id', userId)
    .single();

  if (error) throw error;

  res.json({ user });
}));

// Actualizar perfil
router.patch('/profile', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { fullName, avatarUrl } = req.body;

  const updates = {};
  if (fullName) updates.full_name = fullName;
  if (avatarUrl) updates.avatar_url = avatarUrl;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  logger.info(`Usuario actualizó perfil: ${user.email}`);

  res.json({ user });
}));

export default router;

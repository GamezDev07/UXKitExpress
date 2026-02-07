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

  try {
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

        if (session.payment_status !== 'paid') {
          return res.status(400).json({ error: 'Pago no completado' });
        }

        planData.plan = session.metadata?.plan || 'basic';
        planData.interval = session.metadata?.interval || 'monthly';
        stripeCustomerId = session.customer;
        stripeSubscriptionId = session.subscription;

        console.log('Payment validated successfully:', planData);
      } catch (stripeError) {
        console.error('Error validating Stripe session:', stripeError);
        return res.status(400).json({ error: 'Error al validar sesión de pago' });
      }
    }

    // 2. ✅ HASHEAR CONTRASEÑA MANUALMENTE
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // 3. CREAR USUARIO EN SUPABASE AUTH
    console.log('Creating user in Supabase Auth...');

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);

      if (authError.message?.includes('already') || authError.code === '23505') {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }

      return res.status(500).json({ error: 'Error al crear usuario' });
    }

    console.log('Auth user created:', authData.user.id);

    // 4. ✅ GUARDAR EN TABLA USERS CON PASSWORD_HASH
    console.log('Inserting user in public.users table...');

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        password_hash: passwordHash, // ✅ AQUÍ ESTÁ EL FIX
        full_name: fullName,
        current_plan: planData.plan || 'free',
        subscription_status: 'active',
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        subscription_interval: planData.interval
      });

    if (dbError) {
      console.error('Error inserting user in users table:', dbError);

      // Si falla, eliminar usuario de auth para mantener consistencia
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return res.status(500).json({ error: 'Error al crear usuario en base de datos' });
    }

    console.log('User record created successfully with password hash');

    // 5. CREAR TOKEN JWT
    const token = jwt.sign(
      {
        userId: authData.user.id,
        email,
        plan: planData.plan
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Registration successful for:', email);
    logger.info(`New user registered: ${email} (plan: ${planData.plan})`);

    // 6. RESPUESTA EXITOSA
    res.status(201).json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        fullName,
        plan: planData.plan
      },
      token
    });

  } catch (error) {
    console.error('=== REGISTER ERROR ===', error);
    res.status(500).json({ error: 'Error en el registro' });
  }
}));

// Inicio de sesión
router.post('/login', catchAsync(async (req, res) => {
  console.log('=== LOGIN REQUEST RECEIVED ===');
  console.log('Body:', { email: req.body.email, password: '***' });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

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
    console.log('Password hash exists:', !!user.password_hash);
    console.log('Password hash length:', user.password_hash?.length);

    // ✅ VERIFICAR QUE EXISTE PASSWORD_HASH
    if (!user.password_hash) {
      console.error('❌ No password_hash for user:', email);
      return res.status(401).json({
        error: 'Usuario creado con método antiguo. Por favor contacta a soporte.'
      });
    }

    // Verificar contraseña
    console.log('Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    console.log('bcrypt.compare result:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    console.log('✅ Password valid for user:', email);

    // Crear token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, plan: user.current_plan },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Token generated for user:', email);
    logger.info(`Usuario inició sesión: ${email}`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        plan: user.current_plan
      },
      token
    });

  } catch (error) {
    console.error('=== LOGIN ERROR ===', error);
    res.status(500).json({ error: 'Error en el inicio de sesión' });
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

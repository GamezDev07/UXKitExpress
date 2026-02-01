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
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  console.log('Origin:', req.headers.origin);

  try {
    const { email, password, fullName } = userSchemas.register.parse(req.body);
    console.log('Validation passed for email:', email);

    console.log('Checking for existing user...');
    console.log('Supabase URL exists:', !!process.env.SUPABASE_URL);

    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    console.log('Existing user check result:', { existingUser, checkError });

    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Hashear contraseña
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    console.log('Password hashed successfully');

    // Crear usuario
    console.log('Creating user in database...');
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email,
          password_hash: passwordHash,
          full_name: fullName,
          current_plan: 'free',
          subscription_status: 'active'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    console.log('User created successfully:', user.id);

    // Crear token JWT
    console.log('Generating JWT token...');
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

    const token = jwt.sign(
      { userId: user.id, email: user.email, plan: user.current_plan },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('JWT generated successfully');
    logger.info(`Nuevo usuario registrado: ${email}`);

    const response = {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        plan: user.current_plan
      },
      token
    };

    console.log('Sending success response');
    console.log('Registration successful');

    return res.status(201).json(response);

  } catch (error) {
    console.error('=== REGISTER ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);

    // If it's a Zod validation error
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Datos de registro inválidos',
        details: error.errors
      });
    }

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

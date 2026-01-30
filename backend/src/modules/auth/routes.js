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
  const { email, password, fullName } = userSchemas.register.parse(req.body);
  
  // Verificar si el usuario ya existe
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  
  if (existingUser) {
    return res.status(400).json({ error: 'El usuario ya existe' });
  }
  
  // Hashear contraseña
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  
  // Crear usuario
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
  
  if (error) throw error;
  
  // Crear token JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email, plan: user.current_plan },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  logger.info(`Nuevo usuario registrado: ${email}`);
  
  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      plan: user.current_plan
    },
    token
  });
}));

// Inicio de sesión
router.post('/login', catchAsync(async (req, res) => {
  const { email, password } = userSchemas.login.parse(req.body);
  
  // Obtener usuario
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error || !user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  
  // Verificar contraseña
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  
  // Crear token JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email, plan: user.current_plan },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  logger.info(`Usuario inició sesión: ${email}`);
  
  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      plan: user.current_plan,
      avatarUrl: user.avatar_url
    },
    token
  });
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

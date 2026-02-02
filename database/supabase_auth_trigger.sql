-- ============================================
-- SUPABASE AUTH -> PUBLIC.USERS SYNC SETUP
-- ============================================
-- Este script automatiza la sincronización de usuarios
-- desde auth.users hacia public.users cuando se registran

-- PASO 1: Hacer password_hash NULLABLE (Supabase Auth maneja la seguridad)
ALTER TABLE public.users 
ALTER COLUMN password_hash DROP NOT NULL;

-- PASO 2: Crear función que maneja nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar automáticamente en public.users cuando se crea en auth.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    current_plan,
    stripe_customer_id,
    stripe_subscription_id,
    subscription_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,                                           -- UUID de auth.users
    NEW.email,                                        -- Email del usuario
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), -- Nombre desde metadata
    'free',                                           -- Plan inicial
    NULL,                                             -- Sin Stripe customer aún
    NULL,                                             -- Sin subscription aún
    NULL,                                             -- Sin status aún
    NOW(),                                            -- Timestamp creación
    NOW()                                             -- Timestamp actualización
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Crear trigger que se dispara DESPUÉS de INSERT en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 4: Verificar que el trigger se creó correctamente
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- NOTA IMPORTANTE:
-- ============================================
-- Después de ejecutar este script, cada vez que un usuario
-- se registre vía Supabase Auth (signUp), automáticamente
-- se creará una fila correspondiente en public.users con:
--   - id: UUID del usuario
--   - email: Email registrado
--   - full_name: Extraído de metadata
--   - current_plan: 'free' (por defecto)
--   - created_at/updated_at: Timestamps automáticos
--
-- TESTING:
-- 1. Registra un nuevo usuario desde el frontend
-- 2. Verifica en: SELECT * FROM public.users ORDER BY created_at DESC;
-- 3. Deberías ver el nuevo usuario automáticamente
-- ============================================

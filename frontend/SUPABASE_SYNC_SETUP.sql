-- ================================================
-- STRIPE SYNC SYSTEM - SUPABASE SETUP
-- ================================================
-- Este script configura las tablas y triggers necesarios
-- para la sincronización automática de packs con Stripe
-- ================================================

-- 1. CREAR TABLA DE COLA DE SINCRONIZACIÓN
-- ================================================

CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID REFERENCES packs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Índices para mejorar rendimiento
  CONSTRAINT unique_pending_pack UNIQUE (pack_id, status)
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_pack_id ON sync_queue(pack_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at);

COMMENT ON TABLE sync_queue IS 'Cola de packs pendientes de sincronización con Stripe';
COMMENT ON COLUMN sync_queue.status IS 'Estado: pending, processing, completed, failed';
COMMENT ON COLUMN sync_queue.attempts IS 'Número de intentos de sincronización (máx 3)';


-- 2. FUNCIÓN: Agregar pack a cola de sincronización
-- ================================================

CREATE OR REPLACE FUNCTION add_pack_to_sync_queue()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo agregar a cola si el pack está publicado
  IF NEW.is_published = true THEN
    -- Insertar en cola (ignorar si ya existe)
    INSERT INTO sync_queue (pack_id, status)
    VALUES (NEW.id, 'pending')
    ON CONFLICT (pack_id, status) DO NOTHING;
    
    RAISE NOTICE 'Pack % agregado a cola de sincronización', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_pack_to_sync_queue() IS 'Agrega un pack a la cola de sincronización cuando se crea o actualiza';


-- 3. TRIGGER: Agregar a cola cuando se CREA un pack
-- ================================================

DROP TRIGGER IF EXISTS pack_created_trigger ON packs;

CREATE TRIGGER pack_created_trigger
AFTER INSERT ON packs
FOR EACH ROW
EXECUTE FUNCTION add_pack_to_sync_queue();

COMMENT ON TRIGGER pack_created_trigger ON packs IS 'Agrega automáticamente nuevos packs a la cola de sincronización';


-- 4. TRIGGER: Re-agregar a cola cuando cambia el PRECIO
-- ================================================

DROP TRIGGER IF EXISTS pack_price_updated_trigger ON packs;

CREATE TRIGGER pack_price_updated_trigger
AFTER UPDATE OF price ON packs
FOR EACH ROW
WHEN (OLD.price IS DISTINCT FROM NEW.price AND NEW.is_published = true)
EXECUTE FUNCTION add_pack_to_sync_queue();

COMMENT ON TRIGGER pack_price_updated_trigger ON packs IS 'Re-sincroniza packs cuando su precio cambia';


-- 5. FUNCIÓN: Limpiar cola de items completados antiguos
-- ================================================

CREATE OR REPLACE FUNCTION cleanup_old_sync_queue_items()
RETURNS void AS $$
BEGIN
  -- Eliminar items completados con más de 30 días
  DELETE FROM sync_queue
  WHERE status = 'completed'
    AND processed_at < NOW() - INTERVAL '30 days';
    
  RAISE NOTICE 'Items antiguos de sync_queue eliminados';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_sync_queue_items() IS 'Limpia items completados con más de 30 días (ejecutar periódicamente)';


-- 6. VERIFICACIÓN: Comprobar que todo está configurado
-- ================================================

-- Verificar que la tabla existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sync_queue') THEN
    RAISE NOTICE '✅ Tabla sync_queue creada correctamente';
  ELSE
    RAISE EXCEPTION '❌ Error: Tabla sync_queue no existe';
  END IF;
END
$$;

-- Verificar triggers
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'pack_created_trigger') THEN
    RAISE NOTICE '✅ Trigger pack_created_trigger configurado';
  ELSE
    RAISE WARNING '⚠️ Trigger pack_created_trigger NO encontrado';
  END IF;
  
  IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'pack_price_updated_trigger') THEN
    RAISE NOTICE '✅ Trigger pack_price_updated_trigger configurado';
  ELSE
    RAISE WARNING '⚠️ Trigger pack_price_updated_trigger NO encontrado';
  END IF;
END
$$;


-- ================================================
-- INSTRUCCIONES DE USO
-- ================================================
/*

1. Ejecuta este script completo en el SQL Editor de Supabase

2. Verifica que los mensajes de verificación muestren ✅

3. Para probar, inserta un pack de prueba:
   
   INSERT INTO packs (name, slug, description, price, is_published)
   VALUES ('Test Pack', 'test-pack', 'Pack de prueba', 29.99, true);

4. Verifica que aparezca en sync_queue:
   
   SELECT * FROM sync_queue WHERE status = 'pending';

5. El cron job de Vercel procesará la cola cada 10 minutos (solo en producción)

6. Para desarrollo local, llama manualmente:
   
   POST http://localhost:3000/api/admin/process-sync-queue

7. Para limpiar items antiguos periódicamente (opcional):
   
   SELECT cleanup_old_sync_queue_items();

*/

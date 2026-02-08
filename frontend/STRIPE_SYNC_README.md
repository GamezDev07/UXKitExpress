# Sistema de Sincronización Stripe-Supabase

Sistema completo de sincronización automática y manual entre packs de Supabase y productos de Stripe.

## 🚀 Instalación Rápida

### 1. Instalar Dependencias

El proyecto ya tiene las dependencias necesarias (`stripe` y `@supabase/supabase-js`). Si necesitas reinstalar:

```bash
cd frontend
npm install stripe @supabase/supabase-js
```

### 2. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```bash
# Ya existentes (verificar que estén configuradas)
NEXT_PUBLIC_SUPABASE_URL=https://jnqjhlyqznwiszlrefzj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# NUEVAS - Requeridas para sincronización
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
STRIPE_SECRET_KEY=sk_test_tu_secret_key_aqui
```

**¿Dónde obtener estas claves?**

- **SUPABASE_SERVICE_ROLE_KEY**: Supabase Dashboard → Settings → API → `service_role` key (⚠️ Mantener secreta)
- **STRIPE_SECRET_KEY**: Stripe Dashboard → Developers → API Keys → Secret key

### 3. Configurar Supabase

Ejecuta el script SQL en Supabase Dashboard → SQL Editor:

```bash
# Abre el archivo y copia todo el contenido
SUPABASE_SYNC_SETUP.sql
```

Esto creará:
- ✅ Tabla `sync_queue` para cola de sincronización
- ✅ Trigger automático cuando se crea un pack
- ✅ Trigger automático cuando cambia el precio
- ✅ Funciones de utilidad

### 4. Verificar Instalación

En desarrollo local:

```bash
cd frontend
npm run dev
```

Navega a: `http://localhost:3000/admin/stripe-sync`

Deberías ver el dashboard de sincronización.

---

## 📋 Uso

### Opción 1: Sincronización Manual

1. Ve a `/admin/stripe-sync`
2. Click en **"Sync All Packs"** ✨
3. Espera el resultado (se mostrará tabla con detalles)

### Opción 2: Sincronización Automática

El sistema funciona automáticamente:

1. **Creas pack en Supabase** → Se agrega a `sync_queue` automáticamente
2. **Cron job cada 10 min** → Procesa la cola (solo en producción)
3. **Pack sincronizado** → Aparece en Stripe Dashboard

---

## 🔧 API Endpoints

### `POST /api/admin/sync-stripe`
Sincroniza todos los packs pendientes manualmente.

**Respuesta:**
```json
{
  "success": true,
  "total": 5,
  "synced": 5,
  "failed": 0,
  "details": [...]
}
```

### `GET /api/admin/sync-stripe`
Obtiene el estado actual de sincronización.

**Respuesta:**
```json
{
  "synced": 10,
  "pending": 2,
  "queue": {
    "pending": 3,
    "failed": 0
  }
}
```

### `POST /api/admin/process-sync-queue`
Procesa la cola de sincronización (llamado por cron job).

---

## ⚙️ Configuración en Producción (Vercel)

### 1. Variables de Entorno en Vercel

En Vercel Dashboard → Settings → Environment Variables, agrega:

```
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
STRIPE_SECRET_KEY=sk_live_tu_key_de_produccion
```

### 2. Cron Job (Automático)

El archivo `vercel.json` ya está configurado:

```json
{
  "crons": [{
    "path": "/api/admin/process-sync-queue",
    "schedule": "*/10 * * * *"
  }]
}
```

**Nota:** Los cron jobs solo funcionan en producción, no en desarrollo local.

---

## 🧪 Testing

### Test 1: Crear Pack en Supabase

```sql
INSERT INTO packs (name, slug, description, price, is_published)
VALUES ('Test Pack Sync', 'test-pack-sync', 'Pack de prueba', 19.99, true);
```

Verifica en `sync_queue`:
```sql
SELECT * FROM sync_queue WHERE status = 'pending';
```

### Test 2: Sincronización Manual

```bash
curl -X POST http://localhost:3000/api/admin/sync-stripe
```

### Test 3: Verificar en Stripe

Ve a [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)

Deberías ver el producto creado con:
- Nombre del pack
- Precio correcto
- Metadata con `packId`

### Test 4: Verificar Estado

```bash
curl http://localhost:3000/api/admin/sync-stripe
```

---

## 🐛 Troubleshooting

### Error: "Configuración del servidor incompleta"

**Solución:** Verifica que todas las variables de entorno estén configuradas en `.env.local`

### Error: "resource_missing" en Stripe

**Causa:** El producto fue eliminado manualmente de Stripe pero Supabase aún tiene el ID.

**Solución:** El sistema recreará automáticamente el producto en la próxima sincronización.

### La cola no se procesa automáticamente

**Causa:** Los cron jobs de Vercel solo funcionan en producción.

**Solución en desarrollo:** Llama manualmente al endpoint:
```bash
curl -X POST http://localhost:3000/api/admin/process-sync-queue
```

### Pack falla la sincronización 3 veces

**Solución:** Revisa los logs en la UI de admin → Verifica el error → Corrige el problema → Ejecuta sync manual

---

## 📊 Monitoreo

### Ver Cola de Sincronización

```sql
SELECT 
  sq.id,
  p.name,
  sq.status,
  sq.attempts,
  sq.error_message,
  sq.created_at
FROM sync_queue sq
JOIN packs p ON p.id = sq.pack_id
ORDER BY sq.created_at DESC;
```

### Ver Packs Sincronizados vs Pendientes

```sql
SELECT 
  COUNT(*) FILTER (WHERE stripe_product_id IS NOT NULL) as sincronizados,
  COUNT(*) FILTER (WHERE stripe_product_id IS NULL) as pendientes
FROM packs
WHERE is_published = true;
```

---

## 🔒 Seguridad

- ✅ `SUPABASE_SERVICE_ROLE_KEY` solo se usa en API routes del servidor
- ✅ `STRIPE_SECRET_KEY` nunca se expone al cliente
- ✅ Todas las operaciones admin requieren claves del servidor
- ✅ Los cron jobs se ejecutan en el servidor de Vercel

---

## 📁 Estructura de Archivos

```
frontend/
├── lib/
│   └── sync-stripe.ts              # Librería de sincronización
├── app/
│   ├── api/
│   │   └── admin/
│   │       ├── sync-stripe/
│   │       │   └── route.ts        # API sincronización manual
│   │       └── process-sync-queue/
│   │           └── route.ts        # API procesamiento de cola
│   └── admin/
│       └── stripe-sync/
│           └── page.tsx            # UI de administración
├── vercel.json                     # Configuración de cron jobs
├── SUPABASE_SYNC_SETUP.sql        # Script SQL para Supabase
└── STRIPE_SYNC_README.md          # Este archivo
```

---

## 🎯 Flujo Completo

```
┌─────────────────────┐
│  Admin crea pack    │
│   en Supabase       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Trigger automático │
│  agrega a cola      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Cron job (10 min)  │
│  procesa cola       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Crea producto y    │
│  precio en Stripe   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Actualiza pack en  │
│  Supabase con IDs   │
└─────────────────────┘
```

---

## 📞 Soporte

Si encuentras algún problema, revisa:
1. Logs en la consola del navegador
2. Logs en terminal de Next.js
3. Logs en Vercel Dashboard (producción)
4. Tabla `sync_queue` en Supabase

---

¡Listo! El sistema de sincronización está completamente configurado y listo para usar. 🎉

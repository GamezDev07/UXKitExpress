# 🚀 Guía de Deployment - UX Kit Express

## 📋 Checklist Pre-Deployment

Antes de hacer deployment, asegúrate de:

- [ ] Todas las credenciales configuradas
- [ ] Base de datos creada y migrada
- [ ] Price IDs de Stripe actualizados
- [ ] Tests básicos pasando
- [ ] Variables de entorno verificadas
- [ ] .gitignore configurado correctamente

---

## 🗄️ Paso 1: Configurar Base de Datos (Supabase)

### 1.1 Ejecutar Script SQL

1. Ve a tu proyecto Supabase: https://app.supabase.com
2. Navega a **SQL Editor**
3. Copia el contenido de `database.sql`
4. Pega en el editor y click **Run**
5. Verifica que se crearon todas las tablas

### 1.2 Verificar Tablas Creadas

En el SQL Editor, ejecuta:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Deberías ver:
- users
- transactions
- products
- downloads
- favorites
- reviews

---

## 💳 Paso 2: Configurar Stripe Completamente

### 2.1 Crear Productos en Stripe

1. Ve a: https://dashboard.stripe.com/test/products
2. Crea 4 productos (uno por plan)

**Plan Basic - $15/mes**
- Click **Add product**
- Nombre: "UX Kit Express - Plan Basic"
- Descripción: "Acceso a componentes básicos"
- Precio recurrente mensual: $15
- Precio recurrente anual: $144
- Guarda ambos Price IDs

**Plan Advance - $49/mes**
- Nombre: "UX Kit Express - Plan Advance"
- Precio mensual: $49
- Precio anual: $470
- Guarda Price IDs

**Plan Pro - $89/mes**
- Nombre: "UX Kit Express - Plan Pro"
- Precio mensual: $89
- Precio anual: $854
- Guarda Price IDs

**Plan Enterprise - $199/mes**
- Nombre: "UX Kit Express - Plan Enterprise"
- Precio mensual: $199
- Precio anual: $1910
- Guarda Price IDs

### 2.2 Actualizar Price IDs en el Código

Edita `backend/src/modules/billing/routes.js`:

```javascript
const PLAN_PRICES = {
  basic: {
    monthly: 'price_XXXXXXXXXXXXX',  // Tu price ID mensual
    yearly: 'price_YYYYYYYYYYYYYYY'   // Tu price ID anual
  },
  advance: {
    monthly: 'price_XXXXXXXXXXXXX',
    yearly: 'price_YYYYYYYYYYYYYYY'
  },
  pro: {
    monthly: 'price_XXXXXXXXXXXXX',
    yearly: 'price_YYYYYYYYYYYYYYY'
  },
  enterprise: {
    monthly: 'price_XXXXXXXXXXXXX',
    yearly: 'price_YYYYYYYYYYYYYYY'
  }
};
```

### 2.3 Obtener Stripe Publishable Key

1. Ve a: https://dashboard.stripe.com/test/apikeys
2. Copia la **Publishable key** (empieza con `pk_test_`)
3. Añádela a `frontend/.env.local`:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXX
```

---

## 🖥️ Paso 3: Deployment del Backend (Render.com)

### 3.1 Preparar Repositorio

1. Crear repositorio en GitHub
2. Añadir `.gitignore` apropiado:

```gitignore
# Backend
node_modules/
.env
logs/
*.log

# Frontend  
.next/
out/
.env.local
```

3. Commit y push:
```bash
git add .
git commit -m "Initial commit - UX Kit Express"
git push origin main
```

### 3.2 Crear Web Service en Render

1. Ve a: https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Conecta tu repositorio de GitHub
4. Configuración:

**Basic Info:**
- Name: `uxkit-express-api`
- Region: Tu región más cercana
- Branch: `main`
- Root Directory: `backend`

**Build & Deploy:**
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `node server.js`

**Environment Variables:**
Añade todas estas:
```
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://jnqjhlyqznwiszlrefzj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXX (usa la de producción)
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXX (obtendrás este después)
JWT_SECRET=894e0ec8553d2185d6ecbfbc35e2f231849bbb68c73e9d3fe92b2a6d6706c1cbe43442d7c2b51129cd6dd4dd81a7e68bf57e97687723fb6f4cbbe38187eb5b73
FRONTEND_URL=https://tu-frontend.vercel.app (actualizarás después)
```

5. Click **Create Web Service**
6. Espera a que se complete el deploy
7. Copia la URL (ej: `https://uxkit-express-api.onrender.com`)

### 3.3 Configurar Webhook en Producción

1. Ve a: https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. URL: `https://uxkit-express-api.onrender.com/api/billing/webhook`
4. Eventos:
   - checkout.session.completed
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
5. Copia el **Signing secret** (empieza con `whsec_`)
6. Actualiza `STRIPE_WEBHOOK_SECRET` en Render

---

## 🌐 Paso 4: Deployment del Frontend (Vercel)

### 4.1 Preparar para Deployment

Actualiza `frontend/.env.local` (luego lo configurarás en Vercel):
```
NEXT_PUBLIC_API_URL=https://uxkit-express-api.onrender.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXX
```

### 4.2 Deploy en Vercel

1. Ve a: https://vercel.com
2. Click **Add New** → **Project**
3. Import tu repositorio de GitHub
4. Configuración:

**Project Settings:**
- Framework Preset: `Next.js`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `.next`

**Environment Variables:**
Añade:
```
NEXT_PUBLIC_API_URL=https://uxkit-express-api.onrender.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXX
```

5. Click **Deploy**
6. Espera a que termine el deploy
7. Copia la URL (ej: `https://uxkit-express.vercel.app`)

### 4.3 Actualizar CORS en Backend

1. Ve a Render.com → tu servicio
2. Actualiza la variable `FRONTEND_URL`:
```
FRONTEND_URL=https://uxkit-express.vercel.app
```
3. El servicio se reiniciará automáticamente

---

## ✅ Paso 5: Verificación Post-Deployment

### 5.1 Verificar Backend

```bash
# Health check
curl https://uxkit-express-api.onrender.com/api/health

# Debe retornar:
{
  "status": "healthy",
  "service": "UX-Kit Express API",
  "version": "1.0.0",
  ...
}
```

### 5.2 Verificar Frontend

1. Visita: `https://tu-frontend.vercel.app`
2. Prueba registrar un usuario
3. Prueba iniciar sesión
4. Verifica que no hay errores en Console

### 5.3 Probar Flujo Completo de Pago

1. Ir a la página de pricing
2. Seleccionar un plan
3. Completar checkout con tarjeta de prueba de Stripe:
   - Número: `4242 4242 4242 4242`
   - Fecha: Cualquier fecha futura
   - CVC: Cualquier 3 dígitos
4. Verificar que:
   - El webhook se recibe correctamente
   - El plan se actualiza en la base de datos
   - El usuario ve su plan actualizado

---

## 📊 Paso 6: Monitoreo

### 6.1 Configurar Logs en Render

1. Ve a tu servicio en Render
2. Click en **Logs**
3. Verifica que no hay errores

### 6.2 Configurar Logs en Vercel

1. Ve a tu proyecto en Vercel
2. Click **Logs**
3. Monitorea errores

### 6.3 Monitoreo de Stripe

1. Ve a: https://dashboard.stripe.com/logs
2. Verifica webhooks exitosos
3. Revisa cualquier error

---

## 🔒 Paso 7: Seguridad en Producción

### 7.1 Checklist de Seguridad

- [ ] Variables de entorno en producción (NO en código)
- [ ] HTTPS habilitado (Vercel y Render lo hacen automáticamente)
- [ ] CORS configurado correctamente
- [ ] Rate limiting activado
- [ ] Contraseñas con hash (bcrypt)
- [ ] JWT con expiración
- [ ] Validación de inputs con Zod
- [ ] RLS habilitado en Supabase

### 7.2 Rotar JWT Secret (Recomendado)

Genera un nuevo JWT_SECRET para producción:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Actualiza en Render.

---

## 🚨 Troubleshooting

### Error: "CORS policy blocked"
**Solución:** Verifica que FRONTEND_URL en backend apunta a tu dominio de Vercel

### Error: "Webhook signature failed"
**Solución:** Verifica que STRIPE_WEBHOOK_SECRET es el correcto para producción

### Error: "Cannot connect to database"
**Solución:** Verifica las credenciales de Supabase

### Error 500 en el backend
**Solución:** Revisa los logs en Render

### Frontend no carga
**Solución:** Verifica las variables de entorno en Vercel

---

## 📈 Paso 8: Post-Launch

### Cosas por hacer después del deployment:

1. **Analytics**
   - Configurar Google Analytics
   - Añadir tracking de conversiones

2. **SEO**
   - Añadir meta tags
   - Configurar sitemap
   - robots.txt

3. **Emails**
   - Configurar servicio de emails (SendGrid, Mailgun)
   - Emails de bienvenida
   - Emails de recuperación de contraseña
   - Receipts de pagos

4. **Monitoreo**
   - Configurar Sentry para errores
   - Uptime monitoring (UptimeRobot)
   - Performance monitoring

5. **Backups**
   - Configurar backups de Supabase
   - Exportar datos regularmente

---

## 🎯 URLs Finales

Después del deployment, tendrás:

- **Frontend:** https://tu-dominio.vercel.app
- **Backend:** https://tu-api.onrender.com
- **API Docs:** https://tu-api.onrender.com/api/health
- **Stripe Dashboard:** https://dashboard.stripe.com

---

## 📝 Notas Importantes

1. **Render Sleep:** 
   - El tier gratuito de Render "duerme" después de inactividad
   - Primera request después de dormir toma ~30 segundos
   - Considera upgrade a plan pagado para producción

2. **Vercel Bandwidth:**
   - El tier gratuito tiene límites de bandwidth
   - Monitorea uso si esperas mucho tráfico

3. **Stripe Testing vs Production:**
   - Usa keys de test durante desarrollo
   - Cambia a keys de producción para lanzamiento
   - NUNCA mezcles test y production keys

4. **Supabase Quotas:**
   - Tier gratuito: 500MB storage, 2GB bandwidth/mes
   - Monitorea uso en dashboard

---

## ✅ Checklist Final

Antes de considerarlo "lanzado":

- [ ] Backend deployado y funcionando
- [ ] Frontend deployado y funcionando
- [ ] Base de datos migrada
- [ ] Stripe configurado (productos, webhook)
- [ ] CORS configurado correctamente
- [ ] Variables de entorno en producción
- [ ] Flujo de registro probado
- [ ] Flujo de login probado
- [ ] Flujo de pago probado end-to-end
- [ ] Logs monitoreados (sin errores)
- [ ] Dominio personalizado (opcional)
- [ ] SSL/HTTPS habilitado
- [ ] Tests de carga básicos
- [ ] Plan de backups

---

¡Tu aplicación está lista para el mundo! 🚀

Para soporte, revisa:
- Logs de Render: https://dashboard.render.com
- Logs de Vercel: https://vercel.com
- Logs de Stripe: https://dashboard.stripe.com/logs
- Logs de Supabase: https://app.supabase.com

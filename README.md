# UX-Kit Express - Proyecto Corregido y Configurado

## 🎉 ¡Tu proyecto está listo!

Este es tu proyecto UX-Kit Express con todas las correcciones implementadas y las credenciales configuradas.

## ✅ Correcciones Implementadas

### Backend
- ✅ Webhook de Stripe funcionando correctamente
- ✅ Todas las rutas conectadas (auth y billing)
- ✅ Middleware de autenticación en todas las rutas protegidas
- ✅ Variables de entorno configuradas con tus credenciales
- ✅ Sistema de logging con Winston
- ✅ Manejo centralizado de errores
- ✅ Validaciones mejoradas con Zod
- ✅ Configuración de Supabase corregida

### Frontend
- ✅ AuthContext implementado
- ✅ Páginas de login y signup creadas
- ✅ globals.css creado
- ✅ Configuración de path aliases (@/)
- ✅ Componente ProtectedRoute
- ✅ Variables de entorno configuradas

## 📦 Instalación

### 1. Backend

```bash
cd backend
npm install
```

### 2. Frontend

```bash
cd frontend
npm install
```

## 🚀 Iniciar el Proyecto

### Desarrollo

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

El backend estará en: http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

El frontend estará en: http://localhost:3000

### Producción

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## 🔑 Credenciales Configuradas

### Backend (.env)
- ✅ SUPABASE_URL
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ STRIPE_SECRET_KEY
- ✅ STRIPE_WEBHOOK_SECRET
- ✅ JWT_SECRET

### Frontend (.env.local)
- ⚠️ **FALTA:** NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  - Debes obtener tu clave pública de Stripe y agregarla

## ⚙️ Configuración de Stripe

### 1. Crear Productos en Stripe Dashboard

Ve a https://dashboard.stripe.com/test/products y crea estos productos:

1. **Plan Basic**
   - Precio mensual: $15
   - Precio anual: $144 (20% descuento)

2. **Plan Advance**
   - Precio mensual: $49
   - Precio anual: $470 (20% descuento)

3. **Plan Pro**
   - Precio mensual: $89
   - Precio anual: $854 (20% descuento)

4. **Plan Enterprise**
   - Precio mensual: $199
   - Precio anual: $1910 (20% descuento)

### 2. Actualizar Price IDs

Una vez creados los productos, copia los Price IDs y actualízalos en:
`backend/src/modules/billing/routes.js` líneas 14-29

```javascript
const PLAN_PRICES = {
  basic: {
    monthly: 'price_XXXXX',  // Reemplazar
    yearly: 'price_YYYYY'    // Reemplazar
  },
  // ... resto de planes
};
```

### 3. Configurar Webhook en Stripe

1. Ve a https://dashboard.stripe.com/test/webhooks
2. Click en "Add endpoint"
3. URL del endpoint: `http://localhost:3001/api/billing/webhook` (desarrollo)
   - Para producción: `https://tu-dominio.com/api/billing/webhook`
4. Selecciona estos eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. El webhook secret ya está configurado en tu .env

## 🗄️ Base de Datos (Supabase)

### Tablas necesarias:

#### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  current_plan TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Ejecutar en Supabase SQL Editor:

1. Ve a tu proyecto Supabase
2. SQL Editor
3. Copia y pega las queries de arriba
4. Click en "Run"

## 🧪 Probar la Aplicación

### 1. Registrar un Usuario

1. Ir a http://localhost:3000/signup
2. Crear cuenta con:
   - Nombre: Tu nombre
   - Email: tu@email.com
   - Contraseña: Debe tener mayúsculas, minúsculas, números y caracteres especiales

### 2. Iniciar Sesión

1. Ir a http://localhost:3000/login
2. Usar las credenciales creadas

### 3. Probar Webhook de Stripe

Para probar localmente:

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks a tu servidor local
stripe listen --forward-to localhost:3001/api/billing/webhook
```

## 📁 Estructura del Proyecto

```
UX_Kit_Express_Fixed/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── stripe.js
│   │   │   └── supabase.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   └── routes.js
│   │   │   └── billing/
│   │   │       └── routes.js
│   │   └── utils/
│   │       ├── logger.js
│   │       └── validations.js
│   ├── logs/
│   ├── .env (con tus credenciales)
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/
    │   │   │   └── page.jsx
    │   │   └── signup/
    │   │       └── page.jsx
    │   ├── components/
    │   │   └── ProtectedRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── globals.css
    │   ├── layout.jsx
    │   └── page.jsx
    ├── .env.local
    ├── jsconfig.json
    ├── next.config.js
    ├── package.json
    └── tailwind.config.js
```

## 🛠️ Scripts Disponibles

### Backend
```bash
npm run dev       # Modo desarrollo con nodemon
npm start         # Modo producción
npm test          # Ejecutar tests
npm run lint      # Linter
```

### Frontend
```bash
npm run dev       # Modo desarrollo
npm run build     # Build para producción
npm start         # Servidor producción
npm run lint      # Linter
```

## 🔐 Seguridad

### Importante antes de deployment:

1. **Backend (.env)**
   - ❌ NUNCA commitear el archivo .env
   - ✅ Usar variables de entorno en producción
   - ✅ Cambiar JWT_SECRET a uno más largo en producción
   - ✅ NODE_ENV=production

2. **Frontend**
   - ❌ NUNCA exponer claves secretas en el frontend
   - ✅ Solo usar NEXT_PUBLIC_ para claves públicas
   - ✅ Verificar CORS en producción

## 📊 Endpoints Disponibles

### Auth
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil (requiere auth)
- `PATCH /api/auth/profile` - Actualizar perfil (requiere auth)

### Billing
- `POST /api/billing/create-checkout-session` - Crear sesión de pago (requiere auth)
- `POST /api/billing/webhook` - Webhook de Stripe (público)
- `GET /api/billing/subscription` - Obtener suscripción (requiere auth)
- `POST /api/billing/cancel-subscription` - Cancelar suscripción (requiere auth)
- `POST /api/billing/create-portal-session` - Portal de cliente (requiere auth)

### Health
- `GET /api/health` - Estado del servidor

## 🐛 Debugging

### Ver logs del backend:
```bash
# Ver logs en tiempo real
tail -f backend/logs/combined.log

# Ver solo errores
tail -f backend/logs/error.log
```

### Verificar conexión a Supabase:
```bash
curl -X GET \
  'https://jnqjhlyqznwiszlrefzj.supabase.co/rest/v1/' \
  -H "apikey: TU_ANON_KEY"
```

### Verificar webhook de Stripe:
```bash
stripe webhooks list
```

## 📝 Próximos Pasos Recomendados

1. ✅ Configurar los Price IDs de Stripe
2. ✅ Crear las tablas en Supabase
3. ✅ Obtener y configurar Stripe Publishable Key
4. ⏭️ Crear página de dashboard
5. ⏭️ Crear página de pricing con checkout
6. ⏭️ Implementar catálogo de componentes/recursos
7. ⏭️ Añadir sistema de búsqueda
8. ⏭️ Implementar preview de componentes
9. ⏭️ Añadir tests

## 🚨 Problemas Comunes

### "Cannot find module '@/app/context/AuthContext'"
- Solución: Verifica que jsconfig.json existe en frontend/

### "JWT_SECRET is not defined"
- Solución: Asegúrate de que el archivo .env existe en backend/

### "Webhook signature verification failed"
- Solución: Verifica que STRIPE_WEBHOOK_SECRET es correcto

### "CORS error"
- Solución: Verifica que FRONTEND_URL en backend/.env apunta a tu frontend

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `backend/logs/combined.log`
2. Verifica las variables de entorno
3. Asegúrate de que ambos servidores están corriendo
4. Verifica la consola del navegador para errores del frontend

## 🎯 Estado del Proyecto

- ✅ Backend completamente funcional
- ✅ Autenticación implementada
- ✅ Billing con Stripe configurado
- ✅ Frontend con login/signup
- ⏳ Dashboard (pendiente)
- ⏳ Catálogo de recursos (pendiente)
- ⏳ Sistema de búsqueda (pendiente)

---

**¡Tu proyecto está listo para desarrollar! 🚀**

Cualquier duda, revisa este README o los comentarios en el código.

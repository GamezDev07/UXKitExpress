# Backend Deployment - Render Configuration

## Environment Variables (Render Dashboard)

Add these in Render → Dashboard → Your Service → Environment:

```
PORT=3001
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application Configuration  
FRONTEND_URL=https://uxkitexpress.vercel.app
JWT_SECRET=generate_secure_random_string_min_64_chars
```

## How to Get Your Keys

### Supabase Keys
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy Project URL, anon/public key, and service_role key

### Stripe Keys
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_`)
3. For webhook secret:
   - Go to Developers → Webhooks
   - Add endpoint: `https://uxkitexpress.onrender.com/api/billing/webhook`
   - Copy the signing secret (starts with `whsec_`)

### JWT Secret
Generate a secure random string (minimum 64 characters):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## IMPORTANT: After updating environment variables
1. Redeploy the backend in Render
2. Wait for deployment to complete (3-5 minutes)
3. Test the endpoint: https://uxkitexpress.onrender.com/health

## CORS Configuration
The backend accepts requests from:
- http://localhost:3000 (development)
- https://uxkitexpress.vercel.app (production)
- Any custom FRONTEND_URL set in environment

## Available Endpoints
- GET /health - Health check
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/auth/profile - Get user profile (requires auth)
- POST /api/billing/create-checkout-session - Create Stripe checkout
- POST /api/billing/webhook - Stripe webhook handler
- POST /api/contact - Contact form submission

## Security Notes
- **NEVER** commit real API keys to git
- **NEVER** share service_role keys publicly  
- Use test keys for development
- Rotate keys immediately if accidentally exposed

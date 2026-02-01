# Backend API Routes Documentation

## Base URL
- **Production**: https://uxkitexpress.onrender.com
- **Development**: http://localhost:3001

## Status Endpoints

### GET /
Quick server status check
```json
{
  "status": "Backend activo",
  "service": "UX Kit Express API",
  "version": "1.0.0",
  "endpoints": { ...available routes }
}
```

### GET /api/health
Detailed health check
```json
{
  "status": "healthy",
  "service": "UX-Kit Express API",
  "timestamp": "2026-01-31T...",
  "environment": "production"
}
```

## Authentication Endpoints (/ api/auth)

### POST /api/auth/register
Register a new user
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "fullName": "User Name"
}
```
**Response:** `{ user, token }`

### POST /api/auth/login
User login
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```
**Response:** `{ user, token }`

### GET /api/auth/profile
Get user profile (requires auth token)
**Headers:** `Authorization: Bearer <token>`
**Response:** `{ user }`

## Billing Endpoints (/api/billing)

### POST /api/billing/create-checkout-session
Create Stripe checkout session (requires auth)
```json
{
  "priceId": "price_xxx"
}
```
**Response:** `{ url }`

### POST /api/billing/webhook
Stripe webhook handler (Stripe-only)

### GET /api/billing/subscription
Get user subscription details (requires auth)

## Contact Endpoint

### POST /api/contact
Submit contact form
```json
{
  "name": "Name",
  "email": "email@example.com",
  "subject": "Subject",
  "message": "Message text"
}
```

## Error Responses

### 404 Not Found
```json
{
  "error": "Ruta no encontrada",
  "path": "/requested/path"
}
```

### 401 Unauthorized
```json
{
  "error": "Token no válido o expirado"
}
```

### 400 Bad Request
```json
{
  "error": "Description of validation error"
}
```

## Frontend Integration

### Environment Variable
```
NEXT_PUBLIC_API_URL=https://uxkitexpress.onrender.com
```

### Example Fetch
```javascript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email, password, fullName })
})
```

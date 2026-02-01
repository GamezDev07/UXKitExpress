# Vercel Deployment Configuration

## Environment Variables Setup

Configure these in Vercel Dashboard → Project Settings → Environment Variables:

### Required Variables

```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Optional Variables

```
NEXT_PUBLIC_BUILD_ID=v1.0.0
NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
```

## Deployment Checklist

1. ✅ Push code to GitHub
2. ✅ Configure environment variables in Vercel
3. ✅ Deploy from Vercel dashboard
4. ✅ Check build indicator on homepage (bottom-right)
5. ✅ Test signup/login flow
6. ✅ Remove BUILD_ID after verification

## Troubleshooting

If changes don't reflect:
- Clear Vercel cache and redeploy
- Verify environment variables are set
- Check build logs for errors
- Ensure NEXT_PUBLIC_API_URL points to deployed backend

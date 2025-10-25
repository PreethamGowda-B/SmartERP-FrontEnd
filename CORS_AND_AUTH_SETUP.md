# CORS & Authentication Setup Guide

## Problem Summary
Your frontend (Vercel) and backend (Render) were experiencing CORS and authentication issues because:
- Frontend used localStorage-based mock auth (no real HTTP cookies)
- Backend expected httpOnly cookies from authenticated requests
- Cookies weren't being sent/received properly across domains

## Solution Overview
The fix bridges your frontend's localStorage auth with your backend's cookie-based auth:

1. **Frontend** → Calls backend `/api/auth/login` endpoint
2. **Backend** → Sets httpOnly cookie in response
3. **Browser** → Automatically stores the cookie
4. **Subsequent requests** → Include cookie via `credentials: "include"`
5. **Backend** → Validates cookie and returns data

## Frontend Changes

### 1. Updated `lib/auth.ts`
- `signIn()` now calls `POST /api/auth/login` on your backend
- `signUp()` now calls `POST /api/auth/signup` on your backend
- `signOut()` now calls `POST /api/auth/logout` on your backend
- Falls back to mock auth if backend is unavailable

### 2. Updated `lib/apiClient.ts`
- All API requests now include `credentials: "include"`
- Handles 401 responses by attempting token refresh
- Properly propagates errors

### 3. Updated `app/employee/jobs/page.tsx`
- Now uses `apiClient()` instead of raw `fetch()`
- Automatically handles credentials and error handling

## Backend Requirements

Your Express backend needs these configurations:

### 1. CORS Configuration
\`\`\`javascript
const cors = require('cors');

app.use(cors({
  origin: "https://smart-erp-front-end.vercel.app", // Your Vercel URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
\`\`\`

### 2. Cookie Settings
When setting cookies, use:
\`\`\`javascript
res.cookie("access_token", token, {
  httpOnly: true,      // ✅ Prevents JS access (security)
  secure: true,        // ✅ HTTPS only
  sameSite: "none",    // ✅ Cross-site requests (required for Vercel→Render)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
\`\`\`

### 3. Required Endpoints
Your backend must have these endpoints:

#### POST `/api/auth/login`
\`\`\`javascript
// Request body:
{ email: string, password: string }

// Response:
{ user: { id, email, name, role, ... } }

// Sets httpOnly cookie with access_token
\`\`\`

#### POST `/api/auth/signup`
\`\`\`javascript
// Request body:
{ email, password, name, role, phone?, position?, department? }

// Response:
{ user: { id, email, name, role, ... } }

// Sets httpOnly cookie with access_token
\`\`\`

#### POST `/api/auth/logout`
\`\`\`javascript
// Clears the access_token cookie
res.clearCookie("access_token", { 
  httpOnly: true, 
  secure: true, 
  sameSite: "none" 
});
\`\`\`

#### POST `/api/auth/refresh`
\`\`\`javascript
// Validates current cookie and returns new token if needed
// Used for automatic token refresh on 401 responses
\`\`\`

#### GET `/jobs` (or any protected endpoint)
\`\`\`javascript
// Middleware should verify the access_token cookie
// Return 401 if cookie is invalid/missing
\`\`\`

## Environment Variables

### Frontend (.env.local or Vercel)
\`\`\`
NEXT_PUBLIC_API_URL=https://smarterp-backendend.onrender.com
\`\`\`

### Backend (.env)
\`\`\`
FRONTEND_URL=https://smart-erp-front-end.vercel.app
NODE_ENV=production
\`\`\`

## Testing the Fix

### 1. Test Login Flow
\`\`\`bash
# Open browser DevTools → Application → Cookies
# 1. Go to https://smart-erp-front-end.vercel.app/auth/login
# 2. Sign in with credentials
# 3. Check if "access_token" cookie appears for smarterp-backendend.onrender.com
# 4. Should redirect to /employee/jobs
\`\`\`

### 2. Test API Requests
\`\`\`bash
# In browser console:
fetch('https://smarterp-backendend.onrender.com/jobs', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)

# Should return jobs array (not 401 error)
\`\`\`

### 3. Check CORS Headers
\`\`\`bash
# In browser DevTools → Network tab
# Click on /jobs request
# Response headers should include:
# Access-Control-Allow-Origin: https://smart-erp-front-end.vercel.app
# Access-Control-Allow-Credentials: true
\`\`\`

## Common Issues & Fixes

### Issue: "CORS error" or "Failed to fetch"
**Cause**: Backend CORS not configured for Vercel URL
**Fix**: Update backend CORS to include `https://smart-erp-front-end.vercel.app`

### Issue: "401 Unauthorized"
**Cause**: Cookie not being sent or backend not validating it
**Fix**: 
1. Verify `credentials: "include"` is set in fetch
2. Verify backend is setting cookie with `sameSite: "none"`
3. Check browser DevTools → Application → Cookies

### Issue: Cookie not appearing in browser
**Cause**: Backend not setting cookie or using wrong settings
**Fix**: Verify backend response includes:
\`\`\`
Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=None
\`\`\`

### Issue: "Cookie not sent on cross-site request"
**Cause**: Missing `sameSite: "none"` or `secure: true`
**Fix**: Update backend cookie settings to:
\`\`\`javascript
res.cookie("access_token", token, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
});
\`\`\`

## Deployment Checklist

- [ ] Backend CORS configured for `https://smart-erp-front-end.vercel.app`
- [ ] Backend cookies use `sameSite: "none"` and `secure: true`
- [ ] Frontend `NEXT_PUBLIC_API_URL` set to `https://smarterp-backendend.onrender.com`
- [ ] Backend `/api/auth/login` endpoint implemented
- [ ] Backend `/api/auth/signup` endpoint implemented
- [ ] Backend `/api/auth/logout` endpoint implemented
- [ ] Backend `/api/auth/refresh` endpoint implemented
- [ ] All protected endpoints validate the `access_token` cookie
- [ ] Test login flow in production URLs
- [ ] Test API requests with credentials in DevTools

## Additional Resources

- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express CORS Package](https://github.com/expressjs/cors)
- [SameSite Cookie Explained](https://web.dev/samesite-cookies-explained/)

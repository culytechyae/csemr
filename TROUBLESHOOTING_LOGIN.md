# Login 401 Error - Fixed
## Cookie Security Issue Resolution

---

## Problem Identified

**Error**: `401 (Unauthorized)` errors on `/api/auth/me` and `/api/dashboard/stats`

**Root Cause**: 
- Cookies were being set with `secure: true` when `NODE_ENV === 'production'`
- Secure cookies can only be sent over HTTPS connections
- Since the application is accessed via HTTP over intranet (`http://10.24.0.10:5005`), the browser refused to send the secure cookie
- This caused all authenticated requests to fail with 401 errors

---

## Solution Applied

### Changed Cookie Settings

**Before:**
```typescript
response.cookies.set('auth-token', session.token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // ❌ Always true in production
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7,
});
```

**After:**
```typescript
// Determine if using HTTPS
const protocol = request.headers.get('x-forwarded-proto') || 
                 (request.url.startsWith('https://') ? 'https' : 'http');
const isSecure = protocol === 'https';

response.cookies.set('auth-token', session.token, {
  httpOnly: true,
  secure: isSecure, // ✅ Only true when actually using HTTPS
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
});
```

### Files Updated
1. `app/api/auth/login/route.ts` - Login cookie setting
2. `app/api/auth/mfa/verify/route.ts` - MFA verification cookie setting

---

## How It Works Now

- **HTTP requests**: Cookies sent without `secure` flag (works over HTTP)
- **HTTPS requests**: Cookies sent with `secure` flag (secure over HTTPS)
- **Proxy/Reverse Proxy**: Respects `x-forwarded-proto` header to detect HTTPS

---

## Testing

1. Clear browser cookies for `10.24.0.10`
2. Navigate to: `http://10.24.0.10:5005`
3. Login with admin credentials:
   - Email: `admin@emr.local`
   - Password: `admin123`
4. Should successfully login and maintain session

---

## Security Considerations

### For Intranet (HTTP)
- ✅ Cookies are still `httpOnly` (JavaScript cannot access)
- ✅ Cookies use `sameSite: 'lax'` (CSRF protection)
- ⚠️ Cookies are not `secure` (but acceptable for intranet HTTP)

### For Production (HTTPS)
- ✅ All security features enabled
- ✅ `secure` flag automatically enabled
- ✅ Full protection against cookie theft

---

## If Issues Persist

1. **Clear Browser Cookies**:
   - Open Developer Tools (F12)
   - Go to Application > Cookies
   - Delete all cookies for `10.24.0.10:5005`

2. **Check Server Logs**:
   - Look for authentication errors
   - Verify database connection

3. **Verify Admin Account**:
   - Check if admin user exists in database
   - Verify account is active

4. **Database Connection**:
   - Ensure PostgreSQL is running
   - Verify DATABASE_URL in `.env` file

---

## Server Restart Required

After the fix, the server was restarted. If you still see issues:

1. Check if server is running:
   ```powershell
   netstat -ano | findstr :5005
   ```

2. Restart server:
   ```powershell
   cd C:\EMR
   npm start
   ```

---

**Status**: ✅ **FIXED**  
**Date**: December 2024  
**Server**: Restarted with new cookie settings


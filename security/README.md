# Security Module

This directory contains all security-related functionality for the School Clinic EMR system, organized for easy management and maintenance.

## Directory Structure

```
security/
├── config/          # Security configuration and policies
├── middleware/      # Security middleware (rate limiting, headers, CSRF, etc.)
├── utils/           # Security utility functions
├── audit/           # Audit logging system
└── monitoring/      # Security monitoring and alerting
```

## Features Implemented

### 1. Password Security (`config/password-policy.ts`, `utils/password.ts`)
- **Password Complexity**: Enforces minimum length, uppercase, lowercase, numbers, and special characters
- **Password History**: Prevents reuse of last 5 passwords
- **Password Expiration**: Passwords expire after 90 days
- **Password Validation**: Validates passwords against policy before saving

### 2. Account Lockout (`utils/account-lockout.ts`)
- **Failed Login Tracking**: Tracks failed login attempts per user
- **Automatic Lockout**: Locks account after 5 failed attempts for 30 minutes
- **Login Attempt Logging**: Logs all login attempts (success and failure)
- **Account Unlock**: Manual unlock capability for administrators

### 3. Session Management (`utils/session-manager.ts`)
- **Session Timeout**: 30 minutes of inactivity
- **Concurrent Session Limits**: Maximum 3 concurrent sessions per user
- **Session Revocation**: Ability to revoke individual or all user sessions
- **Session Tracking**: Tracks IP address and user agent for each session

### 4. Audit Logging (`audit/audit-logger.ts`)
- **Comprehensive Logging**: Logs all security-relevant events
- **Data Access Logging**: Tracks who accessed what data and when
- **Data Modification Logging**: Tracks all changes with before/after values
- **Security Event Logging**: Dedicated logging for security events

### 5. Rate Limiting (`middleware/rate-limiter.ts`)
- **Login Rate Limiting**: 5 attempts per 15 minutes
- **API Rate Limiting**: Configurable rate limits for API endpoints
- **IP-based Tracking**: Tracks rate limits by IP address and user ID

### 6. Security Headers (`middleware/security-headers.ts`)
- **Content Security Policy (CSP)**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Strict-Transport-Security**: Enforces HTTPS in production
- **Referrer-Policy**: Controls referrer information

### 7. CSRF Protection (`middleware/csrf-protection.ts`)
- **Token Generation**: Generates unique CSRF tokens
- **Token Validation**: Validates tokens on state-changing requests
- **Cookie-based Storage**: Secure storage of CSRF tokens

### 8. Input Sanitization (`middleware/input-sanitizer.ts`)
- **XSS Prevention**: Removes script tags and event handlers
- **HTML Escaping**: Escapes HTML entities
- **Input Validation**: Validates email and phone formats
- **Recursive Sanitization**: Sanitizes nested objects and arrays

### 9. Security Monitoring (`monitoring/security-monitor.ts`)
- **Suspicious Activity Detection**: Detects brute force attempts
- **Account Compromise Alerts**: Alerts on multiple failed login attempts
- **Password Expiration Alerts**: Alerts on expired passwords
- **Security Event Logging**: Logs all security alerts

## Database Models

### New Security Models

1. **PasswordHistory**: Stores password history to prevent reuse
2. **LoginAttempt**: Logs all login attempts (success and failure)
3. **SecurityEvent**: Dedicated table for security events
4. **Enhanced User Model**: Added security fields (password expiration, lockout, etc.)
5. **Enhanced Session Model**: Added IP tracking and activity monitoring

## API Endpoints

### Security Endpoints

- `POST /api/auth/change-password` - Change user password with validation
- `GET /api/security/events` - View security events (Admin only)
- `GET /api/security/alerts` - Get security alerts (Admin only)
- `GET /api/audit-logs` - View audit logs (Admin only)

## Usage Examples

### Password Change
```typescript
import { changePassword } from '@/security/utils/password';

const result = await changePassword(userId, currentPassword, newPassword);
if (result.success) {
  // Password changed successfully
}
```

### Audit Logging
```typescript
import { logDataAccess, logDataModification } from '@/security/audit/audit-logger';

await logDataAccess(userId, 'Student', studentId, 'READ', request);
await logDataModification(userId, 'Student', studentId, 'UPDATE', oldData, newData, request);
```

### Rate Limiting
```typescript
import { loginRateLimit } from '@/security/middleware/rate-limiter';

const rateLimitResponse = loginRateLimit(request);
if (rateLimitResponse) {
  return rateLimitResponse; // Rate limit exceeded
}
```

## Configuration

All security policies can be configured in `security/config/password-policy.ts`:

```typescript
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90, // days
  historyCount: 5,
  lockoutAttempts: 5,
  lockoutDuration: 30, // minutes
};
```

## Compliance

This security implementation addresses requirements from:
- Malaffi Security Assessment Template v3
- Malaffi Key Compliance Checklist v3
- Healthcare data protection standards
- HIPAA security requirements (where applicable)

## Maintenance

### Regular Tasks

1. **Cleanup Expired Sessions**: Run `cleanupExpiredSessions()` periodically
2. **Monitor Security Events**: Review `/api/security/events` regularly
3. **Review Audit Logs**: Check `/api/audit-logs` for suspicious activity
4. **Update Security Policies**: Adjust policies in `security/config/` as needed

### Monitoring

- Check security alerts daily: `GET /api/security/alerts`
- Review failed login attempts: Check `LoginAttempt` table
- Monitor locked accounts: Check `User.lockedUntil` field
- Review password expirations: Check `User.passwordExpiresAt` field

## Security Best Practices

1. **Never log passwords**: Passwords are never logged, only hashed
2. **Use HTTPS in production**: Enforced via HSTS header
3. **Regular security audits**: Review security events weekly
4. **Keep dependencies updated**: Regularly update npm packages
5. **Monitor for suspicious activity**: Use security monitoring alerts


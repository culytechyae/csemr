# Taaleem CS EMR — Backend Design

> Document version: 1.0 · Last updated: February 2026

---

## 1. Runtime & Framework

| Component | Detail |
|-----------|--------|
| **Runtime** | Node.js (via Next.js built-in server) |
| **Framework** | Next.js 14.2.x (App Router) |
| **Language** | TypeScript 5.3.x (strict mode) |
| **Process Manager** | PM2 (cluster mode, all CPU cores) |
| **Port** | 8000 (bound to `0.0.0.0` for network access) |

The backend runs as a **monolithic Next.js application**. All server-side logic is implemented as Next.js Route Handlers inside `app/api/`. There is no separate Express or Fastify server.

---

## 2. Core Libraries (`lib/`)

### 2.1 Prisma Client (`lib/prisma.ts`)

- **Singleton pattern**: Uses `globalThis` to prevent multiple Prisma instances in development (Next.js hot-reload creates new module scopes).
- **Connection pooling**: Configured via `DATABASE_URL` query params (`connection_limit`, `pool_timeout`).
- **Logging**: `['query', 'error', 'warn']` in development, `['error']` in production.

```typescript
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
```

### 2.2 Authentication (`lib/auth.ts`)

Provides 4 key exports:

| Function | Purpose |
|----------|---------|
| `generateToken(user)` | Creates a signed JWT (7-day expiry) containing `id`, `email`, `role`, `schoolId` |
| `verifyToken(token)` | Decodes JWT, validates Session in DB, checks user is active and not locked |
| `getAuthUser(request)` | Reads `auth-token` cookie → calls `verifyToken` |
| `requireAuth(handler)` | HOF wrapper that returns 401 if not authenticated |
| `requireRole(...roles)(handler)` | HOF wrapper that returns 403 if user's role is not in the allowed list |

**Token storage**: JWT is set as an HTTP-only cookie named `auth-token` by the login endpoint. The browser sends it automatically with every request.

**Session validation**: Every API call verifies the token AND checks the `Session` record in the database to ensure it's still active and not expired. This allows server-side session revocation.

### 2.3 HL7 Message Builder (`lib/hl7.ts`)

A class-based builder (`HL7MessageBuilder`) that constructs HL7 v2.5.1 compliant messages:

| Method | Segment | Purpose |
|--------|---------|---------|
| `buildMSH(messageType)` | MSH | Message header with sending/receiving facility, timestamp, version |
| `buildEVN(eventType, date)` | EVN | Event type and recorded date/time |
| `buildPID(student)` | PID | Patient identification (name, DOB, gender, Emirates ID, nationality) |
| `buildPV1(visit, school)` | PV1 | Patient visit (class, attending doctor, facility, admit date) |
| `buildPV2(visit)` | PV2 | Additional visit info (chief complaint) |
| `buildOBX(...)` | OBX | Observation/result (vitals, assessments) |
| `buildDG1(diagnosis)` | DG1 | Diagnosis segment |
| `buildAL1(allergies)` | AL1 | Allergy segment |
| `toString()` | — | Joins all segments with `\r` (CR) delimiter |

**HL7 message types generated:**

| Type | Trigger Event | When Generated |
|------|--------------|----------------|
| ADT^A01 | Admit | New clinical visit created |
| ADT^A03 | Discharge | Visit completed/closed |
| ADT^A04 | Register | Student registered at clinic |
| ADT^A08 | Update | Patient demographics updated |
| ORU^R01 | Results | Assessment/vitals recorded |

**Per-school configuration**: Each school has a `SchoolHL7Config` record with facility codes, sending/receiving application names, auto-send flags, and environment (test/production).

### 2.4 Email Service (`lib/email.ts`)

- **Transport**: Nodemailer with SMTP configuration
- **Config source**: Environment variables (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_PORT`)
- **Template engine**: String interpolation with `replaceTemplateVariables()` for dynamic content
- **Logging**: Every email attempt logged in `EmailLog` model with status tracking (PENDING → SENT → DELIVERED or FAILED)

### 2.5 Email Templates (`lib/email-templates.ts`)

Pre-built HTML templates for:

- **Welcome email** — New user account notification
- **Password reset** — Reset link with expiry
- **Parent visit notification** — Visit summary sent to parent email
- **Account lockout warning** — Security alert email

---

## 3. Security Layer (`security/`)

### 3.1 Middleware (`security/middleware/`)

#### Security Headers (`security-headers.ts`)

Applied to every response via Next.js middleware:

| Header | Value |
|--------|-------|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...` |
| X-Frame-Options | `DENY` |
| X-Content-Type-Options | `nosniff` |
| X-XSS-Protection | `1; mode=block` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `geolocation=(), microphone=(), camera=(), payment=()` |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains; preload` (production only) |

#### CSRF Protection (`csrf-protection.ts`)

- Sets a CSRF token cookie on GET requests
- Validates the token on POST/PUT/DELETE/PATCH requests (non-API routes)
- API routes are exempt (they use JWT authentication)

#### Rate Limiter (`rate-limiter.ts`)

- In-memory sliding window rate limiter
- Configurable per endpoint (e.g., login: 5 attempts per 15 minutes)

#### Input Sanitiser (`input-sanitizer.ts`)

- Strips potential XSS payloads from user inputs
- Applied at the API route level

### 3.2 Utilities (`security/utils/`)

| File | Purpose |
|------|---------|
| `password.ts` | bcryptjs hashing (salt rounds: 12), password comparison |
| `encryption.ts` | AES-256-GCM encryption/decryption for sensitive fields |
| `session-manager.ts` | Session creation, validation, cleanup, inactivity timeout |
| `account-lockout.ts` | Tracks failed login attempts, locks accounts after threshold |
| `mfa.ts` | TOTP secret generation, QR code creation, code verification (otplib) |

### 3.3 Password Policy (`security/config/password-policy.ts`)

```typescript
{
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90,           // 90 days until password expires
  historyCount: 5,      // Prevent reuse of last 5 passwords
  lockoutAttempts: 5,   // Lock after 5 failed attempts
  lockoutDuration: 30,  // Lock for 30 minutes
}
```

### 3.4 Audit Logger (`security/audit/audit-logger.ts`)

Creates structured audit log entries in the `AuditLog` table:

```typescript
{
  userId,
  action,        // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  entityType,    // User, Student, Visit, School, etc.
  entityId,
  changes,       // JSON diff of old → new values
  ipAddress,
  userAgent,
  severity,      // INFO, WARNING, ERROR, CRITICAL
}
```

### 3.5 Security Monitor (`security/monitoring/security-monitor.ts`)

A background service that:

- Detects brute-force login patterns
- Identifies suspicious account activity
- Creates `SecurityEvent` records with severity levels
- Runs as a scheduled job (every 5 minutes via watchdog)

### 3.6 Security Policies (`security/policies/`)

Six formal policy documents aligned with Malaffi / ADHICS requirements:

1. Security Awareness Program
2. Portable Media Security
3. Teleworking & Remote Access Security
4. Incident Response Policy
5. Third-Party Security
6. Infrastructure Security Guidance

---

## 4. Next.js Middleware (`middleware.ts`)

The root middleware intercepts all non-API, non-static requests:

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  addSecurityHeaders(response);

  if (request.method === 'GET') setCSRFToken(response);

  if (['POST','PUT','DELETE','PATCH'].includes(request.method)) {
    const csrfResponse = csrfProtection(request);
    if (csrfResponse) return csrfResponse;
  }

  return response;
}
```

**Matcher**: Excludes `/api`, `/_next/static`, `/_next/image`, `/favicon.ico`.

---

## 5. Next.js Configuration (`next.config.js`)

| Setting | Value | Purpose |
|---------|-------|---------|
| `reactStrictMode` | `true` | Catches common React bugs |
| `poweredByHeader` | `false` | Hides `X-Powered-By: Next.js` for security |
| `compress` | `true` | Enables gzip compression |
| `productionBrowserSourceMaps` | `false` | Prevents source code exposure |
| `headers` | Security headers | HSTS, X-Frame-Options, CSP (additional layer) |

---

## 6. Process Management

### 6.1 PM2 (`ecosystem.config.js`)

- **App name**: `taaleem-emr`
- **Execution mode**: Cluster (uses all CPU cores)
- **Port**: 8000 on `0.0.0.0`
- **Auto-restart**: Enabled, max 10 restarts
- **Memory limit**: 1 GB per instance
- **Restart delay**: 4 seconds
- **Logging**: JSON format, merged across instances, date-stamped

### 6.2 Watchdog (`scripts/watchdog.js`)

A custom Node.js monitoring script that:

- Performs HTTP health checks every 30 seconds (`GET /api/health`)
- Auto-restarts the server on failure (up to 10 attempts)
- Runs security monitoring checks every 5 minutes
- Logs all events to `logs/watchdog.log`

### 6.3 Batch Scripts (`run/`)

| Script | Purpose |
|--------|---------|
| `build.bat` | `prisma generate` → `next build` |
| `start.bat` | Starts PM2 with ecosystem config |
| `restart.bat` | Zero-downtime reload via `pm2 reload` |
| `stop.bat` | Stops and deletes PM2 process |
| `start-watchdog.bat` | Starts the watchdog monitoring service |
| `start-dev.bat` | Starts in development mode (`next dev`) |
| `install.bat` | `npm install` + `prisma generate` |

---

## 7. API Route Handler Pattern

Every API route follows a consistent pattern:

```typescript
// app/api/[resource]/route.ts

import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // 1. Authenticate
  const user = await getAuthUser(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Authorise (role check)
  // 3. Parse query params / body
  // 4. Database query via Prisma
  // 5. Business logic
  // 6. Audit log
  // 7. Return JSON response
}

export async function POST(request: NextRequest) {
  // Same pattern with input validation + creation
}
```

### School-scoped data access

Non-admin users are automatically restricted to data from their assigned school:

```typescript
const whereClause: any = {};
if (user.role !== 'ADMIN') {
  whereClause.schoolId = user.schoolId;
}
```

---

## 8. Error Handling

- **Try/catch blocks** in every route handler
- **Prisma errors** are caught and mapped to appropriate HTTP status codes
- **Validation errors** return `400` with descriptive messages
- **Unhandled errors** return `500` with generic message (no stack traces in production)
- **Console logging** for server-side errors (captured by PM2 logs)

---

## 9. TypeScript Configuration (`tsconfig.json`)

| Setting | Value |
|---------|-------|
| `target` | ES2020 |
| `strict` | true |
| `module` | esnext |
| `moduleResolution` | bundler |
| `jsx` | preserve |
| `paths.@/*` | `./*` (import alias) |
| `incremental` | true (faster builds) |

---

## 10. Dependencies Summary

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^14.0.4 | Framework |
| `react` / `react-dom` | ^18.2.0 | UI library |
| `@prisma/client` | ^5.7.1 | Database ORM |
| `jsonwebtoken` | ^9.0.2 | JWT authentication |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `nodemailer` | ^7.0.11 | Email sending |
| `otplib` | ^12.0.1 | TOTP MFA |
| `qrcode` | ^1.5.4 | QR code generation for MFA |
| `recharts` | ^2.10.3 | Data visualisation charts |
| `lucide-react` | ^0.563.0 | Icon library |
| `zod` | ^3.22.4 | Schema validation |
| `xlsx` | ^0.18.5 | Excel file parsing/generation |
| `archiver` | ^7.0.1 | ZIP archive creation (exports) |
| `axios` | ^1.6.2 | HTTP client (HL7 transmission) |
| `date-fns` | ^3.0.6 | Date formatting utilities |
| `react-hook-form` | ^7.49.2 | Form state management |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.3.3 | Type checking |
| `prisma` | ^5.7.1 | Schema management + migrations |
| `tailwindcss` | ^3.4.0 | Utility CSS |
| `autoprefixer` | ^10.4.16 | CSS vendor prefixes |
| `postcss` | ^8.4.32 | CSS processing |
| `eslint` / `eslint-config-next` | ^8.56.0 | Linting |
| `tsx` | ^4.7.0 | TypeScript script execution |
| `cross-env` | ^10.1.0 | Cross-platform env vars |


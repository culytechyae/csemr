# Taaleem CS EMR — System Architecture

> Document version: 1.0 · Last updated: February 2026

---

## 1. High-Level Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│   React 18 · Next.js App Router · Tailwind CSS · Recharts│
└────────────────────────┬─────────────────────────────────┘
                         │  HTTPS (port 8000)
┌────────────────────────▼─────────────────────────────────┐
│                 Next.js Server (Node.js)                  │
│  ┌──────────┐  ┌───────────┐  ┌────────────────────────┐│
│  │ SSR Pages│  │ API Routes│  │ Middleware (security)   ││
│  └──────────┘  └─────┬─────┘  └────────────────────────┘│
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────────┐│
│  │              Prisma ORM (Client)                      ││
│  └───────────────────┬──────────────────────────────────┘│
└──────────────────────┼───────────────────────────────────┘
                       │  TCP (port 5432)
┌──────────────────────▼───────────────────────────────────┐
│                 PostgreSQL Database                        │
│           18 tables · Indexed · Connection-pooled         │
└──────────────────────────────────────────────────────────┘

External Integrations:
  → Malaffi HIE (HL7 v2.5.1 via Rhapsody)
  → SMTP (Nodemailer for parent email notifications)
```

---

## 2. Architecture Pattern

The system follows a **monolithic full-stack** pattern using Next.js:

| Concern | Approach |
|---------|----------|
| **Rendering** | Client-side rendering (`'use client'` directive). All pages are React SPA components. |
| **Routing** | Next.js App Router with file-system based routes under `app/` |
| **API** | Next.js Route Handlers (`app/api/**/route.ts`) — RESTful JSON endpoints |
| **ORM** | Prisma Client with PostgreSQL |
| **Auth** | JWT tokens stored in HTTP-only cookies, verified server-side per request |
| **State** | React `useState` / `useEffect` hooks — no external state manager (Redux, Zustand) |
| **Styling** | Tailwind CSS utility-first classes — no CSS modules or styled-components |

---

## 3. Directory Structure

```
C:\EMR\
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (Inter font, metadata)
│   ├── page.tsx                # Landing / redirect
│   ├── globals.css             # Tailwind directives + global styles
│   ├── login/                  # Authentication pages
│   ├── dashboard/              # Global Clinic Dashboard
│   ├── admin/                  # Admin module (15+ sub-pages)
│   │   ├── page.tsx            # Admin Command Centre
│   │   ├── audit-logs/
│   │   ├── email/
│   │   ├── export/
│   │   ├── reports/
│   │   ├── schools/
│   │   ├── security/
│   │   ├── settings/
│   │   └── users/
│   ├── analytics/              # Health Analytics dashboard
│   ├── schools/                # School management (CRUD)
│   ├── students/               # Student management (CRUD)
│   ├── visits/                 # Clinical visits (CRUD + New Assessment)
│   ├── health-records/         # Health record management
│   ├── hl7/                    # HL7 message log viewer
│   ├── import/                 # CSV import wizards
│   ├── users/                  # User management
│   ├── settings/               # User settings (MFA)
│   └── api/                    # API Route Handlers (~56 routes)
│       ├── auth/               # Login, logout, MFA, password, session
│       ├── dashboard/          # Dashboard statistics
│       ├── analytics/          # Analytics data + export
│       ├── schools/            # School CRUD + HL7 config
│       ├── students/           # Student CRUD + analytics + summary
│       ├── visits/             # Visit CRUD
│       ├── health-records/     # Health record CRUD
│       ├── hl7/                # HL7 message generation + listing
│       ├── users/              # User CRUD + unlock
│       ├── admin/              # Admin stats, backup, export
│       ├── import/             # Bulk import endpoints
│       ├── email/              # Email templates + logs
│       ├── security/           # Events, alerts, incidents, vendors, training
│       ├── reports/            # Report generation
│       ├── audit-logs/         # Audit log listing
│       └── settings/           # Academic year settings
├── components/                 # Shared React components
│   ├── Layout.tsx              # App shell (sidebar + header)
│   ├── NavItem.tsx             # Sidebar nav link
│   ├── Breadcrumb.tsx          # Breadcrumb navigation
│   ├── PainScaleSelector.tsx   # Pain scale emoji widget
│   └── SidebarIcons.tsx        # SVG icon set
├── lib/                        # Core utility libraries
│   ├── auth.ts                 # JWT generation, verification, role guards
│   ├── prisma.ts               # Prisma singleton client
│   ├── hl7.ts                  # HL7 v2.5.1 message builder
│   ├── email.ts                # SMTP email service
│   └── email-templates.ts      # HTML email template strings
├── security/                   # Security layer
│   ├── middleware/              # Request-level middleware
│   │   ├── security-headers.ts # CSP, HSTS, X-Frame-Options, etc.
│   │   ├── csrf-protection.ts  # CSRF token validation
│   │   ├── rate-limiter.ts     # API rate limiting
│   │   └── input-sanitizer.ts  # Input XSS sanitisation
│   ├── utils/                  # Security utilities
│   │   ├── password.ts         # Password hashing (bcrypt)
│   │   ├── encryption.ts       # AES-256-GCM encryption
│   │   ├── session-manager.ts  # Session lifecycle
│   │   ├── account-lockout.ts  # Brute-force protection
│   │   └── mfa.ts              # TOTP MFA (otplib)
│   ├── config/
│   │   └── password-policy.ts  # Password complexity rules
│   ├── audit/
│   │   └── audit-logger.ts     # Structured audit logging
│   ├── monitoring/
│   │   └── security-monitor.ts # Real-time security monitoring
│   └── policies/               # 6 formal security policy documents
├── prisma/
│   └── schema.prisma           # Database schema (18 models)
├── scripts/                    # Ops & maintenance scripts
│   ├── watchdog.js             # Server health monitoring
│   ├── security-monitor-service.js
│   ├── seed.ts                 # Database seeding
│   ├── migrate.js              # Migration runner
│   └── *.ps1                   # PowerShell deployment scripts
├── run/                        # Windows batch scripts
│   ├── build.bat
│   ├── start.bat / restart.bat / stop.bat
│   └── start-watchdog.bat
├── deployment/                 # Deployment documentation & configs
├── middleware.ts               # Next.js edge middleware
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── ecosystem.config.js         # PM2 cluster configuration
└── package.json                # Dependencies & scripts
```

---

## 4. Request Flow

### 4.1 Page Load (Browser → SSR → Client)

```
Browser GET /dashboard
  → Next.js middleware (security headers, CSRF token)
  → App Router resolves app/dashboard/page.tsx
  → Client-side React renders Layout + page
  → useEffect fires API calls (GET /api/dashboard/stats, GET /api/auth/me)
  → API routes verify JWT, query Prisma, return JSON
  → React updates state → UI renders
```

### 4.2 API Request (Authenticated)

```
Browser POST /api/visits  { body: JSON }
  → Next.js Route Handler (app/api/visits/route.ts)
  → getAuthUser(request)  →  reads 'auth-token' cookie
  → jwt.verify(token)  →  checks Session in DB  →  checks User.isActive
  → Business logic (create ClinicalVisit + ClinicalAssessment)
  → Generate HL7 message (if school has HL7 config)
  → AuditLog entry created
  → Return JSON response
```

---

## 5. Production Deployment

### 5.1 Process Management

| Tool | Purpose |
|------|---------|
| **PM2** | Cluster-mode process manager — multi-instance on all CPU cores |
| **Watchdog** | Custom Node.js script — health checks every 30s, auto-restart on failure |

### 5.2 PM2 Configuration (`ecosystem.config.js`)

- **Name**: `taaleem-emr`
- **Mode**: Cluster (`exec_mode: 'cluster'`, `instances: 'max'`)
- **Port**: 8000 (bound to `0.0.0.0`)
- **Memory limit**: 1 GB per instance
- **Auto-restart**: On crash, max 10 restarts
- **Logging**: JSON-formatted, date-stamped, merged across instances

### 5.3 Build & Deploy Workflow

```
1. .\run\build.bat       →  prisma generate  →  next build
2. .\run\start.bat        →  pm2 start ecosystem.config.js
3. .\run\restart.bat      →  pm2 reload taaleem-emr (zero-downtime)
4. .\run\stop.bat         →  pm2 stop/delete taaleem-emr
```

### 5.4 Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string with pooling params |
| `JWT_SECRET` | 256-bit secret for JWT signing |
| `MALAFFI_API_URL` | Malaffi HIE endpoint |
| `MALAFFI_API_KEY` | API key for Malaffi |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` | Email SMTP credentials |
| `NODE_ENV` | `production` in deployed environments |

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
Login POST /api/auth/login
  → Validate email + password (bcrypt compare)
  → Check account lockout (5 failed attempts → 30-min lock)
  → Check MFA requirement → redirect to /login/mfa if enabled
  → Generate JWT (7-day expiry)
  → Create Session record in DB
  → Set 'auth-token' HTTP-only cookie
  → Log SecurityEvent + AuditLog
```

### 6.2 Defence Layers

| Layer | Implementation |
|-------|---------------|
| **HTTPS** | HSTS header, Strict-Transport-Security |
| **Security Headers** | CSP, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy |
| **CSRF Protection** | Token-based protection for non-API state-changing requests |
| **Rate Limiting** | Request throttling on API endpoints |
| **Input Sanitisation** | XSS prevention on user inputs |
| **Password Policy** | Min 8 chars, upper/lower/number/special, 90-day expiry, 5-history |
| **Account Lockout** | 5 failures → 30-minute lockout |
| **MFA** | TOTP-based (otplib + QR code) |
| **Session Management** | DB-backed sessions with 30-min inactivity timeout |
| **Audit Logging** | Every significant action logged with user, IP, timestamp, severity |
| **Encryption** | AES-256-GCM for sensitive data at rest |

### 6.3 Compliance

The system is designed for **Malaffi / ADHICS** compliance (Abu Dhabi Health Information and Cyber Security Standards), including:

- HL7 v2.5.1 message generation for patient registration and visit events
- Formal security policies (6 documents in `security/policies/`)
- Vendor security management
- Security incident tracking
- Security awareness training tracking
- Comprehensive audit trail

---

## 7. Integration Points

### 7.1 Malaffi HIE (HL7 v2.5.1)

- **Message Types**: ADT^A01 (admit), ADT^A03 (discharge), ADT^A04 (register), ADT^A08 (update), ORU^R01 (results)
- **Builder**: `lib/hl7.ts` — `HL7MessageBuilder` class constructs compliant HL7 segments
- **Per-school config**: `SchoolHL7Config` model stores facility codes, auto-send settings
- **Message queue**: `HL7Message` model tracks status (PENDING → SENT → ACKNOWLEDGED)

### 7.2 Email (SMTP)

- **Library**: Nodemailer
- **Templates**: HTML templates for welcome, password reset, parent visit notifications
- **Logging**: Every email tracked in `EmailLog` model with delivery status

---

## 8. Performance Considerations

| Area | Strategy |
|------|----------|
| **Database** | Indexed columns on all foreign keys and frequently-queried fields |
| **Connection pooling** | Prisma connection pool via `DATABASE_URL` params |
| **Cluster mode** | PM2 runs multiple Node.js instances across CPU cores |
| **Client bundle** | Next.js automatic code splitting per route |
| **Compression** | `compress: true` in `next.config.js` |
| **Source maps** | Disabled in production (`productionBrowserSourceMaps: false`) |
| **Singleton pattern** | Prisma client singleton prevents connection leaks in dev |


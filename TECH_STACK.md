# Technology Stack - Taaleem Clinic Management System

## Overview

This document provides a comprehensive overview of all technologies, frameworks, libraries, and tools used in the Taaleem Clinic Management System.

---

## 🎯 Core Framework & Runtime

### Frontend Framework
- **Next.js 14.0.4** (App Router)
  - React Server Components
  - Server-side rendering (SSR)
  - Static site generation (SSG)
  - API Routes
  - File-based routing

### Runtime
- **Node.js 20+**
  - JavaScript runtime environment
  - Server-side execution

### Language
- **TypeScript 5.3.3**
  - Type-safe JavaScript
  - Enhanced developer experience
  - Compile-time error checking

---

## 🎨 Frontend Technologies

### UI Framework
- **React 18.2.0**
  - Component-based UI library
  - Hooks for state management
  - Client-side interactivity

### Styling
- **Tailwind CSS 3.4.0**
  - Utility-first CSS framework
  - Responsive design
  - Custom component styling

### Form Management
- **React Hook Form 7.49.2**
  - Form state management
  - Validation integration
  - Performance optimization

### Form Validation
- **Zod 3.22.4**
  - Schema validation
  - TypeScript-first validation
  - Runtime type checking

- **@hookform/resolvers 3.3.2**
  - Integration between React Hook Form and Zod

### Data Visualization
- **Recharts 2.10.3**
  - Chart library for React
  - Used for reports and analytics
  - Supports various chart types

---

## 🗄️ Database & ORM

### Database
- **PostgreSQL**
  - Relational database management system
  - ACID compliance
  - Advanced features (JSON, arrays, etc.)

### ORM
- **Prisma 5.7.1**
  - Type-safe database client
  - Migration management
  - Database schema management
  - Query builder

### Database Tools
- **Prisma Studio**
  - Visual database browser
  - Data management interface

---

## 🔐 Authentication & Security

### Authentication
- **JSON Web Tokens (JWT) 9.0.2**
  - Token-based authentication
  - Stateless session management
  - Secure token generation and verification

### Password Security
- **bcryptjs 2.4.3**
  - Password hashing
  - Salt rounds: 12
  - Secure password storage

### Multi-Factor Authentication
- **otplib 12.0.1**
  - TOTP (Time-based One-Time Password) implementation
  - MFA support
  - Authenticator app integration

- **qrcode 1.5.4**
  - QR code generation for MFA setup
  - Authenticator app pairing

### Encryption
- **Web Crypto API**
  - Field-level encryption (AES-GCM)
  - PBKDF2 key derivation
  - Secure data encryption/decryption

---

## 📧 Email Services

### Email Library
- **Nodemailer 7.0.11**
  - Email sending functionality
  - SMTP configuration
  - Email template support

### Email Features
- Email logging and tracking
- Parent notification system
- Email template management
- Delivery status monitoring

---

## 📊 Data Processing

### Excel Processing
- **xlsx 0.18.5**
  - Excel file generation
  - Data export to .xlsx format
  - Backup functionality

### Archive Management
- **archiver 7.0.1**
  - ZIP file creation
  - Backup file packaging
  - File compression

### Date Handling
- **date-fns 3.0.6**
  - Date manipulation
  - Date formatting
  - Time zone handling

---

## 🌐 HTTP & API

### HTTP Client
- **Axios 1.6.2**
  - HTTP request library
  - Promise-based API
  - Request/response interceptors

---

## 🛠️ Development Tools

### Build Tools
- **PostCSS 8.4.32**
  - CSS processing
  - Autoprefixer integration

- **Autoprefixer 10.4.16**
  - Automatic vendor prefixing
  - Browser compatibility

### Code Quality
- **ESLint 8.56.0**
  - JavaScript/TypeScript linting
  - Code quality enforcement

- **eslint-config-next 14.0.4**
  - Next.js-specific ESLint rules
  - Best practices enforcement

### TypeScript Execution
- **tsx 4.7.0**
  - TypeScript execution
  - Script running
  - Development utilities

### Environment Management
- **cross-env 10.1.0**
  - Cross-platform environment variables
  - Windows/Unix compatibility

---

## 🔧 Infrastructure & Deployment

### Server
- **Next.js Production Server**
  - Built-in production server
  - Port: 5005 (configurable)
  - Optimized for production

### Process Management
- **Custom Watchdog Service**
  - Server monitoring
  - Auto-recovery on crashes
  - Health checks
  - Security monitoring

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security (HSTS)
- Referrer-Policy
- Permissions-Policy

---

## 📡 Integration & APIs

### HL7 Integration
- **HL7 v2.5.1**
  - Healthcare data exchange
  - Message generation (ADT, ORU)
  - Malaffi integration

### External APIs
- **Malaffi API**
  - Health Information Exchange
  - HL7 message transmission
  - Test and production environments

---

## 🗂️ Project Structure

```
EMR/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── dashboard/         # Dashboard pages
│   └── ...                # Other pages
├── components/            # React components
├── lib/                   # Utility libraries
├── security/              # Security modules
│   ├── middleware/        # Security middleware
│   ├── utils/             # Security utilities
│   ├── audit/             # Audit logging
│   └── monitoring/        # Security monitoring
├── prisma/                # Prisma schema
├── scripts/               # Utility scripts
├── public/                # Static assets
└── run/                   # Batch scripts
```

---

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Session management
- Multi-factor authentication (MFA)

### Security Middleware
- Rate limiting
- CSRF protection
- Input sanitization
- XSS prevention
- SQL injection prevention

### Security Monitoring
- Audit logging
- Security event tracking
- Suspicious activity detection
- Account lockout protection
- Password policy enforcement

### Data Protection
- Password hashing (bcrypt)
- Field-level encryption
- Secure cookie flags
- HTTPS enforcement
- Security headers

---

## 📦 Package Management

### Package Manager
- **npm** (Node Package Manager)
  - Dependency management
  - Script execution
  - Package installation

---

## 🗄️ Database Models

### Core Models
- User
- School
- Student
- ClinicalVisit
- ClinicalAssessment
- HealthRecord

### Security Models
- Session
- PasswordHistory
- LoginAttempt
- SecurityEvent
- AuditLog

### Integration Models
- HL7Message
- SchoolHL7Config
- EmailLog

---

## 🚀 Deployment

### Production Environment
- **Node.js 20+**
- **PostgreSQL Database**
- **Windows Server** (current deployment)
- **Port 5005** (configurable)

### Deployment Scripts
- `run/start.bat` - Production server
- `run/start-watchdog.bat` - Server with monitoring
- `run/build.bat` - Build script
- `run/install.bat` - Installation script

---

## 📊 Monitoring & Logging

### Logging
- Watchdog logs (`logs/watchdog.log`)
- Server logs (`logs/server.log`)
- Security monitor logs (`logs/security-monitor.log`)

### Health Monitoring
- Health check endpoint (`/api/health`)
- Database connectivity checks
- Server uptime tracking

### Security Monitoring
- Continuous security checks
- Suspicious activity detection
- Automated alerting

---

## 🔄 Version Control

### Git
- Version control system
- Code repository management

---

## 📝 Documentation

### Documentation Tools
- Markdown files
- README files
- API documentation
- Deployment guides

---

## 🌟 Key Features Enabled by Tech Stack

1. **Type Safety**: TypeScript ensures compile-time error checking
2. **Performance**: Next.js SSR/SSG for optimal performance
3. **Security**: Comprehensive security middleware and monitoring
4. **Scalability**: PostgreSQL for robust data management
5. **Maintainability**: Prisma ORM for type-safe database access
6. **User Experience**: React + Tailwind for modern UI
7. **Integration**: HL7 support for healthcare data exchange
8. **Reliability**: Watchdog service for auto-recovery
9. **Monitoring**: Continuous security and health monitoring
10. **Compliance**: Security features for healthcare compliance

---

## 📈 Performance Optimizations

- Next.js automatic code splitting
- Image optimization
- Static asset optimization
- Database query optimization (Prisma)
- Compression enabled
- Security headers for performance

---

## 🔄 Development Workflow

1. **Development**: `npm run dev` (port 3000)
2. **Building**: `npm run build`
3. **Production**: `npm start` (port 5005)
4. **With Watchdog**: `npm run start:watchdog`
5. **Database**: Prisma migrations and Studio

---

## 📚 Additional Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **React Documentation**: https://react.dev
- **TypeScript Documentation**: https://www.typescriptlang.org/docs
- **Tailwind CSS Documentation**: https://tailwindcss.com/docs

---

## 🎯 Summary

This application uses a modern, type-safe, and secure tech stack optimized for:
- **Healthcare compliance** (HL7, security standards)
- **Performance** (Next.js SSR, optimized queries)
- **Security** (MFA, encryption, monitoring)
- **Maintainability** (TypeScript, Prisma, modular architecture)
- **Reliability** (Watchdog, health checks, auto-recovery)

The stack is production-ready and designed to handle the requirements of a school clinic EMR system with HL7 integration for Malaffi.


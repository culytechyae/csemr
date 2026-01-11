# Environment Variables Configuration

Complete guide for configuring all environment variables required for production deployment.

## 📋 Required Environment Variables

Create a `.env` file in the application root directory with the following variables:

---

## 🔐 Core Configuration

### Database Connection

```env
# PostgreSQL Database URL
# Format: postgresql://[user]:[password]@[host]:[port]/[database]?schema=[schema]
DATABASE_URL="postgresql://emr_user:YOUR_STRONG_PASSWORD@localhost:5432/school_emr_prod?schema=public"
```

**Example:**
```env
DATABASE_URL="postgresql://emr_user:Emr@Pr0d#2024!Secure$Pass@localhost:5432/school_emr_prod?schema=public"
```

**Notes:**
- Replace `YOUR_STRONG_PASSWORD` with the actual database password
- Use `localhost` for local connections
- Use IP address or hostname for remote connections
- URL-encode special characters in password (e.g., `@` becomes `%40`)

---

### Authentication & Security

```env
# JWT Secret Key (REQUIRED)
# Generate a strong random string (minimum 32 characters)
# Use: openssl rand -base64 32
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long-change-this-in-production"

# Encryption Key for Sensitive Data (REQUIRED)
# Minimum 32 characters, used for MFA secrets and other encrypted data
# Use: openssl rand -base64 32
ENCRYPTION_KEY="your-encryption-key-minimum-32-characters-long-for-data-encryption"
```

**Generate Secure Keys:**
```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Encryption Key
openssl rand -base64 32
```

---

## 📧 Email Configuration (SMTP)

```env
# SMTP Server Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-specific-password"
SMTP_FROM_EMAIL="noreply@taaleem.ae"
SMTP_FROM_NAME="Taaleem Clinic Management"
SMTP_TLS="true"
```

**Common SMTP Providers:**

**Gmail:**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"  # Use App Password, not regular password
SMTP_TLS="true"
```

**Outlook/Office 365:**
```env
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER="your-email@outlook.com"
SMTP_PASSWORD="your-password"
SMTP_TLS="true"
```

**SendGrid:**
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
SMTP_TLS="true"
```

**Custom SMTP:**
```env
SMTP_HOST="mail.yourdomain.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASSWORD="your-smtp-password"
SMTP_TLS="true"
```

---

## 🌐 Application Configuration

```env
# Node Environment
NODE_ENV="production"

# Application Port
PORT="5005"

# Base URL (for email links, etc.)
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
# OR for HTTP
# NEXT_PUBLIC_BASE_URL="http://your-server-ip:5005"
```

---

## 🔗 HL7 Integration (Optional)

```env
# Malaffi HL7 Integration
MALAFFI_API_URL="https://api.malaffi.ae/hl7"
MALAFFI_API_KEY="your-malaffi-api-key"
MALAFFI_ENABLED="true"
```

**Note:** Configure per-school HL7 settings in the application UI after deployment.

---

## 📊 Logging & Monitoring

```env
# Log Level (optional)
LOG_LEVEL="info"  # Options: error, warn, info, debug

# Enable detailed logging (optional)
DEBUG="false"
```

---

## 🔒 Security Settings

```env
# Session Configuration
SESSION_TIMEOUT="3600"  # Session timeout in seconds (1 hour default)

# Password Policy (optional, defaults in code)
PASSWORD_MIN_LENGTH="8"
PASSWORD_REQUIRE_UPPERCASE="true"
PASSWORD_REQUIRE_LOWERCASE="true"
PASSWORD_REQUIRE_NUMBER="true"
PASSWORD_REQUIRE_SPECIAL="true"
PASSWORD_EXPIRY_DAYS="90"

# Account Lockout
MAX_LOGIN_ATTEMPTS="5"
LOCKOUT_DURATION_MINUTES="30"
```

---

## 📝 Complete .env File Template

Create `.env` file in the application root:

```env
# ============================================
# Taaleem Clinic Management - Production Config
# ============================================

# Environment
NODE_ENV=production
PORT=5005
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://emr_user:YOUR_STRONG_PASSWORD@localhost:5432/school_emr_prod?schema=public

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-this-in-production
ENCRYPTION_KEY=your-encryption-key-minimum-32-characters-long-for-data-encryption

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=noreply@taaleem.ae
SMTP_FROM_NAME=Taaleem Clinic Management
SMTP_TLS=true

# HL7 Integration (Optional)
MALAFFI_API_URL=https://api.malaffi.ae/hl7
MALAFFI_API_KEY=your-malaffi-api-key
MALAFFI_ENABLED=true

# Security Settings (Optional)
SESSION_TIMEOUT=3600
PASSWORD_EXPIRY_DAYS=90
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30

# Logging (Optional)
LOG_LEVEL=info
DEBUG=false
```

---

## 🔑 Key Generation Script

Create a script to generate secure keys:

**Linux/Mac (`generate-keys.sh`):**
```bash
#!/bin/bash

echo "Generating secure keys for production..."
echo ""
echo "JWT_SECRET:"
openssl rand -base64 32
echo ""
echo "ENCRYPTION_KEY:"
openssl rand -base64 32
echo ""
echo "Copy these values to your .env file"
```

**Windows (`generate-keys.ps1`):**
```powershell
Write-Host "Generating secure keys for production..." -ForegroundColor Green
Write-Host ""
Write-Host "JWT_SECRET:" -ForegroundColor Yellow
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$jwtSecret += -join ((33,35,36,37,38,42,43,45,46,61,63,64,94,95) | Get-Random -Count 8 | ForEach-Object {[char]$_})
Write-Host $jwtSecret
Write-Host ""
Write-Host "ENCRYPTION_KEY:" -ForegroundColor Yellow
$encKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$encKey += -join ((33,35,36,37,38,42,43,45,46,61,63,64,94,95) | Get-Random -Count 8 | ForEach-Object {[char]$_})
Write-Host $encKey
Write-Host ""
Write-Host "Copy these values to your .env file" -ForegroundColor Green
```

---

## ✅ Validation Checklist

Before starting the application, verify:

- [ ] `DATABASE_URL` is correct and database is accessible
- [ ] `JWT_SECRET` is set and is at least 32 characters
- [ ] `ENCRYPTION_KEY` is set and is at least 32 characters
- [ ] SMTP credentials are correct (test email sending)
- [ ] `NEXT_PUBLIC_BASE_URL` matches your domain/IP
- [ ] All passwords are strong and unique
- [ ] `.env` file is not committed to version control
- [ ] File permissions on `.env` are restrictive (600 on Linux)

---

## 🔒 Security Best Practices

1. **Never commit `.env` to version control**
   - Add `.env` to `.gitignore`
   - Use `.env.example` as template

2. **Use strong, unique passwords**
   - Minimum 16 characters
   - Mix of character types
   - Use password manager

3. **Restrict file permissions (Linux)**
   ```bash
   chmod 600 .env
   chown emr-app:emr-app .env
   ```

4. **Rotate keys periodically**
   - Change JWT_SECRET and ENCRYPTION_KEY every 90 days
   - Update database passwords regularly

5. **Use environment-specific files**
   - `.env.production` for production
   - `.env.staging` for staging
   - `.env.development` for development

---

## 🧪 Testing Configuration

### Test Database Connection

```bash
cd /opt/emr
npx prisma db pull
```

### Test Email Configuration

Create a test script `test-email.js`:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});
```

Run:
```bash
node test-email.js
```

---

## 📋 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | ✅ Yes | - | Secret for JWT token signing |
| `ENCRYPTION_KEY` | ✅ Yes | - | Key for data encryption |
| `NODE_ENV` | ✅ Yes | `production` | Node environment |
| `PORT` | No | `5005` | Application port |
| `SMTP_HOST` | No | - | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | No | - | SMTP username |
| `SMTP_PASSWORD` | No | - | SMTP password |
| `SMTP_FROM_EMAIL` | No | - | Default from email |
| `SMTP_FROM_NAME` | No | `Taaleem Clinic Management` | Default from name |
| `SMTP_TLS` | No | `true` | Enable TLS |
| `NEXT_PUBLIC_BASE_URL` | No | - | Public base URL |
| `MALAFFI_API_URL` | No | - | HL7 API endpoint |
| `MALAFFI_API_KEY` | No | - | HL7 API key |
| `MALAFFI_ENABLED` | No | `false` | Enable HL7 integration |

---

## 🚀 Next Steps

After configuring environment variables:

1. Verify all required variables are set
2. Test database connection
3. Test email configuration
4. Proceed with application deployment (see `DEPLOYMENT.md`)


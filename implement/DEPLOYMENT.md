# Production Deployment Guide

Complete step-by-step guide for deploying Taaleem Clinic Management to a production server.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Server Preparation](#server-preparation)
3. [Application Deployment](#application-deployment)
4. [Database Migration](#database-migration)
5. [Service Configuration](#service-configuration)
6. [Verification](#verification)

---

## Pre-Deployment Checklist

- [ ] Production server is ready (Linux/Windows)
- [ ] PostgreSQL is installed and running
- [ ] Node.js 20+ is installed
- [ ] Domain name is configured (optional but recommended)
- [ ] SSL certificate is obtained (for HTTPS)
- [ ] SMTP server credentials are available
- [ ] Firewall rules are configured
- [ ] Backup strategy is in place

---

## Server Preparation

### 1. Install Node.js

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Linux (CentOS/RHEL):**
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

**Windows:**
- Download and install from https://nodejs.org/
- Verify: `node --version` (should be 20.x or higher)

### 2. Install PostgreSQL

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Linux (CentOS/RHEL):**
```bash
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
- Download and install from https://www.postgresql.org/download/windows/
- Follow the installation wizard

### 3. Create Application User

**Linux:**
```bash
sudo useradd -m -s /bin/bash emr-app
sudo mkdir -p /opt/emr
sudo chown emr-app:emr-app /opt/emr
```

**Windows:**
- Create a new user account for the application (optional)

---

## Application Deployment

### 1. Transfer Application Files

**Option A: Git Clone (Recommended)**
```bash
cd /opt/emr
sudo -u emr-app git clone <repository-url> .
```

**Option B: File Transfer**
```bash
# Transfer files via SCP, SFTP, or other method
# Extract to /opt/emr (or your chosen directory)
```

### 2. Install Dependencies

```bash
cd /opt/emr
npm install --production
```

### 3. Configure Environment Variables

Create `.env` file in the application root:

```bash
cd /opt/emr
cp .env.example .env
nano .env  # Edit with your production values
```

See `ENVIRONMENT_VARIABLES.md` for complete configuration.

### 4. Build Application

```bash
cd /opt/emr
npm run build
```

This will:
- Compile TypeScript
- Generate Prisma client
- Optimize Next.js application
- Create production build in `.next` folder

---

## Database Migration

### 1. Create Production Database

See `DATABASE_SETUP.md` for detailed instructions.

**Quick Setup:**
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE school_emr_prod;
CREATE USER emr_user WITH PASSWORD 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE school_emr_prod TO emr_user;
\q
```

### 2. Update DATABASE_URL in .env

```env
DATABASE_URL="postgresql://emr_user:YOUR_STRONG_PASSWORD@localhost:5432/school_emr_prod?schema=public"
```

### 3. Run Migrations

```bash
cd /opt/emr
npx prisma migrate deploy
```

This applies all pending migrations to the production database.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. (Optional) Seed Initial Data

```bash
npm run db:seed
```

**Note:** Only run seed if you need initial admin user and schools. Modify seed script for production values.

---

## Service Configuration

### Option 1: PM2 (Recommended for Node.js)

**Install PM2:**
```bash
npm install -g pm2
```

**Create PM2 Ecosystem File** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'taaleem-clinic-emr',
    script: 'npm',
    args: 'start',
    cwd: '/opt/emr',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5005
    },
    error_file: '/var/log/emr/error.log',
    out_file: '/var/log/emr/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

**Start Application:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start on boot
```

**Useful PM2 Commands:**
```bash
pm2 status              # Check application status
pm2 logs                # View logs
pm2 restart taaleem-clinic-emr  # Restart application
pm2 stop taaleem-clinic-emr      # Stop application
```

### Option 2: Systemd Service (Linux)

**Create Service File** (`/etc/systemd/system/taaleem-emr.service`):
```ini
[Unit]
Description=Taaleem Clinic Management EMR
After=network.target postgresql.service

[Service]
Type=simple
User=emr-app
WorkingDirectory=/opt/emr
Environment=NODE_ENV=production
Environment=PORT=5005
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Enable and Start:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable taaleem-emr
sudo systemctl start taaleem-emr
sudo systemctl status taaleem-emr
```

### Option 3: Windows Service

**Using NSSM (Non-Sucking Service Manager):**

1. Download NSSM from https://nssm.cc/download
2. Install the service:
```cmd
nssm install TaaleemEMR
```
3. Configure:
   - Path: `C:\Program Files\nodejs\npm.cmd`
   - Startup directory: `C:\EMR`
   - Arguments: `start`
   - Service name: `TaaleemEMR`

4. Start service:
```cmd
nssm start TaaleemEMR
```

---

## Reverse Proxy Setup (Nginx)

**Install Nginx:**
```bash
sudo apt-get install nginx  # Ubuntu/Debian
sudo yum install nginx      # CentOS/RHEL
```

**Configure Nginx** (`/etc/nginx/sites-available/taaleem-emr`):
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    # Redirect HTTP to HTTPS (if SSL is configured)
    # return 301 https://$server_name$request_uri;

    # For HTTP only (not recommended for production)
    location / {
        proxy_pass http://localhost:5005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTPS Configuration (recommended)
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:5005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable Site:**
```bash
sudo ln -s /etc/nginx/sites-available/taaleem-emr /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

---

## Firewall Configuration

**Linux (UFW):**
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

**Linux (firewalld):**
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

**Windows:**
- Configure Windows Firewall to allow ports 80, 443, and 5005

---

## Verification

### 1. Check Application Status

```bash
# PM2
pm2 status

# Systemd
sudo systemctl status taaleem-emr

# Direct check
curl http://localhost:5005/api/auth/me
```

### 2. Test Application Endpoints

```bash
# Health check (if implemented)
curl http://localhost:5005/api/health

# Login endpoint (should return 400/401 without credentials)
curl -X POST http://localhost:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

### 3. Check Logs

```bash
# PM2
pm2 logs taaleem-clinic-emr

# Systemd
sudo journalctl -u taaleem-emr -f

# Application logs
tail -f /var/log/emr/out.log
tail -f /var/log/emr/error.log
```

### 4. Database Connection

```bash
cd /opt/emr
npx prisma studio  # Opens database browser (for verification only)
```

---

## Post-Deployment

See `POST_DEPLOYMENT.md` for:
- Initial admin user setup
- School configuration
- Email configuration
- HL7 configuration
- Security hardening
- Backup setup

---

## Troubleshooting

See `TROUBLESHOOTING.md` for common issues and solutions.

---

## Maintenance

### Update Application

```bash
cd /opt/emr
git pull  # If using git
# Or transfer new files

npm install --production
npm run build
npx prisma migrate deploy
npx prisma generate

# Restart application
pm2 restart taaleem-clinic-emr
# OR
sudo systemctl restart taaleem-emr
```

### Backup Database

```bash
# Daily backup script
pg_dump -U emr_user -d school_emr_prod > /backup/emr_$(date +%Y%m%d).sql
```

### Monitor Application

- Check PM2/systemd status regularly
- Monitor logs for errors
- Set up monitoring alerts (optional)
- Regular database backups

---

## Security Checklist

- [ ] SSL/TLS certificate installed and configured
- [ ] Strong database passwords set
- [ ] JWT_SECRET is strong and unique
- [ ] ENCRYPTION_KEY is set (32+ characters)
- [ ] SMTP credentials are secure
- [ ] Firewall rules configured
- [ ] Regular security updates applied
- [ ] Application runs as non-root user
- [ ] File permissions are restrictive
- [ ] Environment variables are not exposed


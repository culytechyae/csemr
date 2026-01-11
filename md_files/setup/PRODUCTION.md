# Production Deployment Guide

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 12 or higher
- npm or yarn
- Production server (Windows Server, Linux, or cloud platform)

## Database Setup

### 1. Create PostgreSQL Database

Connect to PostgreSQL as superuser and run:

```sql
CREATE DATABASE school_emr_prod;
```

Or use the provided script:
```bash
psql -U postgres -f scripts/create-production-db.sql
```

### 2. Configure Database Connection

The system is configured to use PostgreSQL with:
- **Username**: postgres
- **Password**: M@gesh@020294
- **Database**: school_emr_prod
- **Host**: localhost
- **Port**: 5432

The connection string is already configured in `.env`:
```
DATABASE_URL="postgresql://postgres:M%40gesh%40020294@localhost:5432/school_emr_prod?schema=public"
```

## Environment Configuration

### 1. Generate JWT Secret

**IMPORTANT**: Generate a strong JWT secret for production:

```bash
node scripts/generate-jwt-secret.js
```

Copy the generated secret and update it in `.env`:
```
JWT_SECRET="your-generated-secret-here"
```

### 2. Configure Malaffi API

Update the Malaffi API credentials in `.env`:
```
MALAFFI_API_URL="https://api.malaffi.ae/hl7"
MALAFFI_API_KEY="your-production-api-key"
```

### 3. Set Production Environment

Ensure `.env` has:
```
NODE_ENV="production"
PORT=5005
```

## Production Setup Steps

### Option 1: Automated Setup (Recommended)

**Windows (PowerShell):**
```powershell
.\scripts\setup-production.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

**Node.js (Cross-platform):**
```bash
node scripts/setup-production.js
```

### Option 2: Manual Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Seed Initial Data**
   ```bash
   npm run db:seed
   ```

5. **Build Application**
   ```bash
   npm run build
   ```

6. **Start Production Server**
   ```bash
   npm start
   ```

## Production Server Configuration

### Running as a Service (Windows)

Create a service using NSSM (Non-Sucking Service Manager):

```powershell
# Download NSSM from https://nssm.cc/download
nssm install SchoolClinicEMR "C:\Program Files\nodejs\node.exe"
nssm set SchoolClinicEMR AppDirectory "C:\EMR"
nssm set SchoolClinicEMR AppParameters "C:\EMR\node_modules\.bin\next start -p 5005"
nssm set SchoolClinicEMR AppStdout "C:\EMR\logs\output.log"
nssm set SchoolClinicEMR AppStderr "C:\EMR\logs\error.log"
nssm start SchoolClinicEMR
```

### Running as a Service (Linux - systemd)

Create `/etc/systemd/system/school-emr.service`:

```ini
[Unit]
Description=School Clinic EMR System
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/school-emr
Environment=NODE_ENV=production
Environment=PORT=5005
ExecStart=/usr/bin/node /opt/school-emr/node_modules/.bin/next start -p 5005
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable school-emr
sudo systemctl start school-emr
```

### Using PM2 (Recommended for Node.js)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "school-emr" -- start:prod

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Security Checklist

- [ ] JWT_SECRET is a strong random string (minimum 32 characters)
- [ ] Database password is secure and not exposed
- [ ] HTTPS is enabled (use reverse proxy like Nginx)
- [ ] Firewall rules are configured
- [ ] Database backups are scheduled
- [ ] Environment variables are secured
- [ ] Malaffi API keys are production keys
- [ ] Error logging is configured
- [ ] Audit logs are being monitored

## Reverse Proxy Configuration (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

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

## Database Backups

### Automated Backup Script

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/school-emr"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres school_emr_prod > "$BACKUP_DIR/backup_$DATE.sql"
# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

Schedule with cron:
```bash
0 2 * * * /path/to/backup-db.sh
```

## Monitoring

### Health Check Endpoint

The application includes health monitoring. Set up:

1. **Application Monitoring**: Use tools like PM2 Plus, New Relic, or Datadog
2. **Database Monitoring**: Monitor PostgreSQL performance
3. **Uptime Monitoring**: Use services like UptimeRobot or Pingdom
4. **Error Tracking**: Integrate Sentry or similar

## Performance Optimization

1. **Enable Caching**: Configure Redis for session storage
2. **Database Indexing**: Ensure all indexes are created
3. **CDN**: Use CDN for static assets
4. **Compression**: Already enabled in Next.js config
5. **Connection Pooling**: Configured in Prisma

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
psql -U postgres -d school_emr_prod -c "SELECT 1;"
```

### Application Won't Start

1. Check logs: `npm start` or check service logs
2. Verify environment variables: `echo $DATABASE_URL`
3. Check port availability: `netstat -an | findstr 5005`
4. Verify Prisma client: `npx prisma generate`

### Migration Issues

```bash
# Reset migrations (CAUTION: Data loss)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

## Support

For production issues, check:
- Application logs
- Database logs
- System logs
- HL7 message status in the application

## Default Production Credentials

After seeding:
- **Admin**: admin@emr.local / admin123
- **Change immediately after first login!**


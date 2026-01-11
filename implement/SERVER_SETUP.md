# Production Server Setup Guide

Complete guide for configuring the production server for Taaleem Clinic Management.

## Table of Contents

1. [Server Requirements](#server-requirements)
2. [Operating System Setup](#operating-system-setup)
3. [Node.js Installation](#nodejs-installation)
4. [Application Directory Structure](#application-directory-structure)
5. [Service Configuration](#service-configuration)
6. [Reverse Proxy Setup](#reverse-proxy-setup)
7. [Firewall Configuration](#firewall-configuration)
8. [SSL/TLS Configuration](#ssltls-configuration)

---

## Server Requirements

### Minimum Requirements

- **CPU:** 2 cores
- **RAM:** 4 GB
- **Storage:** 20 GB SSD
- **Network:** 100 Mbps

### Recommended Requirements

- **CPU:** 4+ cores
- **RAM:** 8+ GB
- **Storage:** 50+ GB SSD
- **Network:** 1 Gbps

### Software Requirements

- **OS:** Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **Node.js:** 20.x or higher
- **PostgreSQL:** 12.x or higher
- **Nginx/Apache:** For reverse proxy (optional but recommended)

---

## Operating System Setup

### Linux (Ubuntu/Debian)

**1. Update System:**
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

**2. Install Essential Tools:**
```bash
sudo apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    ufw \
    fail2ban
```

**3. Configure Timezone:**
```bash
sudo timedatectl set-timezone Asia/Dubai
```

**4. Create Application User:**
```bash
sudo useradd -m -s /bin/bash emr-app
sudo mkdir -p /opt/emr
sudo chown emr-app:emr-app /opt/emr
```

### Linux (CentOS/RHEL)

**1. Update System:**
```bash
sudo yum update -y
```

**2. Install Essential Tools:**
```bash
sudo yum install -y \
    curl \
    wget \
    git \
    gcc \
    gcc-c++ \
    make \
    firewalld \
    fail2ban
```

**3. Configure Timezone:**
```bash
sudo timedatectl set-timezone Asia/Dubai
```

**4. Create Application User:**
```bash
sudo useradd -m -s /bin/bash emr-app
sudo mkdir -p /opt/emr
sudo chown emr-app:emr-app /opt/emr
```

### Windows Server

1. Install Windows Updates
2. Install Git for Windows
3. Configure Windows Firewall
4. Create application directory: `C:\EMR`

---

## Node.js Installation

### Linux - Using NodeSource Repository (Recommended)

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**CentOS/RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

**Verify Installation:**
```bash
node --version  # Should be v20.x or higher
npm --version   # Should be 10.x or higher
```

### Linux - Using NVM (Alternative)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
```

### Windows

1. Download Node.js installer from https://nodejs.org/
2. Run installer and follow wizard
3. Verify: `node --version` and `npm --version`

---

## Application Directory Structure

### Recommended Structure

```
/opt/emr/                    # Application root (Linux)
├── .env                     # Environment variables (DO NOT COMMIT)
├── .gitignore
├── package.json
├── package-lock.json
├── next.config.js
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── app/                     # Next.js app directory
├── components/
├── lib/
├── security/
├── public/
├── .next/                   # Build output (generated)
├── node_modules/            # Dependencies
├── logs/                    # Application logs
│   ├── app.log
│   └── error.log
└── backups/                 # Database backups
    └── db/
```

**Set Permissions:**
```bash
sudo chown -R emr-app:emr-app /opt/emr
sudo chmod 750 /opt/emr
sudo chmod 600 /opt/emr/.env
```

---

## Service Configuration

### Option 1: PM2 (Recommended)

**Install PM2:**
```bash
sudo npm install -g pm2
```

**Create PM2 Configuration** (`/opt/emr/ecosystem.config.js`):
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
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};
```

**Create Log Directory:**
```bash
sudo mkdir -p /var/log/emr
sudo chown emr-app:emr-app /var/log/emr
```

**Start Application:**
```bash
cd /opt/emr
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

**PM2 Commands:**
```bash
pm2 status                    # Check status
pm2 logs taaleem-clinic-emr   # View logs
pm2 restart taaleem-clinic-emr # Restart
pm2 stop taaleem-clinic-emr    # Stop
pm2 monit                     # Monitor
```

### Option 2: Systemd Service

**Create Service File** (`/etc/systemd/system/taaleem-emr.service`):
```ini
[Unit]
Description=Taaleem Clinic Management EMR
Documentation=https://github.com/your-repo
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=emr-app
Group=emr-app
WorkingDirectory=/opt/emr
Environment=NODE_ENV=production
Environment=PORT=5005
EnvironmentFile=/opt/emr/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=taaleem-emr

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/emr /var/log/emr

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

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

**Useful Commands:**
```bash
sudo systemctl start taaleem-emr    # Start
sudo systemctl stop taaleem-emr     # Stop
sudo systemctl restart taaleem-emr  # Restart
sudo systemctl status taaleem-emr   # Status
sudo journalctl -u taaleem-emr -f   # View logs
```

### Option 3: Windows Service

**Using NSSM:**

1. Download NSSM from https://nssm.cc/download
2. Extract to `C:\nssm`
3. Open Command Prompt as Administrator:
```cmd
cd C:\nssm\win64
nssm install TaaleemEMR
```

4. Configure:
   - **Path:** `C:\Program Files\nodejs\npm.cmd`
   - **Startup directory:** `C:\EMR`
   - **Arguments:** `start`
   - **Service name:** `TaaleemEMR`

5. Start service:
```cmd
nssm start TaaleemEMR
```

---

## Reverse Proxy Setup

### Nginx Configuration

**Install Nginx:**
```bash
sudo apt-get install nginx  # Ubuntu/Debian
sudo yum install nginx      # CentOS/RHEL
```

**Create Configuration** (`/etc/nginx/sites-available/taaleem-emr`):
```nginx
# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Certificate Configuration
    ssl_certificate /etc/ssl/certs/taaleem-emr.crt;
    ssl_certificate_key /etc/ssl/private/taaleem-emr.key;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/taaleem-emr-access.log;
    error_log /var/log/nginx/taaleem-emr-error.log;

    # Client body size (for file uploads)
    client_max_body_size 10M;

    # Proxy Settings
    location / {
        proxy_pass http://localhost:5005;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint (optional)
    location /health {
        proxy_pass http://localhost:5005/api/health;
        access_log off;
    }
}
```

**Enable Site:**
```bash
sudo ln -s /etc/nginx/sites-available/taaleem-emr /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Apache Configuration (Alternative)

**Install Apache:**
```bash
sudo apt-get install apache2  # Ubuntu/Debian
sudo yum install httpd        # CentOS/RHEL
```

**Enable Required Modules:**
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod ssl
sudo a2enmod rewrite
```

**Create Virtual Host** (`/etc/apache2/sites-available/taaleem-emr.conf`):
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/taaleem-emr.crt
    SSLCertificateKeyFile /etc/ssl/private/taaleem-emr.key
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    <Location />
        ProxyPass http://localhost:5005/
        ProxyPassReverse http://localhost:5005/
    </Location>
    
    ErrorLog ${APACHE_LOG_DIR}/taaleem-emr-error.log
    CustomLog ${APACHE_LOG_DIR}/taaleem-emr-access.log combined
</VirtualHost>
```

**Enable Site:**
```bash
sudo a2ensite taaleem-emr
sudo systemctl restart apache2
```

---

## Firewall Configuration

### Linux (UFW)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application port (if direct access needed)
sudo ufw allow 5005/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Linux (firewalld)

```bash
# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Allow application port
sudo firewall-cmd --permanent --add-port=5005/tcp

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

### Windows Firewall

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Create Inbound Rules:
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 5005 (Application, optional)

---

## SSL/TLS Configuration

### Using Let's Encrypt (Free SSL)

**Install Certbot:**
```bash
sudo apt-get install certbot python3-certbot-nginx  # Ubuntu/Debian
sudo yum install certbot python3-certbot-nginx     # CentOS/RHEL
```

**Obtain Certificate:**
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**Auto-renewal:**
```bash
# Certbot automatically sets up renewal
# Test renewal:
sudo certbot renew --dry-run
```

### Using Commercial SSL Certificate

1. Obtain SSL certificate from provider
2. Place certificate files:
   - Certificate: `/etc/ssl/certs/taaleem-emr.crt`
   - Private Key: `/etc/ssl/private/taaleem-emr.key`
   - CA Bundle: `/etc/ssl/certs/taaleem-emr-ca.crt` (if provided)

3. Set permissions:
```bash
sudo chmod 644 /etc/ssl/certs/taaleem-emr.crt
sudo chmod 600 /etc/ssl/private/taaleem-emr.key
```

4. Update Nginx configuration with certificate paths

---

## Log Management

### Application Logs

**Create Log Directory:**
```bash
sudo mkdir -p /var/log/emr
sudo chown emr-app:emr-app /var/log/emr
```

**Log Rotation** (`/etc/logrotate.d/taaleem-emr`):
```
/var/log/emr/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 emr-app emr-app
    sharedscripts
    postrotate
        pm2 reloadLogs 2>/dev/null || true
    endscript
}
```

### System Logs

**View Application Logs:**
```bash
# PM2
pm2 logs taaleem-clinic-emr

# Systemd
sudo journalctl -u taaleem-emr -f

# Direct
tail -f /var/log/emr/out.log
tail -f /var/log/emr/error.log
```

---

## Performance Optimization

### Node.js Optimization

**Set Node Options in `.env`:**
```env
NODE_OPTIONS="--max-old-space-size=2048"
```

### System Limits

**Increase File Descriptor Limits** (`/etc/security/limits.conf`):
```
emr-app soft nofile 65536
emr-app hard nofile 65536
```

**Apply Changes:**
```bash
sudo systemctl daemon-reload
sudo systemctl restart taaleem-emr
```

---

## Monitoring

### Health Check Endpoint

Create `/opt/emr/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
```

**Test:**
```bash
curl http://localhost:5005/api/health
```

### Process Monitoring

**PM2 Monitoring:**
```bash
pm2 monit
```

**System Monitoring:**
```bash
# CPU and Memory
top
htop

# Disk Usage
df -h

# Network
netstat -tulpn | grep 5005
```

---

## Backup Strategy

### Application Backup

```bash
# Backup application files
tar -czf /backup/emr-app-$(date +%Y%m%d).tar.gz /opt/emr --exclude='node_modules' --exclude='.next'
```

### Automated Backup Script

See `DATABASE_SETUP.md` for database backup configuration.

---

## Security Hardening

1. **Keep System Updated:**
   ```bash
   sudo apt-get update && sudo apt-get upgrade  # Ubuntu/Debian
   sudo yum update                              # CentOS/RHEL
   ```

2. **Install Fail2Ban:**
   ```bash
   sudo apt-get install fail2ban  # Ubuntu/Debian
   sudo yum install fail2ban      # CentOS/RHEL
   ```

3. **Disable Root Login (SSH):**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   sudo systemctl restart sshd
   ```

4. **Regular Security Audits:**
   ```bash
   npm audit
   npm audit fix
   ```

---

## Troubleshooting

### Application Won't Start

1. Check logs: `pm2 logs` or `journalctl -u taaleem-emr`
2. Verify environment variables: `cat .env`
3. Test database connection: `npx prisma db pull`
4. Check port availability: `netstat -tulpn | grep 5005`

### High Memory Usage

1. Check process: `pm2 monit` or `top`
2. Restart application: `pm2 restart taaleem-clinic-emr`
3. Increase Node.js memory: Set `NODE_OPTIONS` in `.env`

### Connection Issues

1. Check firewall: `sudo ufw status`
2. Verify Nginx/Apache: `sudo nginx -t`
3. Check service status: `sudo systemctl status taaleem-emr`

---

## Next Steps

After server setup:
1. Configure database (see `DATABASE_SETUP.md`)
2. Set environment variables (see `ENVIRONMENT_VARIABLES.md`)
3. Deploy application (see `DEPLOYMENT.md`)
4. Verify deployment (see `POST_DEPLOYMENT.md`)


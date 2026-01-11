# Quick Start Guide
## NGINX + PM2 Production Deployment

## 🚀 Fastest Deployment (5 Minutes)

### Step 1: Run Deployment Script

**Linux:**
```bash
chmod +x deployment/scripts/deploy.sh
sudo bash deployment/scripts/deploy.sh
```

**Windows:**
```powershell
# Run in PowerShell as Administrator
.\deployment\scripts\install-pm2.ps1
.\deployment\scripts\install-nginx.ps1
```

### Step 2: Configure SSL

**Using Let's Encrypt (Recommended):**
```bash
sudo bash deployment/scripts/setup-ssl.sh
# Choose option 1
```

**Or manually:**
- Copy your SSL certificate to `/etc/nginx/ssl/`
- Update paths in NGINX configuration

### Step 3: Update Configuration

Edit `/etc/nginx/sites-available/taaleem-emr`:
- Replace `your-domain.com` with your domain
- Update application path if needed

### Step 4: Start Services

```bash
# Start PM2
pm2 start ecosystem.config.js
pm2 save

# Reload NGINX
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Verify

```bash
# Check PM2
pm2 status

# Check NGINX
sudo systemctl status nginx

# Test application
curl https://your-domain.com/api/health
```

## ✅ Done!

Your application is now running with:
- ✅ Load balancing (4+ instances)
- ✅ Auto-recovery (PM2)
- ✅ SSL/TLS encryption
- ✅ Security headers
- ✅ Rate limiting
- ✅ Malaffi compliance

## 📚 Next Steps

- Read full documentation: `deployment/README.md`
- Review compliance: `deployment/MALAFFI_COMPLIANCE.md`
- Setup monitoring: See monitoring section in README


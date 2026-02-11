# Production Start Guide
## Taaleem Clinic Management System

---

## 🚀 Quick Start Options

### Option 1: Standard Production Start with PM2 (Recommended)
```batch
run\start.bat
```

**Features:**
- ✅ Starts server on port 8000 using PM2
- ✅ Cluster mode (uses all CPU cores for load balancing)
- ✅ Accessible on all network interfaces (0.0.0.0)
- ✅ Intranet access enabled
- ✅ Production environment configured
- ✅ Auto-builds if needed
- ✅ Auto-restart on crashes
- ✅ Process management with PM2

**Access:**
- Local: `http://localhost:8000`
- Network: `http://[SERVER_IP]:8000`

### Option 1b: Restart Production Application
```batch
run\restart.bat
```

**Features:**
- ✅ Gracefully restarts all PM2 instances
- ✅ Runs database migrations
- ✅ Regenerates Prisma client
- ✅ Rebuilds if needed
- ✅ Preserves PM2 configuration

### Option 1c: Stop Production Application
```batch
run\stop.bat
```

**Features:**
- ✅ Stops all PM2 processes
- ✅ Cleans up processes on ports 8000 and 5005
- ✅ Use before starting if you encounter port conflicts

---

### Option 2: Production with Watchdog (Recommended for 24/7 Operation)
```batch
run\start-watchdog.bat
```

**Features:**
- ✅ All features from Option 1
- ✅ Auto-recovery on crashes
- ✅ Health monitoring (every 30 seconds)
- ✅ Security monitoring (every 5 minutes)
- ✅ Comprehensive logging
- ✅ Restart protection

**Best For:**
- Production servers
- Unattended operation
- High availability requirements

---

## 📋 Pre-Start Checklist

Before starting the production server:

- [ ] **Node.js Installed**: Verify with `node --version`
- [ ] **Dependencies Installed**: Run `run\install.bat` if needed
- [ ] **Application Built**: Run `run\build.bat` if needed
- [ ] **Environment Configured**: Ensure `.env` file exists with:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `NODE_ENV=production`
  - `PORT=8000`
- [ ] **PostgreSQL Running**: Verify database is accessible
- [ ] **Firewall Configured**: Port 8000 should be open for intranet access

---

## 🔧 Configuration Details

### Network Binding

The production server is configured to bind to `0.0.0.0`, which means:
- ✅ Accessible from localhost
- ✅ Accessible from other devices on the network
- ✅ Accessible via server IP address

### Port Configuration

- **Default Port**: 8000 (PM2 and direct start)
- **PM2 Configuration**: Port 8000 (configured in `ecosystem.config.js`)
- **Configurable**: Set `PORT` in `.env` file or `ecosystem.config.js`
- **Firewall**: Ensure port is open for intranet access

### Environment Variables

Required in `.env`:
```env
NODE_ENV=production
PORT=8000
DATABASE_URL=postgresql://...
JWT_SECRET=...
MALAFFI_API_URL=...
MALAFFI_API_KEY=...
```

---

## 🌐 Access Information

### Finding Server IP Address

**Windows:**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object IPAddress
```

**Result Example**: `10.24.0.10`

### Access URLs

Once you have the server IP:

- **Local Access**: `http://localhost:8000`
- **Intranet Access**: `http://10.24.0.10:8000`

---

## 🔒 Security Considerations

### Intranet Access (HTTP)

- ✅ Cookies work correctly (non-secure for HTTP)
- ✅ Still protected with `httpOnly` and `sameSite`
- ⚠️ Consider HTTPS for production (use NGINX reverse proxy)

### Production (HTTPS)

- ✅ Full security with secure cookies
- ✅ SSL/TLS encryption
- ✅ See `deployment/` folder for NGINX setup

---

## 📊 Monitoring

### Standard Start (`start.bat`)

- Monitor server output in console
- Check for errors in console
- No automatic restart on crashes

### Watchdog Start (`start-watchdog.bat`)

- **Logs**: `logs/watchdog.log` and `logs/server.log`
- **Health Checks**: Automatic every 30 seconds
- **Security Monitoring**: Automatic every 5 minutes
- **Auto-Restart**: On crashes (max 10 per minute)

---

## 🛠️ Troubleshooting

### Server Won't Start

**If you see "Port already in use" or "EADDRINUSE" error:**

1. **Stop all processes**:
   ```batch
   run\stop.bat
   ```
   This will clean up any existing processes on ports 8000 and 5005.

2. **Then try starting again**:
   ```batch
   run\start.bat
   ```

**Other common issues:**

1. **Check Node.js**:
   ```batch
   node --version
   ```

2. **Check Dependencies**:
   ```batch
   run\install.bat
   ```

3. **Check Build**:
   ```batch
   run\build.bat
   ```

4. **Check Environment**:
   - Verify `.env` file exists
   - Check `DATABASE_URL` is correct
   - Verify PostgreSQL is running

5. **Check PM2 Status**:
   ```powershell
   pm2 list
   pm2 logs taaleem-emr --lines 50
   ```

6. **Check Port Usage**:
   ```powershell
   netstat -ano | findstr :5005
   ```

### Cannot Access from Network

1. **Check Firewall**:
   ```powershell
   New-NetFirewallRule -DisplayName "Taaleem EMR - Port 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
   ```

2. **Check Server Binding**:
   - Verify server shows: `Network: http://0.0.0.0:8000`
   - If shows `localhost`, check `package.json` start script

3. **Check IP Address**:
   - Verify correct IP address
   - Ensure devices are on same network

### Port Already in Use

1. **Find Process**:
   ```powershell
   netstat -ano | findstr :8000
   ```

2. **Stop Process**:
   ```powershell
   Stop-Process -Id [PID] -Force
   ```

---

## 📝 Script Details

### `start.bat`

**What it does:**
1. Checks Node.js and PM2 installation
2. Verifies dependencies
3. Builds application if needed
4. Generates Prisma client
5. Runs database migrations
6. Starts server with PM2 in cluster mode on port 8000
7. Saves PM2 configuration

**Output:**
- Server accessible on all network interfaces
- PM2 manages multiple instances (cluster mode)
- Use `pm2 list` to check status
- Use `restart.bat` to restart

### `restart.bat`

**What it does:**
1. Checks if application is running with PM2
2. Regenerates Prisma client (if schema changed)
3. Runs database migrations (if schema changed)
4. Rebuilds application if needed
5. Gracefully restarts all PM2 instances
6. Saves PM2 configuration

**Output:**
- All instances restarted gracefully
- PM2 status displayed
- Application accessible immediately after restart

### `start-watchdog.bat`

**What it does:**
1. All steps from `start.bat`
2. Starts watchdog service
3. Watchdog manages server process
4. Auto-restarts on crashes
5. Monitors health and security

**Output:**
- Watchdog logs to `logs/watchdog.log`
- Server logs to `logs/server.log`
- Console shows watchdog status

---

## ✅ Verification

After starting, verify:

1. **Server is Running**:
   ```powershell
   pm2 list
   ```
   Or check port:
   ```powershell
   netstat -ano | findstr :5005
   ```

2. **Health Check**:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:8000/api/health" -UseBasicParsing
   ```

3. **PM2 Status**:
   ```powershell
   pm2 status
   pm2 logs taaleem-emr --lines 50
   ```

4. **Network Access**:
   - Open browser on another device
   - Navigate to `http://[SERVER_IP]:8000`
   - Should see login page

---

## 🎯 Recommended Setup

### For Intranet Production:

1. **First Time Setup**:
   ```batch
   run\install.bat
   run\build.bat
   ```

2. **Start Server**:
   ```batch
   run\start.bat
   ```

3. **Restart Server** (after updates):
   ```batch
   run\restart.bat
   ```

4. **Configure Firewall**:
   ```powershell
   New-NetFirewallRule -DisplayName "Taaleem EMR - Port 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
   ```

5. **Access Application**:
   - Get server IP address
   - Access from any device: `http://[SERVER_IP]:8000`

---

## 📚 Additional Resources

- **Full Deployment Guide**: `deployment/README.md`
- **Watchdog Documentation**: `WATCHDOG_IMPLEMENTATION.md`
- **Production Deployment**: `deployment/PRODUCTION_ACCESS.md`
- **Troubleshooting**: `TROUBLESHOOTING_LOGIN.md`

---

**Last Updated**: December 2024  
**Status**: ✅ Production Ready


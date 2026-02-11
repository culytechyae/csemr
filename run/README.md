# Run Scripts Documentation

This directory contains batch scripts for managing the Taaleem Clinic Management application.

## Scripts

### `start.bat`
Starts the production server using PM2 on port 8000.

**Usage:**
```batch
start.bat
```

**Features:**
- Checks for Node.js and PM2 installation
- Verifies dependencies
- Builds application if needed
- Generates Prisma client
- Runs database migrations
- Starts production server with PM2 in cluster mode
- Uses all CPU cores for load balancing
- Auto-restart on crashes

### `restart.bat` ⭐ **NEW**
Restarts the production server gracefully using PM2.

**Usage:**
```batch
restart.bat
```

**Features:**
- Gracefully restarts all PM2 instances
- Regenerates Prisma client (if schema changed)
- Runs database migrations (if schema changed)
- Rebuilds application if needed
- Preserves PM2 configuration
- Shows PM2 status after restart

### `stop.bat` ⭐ **NEW**
Stops the production server and cleans up all processes.

**Usage:**
```batch
stop.bat
```

**Features:**
- Stops PM2 processes
- Kills processes on ports 8000 and 5005
- Cleans up any hanging processes
- Use before starting if you encounter port conflicts

### `start-dev.bat`
Starts the development server with hot-reload on port 3000.

**Usage:**
```batch
start-dev.bat
```

**Features:**
- Development mode with hot-reload
- Runs on port 3000
- Automatic rebuild on file changes

### `start-watchdog.bat` ⭐ **NEW - Recommended for Production**
Starts the server with watchdog monitoring and auto-recovery.

**Usage:**
```batch
start-watchdog.bat
```

**Features:**
- **Auto-recovery**: Automatically restarts server on crashes
- **Health monitoring**: Checks server health every 30 seconds
- **Security monitoring**: Runs security checks every 5 minutes
- **Crash protection**: Maximum 10 restarts per minute (prevents restart loops)
- **Logging**: All events logged to `logs/watchdog.log` and `logs/server.log`

**Watchdog Features:**
- Monitors server process
- Automatic restart on crash
- Health check endpoint monitoring
- Continuous security monitoring
- Graceful shutdown handling
- Restart attempt limiting

### `build.bat`
Builds the application for production.

**Usage:**
```batch
build.bat
```

**Features:**
- Installs dependencies
- Generates Prisma client
- Builds Next.js application

### `install.bat`
Installs all dependencies and generates Prisma client.

**Usage:**
```batch
install.bat
```

## Watchdog System

The watchdog system provides:

1. **Process Monitoring**: Monitors the server process and detects crashes
2. **Auto-Recovery**: Automatically restarts the server if it crashes
3. **Health Checks**: Verifies server is responding via `/api/health` endpoint
4. **Security Monitoring**: Continuously monitors for suspicious activity
5. **Logging**: Comprehensive logging of all events

### Watchdog Logs

Logs are stored in the `logs/` directory:
- `logs/watchdog.log` - Watchdog service logs
- `logs/server.log` - Server output logs

### Security Monitoring

The watchdog automatically runs security checks every 5 minutes:
- Brute force attack detection
- Account compromise risk alerts
- Locked account monitoring
- Password expiration alerts

All security alerts are logged to the database (`SecurityEvent` table) and the watchdog log.

### Health Check Endpoint

The watchdog monitors the server via:
```
GET http://localhost:8000/api/health
```

This endpoint checks:
- Server is running
- Database connectivity
- Server uptime

### Restart Protection

The watchdog includes protection against restart loops:
- Maximum 10 restarts per minute
- Automatic shutdown if limit exceeded
- Prevents infinite restart cycles

## Troubleshooting

### Server Won't Start

**Common Issues:**

1. **Port Already in Use**
   - Error: `EADDRINUSE: address already in use`
   - Solution: Run `stop.bat` to clean up existing processes
   - Or manually: `netstat -ano | findstr :8000` then `taskkill /PID [PID] /F`

2. **PM2 Process Already Running**
   - Error: "Application is already running with PM2!"
   - Solution: Use `restart.bat` or `stop.bat` first

3. **Node.js Not Found**
   - Error: "Node.js is not installed or not in PATH"
   - Solution: Install Node.js from https://nodejs.org/

4. **Dependencies Missing**
   - Error: "Failed to install dependencies"
   - Solution: Run `install.bat` first

5. **Build Missing**
   - Error: "Build failed" or ".next not found"
   - Solution: Run `build.bat` first

6. **Database Connection Issues**
   - Error: Database migration failed
   - Solution: Verify PostgreSQL is running and `.env` has correct `DATABASE_URL`

**Diagnostic Steps:**
1. Check Node.js is installed: `node --version`
2. Verify dependencies: `npm install`
3. Check environment variables: `.env` file
4. Review logs: `logs/pm2-error.log` and `logs/pm2-out.log`
5. Check ports: `netstat -ano | findstr :8000`
6. Stop all processes: `stop.bat`
7. Try starting again: `start.bat`

### Watchdog Not Restarting
1. Check restart limit hasn't been exceeded
2. Review watchdog logs for errors
3. Verify health check endpoint is accessible
4. Check server logs for crash reasons

### Security Monitoring Not Working
1. Verify database connection
2. Check security monitoring API endpoint
3. Review security monitor logs
4. Ensure Prisma client is generated

## Production Deployment

For production deployment, use:
```batch
start.bat
```

This ensures:
- PM2 process management
- Cluster mode (load balancing)
- Automatic recovery from crashes
- Multiple instances for high availability

To restart after updates:
```batch
restart.bat
```

This will:
- Gracefully restart all instances
- Apply database migrations
- Regenerate Prisma client
- Rebuild if needed

## Manual Security Monitoring

To run security monitoring as a standalone service:
```batch
npm run monitor:security
```

This runs the security monitoring service independently of the watchdog.

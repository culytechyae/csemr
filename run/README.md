# Run Scripts Documentation

This directory contains batch scripts for managing the Taaleem Clinic Management application.

## Scripts

### `start.bat`
Starts the production server on port 5005.

**Usage:**
```batch
start.bat
```

**Features:**
- Checks for Node.js installation
- Verifies dependencies
- Builds application if needed
- Generates Prisma client
- Starts production server

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
GET http://localhost:5005/api/health
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
1. Check Node.js is installed: `node --version`
2. Verify dependencies: `npm install`
3. Check environment variables: `.env` file
4. Review logs: `logs/watchdog.log` and `logs/server.log`

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
start-watchdog.bat
```

This ensures:
- Automatic recovery from crashes
- Continuous security monitoring
- Health monitoring
- Comprehensive logging

## Manual Security Monitoring

To run security monitoring as a standalone service:
```batch
npm run monitor:security
```

This runs the security monitoring service independently of the watchdog.

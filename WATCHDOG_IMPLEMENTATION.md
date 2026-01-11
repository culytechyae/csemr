# Watchdog & Security Monitoring Implementation

## Overview

A comprehensive watchdog system has been implemented to monitor the server, provide auto-recovery on crashes, and continuously monitor for suspicious security activity.

## Features Implemented

### 1. Server Watchdog (`scripts/watchdog.js`)
- **Process Monitoring**: Monitors the server process continuously
- **Auto-Recovery**: Automatically restarts server on crashes
- **Health Checks**: Verifies server health every 30 seconds
- **Security Monitoring**: Runs security checks every 5 minutes
- **Restart Protection**: Maximum 10 restarts per minute (prevents infinite loops)
- **Comprehensive Logging**: All events logged to `logs/watchdog.log` and `logs/server.log`

### 2. Health Check Endpoint (`app/api/health/route.ts`)
- **Endpoint**: `GET /api/health`
- **Checks**: Server status, database connectivity, uptime
- **Response**: JSON with health status and timestamp
- **Used by**: Watchdog for health monitoring

### 3. Security Monitoring Service (`scripts/security-monitor-service.js`)
- **Standalone Service**: Can run independently
- **Continuous Monitoring**: Checks for suspicious activity every 5 minutes
- **Detects**:
  - Brute force attacks (10+ failed logins from same IP)
  - Account compromise risks (3+ failed login attempts)
  - Locked accounts
  - Expired passwords
- **Logging**: All alerts saved to database (`SecurityEvent` table) and log files

### 4. Integrated Security Monitoring
- **Watchdog Integration**: Security checks run automatically with watchdog
- **Database Logging**: All security alerts saved to database
- **Real-time Detection**: Monitors login attempts, account status, password expiration

## Usage

### Start Server with Watchdog (Recommended for Production)

```batch
run\start-watchdog.bat
```

Or using npm:
```bash
npm run start:watchdog
```

### Start Standalone Security Monitoring

```bash
npm run monitor:security
```

### Health Check

Access the health endpoint:
```
GET http://localhost:5005/api/health
```

## Watchdog Features

### Auto-Recovery
- Automatically detects server crashes
- Restarts server within 5 seconds
- Tracks restart attempts
- Stops after 10 restarts per minute (prevents loops)

### Health Monitoring
- Checks server health every 30 seconds
- Verifies `/api/health` endpoint
- Logs health check results
- Continues monitoring even if health check fails

### Security Monitoring
- Runs security checks every 5 minutes
- Detects suspicious activity patterns
- Logs all security alerts to database
- Monitors:
  - Failed login attempts
  - Account lockouts
  - Password expirations
  - Brute force attacks

### Logging
- **Watchdog Log**: `logs/watchdog.log`
  - Watchdog service events
  - Server start/stop events
  - Health check results
  - Security check results
  - Restart attempts

- **Server Log**: `logs/server.log`
  - Server stdout/stderr
  - Application logs
  - Error messages

## Security Monitoring Details

### Detected Threats

1. **Brute Force Attacks**
   - Threshold: 10+ failed login attempts from same IP in 1 hour
   - Severity: HIGH
   - Action: Logged to SecurityEvent table

2. **Account Compromise Risk**
   - Threshold: 3+ failed login attempts on account
   - Severity: MEDIUM
   - Action: Logged to SecurityEvent table

3. **Locked Accounts**
   - Detection: Accounts with active lockout
   - Severity: MEDIUM
   - Action: Logged to SecurityEvent table

4. **Expired Passwords**
   - Detection: Passwords past expiration date
   - Severity: LOW
   - Action: Logged to SecurityEvent table

### Security Event Storage

All security alerts are stored in:
- **Database**: `SecurityEvent` table
- **Logs**: `logs/security-monitor.log` (if running standalone)

## Configuration

### Watchdog Settings

Edit `scripts/watchdog.js` to adjust:
- `MAX_RESTARTS`: Maximum restart attempts (default: 10)
- `RESTART_WINDOW`: Time window for restart limit (default: 60000ms = 1 minute)
- `HEALTH_CHECK_INTERVAL`: Health check frequency (default: 30000ms = 30 seconds)
- `SECURITY_CHECK_INTERVAL`: Security check frequency (default: 300000ms = 5 minutes)

### Security Monitoring Settings

Edit `scripts/security-monitor-service.js` to adjust:
- `CHECK_INTERVAL`: Security check frequency (default: 300000ms = 5 minutes)

## Monitoring & Alerts

### View Security Alerts

Access via API (Admin only):
```
GET /api/security/alerts
```

Or view in Admin UI:
- Navigate to Admin → Security → Alerts

### View Security Events

Access via API (Admin only):
```
GET /api/security/events
```

Or view in Admin UI:
- Navigate to Admin → Security → Events

### View Watchdog Logs

```bash
# Watchdog service logs
cat logs/watchdog.log

# Server output logs
cat logs/server.log
```

## Production Deployment

### Recommended Setup

1. **Use Watchdog**: Always use `start-watchdog.bat` in production
2. **Monitor Logs**: Regularly check `logs/watchdog.log`
3. **Review Alerts**: Check security alerts daily
4. **Health Checks**: Monitor health endpoint externally if needed

### Windows Service (Optional)

To run as a Windows service, use tools like:
- NSSM (Non-Sucking Service Manager)
- PM2 for Windows
- Windows Task Scheduler

Example with NSSM:
```batch
nssm install TaaleemEMR "C:\Program Files\nodejs\node.exe" "C:\EMR\scripts\watchdog.js"
nssm start TaaleemEMR
```

## Troubleshooting

### Server Keeps Restarting

1. Check `logs/server.log` for error messages
2. Review `logs/watchdog.log` for restart reasons
3. Verify environment variables are set correctly
4. Check database connectivity
5. Review application code for errors

### Health Check Failing

1. Verify server is running on port 5005
2. Check `/api/health` endpoint manually
3. Verify database connection
4. Review server logs for errors

### Security Monitoring Not Working

1. Verify database connection
2. Check Prisma client is generated
3. Review `logs/security-monitor.log` (if standalone)
4. Check watchdog logs for security check errors

### Watchdog Not Starting

1. Verify Node.js is installed
2. Check all dependencies are installed
3. Verify `.env` file exists
4. Check file permissions
5. Review error messages in console

## Best Practices

1. **Always Use Watchdog in Production**: Ensures automatic recovery
2. **Monitor Logs Regularly**: Check logs daily for issues
3. **Review Security Alerts**: Check security alerts weekly
4. **Set Up External Monitoring**: Use external monitoring tools if available
5. **Regular Backups**: Ensure database backups are running
6. **Update Dependencies**: Keep Node.js and npm packages updated

## API Endpoints

### Health Check
```
GET /api/health
```
- **Auth**: Not required
- **Response**: `{ status: 'healthy', timestamp: '...', uptime: 123 }`

### Security Alerts
```
GET /api/security/alerts
```
- **Auth**: Admin only
- **Response**: `{ alerts: [...] }`

### Security Events
```
GET /api/security/events
```
- **Auth**: Admin only
- **Response**: `{ events: [...] }`

## Files Created

1. `scripts/watchdog.js` - Main watchdog service
2. `scripts/security-monitor-service.js` - Standalone security monitoring
3. `app/api/health/route.ts` - Health check endpoint
4. `run/start-watchdog.bat` - Watchdog start script
5. `run/README.md` - Updated documentation

## Summary

The watchdog system provides:
- ✅ Automatic server recovery on crashes
- ✅ Continuous health monitoring
- ✅ Real-time security threat detection
- ✅ Comprehensive logging
- ✅ Production-ready reliability

All security alerts are automatically logged to the database and can be viewed in the Admin UI or via API endpoints.


/**
 * Server Watchdog
 * Monitors the server process and automatically restarts on crash
 * Also runs continuous security monitoring
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const WATCHDOG_LOG = path.join(LOG_DIR, 'watchdog.log');
const SERVER_LOG = path.join(LOG_DIR, 'server.log');
const MAX_RESTARTS = 10;
const RESTART_WINDOW = 60000; // 1 minute
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const SECURITY_CHECK_INTERVAL = 300000; // 5 minutes
const PORT = process.env.PORT || '8000';

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Logging utility
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}\n`;
  fs.appendFileSync(WATCHDOG_LOG, logMessage);
  console.log(`[${type}] ${message}`);
}

// Track restart attempts
let restartCount = 0;
let restartTimes = [];
let serverProcess = null;
let healthCheckInterval = null;
let securityCheckInterval = null;

// Clean old restart times
function cleanRestartTimes() {
  const now = Date.now();
  restartTimes = restartTimes.filter(time => now - time < RESTART_WINDOW);
}

// Check if we should restart
function shouldRestart() {
  cleanRestartTimes();
  if (restartTimes.length >= MAX_RESTARTS) {
    log(`Maximum restart attempts (${MAX_RESTARTS}) reached in ${RESTART_WINDOW / 1000} seconds. Stopping watchdog.`, 'ERROR');
    return false;
  }
  return true;
}

// Health check function
async function healthCheck() {
  try {
    const http = require('http');
    
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${PORT}/api/health`, { timeout: 5000 }, (res) => {
        if (res.statusCode === 200) {
          log('Health check passed', 'INFO');
          resolve(true);
        } else {
          log(`Health check failed: HTTP ${res.statusCode}`, 'WARNING');
          resolve(false);
        }
        res.resume(); // Consume response data to free up memory
      });
      
      req.on('error', (error) => {
        log(`Health check failed: ${error.message}`, 'WARNING');
        resolve(false);
      });
      
      req.on('timeout', () => {
        req.destroy();
        log('Health check timeout', 'WARNING');
        resolve(false);
      });
    });
  } catch (error) {
    log(`Health check error: ${error.message}`, 'WARNING');
    return false;
  }
}

// Security monitoring check
async function securityCheck() {
  try {
    log('Running security monitoring check...', 'INFO');
    
    // Use the standalone security monitoring service directly
    // This runs the monitoring logic without needing API authentication
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Check for multiple failed login attempts from same IP
      const recentFailedLogins = await prisma.loginAttempt.findMany({
        where: {
          success: false,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
        select: {
          ipAddress: true,
          email: true,
        },
      });

      // Group by IP
      const ipAttempts = new Map();
      for (const attempt of recentFailedLogins) {
        if (attempt.ipAddress) {
          ipAttempts.set(attempt.ipAddress, (ipAttempts.get(attempt.ipAddress) || 0) + 1);
        }
      }

      // Alert if more than 10 failed attempts from same IP
      for (const [ip, count] of ipAttempts.entries()) {
        if (count > 10) {
          await prisma.securityEvent.create({
            data: {
              eventType: 'BRUTE_FORCE_ATTEMPT',
              severity: 'HIGH',
              description: `Multiple failed login attempts (${count}) from IP: ${ip}`,
              metadata: JSON.stringify({ ip, count }),
            },
          });
          log(`Security Alert [HIGH]: BRUTE_FORCE_ATTEMPT - Multiple failed login attempts (${count}) from IP: ${ip}`, 'HIGH');
        }
      }

      // Check for accounts with many failed attempts
      const usersWithFailures = await prisma.user.findMany({
        where: {
          failedLoginAttempts: {
            gte: 3,
          },
        },
        select: {
          id: true,
          email: true,
          failedLoginAttempts: true,
        },
      });

      for (const user of usersWithFailures) {
        await prisma.securityEvent.create({
          data: {
            eventType: 'ACCOUNT_COMPROMISE_RISK',
            userId: user.id,
            severity: 'MEDIUM',
            description: `User ${user.email} has ${user.failedLoginAttempts} failed login attempts`,
            metadata: JSON.stringify({ failedAttempts: user.failedLoginAttempts }),
          },
        });
        log(`Security Alert [MEDIUM]: ACCOUNT_COMPROMISE_RISK - User ${user.email} has ${user.failedLoginAttempts} failed login attempts`, 'MEDIUM');
      }

      log('Security monitoring check completed', 'INFO');
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    // If server is not ready or database unavailable, skip security check
    if (error.code === 'ECONNREFUSED' || error.message.includes('connect')) {
      log('Database not available for security check, will retry later', 'INFO');
    } else {
      log(`Security check error: ${error.message}`, 'ERROR');
      console.error('Security check error:', error);
    }
  }
}

// Start the server
function startServer() {
  if (!shouldRestart()) {
    process.exit(1);
  }

  log('Starting server...', 'INFO');
  restartTimes.push(Date.now());

  // Set environment
  const env = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: process.env.PORT || '8000',
  };

  // Start the server process
  serverProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '..'),
    env: env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  // Log server output
  serverProcess.stdout.on('data', (data) => {
    const message = data.toString();
    fs.appendFileSync(SERVER_LOG, message);
    process.stdout.write(message);
  });

  serverProcess.stderr.on('data', (data) => {
    const message = data.toString();
    fs.appendFileSync(SERVER_LOG, message);
    process.stderr.write(message);
  });

  // Handle server exit
  serverProcess.on('exit', (code, signal) => {
    log(`Server exited with code ${code} and signal ${signal}`, 'ERROR');
    serverProcess = null;

    // Wait a bit before restarting
    setTimeout(() => {
      if (shouldRestart()) {
        log(`Restarting server... (Attempt ${restartTimes.length}/${MAX_RESTARTS})`, 'WARNING');
        startServer();
      } else {
        log('Watchdog stopping due to excessive restarts', 'ERROR');
        process.exit(1);
      }
    }, 5000); // Wait 5 seconds before restart
  });

  // Handle server errors
  serverProcess.on('error', (error) => {
    log(`Server process error: ${error.message}`, 'ERROR');
  });

  log('Server process started', 'INFO');
}

// Start health check interval
function startHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  healthCheckInterval = setInterval(async () => {
    if (serverProcess && serverProcess.pid) {
      const isHealthy = await healthCheck();
      if (!isHealthy) {
        log('Server health check failed, but process is still running. Monitoring...', 'WARNING');
      }
    }
  }, HEALTH_CHECK_INTERVAL);

  log('Health check monitoring started', 'INFO');
}

// Start security monitoring interval
function startSecurityMonitoring() {
  if (securityCheckInterval) {
    clearInterval(securityCheckInterval);
  }

  // Run initial check
  securityCheck();

  // Set up periodic checks
  securityCheckInterval = setInterval(() => {
    securityCheck();
  }, SECURITY_CHECK_INTERVAL);

  log('Security monitoring started', 'INFO');
}

// Graceful shutdown
function shutdown() {
  log('Watchdog shutting down...', 'INFO');

  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  if (securityCheckInterval) {
    clearInterval(securityCheckInterval);
  }

  if (serverProcess) {
    log('Terminating server process...', 'INFO');
    serverProcess.kill('SIGTERM');
    
    // Force kill after 10 seconds
    setTimeout(() => {
      if (serverProcess) {
        log('Force killing server process...', 'WARNING');
        serverProcess.kill('SIGKILL');
      }
      process.exit(0);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Handle process signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGUSR2', shutdown); // Nodemon restart signal

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'ERROR');
  console.error(error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection: ${reason}`, 'ERROR');
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start everything
log('========================================', 'INFO');
log('Taaleem Clinic Management - Watchdog', 'INFO');
log('Starting watchdog service...', 'INFO');
log('========================================', 'INFO');

startServer();
startHealthCheck();
startSecurityMonitoring();

log('Watchdog is now monitoring the server', 'INFO');
log(`Health checks every ${HEALTH_CHECK_INTERVAL / 1000} seconds`, 'INFO');
log(`Security checks every ${SECURITY_CHECK_INTERVAL / 1000} seconds`, 'INFO');
log('Press Ctrl+C to stop', 'INFO');


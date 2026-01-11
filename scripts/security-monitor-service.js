/**
 * Security Monitoring Service
 * Runs continuously to monitor for suspicious activity
 * Can be run as a standalone service or integrated with watchdog
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CHECK_INTERVAL = 300000; // 5 minutes
const LOG_FILE = require('path').join(__dirname, '..', 'logs', 'security-monitor.log');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Logging utility
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(`[${type}] ${message}`);
}

// Security monitoring check
async function checkSuspiciousActivity() {
  const alerts = [];

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
        alerts.push({
          type: 'BRUTE_FORCE_ATTEMPT',
          severity: 'HIGH',
          message: `Multiple failed login attempts (${count}) from IP: ${ip}`,
          metadata: { ip, count },
        });
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
      alerts.push({
        type: 'ACCOUNT_COMPROMISE_RISK',
        severity: 'MEDIUM',
        message: `User ${user.email} has ${user.failedLoginAttempts} failed login attempts`,
        userId: user.id,
        metadata: { failedAttempts: user.failedLoginAttempts },
      });
    }

    // Check for locked accounts
    const lockedAccounts = await prisma.user.findMany({
      where: {
        lockedUntil: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        lockedUntil: true,
      },
    });

    for (const account of lockedAccounts) {
      alerts.push({
        type: 'ACCOUNT_LOCKED',
        severity: 'MEDIUM',
        message: `Account ${account.email} is locked until ${account.lockedUntil}`,
        userId: account.id,
        metadata: { lockedUntil: account.lockedUntil },
      });
    }

    // Check for expired passwords
    const expiredPasswords = await prisma.user.findMany({
      where: {
        passwordExpiresAt: {
          lte: new Date(),
        },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        passwordExpiresAt: true,
      },
    });

    for (const user of expiredPasswords) {
      alerts.push({
        type: 'PASSWORD_EXPIRED',
        severity: 'LOW',
        message: `Password expired for user ${user.email}`,
        userId: user.id,
        metadata: { expiredAt: user.passwordExpiresAt },
      });
    }

    return alerts;
  } catch (error) {
    log(`Error checking suspicious activity: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Log security alert
async function logSecurityAlert(alert) {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType: alert.type,
        userId: alert.userId,
        severity: alert.severity,
        description: alert.message,
        metadata: alert.metadata ? JSON.stringify(alert.metadata) : null,
      },
    });
  } catch (error) {
    log(`Error logging security alert: ${error.message}`, 'ERROR');
  }
}

// Main monitoring loop
async function runMonitoring() {
  try {
    log('Running security monitoring check...', 'INFO');
    
    const alerts = await checkSuspiciousActivity();
    
    if (alerts.length > 0) {
      log(`Found ${alerts.length} security alert(s)`, 'WARNING');
      
      // Log all alerts
      for (const alert of alerts) {
        await logSecurityAlert(alert);
        log(`Security Alert [${alert.severity}]: ${alert.type} - ${alert.message}`, alert.severity);
      }
    } else {
      log('No security alerts detected', 'INFO');
    }
  } catch (error) {
    log(`Monitoring error: ${error.message}`, 'ERROR');
    console.error('Monitoring error:', error);
  }
}

// Graceful shutdown
async function shutdown() {
  log('Security monitoring service shutting down...', 'INFO');
  await prisma.$disconnect();
  process.exit(0);
}

// Handle process signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  log(`Uncaught exception: ${error.message}`, 'ERROR');
  console.error(error);
  await shutdown();
});

process.on('unhandledRejection', async (reason, promise) => {
  log(`Unhandled rejection: ${reason}`, 'ERROR');
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await shutdown();
});

// Start monitoring
log('========================================', 'INFO');
log('Security Monitoring Service', 'INFO');
log('Starting continuous security monitoring...', 'INFO');
log(`Check interval: ${CHECK_INTERVAL / 1000} seconds`, 'INFO');
log('========================================', 'INFO');

// Run initial check
runMonitoring();

// Set up periodic checks
const interval = setInterval(() => {
  runMonitoring();
}, CHECK_INTERVAL);

log('Security monitoring service is running', 'INFO');
log('Press Ctrl+C to stop', 'INFO');


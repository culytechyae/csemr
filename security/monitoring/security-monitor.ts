/**
 * Security Monitoring System
 * Detects and alerts on suspicious activities
 */

import { prisma } from '@/lib/prisma';

export interface SecurityAlert {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export async function checkSuspiciousActivity(): Promise<SecurityAlert[]> {
  const alerts: SecurityAlert[] = [];

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
  const ipAttempts = new Map<string, number>();
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
}

export async function logSecurityAlert(alert: SecurityAlert): Promise<void> {
  await prisma.securityEvent.create({
    data: {
      eventType: alert.type,
      userId: alert.userId,
      severity: alert.severity,
      description: alert.message,
      metadata: alert.metadata ? JSON.stringify(alert.metadata) : null,
    },
  });
}


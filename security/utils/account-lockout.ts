/**
 * Account Lockout Management
 * Handles account locking after failed login attempts
 */

import { prisma } from '@/lib/prisma';
import { DEFAULT_PASSWORD_POLICY } from '../config/password-policy';

export async function recordFailedLoginAttempt(
  email: string,
  userId: string | null,
  ipAddress: string | null,
  userAgent: string | null,
  reason: string
): Promise<void> {
  // Log the failed attempt
  await prisma.loginAttempt.create({
    data: {
      userId,
      email,
      success: false,
      ipAddress,
      userAgent,
      failureReason: reason,
    },
  });

  // If user exists, increment failed attempts
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    if (user) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const lockoutDuration = DEFAULT_PASSWORD_POLICY.lockoutDuration;
      const lockoutAttempts = DEFAULT_PASSWORD_POLICY.lockoutAttempts;

      let lockedUntil: Date | null = null;
      if (newAttempts >= lockoutAttempts) {
        lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + lockoutDuration);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil,
        },
      });

      // Log security event if account is locked
      if (lockedUntil) {
        await prisma.securityEvent.create({
          data: {
            eventType: 'ACCOUNT_LOCKED',
            userId,
            severity: 'HIGH',
            description: `Account locked due to ${newAttempts} failed login attempts`,
            ipAddress,
            userAgent,
            metadata: JSON.stringify({
              failedAttempts: newAttempts,
              lockedUntil: lockedUntil.toISOString(),
            }),
          },
        });
      }
    }
  }
}

export async function recordSuccessfulLogin(
  userId: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  // Log successful login
  await prisma.loginAttempt.create({
    data: {
      userId,
      email: '', // Will be populated from user
      success: true,
      ipAddress,
      userAgent,
    },
  });

  // Reset failed attempts and update last login
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    },
  });
}

export async function isAccountLocked(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });

  if (!user || !user.lockedUntil) {
    return false;
  }

  // Check if lockout period has expired
  if (new Date() > user.lockedUntil) {
    // Unlock the account
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    });
    return false;
  }

  return true;
}

export async function unlockAccount(userId: string, unlockedBy: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lockedUntil: null,
      failedLoginAttempts: 0,
    },
  });

  await prisma.securityEvent.create({
    data: {
      eventType: 'ACCOUNT_UNLOCKED',
      userId,
      severity: 'MEDIUM',
      description: `Account unlocked by administrator`,
      metadata: JSON.stringify({ unlockedBy }),
    },
  });
}


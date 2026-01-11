/**
 * Password Management Utilities
 * Handles password hashing, validation, and history
 */

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validatePassword as validatePasswordPolicy, calculatePasswordExpiry, DEFAULT_PASSWORD_POLICY } from '../config/password-policy';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function checkPasswordHistory(
  userId: string,
  newPassword: string,
  historyCount: number = DEFAULT_PASSWORD_POLICY.historyCount
): Promise<boolean> {
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: historyCount,
    select: { passwordHash: true },
  });

  for (const entry of history) {
    const matches = await verifyPassword(newPassword, entry.passwordHash);
    if (matches) {
      return false; // Password was used before
    }
  }

  return true; // Password is new
}

export async function savePasswordHistory(userId: string, passwordHash: string): Promise<void> {
  await prisma.passwordHistory.create({
    data: {
      userId,
      passwordHash,
    },
  });

  // Keep only the last N passwords (based on policy)
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: DEFAULT_PASSWORD_POLICY.historyCount,
    select: { id: true },
  });

  if (history.length > 0) {
    await prisma.passwordHistory.deleteMany({
      where: {
        id: { in: history.map((h) => h.id) },
      },
    });
  }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  // Validate new password
  const validation = validatePasswordPolicy(newPassword);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join(', '),
    };
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Current password is incorrect' };
  }

  // Check password history
  const isNewPassword = await checkPasswordHistory(userId, newPassword);
  if (!isNewPassword) {
    return {
      success: false,
      error: `You cannot reuse any of your last ${DEFAULT_PASSWORD_POLICY.historyCount} passwords`,
    };
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Save old password to history
  await savePasswordHistory(userId, user.passwordHash);

  // Update user password
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
      passwordChangedAt: new Date(),
      passwordExpiresAt: calculatePasswordExpiry(DEFAULT_PASSWORD_POLICY.maxAge),
      failedLoginAttempts: 0, // Reset failed attempts on password change
    },
  });

  return { success: true };
}

export async function resetPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  // Validate new password
  const validation = validatePasswordPolicy(newPassword);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join(', '),
    };
  }

  // Check password history
  const isNewPassword = await checkPasswordHistory(userId, newPassword);
  if (!isNewPassword) {
    return {
      success: false,
      error: `You cannot reuse any of your last ${DEFAULT_PASSWORD_POLICY.historyCount} passwords`,
    };
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Get current password hash for history
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (user) {
    await savePasswordHistory(userId, user.passwordHash);
  }

  // Update user password
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
      passwordChangedAt: new Date(),
      passwordExpiresAt: calculatePasswordExpiry(DEFAULT_PASSWORD_POLICY.maxAge),
      failedLoginAttempts: 0,
      lockedUntil: null, // Unlock account on password reset
    },
  });

  return { success: true };
}


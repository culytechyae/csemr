/**
 * Session Management
 * Handles session creation, validation, timeout, and concurrent session limits
 */

import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';

const SESSION_TIMEOUT_MINUTES = 15; // 15 minutes of inactivity
const MAX_CONCURRENT_SESSIONS = 3; // Maximum 3 concurrent sessions per user

export interface SessionInfo {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  lastActivityAt: Date;
}

export async function createSession(
  userId: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<SessionInfo> {
  // Check concurrent session limit
  const activeSessions = await prisma.session.findMany({
    where: {
      userId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'asc' },
  });

  // If at limit, deactivate oldest sessions
  if (activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
    const sessionsToDeactivate = activeSessions.slice(0, activeSessions.length - MAX_CONCURRENT_SESSIONS + 1);
    await prisma.session.updateMany({
      where: {
        id: { in: sessionsToDeactivate.map((s) => s.id) },
      },
      data: {
        isActive: false,
      },
    });
  }

  // Generate token
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      schoolId: true,
      firstName: true,
      lastName: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const token = generateToken(user);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Create session
  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
      lastActivityAt: new Date(),
    },
  });

  return {
    id: session.id,
    userId: session.userId,
    token: session.token,
    expiresAt: session.expiresAt,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    lastActivityAt: session.lastActivityAt,
  };
}

export async function validateSession(token: string): Promise<SessionInfo | null> {
  const session = await prisma.session.findUnique({
    where: { token },
  });

  if (!session || !session.isActive) {
    return null;
  }

  // Check if session expired
  if (new Date() > session.expiresAt) {
    await prisma.session.update({
      where: { id: session.id },
      data: { isActive: false },
    });
    return null;
  }

  // Check session timeout (inactivity)
  const lastActivity = session.lastActivityAt;
  const timeoutMs = SESSION_TIMEOUT_MINUTES * 60 * 1000;
  if (new Date().getTime() - lastActivity.getTime() > timeoutMs) {
    await prisma.session.update({
      where: { id: session.id },
      data: { isActive: false },
    });
    return null;
  }

  // Update last activity
  await prisma.session.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date() },
  });

  return {
    id: session.id,
    userId: session.userId,
    token: session.token,
    expiresAt: session.expiresAt,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    lastActivityAt: new Date(),
  };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { isActive: false },
  });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });
}

export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.updateMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        {
          AND: [
            { isActive: true },
            {
              lastActivityAt: {
                lt: new Date(Date.now() - SESSION_TIMEOUT_MINUTES * 60 * 1000),
              },
            },
          ],
        },
      ],
    },
    data: { isActive: false },
  });

  return result.count;
}


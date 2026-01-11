/**
 * Comprehensive Audit Logging System
 * Logs all security-relevant events and data access
 */

import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'PERMISSION_CHANGE'
  | 'DATA_EXPORT'
  | 'DATA_IMPORT'
  | 'HL7_SEND'
  | 'HL7_RECEIVE';

export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface AuditLogData {
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: string | null;
  severity?: AuditSeverity;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
}

export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes ? JSON.stringify(data.changes) : null,
        severity: data.severity || 'INFO',
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break the application
  }
}

export function getClientInfo(request: NextRequest): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  // Get IP address (considering proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') || null;

  const userAgent = request.headers.get('user-agent') || null;

  return { ipAddress, userAgent };
}

export async function logDataAccess(
  userId: string | null,
  entityType: string,
  entityId: string,
  action: AuditAction,
  request: NextRequest,
  metadata?: Record<string, any>
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(request);

  await logAuditEvent({
    userId,
    action,
    entityType,
    entityId,
    severity: 'INFO',
    ipAddress,
    userAgent,
    metadata,
  });
}

export async function logDataModification(
  userId: string | null,
  entityType: string,
  entityId: string,
  action: AuditAction,
  oldData: any,
  newData: any,
  request: NextRequest
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(request);

  const changes = {
    before: oldData,
    after: newData,
    timestamp: new Date().toISOString(),
  };

  await logAuditEvent({
    userId,
    action,
    entityType,
    entityId,
    changes: JSON.stringify(changes),
    severity: 'WARNING',
    ipAddress,
    userAgent,
  });
}

export async function logSecurityEvent(
  eventType: string,
  userId: string | null,
  severity: AuditSeverity,
  description: string,
  request: NextRequest,
  metadata?: Record<string, any>
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(request);

  // Log to SecurityEvent table
  try {
    await prisma.securityEvent.create({
      data: {
        eventType,
        userId,
        severity,
        description,
        ipAddress,
        userAgent,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }

  // Also log to audit log
  await logAuditEvent({
    userId,
    action: eventType as AuditAction,
    entityType: 'SECURITY',
    entityId: userId || 'SYSTEM',
    severity,
    ipAddress,
    userAgent,
    metadata,
  });
}


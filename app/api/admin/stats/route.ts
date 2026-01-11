import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const GET = requireRole('ADMIN')(
  requireAuth(async (req: NextRequest, user) => {
    try {
      const [
        totalUsers,
        totalSchools,
        totalStudents,
        activeUsers,
        lockedAccounts,
        pendingSecurityEvents,
        recentAuditLogs,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.school.count(),
        prisma.student.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({
          where: {
            lockedUntil: {
              gt: new Date(),
            },
          },
        }),
        prisma.securityEvent.count({
          where: {
            resolved: false,
            severity: { in: ['HIGH', 'CRITICAL'] },
          },
        }),
        prisma.auditLog.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

      return NextResponse.json({
        totalUsers,
        totalSchools,
        totalStudents,
        activeUsers,
        lockedAccounts,
        pendingSecurityEvents,
        recentAuditLogs,
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })
);


import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const GET = requireRole('ADMIN')(
  requireAuth(async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get('userId');
      const entityType = searchParams.get('entityType');
      const action = searchParams.get('action');
      const severity = searchParams.get('severity');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const limit = parseInt(searchParams.get('limit') || '100');

      const where: any = {};
      if (userId) where.userId = userId;
      if (entityType) where.entityType = entityType;
      if (action) where.action = action;
      if (severity) where.severity = severity;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return NextResponse.json(logs);
    } catch (error) {
      console.error('Audit logs fetch error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })
);


import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const GET = requireRole('ADMIN')(
  requireAuth(async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const severity = searchParams.get('severity');
      const eventType = searchParams.get('eventType');
      const resolved = searchParams.get('resolved');
      const limit = parseInt(searchParams.get('limit') || '100');

      const where: any = {};
      if (severity) where.severity = severity;
      if (eventType) where.eventType = eventType;
      if (resolved !== null) where.resolved = resolved === 'true';

      const events = await prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return NextResponse.json(events);
    } catch (error) {
      console.error('Security events fetch error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })
);


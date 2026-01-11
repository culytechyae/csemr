import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { checkSuspiciousActivity, logSecurityAlert } from '@/security/monitoring/security-monitor';

export const GET = requireRole('ADMIN')(
  requireAuth(async (req: NextRequest, user) => {
    try {
      const alerts = await checkSuspiciousActivity();

      // Log all alerts
      for (const alert of alerts) {
        await logSecurityAlert(alert);
      }

      return NextResponse.json({ alerts });
    } catch (error) {
      console.error('Security alerts error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })
);


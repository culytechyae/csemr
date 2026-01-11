import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Update user's last activity timestamp
 * Called periodically by the client to keep the session alive
 */
export async function POST(req: NextRequest) {
  return requireAuth(async (req: NextRequest, user) => {
    try {
      const token = req.cookies.get('auth-token')?.value;
      if (!token) {
        return NextResponse.json({ error: 'No session token' }, { status: 401 });
      }

      // Update session's lastActivityAt
      await prisma.session.updateMany({
        where: {
          token,
          userId: user.id,
          isActive: true,
        },
        data: {
          lastActivityAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error updating activity:', error);
      return NextResponse.json(
        { error: 'Failed to update activity' },
        { status: 500 }
      );
    }
  })(req);
}


import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlockAccount } from '@/security/utils/account-lockout';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return requireRole('ADMIN')(
      requireAuth(async (req: NextRequest, user) => {
        try {
          await unlockAccount(id, user.id);
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('Unlock account error:', error);
          return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          );
        }
      })
    )(req);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}


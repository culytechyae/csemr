import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getAuthUser } from '@/lib/auth';
import { logSecurityEvent } from '@/security/audit/audit-logger';

/**
 * PATCH /api/security/training/[id]
 * Update training record (complete training, update status)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const training = await prisma.securityTraining.findUnique({
      where: { id: params.id },
    });

    if (!training) {
      return NextResponse.json(
        { error: 'Training record not found' },
        { status: 404 }
      );
    }

    // Users can only update their own training unless Admin
    if (user.role !== 'ADMIN' && training.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.score !== undefined) updateData.score = body.score;
    if (body.maxScore !== undefined) updateData.maxScore = body.maxScore;
    if (body.certificateUrl !== undefined) updateData.certificateUrl = body.certificateUrl;

    // If completing training, set completedAt
    if (body.status === 'COMPLETED' && !training.completedAt) {
      updateData.completedAt = new Date();
    }

    const updatedTraining = await prisma.securityTraining.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });

    const eventType = updateData.status === 'COMPLETED' 
      ? 'TRAINING_COMPLETED' 
      : 'TRAINING_UPDATED';
    
    await logSecurityEvent(
      eventType,
      user.id,
      'INFO',
      `Security training updated: ${params.id}`,
      req,
      { status: updateData.status }
    );

    return NextResponse.json(updatedTraining);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update training record' },
      { status: 500 }
    );
  }
}


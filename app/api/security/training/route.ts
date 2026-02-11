import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getAuthUser } from '@/lib/auth';
import { logSecurityEvent } from '@/security/audit/audit-logger';

/**
 * GET /api/security/training
 * Get security training records
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const trainingType = searchParams.get('trainingType');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Users can only see their own training unless Admin
    const where: any = {};
    if (user.role === 'ADMIN') {
      if (userId) where.userId = userId;
    } else {
      where.userId = user.id; // Users can only see their own
    }
    if (trainingType) where.trainingType = trainingType;
    if (status) where.status = status;

    const trainings = await prisma.securityTraining.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.securityTraining.count({ where });

    await logSecurityEvent(
      'TRAINING_ACCESSED',
      user.id,
      'INFO',
      'Security training records accessed',
      req
    );

    return NextResponse.json({
      trainings,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch training records' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/training
 * Create a new training record (Admin only for others, users can create for themselves)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      userId: targetUserId,
      trainingType,
      title,
      description,
      dueDate,
      expiresAt,
      duration,
    } = body;

    // Users can only create training for themselves unless Admin
    const userId = user.role === 'ADMIN' && targetUserId ? targetUserId : user.id;

    if (!trainingType || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: trainingType, title' },
        { status: 400 }
      );
    }

    const training = await prisma.securityTraining.create({
      data: {
        userId,
        trainingType,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        duration,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
      },
    });

    await logSecurityEvent(
      'TRAINING_CREATED',
      user.id,
      'INFO',
      `Security training created: ${title}`,
      req,
      { trainingId: training.id, userId: training.userId }
    );

    return NextResponse.json(training, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create training record' },
      { status: 500 }
    );
  }
}


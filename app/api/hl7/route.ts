import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const schoolId = searchParams.get('schoolId');

    const whereClause: any = {};
    if (user.role !== 'ADMIN' && user.schoolId) {
      whereClause.schoolId = user.schoolId;
    } else if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    if (status) {
      whereClause.status = status;
    }

    const messages = await prisma.hL7Message.findMany({
      where: whereClause,
      select: {
        id: true,
        messageType: true,
        messageControlId: true,
        status: true,
        sentAt: true,
        acknowledgedAt: true,
        errorMessage: true,
        messageContent: true,
        createdAt: true,
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        school: {
          select: {
            name: true,
            code: true,
          },
        },
        visit: {
          select: {
            visitType: true,
            visitDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('HL7 messages fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


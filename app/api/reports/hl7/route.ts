import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const schoolId = searchParams.get('schoolId');
    const messageType = searchParams.get('messageType');

    // Build where clause
    const where: any = {};

    // School-based access control
    if (user.role !== 'ADMIN' && user.schoolId) {
      where.schoolId = user.schoolId;
    } else if (schoolId) {
      where.schoolId = schoolId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (messageType) {
      where.messageType = messageType;
    }

    // Get total messages
    const totalMessages = await prisma.hL7Message.count({ where });

    // Get messages by status
    const messagesByStatus = await prisma.hL7Message.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // Get messages by type
    const messagesByType = await prisma.hL7Message.groupBy({
      by: ['messageType'],
      where,
      _count: true,
    });

    // Get messages by school
    const messagesBySchool = await prisma.hL7Message.groupBy({
      by: ['schoolId'],
      where,
      _count: true,
    });

    // Get messages by date (daily)
    const messagesByDate = await prisma.hL7Message.groupBy({
      by: ['createdAt'],
      where,
      _count: true,
    });

    // Get failed messages
    const failedMessages = await prisma.hL7Message.count({
      where: {
        ...where,
        status: 'FAILED',
      },
    });

    // Get success rate
    const sentMessages = await prisma.hL7Message.count({
      where: {
        ...where,
        status: 'SENT',
      },
    });

    const successRate = totalMessages > 0 ? (sentMessages / totalMessages) * 100 : 0;

    // Get average retry count
    const avgRetryCount = await prisma.hL7Message.aggregate({
      where,
      _avg: {
        retryCount: true,
      },
    });

    // Get school details
    const schoolIds = messagesBySchool.map((m) => m.schoolId);
    const schools = await prisma.school.findMany({
      where: { id: { in: schoolIds } },
      select: { id: true, name: true, code: true },
    });

    const messagesBySchoolWithNames = messagesBySchool.map((m) => {
      const school = schools.find((s) => s.id === m.schoolId);
      return {
        schoolId: m.schoolId,
        schoolName: school?.name || 'Unknown',
        schoolCode: school?.code || '',
        count: m._count,
      };
    });

    return NextResponse.json({
      summary: {
        totalMessages,
        sentMessages,
        failedMessages,
        successRate: Math.round(successRate * 100) / 100,
        avgRetryCount: Math.round((avgRetryCount._avg.retryCount || 0) * 100) / 100,
      },
      messagesByStatus: messagesByStatus.map((m) => ({
        status: m.status,
        count: m._count,
      })),
      messagesByType: messagesByType.map((m) => ({
        type: m.messageType,
        count: m._count,
      })),
      messagesBySchool: messagesBySchoolWithNames,
      messagesByDate: messagesByDate.map((m) => ({
        date: m.createdAt.toISOString().split('T')[0],
        count: m._count,
      })),
    });
  } catch (error) {
    console.error('Error generating HL7 reports:', error);
    return NextResponse.json(
      { error: 'Failed to generate HL7 reports' },
      { status: 500 }
    );
  }
});


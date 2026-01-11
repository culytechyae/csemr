import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const whereClause: any = {};
    if (user.role !== 'ADMIN' && user.schoolId) {
      whereClause.schoolId = user.schoolId;
    }

    const [totalSchools, totalStudents, totalVisits, visitsToday, pendingHL7] = await Promise.all([
      user.role === 'ADMIN'
        ? prisma.school.count({ where: { isActive: true } })
        : 1,
      prisma.student.count({ where: { ...whereClause, isActive: true } }),
      prisma.clinicalVisit.count({ where: whereClause }),
      prisma.clinicalVisit.count({
        where: {
          ...whereClause,
          visitDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.hL7Message.count({
        where: {
          ...whereClause,
          status: 'PENDING',
        },
      }),
    ]);

    return NextResponse.json({
      totalSchools,
      totalStudents,
      totalVisits,
      visitsToday,
      pendingHL7Messages: pendingHL7,
      recentVisits: [],
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


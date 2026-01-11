import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const schoolId = searchParams.get('schoolId');
    const visitType = searchParams.get('visitType');

    // Build where clause
    const where: any = {};

    // School-based access control
    if (user.role !== 'ADMIN' && user.schoolId) {
      where.schoolId = user.schoolId;
    } else if (schoolId) {
      where.schoolId = schoolId;
    }

    if (startDate || endDate) {
      where.visitDate = {};
      if (startDate) {
        where.visitDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.visitDate.lte = new Date(endDate);
      }
    }

    if (visitType) {
      where.visitType = visitType;
    }

    // Get total visits
    const totalVisits = await prisma.clinicalVisit.count({ where });

    // Get visits by type
    const visitsByType = await prisma.clinicalVisit.groupBy({
      by: ['visitType'],
      where,
      _count: true,
    });

    // Get visits by school
    const visitsBySchool = await prisma.clinicalVisit.groupBy({
      by: ['schoolId'],
      where,
      _count: true,
    });

    // Get visits by date (daily)
    const visitsByDate = await prisma.clinicalVisit.groupBy({
      by: ['visitDate'],
      where,
      _count: true,
    });

    // Get visits with follow-up required
    const followUpVisits = await prisma.clinicalVisit.count({
      where: {
        ...where,
        followUpRequired: true,
      },
    });

    // Get emergency visits
    const emergencyVisits = await prisma.clinicalVisit.count({
      where: {
        ...where,
        visitType: 'EMERGENCY',
      },
    });

    // Get top diagnoses
    const topDiagnoses = await prisma.clinicalVisit.groupBy({
      by: ['diagnosis'],
      where: {
        ...where,
        diagnosis: { not: null },
      },
      _count: true,
      orderBy: {
        _count: {
          diagnosis: 'desc',
        },
      },
      take: 10,
    });

    // Get school details for visits by school
    const schoolIds = visitsBySchool.map((v) => v.schoolId);
    const schools = await prisma.school.findMany({
      where: { id: { in: schoolIds } },
      select: { id: true, name: true, code: true },
    });

    const visitsBySchoolWithNames = visitsBySchool.map((v) => {
      const school = schools.find((s) => s.id === v.schoolId);
      return {
        schoolId: v.schoolId,
        schoolName: school?.name || 'Unknown',
        schoolCode: school?.code || '',
        count: v._count,
      };
    });

    return NextResponse.json({
      summary: {
        totalVisits,
        followUpVisits,
        emergencyVisits,
      },
      visitsByType: visitsByType.map((v) => ({
        type: v.visitType,
        count: v._count,
      })),
      visitsBySchool: visitsBySchoolWithNames,
      visitsByDate: visitsByDate.map((v) => ({
        date: v.visitDate.toISOString().split('T')[0],
        count: v._count,
      })),
      topDiagnoses: topDiagnoses.map((d) => ({
        diagnosis: d.diagnosis,
        count: d._count,
      })),
    });
  } catch (error) {
    console.error('Error generating visit reports:', error);
    return NextResponse.json(
      { error: 'Failed to generate visit reports' },
      { status: 500 }
    );
  }
});


import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId');

    // Build where clause
    const where: any = {};

    // School-based access control
    if (user.role !== 'ADMIN' && user.schoolId) {
      where.schoolId = user.schoolId;
    } else if (schoolId) {
      where.schoolId = schoolId;
    }

    // Get total students
    const totalStudents = await prisma.student.count({ where });

    // Get students by gender
    const studentsByGender = await prisma.student.groupBy({
      by: ['gender'],
      where,
      _count: true,
    });

    // Get students by blood type
    const studentsByBloodType = await prisma.student.groupBy({
      by: ['bloodType'],
      where,
      _count: true,
    });

    // Get students by school
    const studentsBySchool = await prisma.student.groupBy({
      by: ['schoolId'],
      where,
      _count: true,
    });

    // Get students with allergies
    const studentsWithAllergies = await prisma.student.count({
      where: {
        ...where,
        AND: [
          { allergies: { not: null } },
          { allergies: { not: '' } },
        ],
      },
    });

    // Get students with chronic conditions
    const studentsWithChronicConditions = await prisma.student.count({
      where: {
        ...where,
        AND: [
          { chronicConditions: { not: null } },
          { chronicConditions: { not: '' } },
        ],
      },
    });

    // Get students with medications
    const studentsWithMedications = await prisma.student.count({
      where: {
        ...where,
        AND: [
          { medications: { not: null } },
          { medications: { not: '' } },
        ],
      },
    });

    // Get average visits per student
    const visitsPerStudent = await prisma.clinicalVisit.groupBy({
      by: ['studentId'],
      where: user.role !== 'ADMIN' && user.schoolId ? { schoolId: user.schoolId } : {},
      _count: true,
    });

    const avgVisitsPerStudent =
      totalStudents > 0
        ? visitsPerStudent.reduce((sum, v) => sum + v._count, 0) / totalStudents
        : 0;

    // Get school details
    const schoolIds = studentsBySchool.map((s) => s.schoolId);
    const schools = await prisma.school.findMany({
      where: { id: { in: schoolIds } },
      select: { id: true, name: true, code: true },
    });

    const studentsBySchoolWithNames = studentsBySchool.map((s) => {
      const school = schools.find((sch) => sch.id === s.schoolId);
      return {
        schoolId: s.schoolId,
        schoolName: school?.name || 'Unknown',
        schoolCode: school?.code || '',
        count: s._count,
      };
    });

    // Get health record statistics
    const healthRecords = await prisma.healthRecord.findMany({
      where: user.role !== 'ADMIN' && user.schoolId ? { schoolId: user.schoolId } : {},
      select: {
        height: true,
        weight: true,
        bmi: true,
        visionScreeningResult: true,
        colorBlindness: true,
      },
    });

    const avgHeight =
      healthRecords.filter((h) => h.height).length > 0
        ? healthRecords.reduce((sum, h) => sum + (h.height || 0), 0) /
          healthRecords.filter((h) => h.height).length
        : 0;

    const avgWeight =
      healthRecords.filter((h) => h.weight).length > 0
        ? healthRecords.reduce((sum, h) => sum + (h.weight || 0), 0) /
          healthRecords.filter((h) => h.weight).length
        : 0;

    const avgBMI =
      healthRecords.filter((h) => h.bmi).length > 0
        ? healthRecords.reduce((sum, h) => sum + (h.bmi || 0), 0) /
          healthRecords.filter((h) => h.bmi).length
        : 0;

    const visionAbnormal = healthRecords.filter(
      (h) => h.visionScreeningResult === 'Abnormal'
    ).length;

    const colorBlindnessCount = healthRecords.filter(
      (h) => h.colorBlindness === 'Abnormal'
    ).length;

    return NextResponse.json({
      summary: {
        totalStudents,
        studentsWithAllergies,
        studentsWithChronicConditions,
        studentsWithMedications,
        avgVisitsPerStudent: Math.round(avgVisitsPerStudent * 100) / 100,
      },
      studentsByGender: studentsByGender.map((s) => ({
        gender: s.gender,
        count: s._count,
      })),
      studentsByBloodType: studentsByBloodType.map((s) => ({
        bloodType: s.bloodType,
        count: s._count,
      })),
      studentsBySchool: studentsBySchoolWithNames,
      healthMetrics: {
        avgHeight: Math.round(avgHeight * 100) / 100,
        avgWeight: Math.round(avgWeight * 100) / 100,
        avgBMI: Math.round(avgBMI * 100) / 100,
        visionAbnormal,
        colorBlindnessCount,
        totalHealthRecords: healthRecords.length,
      },
    });
  } catch (error) {
    console.error('Error generating student reports:', error);
    return NextResponse.json(
      { error: 'Failed to generate student reports' },
      { status: 500 }
    );
  }
});


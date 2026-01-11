import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const healthRecordSchema = z.object({
  studentId: z.string(),
  schoolId: z.string(),
  height: z.number().optional(),
  weight: z.number().optional(),
  bmi: z.number().optional(),
  colorBlindness: z.enum(['Normal', 'Abnormal']).optional(),
  visionTestingPerformed: z.boolean().optional(),
  visionTestingNotPerformedReason: z.string().optional(),
  correctiveLenses: z.enum(['None', 'Glasses', 'Contact lenses', 'Surgical correction', 'Other']).optional(),
  correctiveLensesOtherReason: z.string().optional(),
  rightEye: z.string().optional(),
  leftEye: z.string().optional(),
  rightEyeWithCorrection: z.string().optional(),
  leftEyeWithCorrection: z.string().optional(),
  visionScreeningResult: z.enum(['Normal', 'Abnormal']).optional(),
});

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const schoolId = searchParams.get('schoolId');
    const studentEsisId = searchParams.get('studentEsisId'); // ESIS ID lookup

    const whereClause: any = {};
    
    if (user.role !== 'ADMIN' && user.schoolId) {
      whereClause.schoolId = user.schoolId;
    } else if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    if (studentId) {
      whereClause.studentId = studentId;
    } else if (studentEsisId) {
      // Find student by ESIS ID (studentId field)
      const student = await prisma.student.findFirst({
        where: {
          studentId: studentEsisId,
          ...(user.role !== 'ADMIN' && user.schoolId ? { schoolId: user.schoolId } : {}),
        },
        select: { id: true },
      });
      if (student) {
        whereClause.studentId = student.id;
      } else {
        return NextResponse.json([]);
      }
    }

    const records = await prisma.healthRecord.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
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
        recorder: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Health records fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const data = healthRecordSchema.parse(body);

    // Enforce school assignment
    if (user.role !== 'ADMIN') {
      if (!user.schoolId) {
        return NextResponse.json(
          { error: 'You must be assigned to a school to create health records' },
          { status: 403 }
        );
      }
      data.schoolId = user.schoolId;
    }

    // Verify student belongs to user's school
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      select: { schoolId: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && user.schoolId !== student.schoolId) {
      return NextResponse.json(
        { error: 'You can only create health records for students in your school' },
        { status: 403 }
      );
    }

    // Calculate BMI if height and weight provided
    let bmi = data.bmi;
    if (data.height && data.weight && !bmi) {
      bmi = data.weight / Math.pow(data.height / 100, 2);
    }

    const record = await prisma.healthRecord.create({
      data: {
        ...data,
        schoolId: data.schoolId || student.schoolId,
        bmi,
        recordedBy: user.id,
      },
      include: {
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
          },
        },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Health record creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


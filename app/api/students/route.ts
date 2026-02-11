import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const studentSchema = z.object({
  schoolId: z.string(),
  academicYear: z.string().min(1),
  studentId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  nationality: z.string().optional(),
  bloodType: z.enum([
    'A_POSITIVE',
    'A_NEGATIVE',
    'B_POSITIVE',
    'B_NEGATIVE',
    'AB_POSITIVE',
    'AB_NEGATIVE',
    'O_POSITIVE',
    'O_NEGATIVE',
    'UNKNOWN',
  ]).optional(),
  grade: z.string().optional(),
  homeroom: z.string().optional(),
  studentEmiratesId: z.string().optional(),
  parentName: z.string().min(1),
  parentPhone: z.string().min(1),
  parentEmail: z.string().email().optional(),
  emergencyContact: z.string().min(1),
  emergencyPhone: z.string().min(1),
  address: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  medications: z.string().optional(),
});

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');
    const search = searchParams.get('search');
    const grade = searchParams.get('grade');
    const homeroom = searchParams.get('homeroom');

    const whereClause: any = {};
    if (user.role !== 'ADMIN' && user.schoolId) {
      whereClause.schoolId = user.schoolId;
    } else if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (grade) {
      whereClause.grade = grade;
    }

    if (homeroom) {
      whereClause.homeroom = homeroom;
    }

    const students = await prisma.student.findMany({
      where: { ...whereClause, isActive: true },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
      take: 1000,
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Students fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const data = studentSchema.parse(body);

    // Enforce school assignment: Non-admin users must use their assigned school
    if (user.role !== 'ADMIN') {
      if (!user.schoolId) {
        return NextResponse.json(
          { error: 'You must be assigned to a school to create students' },
          { status: 403 }
        );
      }
      // Force the schoolId to be the user's assigned school
      data.schoolId = user.schoolId;
    }

    // Additional check: Ensure user can only create students for their school
    if (user.role !== 'ADMIN' && user.schoolId !== data.schoolId) {
      return NextResponse.json(
        { error: 'You can only create students for your assigned school' },
        { status: 403 }
      );
    }

    const student = await prisma.student.create({
      data: {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
        academicYear: data.academicYear,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Student creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateStudentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
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
  parentName: z.string().min(1).optional(),
  parentPhone: z.string().min(1).optional(),
  parentEmail: z.string().email().optional(),
  emergencyContact: z.string().min(1).optional(),
  emergencyPhone: z.string().min(1).optional(),
  address: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  medications: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return requireAuth(async (req: NextRequest, user) => {
    try {
      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          school: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      // Non-admins can only view students from their school
      if (user.role !== 'ADMIN' && user.schoolId !== student.schoolId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json(student);
    } catch (error) {
      console.error('Student fetch error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return requireAuth(async (req: NextRequest, user) => {
    try {
      const student = await prisma.student.findUnique({
        where: { id },
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      // Non-admins can only update students from their school
      if (user.role !== 'ADMIN' && user.schoolId !== student.schoolId) {
        return NextResponse.json(
          { error: 'You can only update students from your assigned school' },
          { status: 403 }
        );
      }

      const body = await req.json();
      const data = updateStudentSchema.parse(body);

      const updateData: any = { ...data };
      if (data.dateOfBirth) {
        updateData.dateOfBirth = new Date(data.dateOfBirth);
      }

      const updatedStudent = await prisma.student.update({
        where: { id },
        data: updateData,
        include: {
          school: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      });

      return NextResponse.json(updatedStudent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Student update error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return requireAuth(async (req: NextRequest, user) => {
    try {
      const student = await prisma.student.findUnique({
        where: { id },
      });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      // Non-admins can only deactivate students from their school
      if (user.role !== 'ADMIN' && user.schoolId !== student.schoolId) {
        return NextResponse.json(
          { error: 'You can only deactivate students from your assigned school' },
          { status: 403 }
        );
      }

      await prisma.student.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Student delete error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}


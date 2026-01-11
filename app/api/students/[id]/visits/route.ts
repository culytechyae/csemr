import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return requireAuth(async (req: NextRequest, user) => {
      try {
        // First verify the student exists and user has access
        const student = await prisma.student.findUnique({
          where: { id },
          select: { schoolId: true },
        });

        if (!student) {
          return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Check access: non-admin users can only access students from their school
        if (user.role !== 'ADMIN' && user.schoolId !== student.schoolId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch visits for this student
        const visits = await prisma.clinicalVisit.findMany({
          where: { studentId: id },
          include: {
            assessment: true,
            creator: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            school: {
              select: {
                name: true,
                code: true,
              },
            },
          },
          orderBy: { visitDate: 'desc' },
        });

        return NextResponse.json(visits);
      } catch (error) {
        console.error('Student visits fetch error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    })(req);
  } catch (error) {
    console.error('Params error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}


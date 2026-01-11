import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get the latest health record for a specific student
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    return requireAuth(async (req: NextRequest, user) => {
      try {

    // Verify student exists and user has access
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { schoolId: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && user.schoolId !== student.schoolId) {
      return NextResponse.json(
        { error: 'You can only view health records for students in your school' },
        { status: 403 }
      );
    }

    // Get latest health record for this student
    const latestRecord = await prisma.healthRecord.findFirst({
      where: { studentId },
      orderBy: { recordedAt: 'desc' },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        recorder: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!latestRecord) {
      return NextResponse.json({ error: 'No health record found' }, { status: 404 });
    }

        return NextResponse.json(latestRecord);
      } catch (error) {
        console.error('Health record fetch error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    })(req);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}


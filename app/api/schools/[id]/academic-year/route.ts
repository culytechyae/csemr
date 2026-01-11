import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const academicYearSchema = z.object({
  academicYear: z.string().min(1),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return requireRole('ADMIN', 'CLINIC_MANAGER')(async (req: NextRequest, user) => {
    try {
      const school = await prisma.school.findUnique({
        where: { id },
      });

      if (!school) {
        return NextResponse.json({ error: 'School not found' }, { status: 404 });
      }

      // Clinic managers can only update their own school
      if (user.role === 'CLINIC_MANAGER' && user.schoolId !== school.id) {
        return NextResponse.json(
          { error: 'You can only update your own school' },
          { status: 403 }
        );
      }

      const body = await req.json();
      const data = academicYearSchema.parse(body);

      const updatedSchool = await prisma.school.update({
        where: { id },
        data: { currentAcademicYear: data.academicYear },
      });

      return NextResponse.json(updatedSchool);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Academic year update error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}


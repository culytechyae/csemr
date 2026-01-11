import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateVisitSchema = z.object({
  visitType: z.enum(['ROUTINE_CHECKUP', 'ILLNESS', 'INJURY', 'VACCINATION', 'EMERGENCY', 'FOLLOW_UP']).optional(),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return requireAuth(async (req: NextRequest, user) => {
    try {
      const visit = await prisma.clinicalVisit.findUnique({
        where: { id },
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
          assessment: true,
          creator: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!visit) {
        return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
      }

      // Non-admins can only view visits from their school
      if (user.role !== 'ADMIN' && user.schoolId !== visit.schoolId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json(visit);
    } catch (error) {
      console.error('Visit fetch error:', error);
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
      const visit = await prisma.clinicalVisit.findUnique({
        where: { id },
      });

      if (!visit) {
        return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
      }

      // Non-admins can only update visits from their school
      if (user.role !== 'ADMIN' && user.schoolId !== visit.schoolId) {
        return NextResponse.json(
          { error: 'You can only update visits from your assigned school' },
          { status: 403 }
        );
      }

      const body = await req.json();
      const data = updateVisitSchema.parse(body);

      const updateData: any = { ...data };
      if (data.followUpDate) {
        updateData.followUpDate = new Date(data.followUpDate);
      }

      const updatedVisit = await prisma.clinicalVisit.update({
        where: { id },
        data: updateData,
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
          assessment: true,
        },
      });

      return NextResponse.json(updatedVisit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Visit update error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}


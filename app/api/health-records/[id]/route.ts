import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateHealthRecordSchema = z.object({
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return requireAuth(async (req: NextRequest, user) => {
      try {
        const record = await prisma.healthRecord.findUnique({
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
            recorder: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        if (!record) {
          return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
        }

        if (user.role !== 'ADMIN' && user.schoolId !== record.schoolId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(record);
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return requireAuth(async (req: NextRequest, user) => {
      try {
        const record = await prisma.healthRecord.findUnique({
          where: { id },
        });

        if (!record) {
          return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
        }

        if (user.role !== 'ADMIN' && user.schoolId !== record.schoolId) {
          return NextResponse.json(
            { error: 'You can only update health records from your school' },
            { status: 403 }
          );
        }

        const body = await req.json();
        const data = updateHealthRecordSchema.parse(body);

        // Recalculate BMI if height/weight changed
        let bmi = data.bmi;
        if (data.height && data.weight) {
          bmi = data.weight / Math.pow(data.height / 100, 2);
        } else if (data.height && record.weight) {
          bmi = record.weight / Math.pow(data.height / 100, 2);
        } else if (data.weight && record.height) {
          bmi = data.weight / Math.pow(record.height / 100, 2);
        }

        const updated = await prisma.healthRecord.update({
          where: { id },
          data: {
            ...data,
            ...(bmi !== undefined && { bmi }),
          },
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
          },
        });

        return NextResponse.json(updated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          );
        }
        console.error('Health record update error:', error);
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return requireAuth(async (req: NextRequest, user) => {
      try {
        const record = await prisma.healthRecord.findUnique({
          where: { id },
        });

        if (!record) {
          return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
        }

        if (user.role !== 'ADMIN' && user.schoolId !== record.schoolId) {
          return NextResponse.json(
            { error: 'You can only delete health records from your school' },
            { status: 403 }
          );
        }

        await prisma.healthRecord.delete({
          where: { id },
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Health record delete error:', error);
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


import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const hl7ConfigSchema = z.object({
  sendingApplication: z.string().min(1),
  sendingFacility: z.string().min(1),
  receivingApplication: z.string().min(1),
  receivingFacility: z.string().min(1),
  autoSend: z.boolean(),
  retryAttempts: z.number().int().min(0).max(10),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return requireRole('ADMIN')(async (req: NextRequest) => {
    try {
      const config = await prisma.schoolHL7Config.findUnique({
        where: { schoolId: id },
        include: {
          school: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      });

      if (!config) {
        // Return default config if not set
        const school = await prisma.school.findUnique({
          where: { id },
          select: { code: true },
        });

        return NextResponse.json({
          schoolId: id,
          sendingApplication: 'SchoolClinicEMR',
          sendingFacility: school?.code || 'SCHOOL_CLINIC',
          receivingApplication: 'Rhapsody',
          receivingFacility: 'MALAFFI',
          autoSend: true,
          retryAttempts: 3,
        });
      }

      return NextResponse.json(config);
    } catch (error) {
      console.error('HL7 config fetch error:', error);
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
  return requireRole('ADMIN')(async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = hl7ConfigSchema.parse(body);

      // Verify school exists
      const school = await prisma.school.findUnique({
        where: { id },
      });

      if (!school) {
        return NextResponse.json(
          { error: 'School not found' },
          { status: 404 }
        );
      }

      // Upsert HL7 config
      const config = await prisma.schoolHL7Config.upsert({
        where: { schoolId: id },
        update: {
          sendingApplication: data.sendingApplication,
          sendingFacility: data.sendingFacility,
          receivingApplication: data.receivingApplication,
          receivingFacility: data.receivingFacility,
          autoSend: data.autoSend,
          retryAttempts: data.retryAttempts,
        },
        create: {
          schoolId: id,
          sendingApplication: data.sendingApplication,
          sendingFacility: data.sendingFacility,
          receivingApplication: data.receivingApplication,
          receivingFacility: data.receivingFacility,
          autoSend: data.autoSend,
          retryAttempts: data.retryAttempts,
        },
        include: {
          school: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      });

      return NextResponse.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }
      console.error('HL7 config update error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}


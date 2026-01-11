import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const hl7ConfigSchema = z.object({
  facilityCode: z.string().min(1).optional(),
  sendingApplication: z.string().min(1),
  sendingFacility: z.string().min(1),
  receivingApplication: z.string().min(1),
  receivingFacility: z.string().min(1),
  processingId: z.string().optional(),
  hl7Version: z.string().optional(),
  autoSend: z.boolean(),
  retryAttempts: z.number().int().min(0).max(10),
  validDoctorIds: z.string().optional(),
  defaultDoctorId: z.string().optional(),
  autoSendMessageTypes: z.string().optional(), // JSON array string
  environment: z.enum(['test', 'production']).optional(),
  enabled: z.boolean().optional(),
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
          facilityCode: school?.code || '',
          sendingApplication: school?.code || 'SchoolClinicEMR',
          sendingFacility: school?.code || 'SCHOOL_CLINIC',
          receivingApplication: 'Rhapsody',
          receivingFacility: 'MALAFFI',
          processingId: 'ADHIE',
          hl7Version: '2.5.1',
          autoSend: true,
          retryAttempts: 3,
          validDoctorIds: '',
          defaultDoctorId: '',
          autoSendMessageTypes: '["ADT_A01","ADT_A04","ORU_R01"]',
          environment: 'test',
          enabled: true,
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
          facilityCode: data.facilityCode || school.code || undefined,
          sendingApplication: data.sendingApplication,
          sendingFacility: data.sendingFacility,
          receivingApplication: data.receivingApplication,
          receivingFacility: data.receivingFacility,
          processingId: data.processingId || 'ADHIE',
          hl7Version: data.hl7Version || '2.5.1',
          autoSend: data.autoSend,
          retryAttempts: data.retryAttempts,
          validDoctorIds: data.validDoctorIds || null,
          defaultDoctorId: data.defaultDoctorId || null,
          autoSendMessageTypes: data.autoSendMessageTypes || null,
          environment: data.environment || 'test',
          enabled: data.enabled !== undefined ? data.enabled : true,
        },
        create: {
          schoolId: id,
          facilityCode: data.facilityCode || school.code || '',
          sendingApplication: data.sendingApplication,
          sendingFacility: data.sendingFacility,
          receivingApplication: data.receivingApplication,
          receivingFacility: data.receivingFacility,
          processingId: data.processingId || 'ADHIE',
          hl7Version: data.hl7Version || '2.5.1',
          autoSend: data.autoSend,
          retryAttempts: data.retryAttempts,
          validDoctorIds: data.validDoctorIds || null,
          defaultDoctorId: data.defaultDoctorId || null,
          autoSendMessageTypes: data.autoSendMessageTypes || null,
          environment: data.environment || 'test',
          enabled: data.enabled !== undefined ? data.enabled : true,
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


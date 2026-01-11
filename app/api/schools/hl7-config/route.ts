import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const GET = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const configs = await prisma.schoolHL7Config.findMany({
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        school: {
          name: 'asc',
        },
      },
    });

    // Also include schools without configs (with defaults)
    const allSchools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const schoolConfigsMap = new Map(
      configs.map((config) => [config.schoolId, config])
    );

    const result = allSchools.map((school) => {
      const config = schoolConfigsMap.get(school.id);
      if (config) {
        return {
          ...config,
          school,
        };
      }
      return {
        schoolId: school.id,
        sendingApplication: 'SchoolClinicEMR',
        sendingFacility: school.code,
        receivingApplication: 'Rhapsody',
        receivingFacility: 'MALAFFI',
        autoSend: true,
        retryAttempts: 3,
        school,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('HL7 configs fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


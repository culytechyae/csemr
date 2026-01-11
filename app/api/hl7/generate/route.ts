import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  HL7MessageBuilder,
  generateMessageControlId,
} from '@/lib/hl7';

type HL7Type = 'ADT_A01' | 'ADT_A03' | 'ADT_A04' | 'ADT_A08' | 'ORU_R01';

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const type: HL7Type = body.type;
    const studentId: string | undefined = body.studentId;
    const visitId: string | undefined = body.visitId;

    if (!type) {
      return NextResponse.json(
        { error: 'type is required (ADT_A01, ADT_A03, ADT_A04, ADT_A08, ORU_R01)' },
        { status: 400 }
      );
    }

    const messageControlId = generateMessageControlId();

    // Helper function to get HL7 config for a school
    const getHL7Config = async (schoolId: string) => {
      const hl7Config = await prisma.schoolHL7Config.findUnique({
        where: { schoolId },
      });
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { code: true },
      });

      return {
        sendingApp: hl7Config?.sendingApplication || 'SchoolClinicEMR',
        sendingFac: hl7Config?.sendingFacility || school?.code || 'SCHOOL_CLINIC',
        receivingApp: hl7Config?.receivingApplication || 'Rhapsody',
        receivingFac: hl7Config?.receivingFacility || 'MALAFFI',
      };
    };

    if (type === 'ADT_A04') {
      if (!studentId) {
        return NextResponse.json(
          { error: 'studentId is required for ADT_A04' },
          { status: 400 }
        );
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { school: true },
      });

      if (!student || !student.school) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      // Access control: non-admins only for their school
      if (user.role !== 'ADMIN' && user.schoolId !== student.schoolId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const config = await getHL7Config(student.schoolId);
      const builder = new HL7MessageBuilder({
        messageControlId,
        sendingApplication: `${config.sendingFac}^${config.sendingFac}`,
        sendingFacility: `${config.sendingFac}^${config.sendingFac}`,
        receivingApplication: `${config.receivingApp}^${config.receivingFac}`,
        receivingFacility: config.receivingFac,
      });

      builder.buildADT_A04(student, student.school);

      return NextResponse.json({
        type,
        messageControlId,
        message: builder.build(),
      });
    }

    // For visit-based messages, we need visit + student + school
    if (!visitId) {
      return NextResponse.json(
        { error: 'visitId is required for this message type' },
        { status: 400 }
      );
    }

    const visit = await prisma.clinicalVisit.findUnique({
      where: { id: visitId },
      include: {
        student: true,
        school: true,
        assessment: true,
      },
    });

    if (!visit || !visit.student || !visit.school) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && user.schoolId !== visit.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const config = await getHL7Config(visit.schoolId);
    const builder = new HL7MessageBuilder({
      messageControlId,
      sendingApplication: `${config.sendingFac}^${config.sendingFac}`,
      sendingFacility: `${config.sendingFac}^${config.sendingFac}`,
      receivingApplication: `${config.receivingApp}^${config.receivingFac}`,
      receivingFacility: config.receivingFac,
    });

    switch (type) {
      case 'ADT_A01':
        builder.buildADT_A01(visit.student, visit, visit.school);
        break;
      case 'ADT_A03': {
        const dischargeDate = new Date();
        builder.buildADT_A03(visit.student, visit, visit.school, dischargeDate);
        break;
      }
      case 'ADT_A08':
        builder.buildADT_A08(visit.student, visit, visit.school, visit.assessment || undefined);
        break;
      case 'ORU_R01':
        if (!visit.assessment) {
          return NextResponse.json(
            { error: 'Visit has no assessment to build ORU_R01' },
            { status: 400 }
          );
        }
        builder.buildORU_R01(visit.student, visit, visit.school, visit.assessment);
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported type' },
          { status: 400 }
        );
    }

    const message = builder.build();

    return NextResponse.json({
      type,
      messageControlId,
      message,
    });
  } catch (error) {
    console.error('HL7 generate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});



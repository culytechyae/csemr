import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { HL7MessageBuilder, generateMessageControlId, sendHL7ToMalaffi } from '@/lib/hl7';
import { sendParentVisitNotification } from '@/lib/email';

const visitSchema = z.object({
  studentId: z.string(),
  schoolId: z.string(),
  visitType: z.enum(['ROUTINE_CHECKUP', 'ILLNESS', 'INJURY', 'VACCINATION', 'EMERGENCY', 'FOLLOW_UP']),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().optional(),
  notifyParent: z.boolean().optional(),
  assessment: z.object({
    temperature: z.number().optional(),
    bloodPressureSystolic: z.number().optional(),
    bloodPressureDiastolic: z.number().optional(),
    heartRate: z.number().optional(),
    respiratoryRate: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    height: z.number().optional(),
    weight: z.number().optional(),
    painScale: z.number().optional(),
    generalAppearance: z.string().optional(),
    skinCondition: z.string().optional(),
    eyes: z.string().optional(),
    ears: z.string().optional(),
    throat: z.string().optional(),
    cardiovascular: z.string().optional(),
    respiratory: z.string().optional(),
    abdomen: z.string().optional(),
    neurological: z.string().optional(),
    otherFindings: z.string().optional(),
    // Health Record fields
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
  }).optional(),
});

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const schoolId = searchParams.get('schoolId');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const grade = searchParams.get('grade');
    const homeroom = searchParams.get('homeroom');
    const visitType = searchParams.get('visitType');
    const fetchFilters = searchParams.get('filters');

    // If requesting available filter options
    if (fetchFilters === 'true') {
      const filterWhereClause: any = {};
      if (user.role !== 'ADMIN' && user.schoolId) {
        filterWhereClause.schoolId = user.schoolId;
      }

      const [grades, homerooms, schools] = await Promise.all([
        prisma.student.findMany({
          where: { ...filterWhereClause, grade: { not: null }, isActive: true },
          select: { grade: true },
          distinct: ['grade'],
          orderBy: { grade: 'asc' },
        }),
        prisma.student.findMany({
          where: { ...filterWhereClause, homeroom: { not: null }, isActive: true },
          select: { homeroom: true },
          distinct: ['homeroom'],
          orderBy: { homeroom: 'asc' },
        }),
        user.role === 'ADMIN'
          ? prisma.school.findMany({
              where: { isActive: true },
              select: { id: true, name: true, code: true },
              orderBy: { name: 'asc' },
            })
          : [],
      ]);

      return NextResponse.json({
        grades: grades.map((g) => g.grade).filter(Boolean),
        homerooms: homerooms.map((h) => h.homeroom).filter(Boolean),
        schools,
        visitTypes: ['ROUTINE_CHECKUP', 'ILLNESS', 'INJURY', 'VACCINATION', 'EMERGENCY', 'FOLLOW_UP'],
      });
    }

    const whereClause: any = {};
    if (user.role !== 'ADMIN' && user.schoolId) {
      whereClause.schoolId = user.schoolId;
    } else if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    if (studentId) {
      whereClause.studentId = studentId;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.visitDate = {};
      if (dateFrom) {
        whereClause.visitDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereClause.visitDate.lte = endDate;
      }
    }

    // Visit type filter
    if (visitType) {
      whereClause.visitType = visitType;
    }

    // Grade and homeroom filter via student relation
    if (grade || homeroom) {
      whereClause.student = {};
      if (grade) {
        whereClause.student.grade = grade;
      }
      if (homeroom) {
        whereClause.student.homeroom = homeroom;
      }
    }

    // Search by student name, ID, or complaint
    if (search) {
      whereClause.OR = [
        { student: { firstName: { contains: search, mode: 'insensitive' } } },
        { student: { lastName: { contains: search, mode: 'insensitive' } } },
        { student: { studentId: { contains: search, mode: 'insensitive' } } },
        { chiefComplaint: { contains: search, mode: 'insensitive' } },
      ];
    }

    const visits = await prisma.clinicalVisit.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            grade: true,
            homeroom: true,
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
      orderBy: { visitDate: 'desc' },
      take: 200,
    });

    return NextResponse.json(visits);
  } catch (error) {
    console.error('Visits fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const data = visitSchema.parse(body);

    // Enforce school assignment: Non-admin users must use their assigned school
    if (user.role !== 'ADMIN') {
      if (!user.schoolId) {
        return NextResponse.json(
          { error: 'You must be assigned to a school to create visits' },
          { status: 403 }
        );
      }
      // Force the schoolId to be the user's assigned school
      data.schoolId = user.schoolId;
    }

    // Additional check: Ensure user can only create visits for their school
    if (user.role !== 'ADMIN' && user.schoolId !== data.schoolId) {
      return NextResponse.json(
        { error: 'You can only create visits for your assigned school' },
        { status: 403 }
      );
    }

    // Create visit
    const visit = await prisma.clinicalVisit.create({
      data: {
        studentId: data.studentId,
        schoolId: data.schoolId,
        visitType: data.visitType,
        chiefComplaint: data.chiefComplaint,
        notes: data.notes,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        followUpRequired: data.followUpRequired || false,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        createdBy: user.id,
      },
    });

    // Fetch latest health record for auto-population
    const latestHealthRecord = await prisma.healthRecord.findFirst({
      where: { studentId: data.studentId },
      orderBy: { recordedAt: 'desc' },
    });

    // Create assessment if provided
    let assessment = null;
    if (data.assessment) {
      // Auto-populate from health record if fields are missing
      const assessmentData = {
        ...data.assessment,
        // Use provided values or fall back to health record
        height: data.assessment.height ?? latestHealthRecord?.height ?? null,
        weight: data.assessment.weight ?? latestHealthRecord?.weight ?? null,
        colorBlindness: data.assessment.colorBlindness ?? latestHealthRecord?.colorBlindness ?? null,
        visionTestingPerformed: data.assessment.visionTestingPerformed ?? latestHealthRecord?.visionTestingPerformed ?? null,
        visionTestingNotPerformedReason: data.assessment.visionTestingNotPerformedReason ?? latestHealthRecord?.visionTestingNotPerformedReason ?? null,
        correctiveLenses: data.assessment.correctiveLenses ?? latestHealthRecord?.correctiveLenses ?? null,
        correctiveLensesOtherReason: data.assessment.correctiveLensesOtherReason ?? latestHealthRecord?.correctiveLensesOtherReason ?? null,
        rightEye: data.assessment.rightEye ?? latestHealthRecord?.rightEye ?? null,
        leftEye: data.assessment.leftEye ?? latestHealthRecord?.leftEye ?? null,
        rightEyeWithCorrection: data.assessment.rightEyeWithCorrection ?? latestHealthRecord?.rightEyeWithCorrection ?? null,
        leftEyeWithCorrection: data.assessment.leftEyeWithCorrection ?? latestHealthRecord?.leftEyeWithCorrection ?? null,
        visionScreeningResult: data.assessment.visionScreeningResult ?? latestHealthRecord?.visionScreeningResult ?? null,
      };

      const bmi = assessmentData.height && assessmentData.weight
        ? assessmentData.weight / Math.pow(assessmentData.height / 100, 2)
        : latestHealthRecord?.bmi ?? null;

      assessment = await prisma.clinicalAssessment.create({
        data: {
          visitId: visit.id,
          studentId: data.studentId,
          ...assessmentData,
          bmi,
          createdBy: user.id,
        },
      });
    }

    // Generate and send HL7 message
    try {
      const student = await prisma.student.findUnique({
        where: { id: data.studentId },
      });
      const school = await prisma.school.findUnique({
        where: { id: data.schoolId },
      });

      if (student && school) {
        // Fetch school-specific HL7 configuration
        const hl7Config = await prisma.schoolHL7Config.findUnique({
          where: { schoolId: school.id },
        });

        // Check if HL7 is enabled for this school
        if (hl7Config && !hl7Config.enabled) {
          console.log(`HL7 is disabled for school ${school.id}`);
          // Don't send HL7 message if disabled
        } else {
          // Determine message type
          const messageType = assessment ? 'ORU_R01' : 'ADT_A08';
          
          // Check if auto-send is enabled and if this message type should be auto-sent
          let shouldSend = true;
          if (hl7Config) {
            // Check autoSend flag
            if (!hl7Config.autoSend) {
              shouldSend = false;
              console.log(`Auto-send is disabled for school ${school.id}`);
            } else {
              // Check if message type is in autoSendMessageTypes
              if (hl7Config.autoSendMessageTypes) {
                try {
                  const allowedTypes = JSON.parse(hl7Config.autoSendMessageTypes);
                  if (Array.isArray(allowedTypes) && !allowedTypes.includes(messageType)) {
                    shouldSend = false;
                    console.log(`Message type ${messageType} is not in auto-send list for school ${school.id}`);
                  }
                } catch (e) {
                  // If parsing fails, allow sending (backward compatibility)
                  console.warn('Failed to parse autoSendMessageTypes, allowing send');
                }
              }
            }
          }

          if (shouldSend) {
            // Use school config or defaults
            const sendingApp = hl7Config?.sendingApplication || school.code || 'SchoolClinicEMR';
            const sendingFac = hl7Config?.sendingFacility || hl7Config?.facilityCode || school.code || 'SCHOOL_CLINIC';
            const receivingApp = hl7Config?.receivingApplication || 'Rhapsody';
            const receivingFac = hl7Config?.receivingFacility || hl7Config?.processingId || 'ADHIE';
            const processingId = hl7Config?.environment === 'production' ? 'P' : 'T'; // 'P' for Production, 'T' for Test
            const hl7Version = hl7Config?.hl7Version || '2.5.1';
            const retryAttempts = hl7Config?.retryAttempts || 3;

            const messageControlId = generateMessageControlId();
            const builder = new HL7MessageBuilder({
              messageControlId,
              sendingApplication: `${sendingFac}^${sendingFac}`,
              sendingFacility: `${sendingFac}^${sendingFac}`,
              receivingApplication: `${receivingApp}^${receivingFac}`,
              receivingFacility: receivingFac,
              processingId,
              hl7Version,
            });

            if (assessment) {
              builder.buildORU_R01(student, visit, school, assessment);
            } else {
              builder.buildADT_A08(student, visit, school);
            }

            const hl7Message = builder.build();

            // Save HL7 message
            const hl7Record = await prisma.hL7Message.create({
              data: {
                messageType: assessment ? 'ORU' : 'ADT',
                messageControlId,
                studentId: student.id,
                visitId: visit.id,
                schoolId: school.id,
                messageContent: hl7Message,
                status: 'PENDING',
              },
            });

            // Send to Malaffi with retry logic
            let lastError: string | undefined;
            let success = false;
            
            for (let attempt = 1; attempt <= retryAttempts; attempt++) {
              const result = await sendHL7ToMalaffi(hl7Message, messageControlId, hl7Config?.environment || 'test');
              
              if (result.success) {
                success = true;
                await prisma.hL7Message.update({
                  where: { id: hl7Record.id },
                  data: {
                    status: 'SENT',
                    sentAt: new Date(),
                  },
                });
                break;
              } else {
                lastError = result.error;
                console.warn(`HL7 send attempt ${attempt}/${retryAttempts} failed: ${lastError}`);
                
                // Wait before retry (exponential backoff: 1s, 2s, 4s)
                if (attempt < retryAttempts) {
                  await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
                }
              }
            }

            if (!success) {
              await prisma.hL7Message.update({
                where: { id: hl7Record.id },
                data: {
                  status: 'FAILED',
                  errorMessage: lastError || 'Unknown error',
                  retryCount: retryAttempts,
                },
              });
            }
          } else {
            // Save message but mark as PENDING (not sent)
            const messageControlId = generateMessageControlId();
            const sendingFac = hl7Config?.sendingFacility || hl7Config?.facilityCode || school.code || 'SCHOOL_CLINIC';
            const receivingFac = hl7Config?.receivingFacility || hl7Config?.processingId || 'ADHIE';
            const processingId = hl7Config?.environment === 'production' ? 'P' : 'T';
            const hl7Version = hl7Config?.hl7Version || '2.5.1';

            const builder = new HL7MessageBuilder({
              messageControlId,
              sendingApplication: `${sendingFac}^${sendingFac}`,
              sendingFacility: `${sendingFac}^${sendingFac}`,
              receivingApplication: hl7Config?.receivingApplication || 'Rhapsody',
              receivingFacility: receivingFac,
              processingId,
              hl7Version,
            });

            if (assessment) {
              builder.buildORU_R01(student, visit, school, assessment);
            } else {
              builder.buildADT_A08(student, visit, school);
            }

            const hl7Message = builder.build();

            await prisma.hL7Message.create({
              data: {
                messageType: assessment ? 'ORU' : 'ADT',
                messageControlId,
                studentId: student.id,
                visitId: visit.id,
                schoolId: school.id,
                messageContent: hl7Message,
                status: 'PENDING',
              },
            });
          }
        }
      }
    } catch (hl7Error) {
      console.error('HL7 message error:', hl7Error);
      // Don't fail the visit creation if HL7 fails
    }

    // Send parent notification email if requested
    if (data.notifyParent) {
      try {
        // Fetch student with parent email
        const studentWithEmail = await prisma.student.findUnique({
          where: { id: data.studentId },
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
            parentEmail: true,
          },
        });

        if (studentWithEmail && studentWithEmail.parentEmail) {
          const emailResult = await sendParentVisitNotification(
            {
              firstName: studentWithEmail.firstName,
              lastName: studentWithEmail.lastName,
              studentId: studentWithEmail.studentId,
              parentEmail: studentWithEmail.parentEmail,
            },
            {
              visitType: visit.visitType,
              visitDate: visit.visitDate,
              chiefComplaint: visit.chiefComplaint,
              diagnosis: visit.diagnosis,
              treatment: visit.treatment,
              followUpRequired: visit.followUpRequired,
              followUpDate: visit.followUpDate,
            },
            assessment ? {
              temperature: assessment.temperature,
              bloodPressureSystolic: assessment.bloodPressureSystolic,
              bloodPressureDiastolic: assessment.bloodPressureDiastolic,
              heartRate: assessment.heartRate,
              respiratoryRate: assessment.respiratoryRate,
              oxygenSaturation: assessment.oxygenSaturation,
              height: assessment.height,
              weight: assessment.weight,
              bmi: assessment.bmi,
            } : null,
            user.id
          );

          if (!emailResult.success) {
            console.error('Parent notification email failed:', emailResult.error);
            // Don't fail the visit creation if email fails
          }
        } else if (!studentWithEmail?.parentEmail) {
          console.warn('Parent email not found for student:', data.studentId);
        }
      } catch (emailError) {
        console.error('Parent notification error:', emailError);
        // Don't fail the visit creation if email fails
      }
    }

    return NextResponse.json(
      { visit, assessment },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Visit creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


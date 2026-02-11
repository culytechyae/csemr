import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const healthRecordImportSchema = z.object({
  schoolId: z.string(),
  records: z.array(
    z.object({
      studentNumber: z.preprocess(
        (val) => {
          const str = String(val || '').trim();
          return str === '' ? undefined : str;
        },
        z.string().optional()
      ),
      height: z.preprocess(
        (val) => {
          if (val === '' || val === null || val === undefined) return undefined;
          const num = Number(val);
          return isNaN(num) ? undefined : num;
        },
        z.number().optional()
      ),
      weight: z.preprocess(
        (val) => {
          if (val === '' || val === null || val === undefined) return undefined;
          const num = Number(val);
          return isNaN(num) ? undefined : num;
        },
        z.number().optional()
      ),
      colorBlindness: z.preprocess(
        (val) => {
          const str = String(val || '').trim();
          return str === '' ? undefined : str;
        },
        z.string().optional()
      ),
      visionTestingPerformed: z.preprocess(
        (val) => {
          const str = String(val || '').trim().toLowerCase();
          if (str === '' || str === 'undefined') return undefined;
          return str === 'yes' || str === 'true' || str === '1' || str === 'y';
        },
        z.boolean().optional()
      ),
      visionTestingNotPerformedReason: z.preprocess(
        (val) => {
          const str = String(val || '').trim();
          return str === '' ? undefined : str;
        },
        z.string().optional()
      ),
      correctiveLenses: z.preprocess(
        (val) => {
          const str = String(val || '').trim();
          return str === '' ? undefined : str;
        },
        z.string().optional()
      ),
      correctiveLensesOtherReason: z.preprocess(
        (val) => {
          const str = String(val || '').trim();
          return str === '' ? undefined : str;
        },
        z.string().optional()
      ),
      rightEye: z.preprocess(
        (val) => {
          const str = String(val || '').trim();
          return str === '' ? undefined : str;
        },
        z.string().optional()
      ),
      leftEye: z.preprocess(
        (val) => {
          const str = String(val || '').trim();
          return str === '' ? undefined : str;
        },
        z.string().optional()
      ),
      rightEyeWithCorrection: z.preprocess(
        (val) => {
          const str = String(val || '').trim();
          return str === '' ? undefined : str;
        },
        z.string().optional()
      ),
      leftEyeWithCorrection: z.preprocess(
        (val) => {
          const str = String(val || '').trim();
          return str === '' ? undefined : str;
        },
        z.string().optional()
      ),
      visionScreeningResult: z.preprocess(
        (val) => {
          const str = String(val || '').trim();
          return str === '' ? undefined : str;
        },
        z.string().optional()
      ),
    })
  ),
});

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();

    if (!body.records || !Array.isArray(body.records)) {
      return NextResponse.json(
        { error: 'Invalid request: records array is required' },
        { status: 400 }
      );
    }

    // Validate each record individually
    const validatedRecords: any[] = [];
    const validationErrors: string[] = [];

    for (let i = 0; i < body.records.length; i++) {
      try {
        const record = healthRecordImportSchema.shape.records.element.parse(
          body.records[i]
        );

        if (!record.studentNumber) {
          validationErrors.push(
            `Row ${i + 1}: Missing student number`
          );
          continue;
        }

        validatedRecords.push(record);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          const studentNumber = body.records[i]?.studentNumber || `Row ${i + 1}`;
          const errors = error.errors.map((err) => {
            const path = err.path.join('.');
            return `${path}: ${err.message}`;
          });
          validationErrors.push(`Student ${studentNumber}: ${errors.join('; ')}`);
        } else {
          validationErrors.push(
            `Row ${i + 1}: ${error.message || 'Unknown error'}`
          );
        }
      }
    }

    if (validatedRecords.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid health records found',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    const data = {
      schoolId: body.schoolId,
      records: validatedRecords,
    };

    if (!data.schoolId) {
      return NextResponse.json(
        { error: 'schoolId is required' },
        { status: 400 }
      );
    }

    // Enforce school assignment
    if (user.role !== 'ADMIN') {
      if (!user.schoolId) {
        return NextResponse.json(
          { error: 'You must be assigned to a school to import health records' },
          { status: 403 }
        );
      }
      if (user.schoolId !== data.schoolId) {
        return NextResponse.json(
          {
            error: 'You can only import health records for your assigned school',
          },
          { status: 403 }
        );
      }
    }

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: data.schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each record
    for (const recordData of data.records) {
      try {
        // Find student by student number in the selected school
        const student = await prisma.student.findFirst({
          where: {
            studentId: recordData.studentNumber,
            schoolId: data.schoolId,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!student) {
          results.errors.push(
            `Student ${recordData.studentNumber}: Student not found in ${school.name}`
          );
          results.skipped++;
          continue;
        }

        // Calculate BMI if both height and weight are provided
        let bmi: number | undefined = undefined;
        if (recordData.height && recordData.weight) {
          const heightInMeters = recordData.height / 100;
          if (heightInMeters > 0) {
            bmi = parseFloat(
              (recordData.weight / (heightInMeters * heightInMeters)).toFixed(1)
            );
          }
        }

        // Normalize vision-related values
        const colorBlindness = normalizeNormalAbnormal(recordData.colorBlindness);
        const visionScreeningResult = normalizeNormalAbnormal(
          recordData.visionScreeningResult
        );
        const correctiveLenses = normalizeCorrectiveLenses(
          recordData.correctiveLenses
        );

        // Build the health record data
        const healthRecordData: any = {
          studentId: student.id,
          schoolId: data.schoolId,
          recordedBy: user.id,
          recordedAt: new Date(),
        };

        if (recordData.height !== undefined) healthRecordData.height = recordData.height;
        if (recordData.weight !== undefined) healthRecordData.weight = recordData.weight;
        if (bmi !== undefined) healthRecordData.bmi = bmi;
        if (colorBlindness) healthRecordData.colorBlindness = colorBlindness;
        if (recordData.visionTestingPerformed !== undefined)
          healthRecordData.visionTestingPerformed = recordData.visionTestingPerformed;
        if (recordData.visionTestingNotPerformedReason)
          healthRecordData.visionTestingNotPerformedReason =
            recordData.visionTestingNotPerformedReason;
        if (correctiveLenses) healthRecordData.correctiveLenses = correctiveLenses;
        if (recordData.correctiveLensesOtherReason)
          healthRecordData.correctiveLensesOtherReason =
            recordData.correctiveLensesOtherReason;
        if (recordData.rightEye) healthRecordData.rightEye = recordData.rightEye;
        if (recordData.leftEye) healthRecordData.leftEye = recordData.leftEye;
        if (recordData.rightEyeWithCorrection)
          healthRecordData.rightEyeWithCorrection =
            recordData.rightEyeWithCorrection;
        if (recordData.leftEyeWithCorrection)
          healthRecordData.leftEyeWithCorrection =
            recordData.leftEyeWithCorrection;
        if (visionScreeningResult)
          healthRecordData.visionScreeningResult = visionScreeningResult;

        // Check if a health record already exists for this student in this school
        const existingRecord = await prisma.healthRecord.findFirst({
          where: {
            studentId: student.id,
            schoolId: data.schoolId,
          },
          orderBy: { recordedAt: 'desc' },
        });

        if (existingRecord) {
          // Update existing record
          await prisma.healthRecord.update({
            where: { id: existingRecord.id },
            data: healthRecordData,
          });
          results.updated++;
        } else {
          // Create new record
          await prisma.healthRecord.create({
            data: healthRecordData,
          });
          results.created++;
        }
      } catch (error: any) {
        results.errors.push(
          `Student ${recordData.studentNumber}: ${error.message || 'Unknown error'}`
        );
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      results: {
        ...results,
        validationErrors: validationErrors.slice(0, 50),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error details:', error.errors);
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    console.error('Health record import error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

// Helper: Normalize Normal/Abnormal values
function normalizeNormalAbnormal(value?: string): string | undefined {
  if (!value) return undefined;
  const lower = value.trim().toLowerCase();
  if (lower === 'normal' || lower === 'n') return 'Normal';
  if (lower === 'abnormal' || lower === 'a' || lower === 'ab') return 'Abnormal';
  return value.trim();
}

// Helper: Normalize Corrective Lenses values
function normalizeCorrectiveLenses(value?: string): string | undefined {
  if (!value) return undefined;
  const lower = value.trim().toLowerCase();
  if (lower === 'none' || lower === 'no' || lower === 'n/a') return 'None';
  if (lower === 'glasses' || lower === 'glass') return 'Glasses';
  if (lower === 'contact lenses' || lower === 'contacts' || lower === 'contact lens')
    return 'Contact lenses';
  if (lower === 'surgical correction' || lower === 'surgical' || lower === 'surgery')
    return 'Surgical correction';
  if (lower === 'other') return 'Other';
  return value.trim();
}


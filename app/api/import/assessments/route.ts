import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assessmentImportSchema = z.object({
  schoolId: z.string(),
  assessments: z.array(z.object({
    studentNumber: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    studentName: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    visitDate: z.string(), // ISO date string or DD/MM/YYYY
    visitTime: z.string().optional(), // HH:MM format
    // Vital signs
    temperature: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      const num = parseFloat(String(val));
      return isNaN(num) ? undefined : num;
    }, z.number().optional()),
    bloodPressureSystolic: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      const num = parseInt(String(val));
      return isNaN(num) ? undefined : num;
    }, z.number().optional()),
    bloodPressureDiastolic: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      const num = parseInt(String(val));
      return isNaN(num) ? undefined : num;
    }, z.number().optional()),
    heartRate: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      const num = parseInt(String(val));
      return isNaN(num) ? undefined : num;
    }, z.number().optional()),
    respiratoryRate: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      const num = parseInt(String(val));
      return isNaN(num) ? undefined : num;
    }, z.number().optional()),
    oxygenSaturation: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      const num = parseFloat(String(val));
      return isNaN(num) ? undefined : num;
    }, z.number().optional()),
    // Measurements
    height: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      const num = parseFloat(String(val));
      return isNaN(num) ? undefined : num;
    }, z.number().optional()),
    weight: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      const num = parseFloat(String(val));
      return isNaN(num) ? undefined : num;
    }, z.number().optional()),
    painScale: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      const num = parseInt(String(val));
      return isNaN(num) ? undefined : num;
    }, z.number().min(0).max(10).optional()),
    // Physical exam
    generalAppearance: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    skinCondition: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    eyes: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    ears: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    throat: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    cardiovascular: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    respiratory: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    abdomen: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    neurological: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    otherFindings: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    // Vision fields
    colorBlindness: z.preprocess((val) => {
      const str = String(val || '').trim().toUpperCase();
      return str === '' || str === 'NORMAL' || str === 'ABNORMAL' ? str || undefined : undefined;
    }, z.enum(['Normal', 'Abnormal']).optional()),
    visionTestingPerformed: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      const str = String(val).toLowerCase().trim();
      return str === 'true' || str === 'yes' || str === '1' || str === 'y';
    }, z.boolean().optional()),
    visionTestingNotPerformedReason: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    correctiveLenses: z.preprocess((val) => {
      const str = String(val || '').trim();
      const valid = ['None', 'Glasses', 'Contact lenses', 'Surgical correction', 'Other'];
      return valid.includes(str) ? str : undefined;
    }, z.enum(['None', 'Glasses', 'Contact lenses', 'Surgical correction', 'Other']).optional()),
    correctiveLensesOtherReason: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    rightEye: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    leftEye: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    rightEyeWithCorrection: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    leftEyeWithCorrection: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    visionScreeningResult: z.preprocess((val) => {
      const str = String(val || '').trim().toUpperCase();
      return str === '' || str === 'NORMAL' || str === 'ABNORMAL' ? str || undefined : undefined;
    }, z.enum(['Normal', 'Abnormal']).optional()),
  })),
});

// Helper function to parse date in DD/MM/YYYY format
function parseDate(dateStr: string, timeStr?: string): Date | null {
  try {
    const cleanedDate = dateStr.trim();
    
    // Try DD/MM/YYYY format first
    const ddmmyyyyMatch = cleanedDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1]);
      const month = parseInt(ddmmyyyyMatch[2]) - 1;
      const year = parseInt(ddmmyyyyMatch[3]);
      
      if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 2100) {
        return null;
      }
      
      let hours = 12;
      let minutes = 0;
      
      if (timeStr) {
        const cleanedTime = timeStr.trim();
        const timeMatch = cleanedTime.match(/^(\d{1,2}):(\d{2})$/);
        if (timeMatch) {
          hours = parseInt(timeMatch[1]);
          minutes = parseInt(timeMatch[2]);
          if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            hours = 12;
            minutes = 0;
          }
        }
      }
      
      const date = new Date(year, month, day, hours, minutes);
      if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }
    
    // Try YYYY-MM-DD format
    const yyyymmddMatch = cleanedDate.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (yyyymmddMatch) {
      const year = parseInt(yyyymmddMatch[1]);
      const month = parseInt(yyyymmddMatch[2]) - 1;
      const day = parseInt(yyyymmddMatch[3]);
      
      if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 2100) {
        return null;
      }
      
      let hours = 12;
      let minutes = 0;
      
      if (timeStr) {
        const cleanedTime = timeStr.trim();
        const timeMatch = cleanedTime.match(/^(\d{1,2}):(\d{2})$/);
        if (timeMatch) {
          hours = parseInt(timeMatch[1]);
          minutes = parseInt(timeMatch[2]);
          if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            hours = 12;
            minutes = 0;
          }
        }
      }
      
      const date = new Date(year, month, day, hours, minutes);
      if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }
    
    // Try standard Date parsing
    const date = new Date(cleanedDate);
    if (!isNaN(date.getTime())) {
      if (timeStr) {
        const cleanedTime = timeStr.trim();
        const timeMatch = cleanedTime.match(/^(\d{1,2}):(\d{2})$/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            date.setHours(hours);
            date.setMinutes(minutes);
          }
        }
      }
      return date;
    }
    
    return null;
  } catch {
    return null;
  }
}

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    
    const validatedAssessments: any[] = [];
    const validationErrors: string[] = [];
    
    if (!body.assessments || !Array.isArray(body.assessments)) {
      return NextResponse.json(
        { error: 'Invalid request: assessments array is required' },
        { status: 400 }
      );
    }
    
    // Validate each assessment individually
    for (let i = 0; i < body.assessments.length; i++) {
      try {
        const assessment = assessmentImportSchema.shape.assessments.element.parse(body.assessments[i]);
        
        if ((!assessment.studentNumber && !assessment.studentName) || !assessment.visitDate) {
          const identifier = assessment.studentNumber || assessment.studentName || body.assessments[i]?.studentNumber || body.assessments[i]?.studentName || `Row ${i + 1}`;
          const missing = [];
          if (!assessment.studentNumber && !assessment.studentName) missing.push('studentNumber or studentName');
          if (!assessment.visitDate) missing.push('visitDate');
          validationErrors.push(`Assessment ${identifier}: Missing required fields: ${missing.join(', ')}`);
          continue;
        }
        
        validatedAssessments.push(assessment);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          const studentNumber = body.assessments[i]?.studentNumber || `Row ${i + 1}`;
          const errors = error.errors.map((err) => {
            const path = err.path.join('.');
            return `${path}: ${err.message}`;
          });
          validationErrors.push(`Assessment ${studentNumber}: ${errors.join('; ')}`);
        } else {
          validationErrors.push(`Assessment Row ${i + 1}: ${error.message || 'Unknown error'}`);
        }
      }
    }
    
    if (validatedAssessments.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid assessments found',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    const data = {
      schoolId: body.schoolId,
      assessments: validatedAssessments,
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
          { error: 'You must be assigned to a school to import assessments' },
          { status: 403 }
        );
      }
      if (user.schoolId !== data.schoolId) {
        return NextResponse.json(
          { error: 'You can only import assessments for your assigned school' },
          { status: 403 }
        );
      }
    }

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: data.schoolId },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each assessment
    for (const assessmentData of data.assessments) {
      try {
        // Parse visit date
        const studentIdentifierForError = assessmentData.studentNumber || assessmentData.studentName || `Unknown`;
        const visitDate = parseDate(assessmentData.visitDate, assessmentData.visitTime);
        if (!visitDate) {
          results.errors.push(
            `Student ${studentIdentifierForError}: Invalid visit date format: ${assessmentData.visitDate}`
          );
          results.skipped++;
          continue;
        }

        // Find student - try by studentId first, then by name as fallback
        const studentIdentifier = assessmentData.studentNumber || assessmentData.studentName || `Unknown`;
        let student = null;
        
        // Try matching by student number/ID first
        if (assessmentData.studentNumber) {
          student = await prisma.student.findFirst({
            where: {
              studentId: assessmentData.studentNumber,
              schoolId: data.schoolId,
              isActive: true,
            },
            orderBy: { createdAt: 'desc' },
          });
        }
        
        // Fallback: try matching by student name
        if (!student && assessmentData.studentName) {
          const nameParts = assessmentData.studentName.trim().split(/\s+/);
          if (nameParts.length >= 2) {
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            
            // Try exact first + last name match
            student = await prisma.student.findFirst({
              where: {
                firstName: { equals: firstName, mode: 'insensitive' },
                lastName: { equals: lastName, mode: 'insensitive' },
                schoolId: data.schoolId,
                isActive: true,
              },
              orderBy: { createdAt: 'desc' },
            });
            
            // If not found, try with full name parts (some names have middle names)
            if (!student) {
              // Try firstName = first part, lastName = everything after first part
              const lastNameFull = nameParts.slice(1).join(' ');
              student = await prisma.student.findFirst({
                where: {
                  firstName: { equals: firstName, mode: 'insensitive' },
                  lastName: { equals: lastNameFull, mode: 'insensitive' },
                  schoolId: data.schoolId,
                  isActive: true,
                },
                orderBy: { createdAt: 'desc' },
              });
            }
            
            // Also try: lastName = last part, firstName = everything before last part
            if (!student && nameParts.length > 2) {
              const firstNameFull = nameParts.slice(0, -1).join(' ');
              student = await prisma.student.findFirst({
                where: {
                  firstName: { equals: firstNameFull, mode: 'insensitive' },
                  lastName: { equals: lastName, mode: 'insensitive' },
                  schoolId: data.schoolId,
                  isActive: true,
                },
                orderBy: { createdAt: 'desc' },
              });
            }
          } else if (nameParts.length === 1) {
            // Single name - try as firstName or lastName
            student = await prisma.student.findFirst({
              where: {
                OR: [
                  { firstName: { equals: nameParts[0], mode: 'insensitive' } },
                  { lastName: { equals: nameParts[0], mode: 'insensitive' } },
                ],
                schoolId: data.schoolId,
                isActive: true,
              },
              orderBy: { createdAt: 'desc' },
            });
          }
        }
        
        // If still not found and we only have studentNumber, try it as a name (in case the CSV column was mislabeled)
        if (!student && assessmentData.studentNumber && !assessmentData.studentName) {
          const nameParts = assessmentData.studentNumber.trim().split(/\s+/);
          // Only try name-based matching if the value looks like a name (contains letters and spaces)
          if (nameParts.length >= 2 && /^[a-zA-Z\s]+$/.test(assessmentData.studentNumber.trim())) {
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            
            student = await prisma.student.findFirst({
              where: {
                firstName: { equals: firstName, mode: 'insensitive' },
                lastName: { equals: lastName, mode: 'insensitive' },
                schoolId: data.schoolId,
                isActive: true,
              },
              orderBy: { createdAt: 'desc' },
            });
            
            if (!student && nameParts.length > 2) {
              const lastNameFull = nameParts.slice(1).join(' ');
              student = await prisma.student.findFirst({
                where: {
                  firstName: { equals: firstName, mode: 'insensitive' },
                  lastName: { equals: lastNameFull, mode: 'insensitive' },
                  schoolId: data.schoolId,
                  isActive: true,
                },
                orderBy: { createdAt: 'desc' },
              });
            }
            
            if (!student && nameParts.length > 2) {
              const firstNameFull = nameParts.slice(0, -1).join(' ');
              student = await prisma.student.findFirst({
                where: {
                  firstName: { equals: firstNameFull, mode: 'insensitive' },
                  lastName: { equals: lastName, mode: 'insensitive' },
                  schoolId: data.schoolId,
                  isActive: true,
                },
                orderBy: { createdAt: 'desc' },
              });
            }
          }
        }

        if (!student) {
          results.errors.push(
            `Student ${studentIdentifier}: Student not found in school ${school.name}`
          );
          results.skipped++;
          continue;
        }

        // Find visit by student and date (within 1 hour window)
        const visit = await prisma.clinicalVisit.findFirst({
          where: {
            studentId: student.id,
            schoolId: data.schoolId,
            visitDate: {
              gte: new Date(visitDate.getTime() - 60 * 60 * 1000),
              lte: new Date(visitDate.getTime() + 60 * 60 * 1000),
            },
          },
          orderBy: { visitDate: 'desc' },
        });

        if (!visit) {
          results.errors.push(
            `Student ${studentIdentifier}: No visit found for date ${assessmentData.visitDate}. Please import the visit first.`
          );
          results.skipped++;
          continue;
        }

        // Calculate BMI if height and weight are provided
        let bmi: number | null = null;
        if (assessmentData.height && assessmentData.weight) {
          bmi = assessmentData.weight / Math.pow(assessmentData.height / 100, 2);
        }

        // Prepare assessment data
        const assessmentRecord: any = {
          visitId: visit.id,
          studentId: student.id,
          temperature: assessmentData.temperature,
          bloodPressureSystolic: assessmentData.bloodPressureSystolic,
          bloodPressureDiastolic: assessmentData.bloodPressureDiastolic,
          heartRate: assessmentData.heartRate,
          respiratoryRate: assessmentData.respiratoryRate,
          oxygenSaturation: assessmentData.oxygenSaturation,
          height: assessmentData.height,
          weight: assessmentData.weight,
          bmi: bmi,
          painScale: assessmentData.painScale,
          generalAppearance: assessmentData.generalAppearance,
          skinCondition: assessmentData.skinCondition,
          eyes: assessmentData.eyes,
          ears: assessmentData.ears,
          throat: assessmentData.throat,
          cardiovascular: assessmentData.cardiovascular,
          respiratory: assessmentData.respiratory,
          abdomen: assessmentData.abdomen,
          neurological: assessmentData.neurological,
          otherFindings: assessmentData.otherFindings,
          colorBlindness: assessmentData.colorBlindness,
          visionTestingPerformed: assessmentData.visionTestingPerformed,
          visionTestingNotPerformedReason: assessmentData.visionTestingNotPerformedReason,
          correctiveLenses: assessmentData.correctiveLenses,
          correctiveLensesOtherReason: assessmentData.correctiveLensesOtherReason,
          rightEye: assessmentData.rightEye,
          leftEye: assessmentData.leftEye,
          rightEyeWithCorrection: assessmentData.rightEyeWithCorrection,
          leftEyeWithCorrection: assessmentData.leftEyeWithCorrection,
          visionScreeningResult: assessmentData.visionScreeningResult,
          createdBy: user.id,
        };

        // Remove undefined values
        Object.keys(assessmentRecord).forEach((key) => {
          if (assessmentRecord[key] === undefined) {
            delete assessmentRecord[key];
          }
        });

        // Check if assessment already exists
        const existingAssessment = await prisma.clinicalAssessment.findUnique({
          where: { visitId: visit.id },
        });

        if (existingAssessment) {
          // Update existing assessment
          await prisma.clinicalAssessment.update({
            where: { id: existingAssessment.id },
            data: assessmentRecord,
          });
          results.updated++;
        } else {
          // Create new assessment
          await prisma.clinicalAssessment.create({
            data: assessmentRecord,
          });
          results.created++;
        }
      } catch (error: any) {
        results.errors.push(
          `Student ${assessmentData.studentNumber || assessmentData.studentName || 'Unknown'}: ${error.message || 'Unknown error'}`
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
      const errorMessages = error.errors.map((err) => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors,
          message: `Validation failed: ${errorMessages.join('; ')}`
        },
        { status: 400 }
      );
    }
    console.error('Assessment import error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});


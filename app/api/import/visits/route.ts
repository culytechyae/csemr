import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const visitImportSchema = z.object({
  schoolId: z.string(),
  visits: z.array(z.object({
    studentNumber: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    studentName: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    visitDate: z.string(), // ISO date string
    visitTime: z.string().optional(), // HH:MM format
    visitType: z.enum(['ROUTINE_CHECKUP', 'ILLNESS', 'INJURY', 'VACCINATION', 'EMERGENCY', 'FOLLOW_UP']).optional(),
    chiefComplaint: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    assessment: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    treatment: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    notes: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    evaluation: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
    remarks: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? undefined : str;
    }, z.string().optional()),
  })),
});

// Helper function to parse date in DD/MM/YYYY format
function parseDate(dateStr: string, timeStr?: string): Date | null {
  try {
    // Clean the date string
    const cleanedDate = dateStr.trim();
    
    // Try DD/MM/YYYY format first (most common in CSV imports)
    const ddmmyyyyMatch = cleanedDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1]);
      const month = parseInt(ddmmyyyyMatch[2]) - 1; // Month is 0-indexed
      const year = parseInt(ddmmyyyyMatch[3]);
      
      // Validate date components
      if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 2100) {
        return null;
      }
      
      let hours = 12; // Default to noon
      let minutes = 0;
      
      if (timeStr) {
        const cleanedTime = timeStr.trim();
        const timeMatch = cleanedTime.match(/^(\d{1,2}):(\d{2})$/);
        if (timeMatch) {
          hours = parseInt(timeMatch[1]);
          minutes = parseInt(timeMatch[2]);
          // Validate time
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
    
    // Try YYYY-MM-DD format (ISO format)
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
    
    // Try standard Date parsing as last resort
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

// Helper function to determine visit type from chief complaint
function determineVisitType(chiefComplaint?: string, assessment?: string): 'ROUTINE_CHECKUP' | 'ILLNESS' | 'INJURY' | 'VACCINATION' | 'EMERGENCY' | 'FOLLOW_UP' {
  if (!chiefComplaint && !assessment) {
    return 'ROUTINE_CHECKUP';
  }
  
  const combined = `${chiefComplaint || ''} ${assessment || ''}`.toLowerCase();
  
  if (combined.includes('injury') || combined.includes('hurt') || combined.includes('wound') || combined.includes('cut') || combined.includes('bruise')) {
    return 'INJURY';
  }
  if (combined.includes('vaccination') || combined.includes('vaccine') || combined.includes('immunization')) {
    return 'VACCINATION';
  }
  if (combined.includes('emergency') || combined.includes('urgent') || combined.includes('critical')) {
    return 'EMERGENCY';
  }
  if (combined.includes('follow') || combined.includes('recheck') || combined.includes('review')) {
    return 'FOLLOW_UP';
  }
  
  return 'ILLNESS'; // Default for most clinic visits
}

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    
    // Validate each visit individually to allow partial imports
    const validatedVisits: any[] = [];
    const validationErrors: string[] = [];
    
    if (!body.visits || !Array.isArray(body.visits)) {
      return NextResponse.json(
        { error: 'Invalid request: visits array is required' },
        { status: 400 }
      );
    }
    
    // Validate each visit individually
    for (let i = 0; i < body.visits.length; i++) {
      try {
        const visit = visitImportSchema.shape.visits.element.parse(body.visits[i]);
        
        // Additional validation: Skip if critical fields are missing
        if ((!visit.studentNumber && !visit.studentName) || !visit.visitDate) {
          const identifier = visit.studentNumber || visit.studentName || body.visits[i]?.studentNumber || body.visits[i]?.studentName || `Row ${i + 1}`;
          const missing = [];
          if (!visit.studentNumber && !visit.studentName) missing.push('studentNumber or studentName');
          if (!visit.visitDate) missing.push('visitDate');
          validationErrors.push(`Visit ${identifier}: Missing required fields: ${missing.join(', ')}`);
          continue;
        }
        
        validatedVisits.push(visit);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          const studentNumber = body.visits[i]?.studentNumber || `Row ${i + 1}`;
          const errors = error.errors.map((err) => {
            const path = err.path.join('.');
            return `${path}: ${err.message}`;
          });
          validationErrors.push(`Visit ${studentNumber}: ${errors.join('; ')}`);
        } else {
          validationErrors.push(`Visit Row ${i + 1}: ${error.message || 'Unknown error'}`);
        }
      }
    }
    
    // If no valid visits, return error
    if (validatedVisits.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid visits found',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    const data = {
      schoolId: body.schoolId,
      visits: validatedVisits,
    };
    
    // Validate schoolId
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
          { error: 'You must be assigned to a school to import visits' },
          { status: 403 }
        );
      }
      if (user.schoolId !== data.schoolId) {
        return NextResponse.json(
          { error: 'You can only import visits for your assigned school' },
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
      skipped: 0,
      errors: [] as string[],
    };

    // Process each visit
    for (const visitData of data.visits) {
      try {
        // Parse visit date
        const visitDate = parseDate(visitData.visitDate, visitData.visitTime);
        if (!visitDate) {
          results.errors.push(
            `Student ${visitData.studentNumber || visitData.studentName || 'Unknown'}: Invalid visit date format: ${visitData.visitDate}`
          );
          results.skipped++;
          continue;
        }

        // Find student - try by studentId first, then by name as fallback
        const studentIdentifier = visitData.studentNumber || visitData.studentName || `Unknown`;
        let student = null;
        
        // Try matching by student number/ID first
        if (visitData.studentNumber) {
          student = await prisma.student.findFirst({
            where: {
              studentId: visitData.studentNumber,
              schoolId: data.schoolId,
              isActive: true,
            },
            orderBy: { createdAt: 'desc' },
          });
        }
        
        // Fallback: try matching by student name
        if (!student && visitData.studentName) {
          const nameParts = visitData.studentName.trim().split(/\s+/);
          if (nameParts.length >= 2) {
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
            
            if (!student) {
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
        
        // If still not found and studentNumber looks like a name, try name-based matching
        if (!student && visitData.studentNumber && !visitData.studentName) {
          const nameParts = visitData.studentNumber.trim().split(/\s+/);
          if (nameParts.length >= 2 && /^[a-zA-Z\s]+$/.test(visitData.studentNumber.trim())) {
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

        // Determine visit type
        const visitType = visitData.visitType || determineVisitType(visitData.chiefComplaint, visitData.assessment);

        // Combine notes from multiple fields
        const notesParts: string[] = [];
        if (visitData.assessment) {
          notesParts.push(`Assessment: ${visitData.assessment}`);
        }
        if (visitData.evaluation) {
          notesParts.push(`Evaluation: ${visitData.evaluation}`);
        }
        if (visitData.remarks) {
          notesParts.push(`Remarks: ${visitData.remarks}`);
        }
        const combinedNotes = notesParts.length > 0 ? notesParts.join('\n\n') : undefined;

        // Check if visit already exists (same student, same date/time within 1 hour)
        const existingVisit = await prisma.clinicalVisit.findFirst({
          where: {
            studentId: student.id,
            schoolId: data.schoolId,
            visitDate: {
              gte: new Date(visitDate.getTime() - 60 * 60 * 1000), // 1 hour before
              lte: new Date(visitDate.getTime() + 60 * 60 * 1000), // 1 hour after
            },
            chiefComplaint: visitData.chiefComplaint || undefined,
          },
        });

        if (existingVisit) {
          results.errors.push(
            `Student ${studentIdentifier}: Visit already exists for ${visitData.visitDate}`
          );
          results.skipped++;
          continue;
        }

        // Create visit
        await prisma.clinicalVisit.create({
          data: {
            studentId: student.id,
            schoolId: data.schoolId,
            visitDate: visitDate,
            visitType: visitType,
            chiefComplaint: visitData.chiefComplaint,
            notes: combinedNotes,
            diagnosis: visitData.evaluation,
            treatment: visitData.treatment,
            followUpRequired: false,
            createdBy: user.id,
          },
        });

        results.created++;
      } catch (error: any) {
        results.errors.push(
          `Student ${visitData.studentNumber || visitData.studentName || 'Unknown'}: ${error.message || 'Unknown error'}`
        );
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.created} created, ${results.skipped} skipped`,
      results: {
        ...results,
        validationErrors: validationErrors.slice(0, 50), // Limit to first 50 errors
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
    console.error('Visit import error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});


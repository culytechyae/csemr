import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const studentImportSchema = z.object({
  schoolId: z.string(),
  academicYear: z.string(),
  students: z.array(z.object({
    studentId: z.preprocess((val) => String(val || ''), z.string().min(1)),
    firstName: z.preprocess((val) => String(val || ''), z.string().min(1)),
    lastName: z.preprocess((val) => String(val || ''), z.string().min(1)),
    dateOfBirth: z.preprocess((val) => {
      if (!val) return undefined;
      
      if (val instanceof Date) {
        if (isNaN(val.getTime())) return undefined;
        return val.toISOString().split('T')[0];
      }
      
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed) return undefined;
        
        // Handle YYYY-MM-DD format (most common)
        const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (ymdMatch) {
          const year = parseInt(ymdMatch[1]);
          const month = parseInt(ymdMatch[2]);
          const day = parseInt(ymdMatch[3]);
          if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const testDate = new Date(dateStr);
            if (!isNaN(testDate.getTime()) && testDate.getFullYear() === year) {
              return dateStr;
            }
          }
        }
        
        // Try standard Date parsing
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
        
        return undefined; // Invalid date format
      }
      
      return undefined;
    }, z.string().optional()),
    gender: z.preprocess((val) => {
      const str = String(val || '').toUpperCase().trim();
      return str === 'F' || str === 'FEMALE' ? 'FEMALE' : 'MALE';
    }, z.enum(['MALE', 'FEMALE'])),
    nationality: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      return String(val);
    }, z.string().optional()),
    bloodType: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return 'UNKNOWN';
      const str = String(val).toUpperCase().trim().replace(/[^A-Z0-9_]/g, '_');
      const validTypes = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'];
      return validTypes.includes(str) ? str : 'UNKNOWN';
    }, z.enum([
      'A_POSITIVE',
      'A_NEGATIVE',
      'B_POSITIVE',
      'B_NEGATIVE',
      'AB_POSITIVE',
      'AB_NEGATIVE',
      'O_POSITIVE',
      'O_NEGATIVE',
      'UNKNOWN',
    ]).optional()),
    grade: z.preprocess((val) => {
      if (val === null || val === undefined || val === '') return undefined;
      return String(val);
    }, z.string().optional()),
    homeroom: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      return String(val);
    }, z.string().optional()),
    studentEmiratesId: z.preprocess((val) => {
      if (val === null || val === undefined || val === '') return undefined;
      return String(val);
    }, z.string().optional()),
    parentName: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? 'Not Provided' : str;
    }, z.string().min(1)),
    parentPhone: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? 'Not Provided' : str;
    }, z.string().min(1)),
    parentEmail: z.preprocess((val) => {
      const str = String(val || '').trim();
      if (str === '') return undefined;
      // Basic email validation - if invalid, return undefined instead of failing
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(str) ? str : undefined;
    }, z.string().optional()),
    emergencyContact: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? 'Not Provided' : str;
    }, z.string().min(1)),
    emergencyPhone: z.preprocess((val) => {
      const str = String(val || '').trim();
      return str === '' ? 'Not Provided' : str;
    }, z.string().min(1)),
    address: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      return String(val);
    }, z.string().optional()),
    allergies: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      return String(val);
    }, z.string().optional()),
    chronicConditions: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      return String(val);
    }, z.string().optional()),
    medications: z.preprocess((val) => {
      if (!val || val === '' || val === null || val === undefined) return undefined;
      return String(val);
    }, z.string().optional()),
  })),
});

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    
    // Validate each student individually to allow partial imports
    const validatedStudents: any[] = [];
    const validationErrors: string[] = [];
    
    if (!body.students || !Array.isArray(body.students)) {
      return NextResponse.json(
        { error: 'Invalid request: students array is required' },
        { status: 400 }
      );
    }
    
    // Validate each student individually
    for (let i = 0; i < body.students.length; i++) {
      try {
        const student = studentImportSchema.shape.students.element.parse(body.students[i]);
        
        // Additional validation: Skip if critical fields are missing
        if (!student.studentId || !student.firstName || !student.lastName || !student.dateOfBirth) {
          const studentId = student.studentId || body.students[i]?.studentId || `Row ${i + 1}`;
          const missing = [];
          if (!student.studentId) missing.push('studentId');
          if (!student.firstName) missing.push('firstName');
          if (!student.lastName) missing.push('lastName');
          if (!student.dateOfBirth) missing.push('dateOfBirth');
          validationErrors.push(`Student ${studentId}: Missing required fields: ${missing.join(', ')}`);
          continue;
        }
        
        validatedStudents.push(student);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          const studentId = body.students[i]?.studentId || `Row ${i + 1}`;
          const errors = error.errors.map((err) => {
            const path = err.path.join('.');
            return `${path}: ${err.message}`;
          });
          validationErrors.push(`Student ${studentId}: ${errors.join('; ')}`);
        } else {
          validationErrors.push(`Student Row ${i + 1}: ${error.message || 'Unknown error'}`);
        }
      }
    }
    
    // If no valid students, return error
    if (validatedStudents.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid students found',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    const data = {
      schoolId: body.schoolId,
      academicYear: body.academicYear,
      students: validatedStudents,
    };
    
    // Validate schoolId and academicYear
    if (!data.schoolId || !data.academicYear) {
      return NextResponse.json(
        { error: 'schoolId and academicYear are required' },
        { status: 400 }
      );
    }

    // Enforce school assignment
    if (user.role !== 'ADMIN') {
      if (!user.schoolId) {
        return NextResponse.json(
          { error: 'You must be assigned to a school to import students' },
          { status: 403 }
        );
      }
      if (user.schoolId !== data.schoolId) {
        return NextResponse.json(
          { error: 'You can only import students for your assigned school' },
          { status: 403 }
        );
      }
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    // Process each student
    for (const studentData of data.students) {
      try {
        // Skip if dateOfBirth is missing or invalid
        if (!studentData.dateOfBirth) {
          results.errors.push(
            `Student ${studentData.studentId}: Missing or invalid date of birth`
          );
          continue;
        }

        // Parse and validate date
        const dateOfBirth = new Date(studentData.dateOfBirth);
        if (isNaN(dateOfBirth.getTime())) {
          results.errors.push(
            `Student ${studentData.studentId}: Invalid date of birth format: ${studentData.dateOfBirth}`
          );
          continue;
        }

        const studentRecord = {
          schoolId: data.schoolId,
          academicYear: data.academicYear,
          studentId: studentData.studentId,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          dateOfBirth: dateOfBirth,
          gender: studentData.gender,
          nationality: studentData.nationality,
          bloodType: studentData.bloodType || 'UNKNOWN',
          grade: studentData.grade,
          homeroom: studentData.homeroom,
          studentEmiratesId: studentData.studentEmiratesId,
          parentName: studentData.parentName,
          parentPhone: studentData.parentPhone,
          parentEmail: studentData.parentEmail,
          emergencyContact: studentData.emergencyContact,
          emergencyPhone: studentData.emergencyPhone,
          address: studentData.address,
          allergies: studentData.allergies,
          chronicConditions: studentData.chronicConditions,
          medications: studentData.medications,
        };

        // Upsert: Update if exists, create if not
        const existing = await prisma.student.findUnique({
          where: {
            schoolId_studentId_academicYear: {
              schoolId: data.schoolId,
              studentId: studentData.studentId,
              academicYear: data.academicYear,
            },
          },
        });

        if (existing) {
          await prisma.student.update({
            where: { id: existing.id },
            data: studentRecord,
          });
          results.updated++;
        } else {
          await prisma.student.create({
            data: studentRecord,
          });
          results.created++;
        }
      } catch (error: any) {
        results.errors.push(
          `Student ${studentData.studentId}: ${error.message || 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.created} created, ${results.updated} updated${validationErrors.length > 0 ? `, ${validationErrors.length} skipped due to validation errors` : ''}`,
      results: {
        ...results,
        skipped: validationErrors.length,
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
    console.error('Student import error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});


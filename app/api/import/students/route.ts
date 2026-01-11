import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const studentImportSchema = z.object({
  schoolId: z.string(),
  academicYear: z.string(),
  students: z.array(z.object({
    studentId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.string(),
    gender: z.enum(['MALE', 'FEMALE']),
    nationality: z.string().optional(),
    bloodType: z.enum([
      'A_POSITIVE',
      'A_NEGATIVE',
      'B_POSITIVE',
      'B_NEGATIVE',
      'AB_POSITIVE',
      'AB_NEGATIVE',
      'O_POSITIVE',
      'O_NEGATIVE',
      'UNKNOWN',
    ]).optional(),
    parentName: z.string(),
    parentPhone: z.string(),
    parentEmail: z.string().email().optional(),
    emergencyContact: z.string(),
    emergencyPhone: z.string(),
    address: z.string().optional(),
    allergies: z.string().optional(),
    chronicConditions: z.string().optional(),
    medications: z.string().optional(),
  })),
});

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const data = studentImportSchema.parse(body);

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
        const studentRecord = {
          schoolId: data.schoolId,
          academicYear: data.academicYear,
          studentId: studentData.studentId,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          dateOfBirth: new Date(studentData.dateOfBirth),
          gender: studentData.gender,
          nationality: studentData.nationality,
          bloodType: studentData.bloodType || 'UNKNOWN',
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
      message: `Import completed: ${results.created} created, ${results.updated} updated`,
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Student import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


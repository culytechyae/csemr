import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return requireAuth(async (req: NextRequest, user) => {
      try {
        // Fetch student with all related data
        const student = await prisma.student.findUnique({
          where: { id },
          include: {
            school: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            visits: {
              include: {
                assessment: true,
                creator: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
              orderBy: { visitDate: 'desc' },
            },
            assessments: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!student) {
          return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Check access: non-admin users can only access students from their school
        if (user.role !== 'ADMIN' && user.schoolId !== student.schoolId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Calculate health statistics
        const totalVisits = student.visits.length;
        const visitsWithAssessment = student.visits.filter(v => v.assessment).length;
        
        // Get latest vital signs
        const latestAssessment = student.assessments[0];
        
        // Calculate age
        const today = new Date();
        const birthDate = new Date(student.dateOfBirth);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const ageInMonths = age * 12 + monthDiff;
        
        // Get visit type counts
        const visitTypeCounts = student.visits.reduce((acc, visit) => {
          acc[visit.visitType] = (acc[visit.visitType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Get recent diagnoses
        const recentDiagnoses = student.visits
          .filter(v => v.diagnosis)
          .slice(0, 5)
          .map(v => ({
            diagnosis: v.diagnosis,
            date: v.visitDate,
            visitType: v.visitType,
          }));

        // Get chronic conditions and allergies
        const healthSummary = {
          allergies: student.allergies || 'None recorded',
          chronicConditions: student.chronicConditions || 'None recorded',
          medications: student.medications || 'None recorded',
        };

        const summary = {
          student,
          statistics: {
            totalVisits,
            visitsWithAssessment,
            age,
            ageInMonths,
            visitTypeCounts,
          },
          latestAssessment,
          recentDiagnoses,
          healthSummary,
        };

        return NextResponse.json(summary);
      } catch (error) {
        console.error('Student summary fetch error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    })(req);
  } catch (error) {
    console.error('Params error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}


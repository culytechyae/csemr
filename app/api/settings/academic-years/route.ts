import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

/**
 * Generate academic years list
 * Returns a list of academic years in format "YYYY-YYYY" (e.g., "2024-2025")
 * Defaults to current year ± 5 years
 */
function generateAcademicYears(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  
  // Generate 10 years: 5 years before to 5 years after current year
  for (let i = -5; i <= 5; i++) {
    const startYear = currentYear + i;
    const endYear = startYear + 1;
    years.push(`${startYear}-${endYear}`);
  }
  
  return years.reverse(); // Most recent first
}

export async function GET(req: NextRequest) {
  return requireAuth(async (req: NextRequest, user) => {
    try {
      // Get all unique academic years from schools (existing configured years)
      const { prisma } = await import('@/lib/prisma');
      const schools = await prisma.school.findMany({
        where: {
          currentAcademicYear: { not: null },
        },
        select: {
          currentAcademicYear: true,
        },
      });

      // Get unique academic years from schools
      const schoolAcademicYears = Array.from(
        new Set(
          schools
            .map((s) => s.currentAcademicYear)
            .filter((year): year is string => year !== null)
        )
      ).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

      // Generate default academic years list
      const defaultAcademicYears = generateAcademicYears();

      // Combine and deduplicate (school years first, then defaults)
      const allAcademicYears = Array.from(
        new Set([...schoolAcademicYears, ...defaultAcademicYears])
      ).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

      return NextResponse.json({
        academicYears: allAcademicYears,
        defaultAcademicYear: defaultAcademicYears[0], // Current year
      });
    } catch (error) {
      console.error('Error fetching academic years:', error);
      // Fallback to generated years
      return NextResponse.json({
        academicYears: generateAcademicYears(),
        defaultAcademicYear: generateAcademicYears()[0],
      });
    }
  })(req);
}


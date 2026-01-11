import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schoolSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  principalName: z.string().min(1),
  currentAcademicYear: z.string().optional(),
});

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const schools = await prisma.school.findMany({
      where: user.role === 'ADMIN' ? {} : { id: user.schoolId || '' },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(schools);
  } catch (error) {
    console.error('Schools fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = requireRole('ADMIN')(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const data = schoolSchema.parse(body);

    const school = await prisma.school.create({
      data,
    });

    return NextResponse.json(school, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('School creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


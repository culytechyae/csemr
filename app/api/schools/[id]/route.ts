import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schoolSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  principalName: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return requireAuth(async (req: NextRequest, user) => {
      try {
        const school = await prisma.school.findUnique({
          where: { id },
        });

        if (!school) {
          return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        if (user.role !== 'ADMIN' && user.schoolId !== school.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(school);
      } catch (error) {
        console.error('School fetch error:', error);
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return requireRole('ADMIN')(async (req: NextRequest, user) => {
    try {
      const body = await req.json();
      const data = schoolSchema.parse(body);

      const school = await prisma.school.update({
        where: { id },
        data,
      });

      return NextResponse.json(school);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }
      console.error('School update error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return requireRole('ADMIN')(async (req: NextRequest, user) => {
    try {
      await prisma.school.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('School delete error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'CLINIC_MANAGER', 'NURSE', 'DOCTOR', 'STAFF']),
  schoolId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');
    const role = searchParams.get('role');

    const whereClause: any = {};
    
    // Non-admins can only see users from their school
    if (user.role !== 'ADMIN' && user.schoolId) {
      whereClause.schoolId = user.schoolId;
    } else if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    if (role) {
      whereClause.role = role;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        schoolId: true,
        isActive: true,
        createdAt: true,
        school: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = requireRole('ADMIN', 'CLINIC_MANAGER')(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const data = userSchema.parse(body);

    // Enforce school assignment for non-admin users
    if (data.role !== 'ADMIN' && !data.schoolId) {
      return NextResponse.json(
        { error: 'Non-admin users must be assigned to a school' },
        { status: 400 }
      );
    }

    // Clinic managers can only create users for their school
    if (user.role === 'CLINIC_MANAGER') {
      if (!user.schoolId) {
        return NextResponse.json(
          { error: 'You must be assigned to a school to create users' },
          { status: 403 }
        );
      }
      // Force the schoolId to be the clinic manager's school
      data.schoolId = user.schoolId;
      
      // Clinic managers can't create admins
      if (data.role === 'ADMIN') {
        return NextResponse.json(
          { error: 'You cannot create admin users' },
          { status: 403 }
        );
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password if provided
    const passwordHash = data.password
      ? await bcrypt.hash(data.password, 10)
      : await bcrypt.hash('password123', 10); // Default password

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        schoolId: data.schoolId || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        schoolId: true,
        isActive: true,
        lockedUntil: true,
        failedLoginAttempts: true,
        school: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


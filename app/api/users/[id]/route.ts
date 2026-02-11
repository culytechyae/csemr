import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { resetPassword } from '@/security/utils/password';

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'CLINIC_MANAGER', 'NURSE', 'DOCTOR', 'STAFF']).optional(),
  schoolId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return requireAuth(async (req: NextRequest, user) => {
    try {
      const targetUser = await prisma.user.findUnique({
        where: { id },
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
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Non-admins can only view users from their school
      if (user.role !== 'ADMIN' && user.schoolId !== targetUser.schoolId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json(targetUser);
    } catch (error) {
      console.error('User fetch error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return requireRole('ADMIN', 'CLINIC_MANAGER')(async (req: NextRequest, user) => {
    try {
      const body = await req.json();
      const data = updateUserSchema.parse(body);

      const targetUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Only ADMIN can change roles
      if (data.role && data.role !== targetUser.role && user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only admins can change user roles' },
          { status: 403 }
        );
      }

      // Clinic managers can only update users from their school
      if (user.role === 'CLINIC_MANAGER') {
        if (targetUser.schoolId !== user.schoolId) {
          return NextResponse.json(
            { error: 'You can only update users from your own school' },
            { status: 403 }
          );
        }
        // Can't change role to admin
        if (data.role === 'ADMIN') {
          return NextResponse.json(
            { error: 'You cannot change user role to admin' },
            { status: 403 }
          );
        }
        // Can't change school
        if (data.schoolId && data.schoolId !== user.schoolId) {
          return NextResponse.json(
            { error: 'You cannot change user school' },
            { status: 403 }
          );
        }
      }

      // Check email uniqueness if changing email
      if (data.email && data.email !== targetUser.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });
        if (existingUser) {
          return NextResponse.json(
            { error: 'A user with this email already exists' },
            { status: 400 }
          );
        }
      }

      // Validate schoolId if provided
      if (data.schoolId) {
        const schoolExists = await prisma.school.findUnique({
          where: { id: data.schoolId },
        });
        if (!schoolExists) {
          return NextResponse.json(
            { error: 'Selected school does not exist' },
            { status: 400 }
          );
        }
      }

      // Handle password change using password policy
      const updateData: any = { ...data };
      // Remove password from update data — it's not a DB column
      delete updateData.password;

      if (data.password) {
        // Only ADMIN can reset passwords for other users
        if (user.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Only admins can change user passwords' },
            { status: 403 }
          );
        }
        
        // Use password reset function which enforces password policy
        const passwordResult = await resetPassword(id, data.password);
        if (!passwordResult.success) {
          return NextResponse.json(
            { error: passwordResult.error || 'Password validation failed' },
            { status: 400 }
          );
        }
      }

      // Ensure schoolId is null for ADMIN role
      if (updateData.role === 'ADMIN') {
        updateData.schoolId = null;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          schoolId: true,
          isActive: true,
          school: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      });

      return NextResponse.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      // Handle Prisma-specific errors
      const prismaError = error as any;
      if (prismaError?.code === 'P2002') {
        const target = prismaError.meta?.target;
        if (target?.includes('email')) {
          return NextResponse.json(
            { error: 'A user with this email already exists' },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: 'A unique constraint violation occurred' },
          { status: 400 }
        );
      }
      if (prismaError?.code === 'P2003') {
        return NextResponse.json(
          { error: 'Invalid reference: the selected school may not exist' },
          { status: 400 }
        );
      }
      if (prismaError?.code === 'P2025') {
        return NextResponse.json(
          { error: 'User not found or has been deleted' },
          { status: 404 }
        );
      }

      console.error('User update error:', error);
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
      // Don't allow deleting yourself
      if (id === user.id) {
        return NextResponse.json(
          { error: 'You cannot delete your own account' },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('User delete error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}


import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const userImportSchema = z.object({
  users: z.array(z.object({
    email: z.string().email(),
    password: z.string().min(6).optional(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(['ADMIN', 'CLINIC_MANAGER', 'NURSE', 'DOCTOR', 'STAFF']),
    schoolId: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  })),
});

export const POST = requireRole('ADMIN', 'CLINIC_MANAGER')(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const data = userImportSchema.parse(body);

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    // Process each user
    for (const userData of data.users) {
      try {
        // Enforce school assignment for non-admin users
        if (userData.role !== 'ADMIN' && !userData.schoolId) {
          results.errors.push(
            `User ${userData.email}: Non-admin users must have a school assignment`
          );
          continue;
        }

        // Clinic managers can only create users for their school
        if (user.role === 'CLINIC_MANAGER') {
          if (!user.schoolId) {
            results.errors.push(
              `User ${userData.email}: You must be assigned to a school`
            );
            continue;
          }
          if (userData.schoolId !== user.schoolId) {
            results.errors.push(
              `User ${userData.email}: You can only create users for your school`
            );
            continue;
          }
          if (userData.role === 'ADMIN') {
            results.errors.push(
              `User ${userData.email}: You cannot create admin users`
            );
            continue;
          }
          // Force school assignment
          userData.schoolId = user.schoolId;
        }

        // Check if user exists
        const existing = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        const passwordHash = userData.password
          ? await bcrypt.hash(userData.password, 10)
          : existing?.passwordHash || await bcrypt.hash('password123', 10);

        const userRecord = {
          email: userData.email,
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          schoolId: userData.schoolId || null,
          isActive: userData.isActive !== undefined ? userData.isActive : true,
        };

        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: userRecord,
          });
          results.updated++;
        } else {
          await prisma.user.create({
            data: userRecord,
          });
          results.created++;
        }
      } catch (error: any) {
        results.errors.push(
          `User ${userData.email}: ${error.message || 'Unknown error'}`
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
    console.error('User import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


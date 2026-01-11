/**
 * MFA Verification API
 * Verifies MFA code and enables MFA if setting up, or verifies for login
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { verifyMFACode } from '@/security/utils/mfa';
import { decryptData } from '@/security/utils/encryption';
import { logSecurityEvent } from '@/security/audit/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, enableMFA, loginToken } = body;

    if (!code || !code.match(/^\d{6}$/)) {
      return NextResponse.json(
        { error: 'Invalid MFA code. Must be 6 digits.' },
        { status: 400 }
      );
    }

    // If loginToken is provided, this is a login verification
    if (loginToken) {
      // Verify login token and get user
      const session = await prisma.session.findUnique({
        where: { token: loginToken },
        include: { user: true },
      });

      if (!session || !session.isActive || new Date() > session.expiresAt) {
        return NextResponse.json(
          { error: 'Invalid or expired login token' },
          { status: 401 }
        );
      }

      const user = session.user;
      if (!user.mfaEnabled || !user.mfaSecret) {
        return NextResponse.json(
          { error: 'MFA is not enabled for this account' },
          { status: 400 }
        );
      }

      // Decrypt and verify MFA code
      const secret = await decryptData(user.mfaSecret);
      const isValid = verifyMFACode(code, secret);

      if (!isValid) {
        await logSecurityEvent(
          'MFA_VERIFICATION_FAILED',
          user.id,
          'WARNING',
          `Failed MFA verification for ${user.email}`,
          request
        );
        return NextResponse.json(
          { error: 'Invalid MFA code' },
          { status: 401 }
        );
      }

      // MFA verified - activate the session and create auth token
      await prisma.session.update({
        where: { id: session.id },
        data: { isActive: true },
      });

      await logSecurityEvent(
        'MFA_VERIFICATION_SUCCESS',
        user.id,
        'INFO',
        `Successful MFA verification for ${user.email}`,
        request
      );

      const response = NextResponse.json({
        success: true,
        message: 'MFA verified successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          schoolId: user.schoolId,
        },
      });

      // Set auth cookie
      response.cookies.set('auth-token', session.token, {
        httpOnly: true,
        secure: request.headers.get('x-forwarded-proto') === 'https' || request.url.startsWith('https://'),
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    // Otherwise, this is MFA setup verification
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mfaSecret: true, mfaEnabled: true },
    });

    if (!dbUser?.mfaSecret) {
      return NextResponse.json(
        { error: 'MFA setup not initiated. Please start MFA setup first.' },
        { status: 400 }
      );
    }

    if (dbUser.mfaEnabled) {
      return NextResponse.json(
        { error: 'MFA is already enabled' },
        { status: 400 }
      );
    }

    // Decrypt and verify MFA code
    const secret = await decryptData(dbUser.mfaSecret);
    const isValid = verifyMFACode(code, secret);

    if (!isValid) {
      await logSecurityEvent(
        'MFA_SETUP_VERIFICATION_FAILED',
        user.id,
        'WARNING',
        `Failed MFA setup verification for ${user.email}`,
        request
      );
      return NextResponse.json(
        { error: 'Invalid MFA code. Please try again.' },
        { status: 401 }
      );
    }

    // Enable MFA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: true,
      },
    });

    await logSecurityEvent(
      'MFA_ENABLED',
      user.id,
      'INFO',
      `MFA enabled for ${user.email}`,
      request
    );

    return NextResponse.json({
      success: true,
      message: 'MFA enabled successfully',
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify MFA code' },
      { status: 500 }
    );
  }
}


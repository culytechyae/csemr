import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/security/utils/password';
import { recordFailedLoginAttempt, recordSuccessfulLogin, isAccountLocked } from '@/security/utils/account-lockout';
import { createSession } from '@/security/utils/session-manager';
import { logSecurityEvent, getClientInfo } from '@/security/audit/audit-logger';
import { loginRateLimit } from '@/security/middleware/rate-limiter';
import { sanitizeString } from '@/security/middleware/input-sanitizer';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = loginRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const email = sanitizeString(body.email || '');
    const password = body.password || '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    const { ipAddress, userAgent } = getClientInfo(request);

    if (!user || !user.isActive) {
      if (user) {
        await recordFailedLoginAttempt(email, user.id, ipAddress, userAgent, 'Account inactive');
      } else {
        await recordFailedLoginAttempt(email, null, ipAddress, userAgent, 'User not found');
      }
      await logSecurityEvent('LOGIN_FAILURE', user?.id || null, 'WARNING', `Failed login attempt for ${email}`, request);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if account is locked
    const locked = await isAccountLocked(user.id);
    if (locked) {
      await logSecurityEvent('LOGIN_BLOCKED', user.id, 'ERROR', `Login attempt blocked - account locked for ${email}`, request);
      return NextResponse.json(
        { error: 'Account is locked due to multiple failed login attempts. Please try again later or contact administrator.' },
        { status: 403 }
      );
    }

    // Check if password is expired
    if (user.passwordExpiresAt && new Date() > user.passwordExpiresAt) {
      await logSecurityEvent('LOGIN_BLOCKED', user.id, 'WARNING', `Login attempt blocked - password expired for ${email}`, request);
      return NextResponse.json(
        { error: 'Your password has expired. Please reset your password.', code: 'PASSWORD_EXPIRED' },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await recordFailedLoginAttempt(email, user.id, ipAddress, userAgent, 'Invalid password');
      await logSecurityEvent('LOGIN_FAILURE', user.id, 'WARNING', `Invalid password for ${email}`, request);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if MFA is enabled
    if (user.mfaEnabled && user.mfaSecret) {
      // Create a temporary session for MFA verification
      // This session will be marked as pending MFA verification
      const tempSession = await createSession(user.id, ipAddress, userAgent);
      
      // Mark session as requiring MFA (we'll add a field for this or use a different approach)
      // For now, we'll return a token that requires MFA verification
      await logSecurityEvent('LOGIN_MFA_REQUIRED', user.id, 'INFO', `MFA verification required for ${email}`, request);

      return NextResponse.json({
        success: true,
        requiresMFA: true,
        loginToken: tempSession.token,
        message: 'MFA verification required',
      });
    }

    // Successful login (no MFA required)
    await recordSuccessfulLogin(user.id, ipAddress, userAgent);
    await logSecurityEvent('LOGIN_SUCCESS', user.id, 'INFO', `Successful login for ${email}`, request);

    // Create session
    const session = await createSession(user.id, ipAddress, userAgent);

    const response = NextResponse.json({
      success: true,
      requiresMFA: false,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        schoolId: user.schoolId,
      },
    });

    response.cookies.set('auth-token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


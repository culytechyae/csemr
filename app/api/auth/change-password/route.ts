import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { changePassword } from '@/security/utils/password';
import { logSecurityEvent, getClientInfo } from '@/security/audit/audit-logger';
import { sanitizeString } from '@/security/middleware/input-sanitizer';

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const currentPassword = body.currentPassword || '';
    const newPassword = sanitizeString(body.newPassword || '');

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    const result = await changePassword(user.id, currentPassword, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Log password change
    await logSecurityEvent(
      'PASSWORD_CHANGE',
      user.id,
      'INFO',
      `Password changed successfully`,
      req
    );

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


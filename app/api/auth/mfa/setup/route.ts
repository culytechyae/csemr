/**
 * MFA Setup API
 * Allows users to enable MFA for their account
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { generateMFASecret, generateMFACode } from '@/security/utils/mfa';
import { encryptData } from '@/security/utils/encryption';
import { logSecurityEvent } from '@/security/audit/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if MFA is already enabled
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mfaEnabled: true },
    });

    if (dbUser?.mfaEnabled) {
      return NextResponse.json(
        { error: 'MFA is already enabled for this account' },
        { status: 400 }
      );
    }

    // Generate MFA secret
    const secret = generateMFASecret();
    
    // Encrypt the secret before storing
    const encryptedSecret = await encryptData(secret);

    // Generate QR code
    const qrCode = await generateMFACode(secret, user.email);

    // Store encrypted secret (but don't enable MFA yet - user needs to verify first)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaSecret: encryptedSecret,
      },
    });

    await logSecurityEvent(
      'MFA_SETUP_INITIATED',
      user.id,
      'INFO',
      `MFA setup initiated for ${user.email}`,
      request
    );

    return NextResponse.json({
      success: true,
      secret, // Return plain secret for QR code generation (one-time use)
      qrCode,
      message: 'Scan the QR code with your authenticator app and verify to enable MFA',
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup MFA' },
      { status: 500 }
    );
  }
}


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
    let encryptedSecret: string;
    try {
      encryptedSecret = await encryptData(secret);
    } catch (encryptError) {
      console.error('Encryption error:', encryptError);
      return NextResponse.json(
        { error: 'Failed to encrypt MFA secret. Please check ENCRYPTION_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Generate QR code
    let qrCode: string;
    try {
      qrCode = await generateMFACode(secret, user.email);
    } catch (qrError) {
      console.error('QR code generation error:', qrError);
      return NextResponse.json(
        { error: 'Failed to generate QR code' },
        { status: 500 }
      );
    }

    // Store encrypted secret (but don't enable MFA yet - user needs to verify first)
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          mfaSecret: encryptedSecret,
        },
      });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save MFA secret to database' },
        { status: 500 }
      );
    }

    try {
      await logSecurityEvent(
        'MFA_SETUP_INITIATED',
        user.id,
        'INFO',
        `MFA setup initiated for ${user.email}`,
        request
      );
    } catch (logError) {
      // Log error but don't fail the request
      console.error('Failed to log security event:', logError);
    }

    return NextResponse.json({
      success: true,
      secret, // Return plain secret for QR code generation (one-time use)
      qrCode,
      message: 'Scan the QR code with your authenticator app and verify to enable MFA',
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to setup MFA: ${errorMessage}` },
      { status: 500 }
    );
  }
}


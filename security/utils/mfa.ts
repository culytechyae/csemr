/**
 * Multi-Factor Authentication (MFA) Utilities
 * Implements TOTP-based MFA using otplib
 */

import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

// Configure TOTP settings
authenticator.options = {
  step: 30, // 30-second time steps
  window: 1, // Allow 1 time step tolerance
};

/**
 * Generate a new MFA secret for a user
 */
export function generateMFASecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate a QR code data URL for MFA setup
 */
export async function generateMFACode(
  secret: string,
  email: string,
  issuer: string = 'Taaleem Clinic Management'
): Promise<string> {
  const otpauthUrl = authenticator.keyuri(email, issuer, secret);
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a TOTP code against a secret
 */
export function verifyMFACode(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    return false;
  }
}

/**
 * Generate a backup code (6-digit numeric code)
 */
export function generateBackupCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


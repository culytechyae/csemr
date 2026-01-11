/**
 * Database Encryption Utilities
 * Provides application-level encryption for sensitive fields
 * Uses Web Crypto API for Edge Runtime compatibility
 * 
 * Note: For production, consider using database-level encryption
 * (PostgreSQL encryption, disk encryption) for encryption at rest.
 * This utility provides field-level encryption for sensitive data.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 128; // 128 bits for authentication tag

/**
 * Get encryption key from environment variable
 * In production, this should be a strong, randomly generated key
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be set in production environment');
    }
    // Development fallback - DO NOT USE IN PRODUCTION
    return 'dev-encryption-key-change-in-production-32-chars!!';
  }
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }
  return key;
}

/**
 * Derive a cryptographic key from the master key
 * Uses PBKDF2 for key derivation (compatible with Web Crypto API)
 */
async function deriveKey(masterKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Create a new ArrayBuffer from the salt Uint8Array
  const saltBuffer = new Uint8Array(salt).buffer;
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt sensitive data
 * Returns base64-encoded encrypted data with IV and tag
 */
export async function encryptData(plaintext: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate a random salt for key derivation
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive key from master key
    const key = await deriveKey(getEncryptionKey(), salt);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Encrypt data
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH,
      },
      key,
      data
    );
    
    // Combine salt, IV, encrypted data, and tag
    // Format: salt (16 bytes) + IV (12 bytes) + encrypted data + tag (16 bytes)
    const combined = new Uint8Array(
      salt.length + iv.length + encrypted.byteLength
    );
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    throw new Error('Encryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Decrypt sensitive data
 * Expects base64-encoded encrypted data with IV and tag
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(
      atob(encryptedData),
      (c) => c.charCodeAt(0)
    );
    
    // Extract salt, IV, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 16 + IV_LENGTH);
    const encrypted = combined.slice(16 + IV_LENGTH);
    
    // Derive key from master key
    const key = await deriveKey(getEncryptionKey(), salt);
    
    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH,
      },
      key,
      encrypted
    );
    
    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Decryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Hash sensitive data (one-way, for searching/indexing)
 * Uses SHA-256 for consistent hashing
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Check if a string is encrypted (base64 format check)
 */
export function isEncrypted(data: string): boolean {
  try {
    // Check if it's valid base64
    const decoded = atob(data);
    // Check if it has minimum length (salt + IV + some data)
    return decoded.length >= 16 + IV_LENGTH + 1;
  } catch {
    return false;
  }
}


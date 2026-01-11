# Database Encryption Documentation

## Overview

This document describes the encryption utilities and practices for protecting sensitive data in the Taaleem Clinic Management system.

## Encryption Implementation

### Application-Level Encryption

The system uses **AES-GCM (Galois/Counter Mode)** encryption for field-level encryption of sensitive data. This provides:

- **Confidentiality**: Data is encrypted and cannot be read without the key
- **Integrity**: Authentication tag ensures data hasn't been tampered with
- **Authenticity**: GCM mode provides built-in authentication

### Key Features

1. **Web Crypto API**: Uses browser-native Web Crypto API for Edge Runtime compatibility
2. **PBKDF2 Key Derivation**: Derives encryption keys from a master key using PBKDF2
3. **Random IVs**: Each encryption uses a unique initialization vector (IV)
4. **Salt-based Key Derivation**: Unique salt for each encryption operation

## Encryption Utilities

### Location
- **File**: `security/utils/encryption.ts`
- **Functions**:
  - `encryptData(plaintext: string): Promise<string>` - Encrypts sensitive data
  - `decryptData(encryptedData: string): Promise<string>` - Decrypts encrypted data
  - `hashData(data: string): Promise<string>` - Creates one-way hash for indexing
  - `isEncrypted(data: string): boolean` - Checks if data is encrypted

### Usage Example

```typescript
import { encryptData, decryptData } from '@/security/utils/encryption';

// Encrypt sensitive data
const encrypted = await encryptData('sensitive-value');
// Store encrypted in database

// Decrypt when needed
const decrypted = await decryptData(encrypted);
```

## Encrypted Fields

### Currently Encrypted

1. **MFA Secrets** (`User.mfaSecret`)
   - TOTP secrets are encrypted before storage
   - Decrypted only during MFA verification

### Future Encrypted Fields

The following fields should be considered for encryption:

1. **Patient Health Information** (if storing sensitive medical data)
2. **Parent Contact Information** (phone numbers, addresses)
3. **Emergency Contact Details**
4. **Medical History Notes**
5. **Diagnosis Information**

## Configuration

### Environment Variables

```env
# Encryption Key (required in production)
# Must be at least 32 characters long
# Generate a strong random key: openssl rand -base64 32
ENCRYPTION_KEY=your-strong-encryption-key-here-min-32-chars
```

### Key Management

**⚠️ IMPORTANT**: 
- Never commit the encryption key to version control
- Use different keys for development and production
- Rotate keys periodically (requires re-encryption of all data)
- Store keys securely (environment variables, secret management services)

## Encryption Algorithm Details

### AES-GCM Parameters

- **Algorithm**: AES-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **Key Length**: 256 bits
- **IV Length**: 96 bits (12 bytes)
- **Tag Length**: 128 bits (16 bytes)
- **Salt Length**: 128 bits (16 bytes)

### Key Derivation

- **Function**: PBKDF2 (Password-Based Key Derivation Function 2)
- **Hash**: SHA-256
- **Iterations**: 100,000
- **Salt**: Random 16-byte salt per encryption

### Data Format

Encrypted data is stored as base64-encoded string with the following structure:
```
[salt (16 bytes)][IV (12 bytes)][encrypted data + tag]
```

## Database-Level Encryption

### Encryption at Rest

For production environments, consider implementing:

1. **PostgreSQL Encryption**
   - Enable Transparent Data Encryption (TDE)
   - Use encrypted file systems
   - Enable SSL/TLS for database connections

2. **Disk Encryption**
   - Full disk encryption on database servers
   - Encrypted backups

3. **Backup Encryption**
   - Encrypt database backups before storage
   - Secure backup key management

### Connection Encryption

- All database connections use SSL/TLS
- Connection strings include SSL parameters
- Certificate validation enabled

## Best Practices

### 1. Key Management
- ✅ Use strong, randomly generated keys
- ✅ Store keys in secure environment variables
- ✅ Never log or expose encryption keys
- ✅ Rotate keys periodically
- ✅ Use different keys per environment

### 2. Data Handling
- ✅ Encrypt sensitive data before database storage
- ✅ Decrypt only when necessary
- ✅ Never store plaintext sensitive data
- ✅ Use hashing for searchable fields (if needed)

### 3. Access Control
- ✅ Limit access to encryption/decryption functions
- ✅ Audit all encryption/decryption operations
- ✅ Implement role-based access to sensitive data

### 4. Performance
- ⚠️ Encryption adds computational overhead
- ⚠️ Consider caching decrypted values (securely)
- ⚠️ Batch encryption operations when possible

## Security Considerations

### Limitations

1. **Application-Level Encryption**
   - Protects data from database administrators
   - Does not protect against application-level attacks
   - Requires secure key management

2. **Key Compromise**
   - If encryption key is compromised, all encrypted data is at risk
   - Key rotation requires re-encryption of all data

3. **Performance Impact**
   - Encryption/decryption adds latency
   - Consider impact on high-traffic operations

### Recommendations

1. **For Production**:
   - Use database-level encryption (TDE) in addition to application-level
   - Implement key rotation procedures
   - Monitor encryption/decryption operations
   - Regular security audits

2. **For Compliance**:
   - Document encryption procedures
   - Maintain encryption key inventory
   - Implement key access controls
   - Regular key rotation schedule

## Migration Guide

### Encrypting Existing Data

If you need to encrypt existing plaintext data:

```typescript
// Migration script example
const users = await prisma.user.findMany({
  where: { mfaSecret: { not: null } },
});

for (const user of users) {
  if (!isEncrypted(user.mfaSecret)) {
    const encrypted = await encryptData(user.mfaSecret);
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaSecret: encrypted },
    });
  }
}
```

## Troubleshooting

### Common Issues

1. **"ENCRYPTION_KEY must be set"**
   - Solution: Set `ENCRYPTION_KEY` environment variable

2. **"Decryption failed"**
   - Check if data is actually encrypted
   - Verify encryption key is correct
   - Ensure data format is valid

3. **Performance Issues**
   - Consider caching decrypted values
   - Batch encryption operations
   - Use database-level encryption for bulk data

## References

- [Web Crypto API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [AES-GCM Specification](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [PBKDF2 Specification](https://tools.ietf.org/html/rfc2898)
- [OWASP Encryption Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)


import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import archiver from 'archiver';

// List of all Prisma models to export
const MODELS = [
  'User',
  'Session',
  'School',
  'Student',
  'ClinicalVisit',
  'HealthRecord',
  'ClinicalAssessment',
  'HL7Message',
  'SchoolHL7Config',
  'PasswordHistory',
  'LoginAttempt',
  'SecurityEvent',
  'AuditLog',
  'EmailLog',
] as const;

// Helper function to convert Prisma data to Excel format
function convertToExcel(data: any[], sheetName: string): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

// Helper function to convert data to SQL INSERT statements
function convertToSQL(data: any[], tableName: string): string {
  if (data.length === 0) {
    return `-- Table: ${tableName}\n-- No data\n\n`;
  }

  const columns = Object.keys(data[0]);
  const sqlStatements: string[] = [];
  
  sqlStatements.push(`-- Table: ${tableName}`);
  sqlStatements.push(`-- Records: ${data.length}\n`);

  for (const row of data) {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) {
        return 'NULL';
      }
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`;
      }
      if (value instanceof Date) {
        return `'${value.toISOString()}'`;
      }
      if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
      }
      return String(value);
    });

    sqlStatements.push(
      `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});`
    );
  }

  sqlStatements.push('');
  return sqlStatements.join('\n');
}

export const GET = requireRole('ADMIN')(
  requireAuth(async (req: NextRequest, user) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupName = `backup_${timestamp}`;

      // Create a zip archive
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks: Buffer[] = [];

      // Set up event handlers before adding data
      return new Promise<NextResponse>((resolve, reject) => {
        archive.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        archive.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(
            new NextResponse(buffer, {
              headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${backupName}.zip"`,
                'Content-Length': buffer.length.toString(),
              },
            })
          );
        });

        archive.on('error', (err) => {
          console.error('Archive error:', err);
          reject(
            NextResponse.json(
              { error: 'Failed to create backup archive' },
              { status: 500 }
            )
          );
        });

        // Export each model to Excel and SQL
        (async () => {
          for (const modelName of MODELS) {
            try {
          // Fetch all data from the model
          let data: any[] = [];
          
          switch (modelName) {
            case 'User':
              data = await prisma.user.findMany({
                select: {
                  id: true,
                  email: true,
                  passwordHash: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                  schoolId: true,
                  isActive: true,
                  passwordChangedAt: true,
                  passwordExpiresAt: true,
                  failedLoginAttempts: true,
                  lockedUntil: true,
                  lastLoginAt: true,
                  lastLoginIp: true,
                  mfaEnabled: true,
                  mfaSecret: true,
                  createdAt: true,
                  updatedAt: true,
                },
              });
              break;
            case 'Session':
              data = await prisma.session.findMany();
              break;
            case 'School':
              data = await prisma.school.findMany();
              break;
            case 'Student':
              data = await prisma.student.findMany();
              break;
            case 'ClinicalVisit':
              data = await prisma.clinicalVisit.findMany();
              break;
            case 'HealthRecord':
              data = await prisma.healthRecord.findMany();
              break;
            case 'ClinicalAssessment':
              data = await prisma.clinicalAssessment.findMany();
              break;
            case 'HL7Message':
              data = await prisma.hL7Message.findMany();
              break;
            case 'SchoolHL7Config':
              data = await prisma.schoolHL7Config.findMany();
              break;
            case 'PasswordHistory':
              data = await prisma.passwordHistory.findMany();
              break;
            case 'LoginAttempt':
              data = await prisma.loginAttempt.findMany();
              break;
            case 'SecurityEvent':
              data = await prisma.securityEvent.findMany();
              break;
            case 'AuditLog':
              data = await prisma.auditLog.findMany();
              break;
            case 'EmailLog':
              data = await prisma.emailLog.findMany();
              break;
          }

          // Convert dates to strings for Excel
          const excelData = data.map(row => {
            const converted: any = {};
            for (const [key, value] of Object.entries(row)) {
              if (value instanceof Date) {
                converted[key] = value.toISOString();
              } else {
                converted[key] = value;
              }
            }
            return converted;
          });

          // Add Excel file to archive
          const excelBuffer = convertToExcel(excelData, modelName);
          archive.append(excelBuffer, { name: `excel/${modelName}.xlsx` });

          // Add SQL file to archive
          const sqlContent = convertToSQL(data, modelName);
          archive.append(sqlContent, { name: `sql/${modelName}.sql` });

            } catch (error) {
              console.error(`Error exporting ${modelName}:`, error);
              // Continue with other models even if one fails
            }
          }

          // Add a summary file
          const summary = {
            backupDate: new Date().toISOString(),
            createdBy: user.email,
            tables: MODELS,
            note: 'This backup contains all database tables exported to both Excel and SQL formats.',
          };
          archive.append(JSON.stringify(summary, null, 2), { name: 'backup_summary.json' });

          // Finalize the archive
          await archive.finalize();
        })().catch((error) => {
          console.error('Backup processing error:', error);
          reject(
            NextResponse.json(
              { error: 'Failed to process backup' },
              { status: 500 }
            )
          );
        });
      });
    } catch (error) {
      console.error('Backup error:', error);
      return NextResponse.json(
        { error: 'Failed to create backup' },
        { status: 500 }
      );
    }
  })
);


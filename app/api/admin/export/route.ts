import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      const stringValue = String(value).replace(/"/g, '""');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Helper function to convert data to Excel
function convertToExcel(data: any[]): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

export const POST = requireRole('ADMIN')(
  requireAuth(async (req: NextRequest, user) => {
    try {
      const body = await req.json();
      const { exportType, format, startDate, endDate } = body;

      if (!exportType || !format) {
        return NextResponse.json(
          { error: 'Export type and format are required' },
          { status: 400 }
        );
      }

      // Build date filter if provided
      const dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include entire end date
          dateFilter.createdAt.lte = end;
        }
      }

      let data: any[] = [];
      let filename = '';

      // Fetch data based on export type
      switch (exportType) {
        case 'students': {
          const students = await prisma.student.findMany({
            where: dateFilter,
            include: {
              school: {
                select: { name: true, code: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          });
          
          data = students.map(s => ({
            id: s.id,
            studentId: s.studentId,
            firstName: s.firstName,
            lastName: s.lastName,
            dateOfBirth: s.dateOfBirth.toISOString().split('T')[0],
            gender: s.gender,
            nationality: s.nationality || '',
            bloodType: s.bloodType,
            parentName: s.parentName,
            parentPhone: s.parentPhone,
            parentEmail: s.parentEmail || '',
            emergencyContact: s.emergencyContact,
            emergencyPhone: s.emergencyPhone,
            address: s.address || '',
            allergies: s.allergies || '',
            chronicConditions: s.chronicConditions || '',
            medications: s.medications || '',
            academicYear: s.academicYear,
            schoolName: s.school.name,
            schoolCode: s.school.code,
            isActive: s.isActive,
            enrolledAt: s.enrolledAt.toISOString(),
            createdAt: s.createdAt.toISOString(),
          }));
          filename = `students_${new Date().toISOString().split('T')[0]}`;
          break;
        }

        case 'visits': {
          const visits = await prisma.clinicalVisit.findMany({
            where: dateFilter,
            include: {
              student: {
                select: { firstName: true, lastName: true, studentId: true },
              },
              school: {
                select: { name: true, code: true },
              },
              creator: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
            orderBy: { visitDate: 'desc' },
          });
          
          data = visits.map(v => ({
            id: v.id,
            studentName: `${v.student.firstName} ${v.student.lastName}`,
            studentId: v.student.studentId,
            schoolName: v.school.name,
            schoolCode: v.school.code,
            visitDate: v.visitDate.toISOString(),
            visitType: v.visitType,
            chiefComplaint: v.chiefComplaint || '',
            diagnosis: v.diagnosis || '',
            treatment: v.treatment || '',
            notes: v.notes || '',
            followUpRequired: v.followUpRequired,
            followUpDate: v.followUpDate?.toISOString() || '',
            createdBy: `${v.creator.firstName} ${v.creator.lastName} (${v.creator.email})`,
            createdAt: v.createdAt.toISOString(),
          }));
          filename = `clinical_visits_${new Date().toISOString().split('T')[0]}`;
          break;
        }

        case 'users': {
          const users = await prisma.user.findMany({
            where: dateFilter,
            include: {
              school: {
                select: { name: true, code: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          });
          
          data = users.map(u => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
            schoolName: u.school?.name || '',
            schoolCode: u.school?.code || '',
            isActive: u.isActive,
            mfaEnabled: u.mfaEnabled,
            lastLoginAt: u.lastLoginAt?.toISOString() || '',
            createdAt: u.createdAt.toISOString(),
          }));
          filename = `users_${new Date().toISOString().split('T')[0]}`;
          break;
        }

        case 'health-records': {
          const records = await prisma.healthRecord.findMany({
            where: dateFilter,
            include: {
              student: {
                select: { firstName: true, lastName: true, studentId: true },
              },
              school: {
                select: { name: true, code: true },
              },
              recorder: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
            orderBy: { recordedAt: 'desc' },
          });
          
          data = records.map(r => ({
            id: r.id,
            studentName: `${r.student.firstName} ${r.student.lastName}`,
            studentId: r.student.studentId,
            schoolName: r.school.name,
            schoolCode: r.school.code,
            height: r.height || '',
            weight: r.weight || '',
            bmi: r.bmi || '',
            colorBlindness: r.colorBlindness || '',
            visionTestingPerformed: r.visionTestingPerformed ? 'Yes' : 'No',
            correctiveLenses: r.correctiveLenses || '',
            rightEye: r.rightEye || '',
            leftEye: r.leftEye || '',
            rightEyeWithCorrection: r.rightEyeWithCorrection || '',
            leftEyeWithCorrection: r.leftEyeWithCorrection || '',
            visionScreeningResult: r.visionScreeningResult || '',
            recordedBy: `${r.recorder.firstName} ${r.recorder.lastName} (${r.recorder.email})`,
            recordedAt: r.recordedAt.toISOString(),
            createdAt: r.createdAt.toISOString(),
          }));
          filename = `health_records_${new Date().toISOString().split('T')[0]}`;
          break;
        }

        case 'audit-logs': {
          const logs = await prisma.auditLog.findMany({
            where: dateFilter,
            orderBy: { createdAt: 'desc' },
            take: 10000, // Limit to prevent huge exports
          });
          
          data = logs.map(l => ({
            id: l.id,
            userId: l.userId || '',
            action: l.action,
            entityType: l.entityType,
            entityId: l.entityId,
            changes: l.changes || '',
            ipAddress: l.ipAddress || '',
            userAgent: l.userAgent || '',
            severity: l.severity,
            createdAt: l.createdAt.toISOString(),
          }));
          filename = `audit_logs_${new Date().toISOString().split('T')[0]}`;
          break;
        }

        case 'hl7-messages': {
          const messages = await prisma.hL7Message.findMany({
            where: dateFilter,
            include: {
              student: {
                select: { firstName: true, lastName: true, studentId: true },
              },
              school: {
                select: { name: true, code: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          });
          
          data = messages.map(m => ({
            id: m.id,
            messageType: m.messageType,
            messageControlId: m.messageControlId,
            studentName: m.student ? `${m.student.firstName} ${m.student.lastName}` : '',
            studentId: m.student?.studentId || '',
            schoolName: m.school.name,
            schoolCode: m.school.code,
            status: m.status,
            sentAt: m.sentAt?.toISOString() || '',
            acknowledgedAt: m.acknowledgedAt?.toISOString() || '',
            errorMessage: m.errorMessage || '',
            retryCount: m.retryCount,
            createdAt: m.createdAt.toISOString(),
          }));
          filename = `hl7_messages_${new Date().toISOString().split('T')[0]}`;
          break;
        }

        default:
          return NextResponse.json(
            { error: 'Invalid export type' },
            { status: 400 }
          );
      }

      // Convert to requested format
      let content: string | Buffer;
      let contentType: string;
      let fileExtension: string;

      if (format === 'csv') {
        content = convertToCSV(data);
        contentType = 'text/csv';
        fileExtension = 'csv';
      } else if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
      } else if (format === 'excel') {
        content = convertToExcel(data);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
      } else {
        return NextResponse.json(
          { error: 'Invalid format. Use csv, json, or excel' },
          { status: 400 }
        );
      }

      // Return file download
      return new NextResponse(content as BodyInit, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}.${fileExtension}"`,
        },
      });
    } catch (error) {
      console.error('Export error:', error);
      return NextResponse.json(
        { error: 'Failed to export data' },
        { status: 500 }
      );
    }
  })
);


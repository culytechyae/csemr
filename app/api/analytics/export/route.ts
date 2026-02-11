import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const { format = 'xlsx', dateFrom, dateTo, schoolId, grade, homeroom, gender, visitType } = body;

    // Build school filter
    const schoolFilter: any = {};
    if (user.role !== 'ADMIN' && user.schoolId) {
      schoolFilter.schoolId = user.schoolId;
    } else if (schoolId) {
      schoolFilter.schoolId = schoolId;
    }

    // Build date range filter
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.lte = endDate;
    }

    // Build visit where clause
    const visitWhere: any = { ...schoolFilter };
    if (Object.keys(dateFilter).length > 0) {
      visitWhere.visitDate = dateFilter;
    }
    if (visitType) visitWhere.visitType = visitType;

    const studentFilter: any = {};
    if (grade) studentFilter.grade = grade;
    if (homeroom) studentFilter.homeroom = homeroom;
    if (gender) studentFilter.gender = gender;
    if (Object.keys(studentFilter).length > 0) {
      visitWhere.student = studentFilter;
    }

    // Fetch all matching visits with full details
    const visits = await prisma.clinicalVisit.findMany({
      where: visitWhere,
      select: {
        id: true,
        visitDate: true,
        visitType: true,
        chiefComplaint: true,
        diagnosis: true,
        treatment: true,
        notes: true,
        followUpRequired: true,
        followUpDate: true,
        student: {
          select: {
            studentId: true,
            firstName: true,
            lastName: true,
            grade: true,
            homeroom: true,
            gender: true,
            dateOfBirth: true,
          },
        },
        school: {
          select: { name: true, code: true },
        },
        assessment: {
          select: {
            temperature: true,
            bloodPressureSystolic: true,
            bloodPressureDiastolic: true,
            heartRate: true,
            respiratoryRate: true,
            oxygenSaturation: true,
            height: true,
            weight: true,
            bmi: true,
            painScale: true,
            generalAppearance: true,
          },
        },
      },
      orderBy: { visitDate: 'desc' },
    });

    // Transform data for export
    const exportData = visits.map((v) => ({
      'Visit Date': v.visitDate.toISOString().split('T')[0],
      'Visit Time': v.visitDate.toISOString().split('T')[1].substring(0, 5),
      'Student ID': v.student.studentId,
      'Student Name': `${v.student.firstName} ${v.student.lastName}`,
      'Grade': v.student.grade || '',
      'Homeroom': v.student.homeroom || '',
      'Gender': v.student.gender || '',
      'School': `${v.school.name} (${v.school.code})`,
      'Visit Type': v.visitType.replace(/_/g, ' '),
      'Chief Complaint': v.chiefComplaint || '',
      'Diagnosis': v.diagnosis || '',
      'Treatment': v.treatment || '',
      'Notes': v.notes || '',
      'Follow-up Required': v.followUpRequired ? 'Yes' : 'No',
      'Follow-up Date': v.followUpDate ? v.followUpDate.toISOString().split('T')[0] : '',
      'Temperature (°C)': v.assessment?.temperature || '',
      'BP Systolic': v.assessment?.bloodPressureSystolic || '',
      'BP Diastolic': v.assessment?.bloodPressureDiastolic || '',
      'Heart Rate': v.assessment?.heartRate || '',
      'Respiratory Rate': v.assessment?.respiratoryRate || '',
      'O2 Saturation': v.assessment?.oxygenSaturation || '',
      'Height (cm)': v.assessment?.height || '',
      'Weight (kg)': v.assessment?.weight || '',
      'BMI': v.assessment?.bmi || '',
      'Pain Scale': v.assessment?.painScale || '',
    }));

    // Get user's school name for report header
    let schoolLabel = 'All Schools';
    if (user.role !== 'ADMIN' && user.schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: user.schoolId },
        select: { name: true, code: true },
      });
      if (school) schoolLabel = `${school.name} (${school.code})`;
    } else if (schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { name: true, code: true },
      });
      if (school) schoolLabel = `${school.name} (${school.code})`;
    }

    // Generate summary stats
    const summaryData = [
      { 'Metric': 'School', 'Value': schoolLabel },
      { 'Metric': 'Report Generated', 'Value': new Date().toLocaleString() },
      { 'Metric': 'Total Visits', 'Value': visits.length },
      { 'Metric': 'Unique Students', 'Value': new Set(visits.map((v) => v.student.studentId)).size },
      { 'Metric': 'Follow-ups Required', 'Value': visits.filter((v) => v.followUpRequired).length },
      { 'Metric': 'Date Range', 'Value': dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All time' },
    ];

    // Visit type breakdown
    const visitTypeCounts: Record<string, number> = {};
    visits.forEach((v) => {
      const type = v.visitType.replace(/_/g, ' ');
      visitTypeCounts[type] = (visitTypeCounts[type] || 0) + 1;
    });
    const visitTypeData = Object.entries(visitTypeCounts).map(([type, count]) => ({
      'Visit Type': type,
      'Count': count,
      'Percentage': `${Math.round((count / visits.length) * 100)}%`,
    }));

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      summaryWs['!cols'] = [{ wch: 25 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      // Sheet 2: Visit Type Breakdown
      const vtWs = XLSX.utils.json_to_sheet(visitTypeData);
      vtWs['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, vtWs, 'Visit Types');

      // Sheet 3: All Visits
      const visitsWs = XLSX.utils.json_to_sheet(exportData);
      visitsWs['!cols'] = exportData.length > 0
        ? Object.keys(exportData[0]).map((k) => ({ wch: Math.max(k.length, 15) }))
        : [];
      XLSX.utils.book_append_sheet(wb, visitsWs, 'Visits Detail');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="health_analytics_report_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    } else if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(ws);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="health_analytics_report_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format. Use xlsx or csv.' }, { status: 400 });
  } catch (error) {
    console.error('Analytics export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


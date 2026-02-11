import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return requireAuth(async (req: NextRequest, user) => {
      try {
        // Verify student exists and user has access
        const student = await prisma.student.findUnique({
          where: { id },
          select: { id: true, schoolId: true, firstName: true, lastName: true, studentId: true },
        });

        if (!student) {
          return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        if (user.role !== 'ADMIN' && user.schoolId !== student.schoolId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch all visits with assessments
        const visits = await prisma.clinicalVisit.findMany({
          where: { studentId: id },
          include: {
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
              },
            },
          },
          orderBy: { visitDate: 'asc' },
        });

        // --- 1. Monthly visit trend ---
        const monthlyVisits: Record<string, number> = {};
        visits.forEach((v) => {
          const d = new Date(v.visitDate);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthlyVisits[key] = (monthlyVisits[key] || 0) + 1;
        });

        // Fill in missing months between first and last visit
        const monthlyTrend: { month: string; visits: number }[] = [];
        if (visits.length > 0) {
          const first = new Date(visits[0].visitDate);
          const last = new Date(visits[visits.length - 1].visitDate);
          const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
          const end = new Date(last.getFullYear(), last.getMonth(), 1);
          while (cursor <= end) {
            const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = cursor.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            monthlyTrend.push({ month: monthLabel, visits: monthlyVisits[key] || 0 });
            cursor.setMonth(cursor.getMonth() + 1);
          }
        }

        // --- 2. Visit type distribution ---
        const visitTypeMap: Record<string, number> = {};
        visits.forEach((v) => {
          const type = v.visitType.replace(/_/g, ' ');
          visitTypeMap[type] = (visitTypeMap[type] || 0) + 1;
        });
        const visitTypeDistribution = Object.entries(visitTypeMap).map(([name, value]) => ({
          name,
          value,
        }));

        // --- 3. Day of week distribution ---
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeekMap: Record<string, number> = {};
        dayNames.forEach((d) => (dayOfWeekMap[d] = 0));
        visits.forEach((v) => {
          const d = new Date(v.visitDate);
          dayOfWeekMap[dayNames[d.getDay()]] += 1;
        });
        const dayOfWeekDistribution = dayNames.map((name) => ({
          name: name.substring(0, 3),
          visits: dayOfWeekMap[name],
        }));

        // --- 4. Top chief complaints ---
        const complaintMap: Record<string, number> = {};
        visits.forEach((v) => {
          if (v.chiefComplaint) {
            const complaint = v.chiefComplaint.trim();
            if (complaint) {
              complaintMap[complaint] = (complaintMap[complaint] || 0) + 1;
            }
          }
        });
        const topComplaints = Object.entries(complaintMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, count]) => ({ name, count }));

        // --- 5. Top diagnoses ---
        const diagnosisMap: Record<string, number> = {};
        visits.forEach((v) => {
          if (v.diagnosis) {
            const diagnosis = v.diagnosis.trim();
            if (diagnosis) {
              diagnosisMap[diagnosis] = (diagnosisMap[diagnosis] || 0) + 1;
            }
          }
        });
        const topDiagnoses = Object.entries(diagnosisMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, count]) => ({ name, count }));

        // --- 6. Health metrics trends (BMI, weight, temperature over time) ---
        const healthMetricsTrend: {
          date: string;
          bmi?: number;
          weight?: number;
          temperature?: number;
          heartRate?: number;
          bloodPressureSystolic?: number;
          bloodPressureDiastolic?: number;
        }[] = [];

        visits.forEach((v) => {
          if (v.assessment) {
            const a = v.assessment;
            if (a.bmi || a.weight || a.temperature || a.heartRate || a.bloodPressureSystolic) {
              healthMetricsTrend.push({
                date: new Date(v.visitDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }),
                bmi: a.bmi ?? undefined,
                weight: a.weight ?? undefined,
                temperature: a.temperature ?? undefined,
                heartRate: a.heartRate ?? undefined,
                bloodPressureSystolic: a.bloodPressureSystolic ?? undefined,
                bloodPressureDiastolic: a.bloodPressureDiastolic ?? undefined,
              });
            }
          }
        });

        // --- 7. Visit frequency stats ---
        const totalVisits = visits.length;
        const followUpCount = visits.filter((v) => v.followUpRequired).length;
        const followUpPending = visits.filter(
          (v) => v.followUpRequired && v.followUpDate && new Date(v.followUpDate) > new Date()
        ).length;

        // Average gap between visits (in days)
        let avgGapDays = 0;
        if (visits.length > 1) {
          const gaps: number[] = [];
          for (let i = 1; i < visits.length; i++) {
            const diff =
              new Date(visits[i].visitDate).getTime() -
              new Date(visits[i - 1].visitDate).getTime();
            gaps.push(diff / (1000 * 60 * 60 * 24));
          }
          avgGapDays = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
        }

        // First and last visit dates
        const firstVisit = visits.length > 0 ? visits[0].visitDate : null;
        const lastVisit = visits.length > 0 ? visits[visits.length - 1].visitDate : null;

        // Visits this academic year (assume Sept to June)
        const now = new Date();
        const academicYearStart = new Date(
          now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1,
          8, // September
          1
        );
        const visitsThisYear = visits.filter(
          (v) => new Date(v.visitDate) >= academicYearStart
        ).length;

        // Visits this month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const visitsThisMonth = visits.filter(
          (v) => new Date(v.visitDate) >= monthStart
        ).length;

        // --- 8. Recent visits timeline ---
        const recentVisits = visits
          .slice(-10)
          .reverse()
          .map((v) => ({
            id: v.id,
            date: v.visitDate,
            type: v.visitType.replace(/_/g, ' '),
            complaint: v.chiefComplaint || '',
            diagnosis: v.diagnosis || '',
            followUp: v.followUpRequired,
          }));

        return NextResponse.json({
          studentName: `${student.firstName} ${student.lastName}`,
          studentId: student.studentId,
          summary: {
            totalVisits,
            visitsThisYear,
            visitsThisMonth,
            followUpCount,
            followUpPending,
            avgGapDays,
            firstVisit,
            lastVisit,
          },
          monthlyTrend,
          visitTypeDistribution,
          dayOfWeekDistribution,
          topComplaints,
          topDiagnoses,
          healthMetricsTrend,
          recentVisits,
        });
      } catch (error) {
        console.error('Student analytics error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    })(req);
  } catch (error) {
    console.error('Params error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const schoolId = searchParams.get('schoolId');
    const grade = searchParams.get('grade');
    const homeroom = searchParams.get('homeroom');
    const gender = searchParams.get('gender');
    const visitType = searchParams.get('visitType');
    const diagnosis = searchParams.get('diagnosis');

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
    if (visitType) {
      visitWhere.visitType = visitType;
    }
    if (diagnosis) {
      visitWhere.diagnosis = { contains: diagnosis, mode: 'insensitive' };
    }

    // Build student filter for grade/homeroom/gender
    const studentFilter: any = {};
    if (grade) studentFilter.grade = grade;
    if (homeroom) studentFilter.homeroom = homeroom;
    if (gender) studentFilter.gender = gender;
    if (Object.keys(studentFilter).length > 0) {
      visitWhere.student = studentFilter;
    }

    // ============================
    // 1. OVERVIEW STATS
    // ============================
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalVisits,
      visitsToday,
      visitsThisWeek,
      visitsThisMonth,
      totalStudents,
      followUpsRequired,
      followUpsCompleted,
      activeStudentsWithVisits,
    ] = await Promise.all([
      prisma.clinicalVisit.count({ where: visitWhere }),
      prisma.clinicalVisit.count({
        where: { ...visitWhere, visitDate: { gte: today, lte: todayEnd } },
      }),
      prisma.clinicalVisit.count({
        where: { ...visitWhere, visitDate: { gte: thisWeekStart, lte: todayEnd } },
      }),
      prisma.clinicalVisit.count({
        where: { ...visitWhere, visitDate: { gte: thisMonthStart, lte: todayEnd } },
      }),
      prisma.student.count({
        where: { ...schoolFilter, isActive: true, ...studentFilter },
      }),
      prisma.clinicalVisit.count({
        where: { ...visitWhere, followUpRequired: true },
      }),
      prisma.clinicalVisit.count({
        where: {
          ...visitWhere,
          followUpRequired: true,
          followUpDate: { lte: todayEnd },
        },
      }),
      prisma.clinicalVisit.groupBy({
        by: ['studentId'],
        where: visitWhere,
        _count: true,
      }),
    ]);

    const followUpRate = totalVisits > 0 
      ? Math.round((followUpsRequired / totalVisits) * 100) 
      : 0;

    // ============================
    // 2. VISIT TRENDS (last 30 days daily)
    // ============================
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const visitTrendsRaw = await prisma.clinicalVisit.findMany({
      where: {
        ...schoolFilter,
        visitDate: { gte: thirtyDaysAgo, lte: todayEnd },
        ...(visitWhere.student ? { student: visitWhere.student } : {}),
      },
      select: { visitDate: true },
      orderBy: { visitDate: 'asc' },
    });

    // Group by date
    const visitTrendsMap: Record<string, number> = {};
    for (let d = new Date(thirtyDaysAgo); d <= todayEnd; d.setDate(d.getDate() + 1)) {
      visitTrendsMap[d.toISOString().split('T')[0]] = 0;
    }
    visitTrendsRaw.forEach((v) => {
      const dateKey = v.visitDate.toISOString().split('T')[0];
      if (visitTrendsMap[dateKey] !== undefined) {
        visitTrendsMap[dateKey]++;
      }
    });
    const visitTrends = Object.entries(visitTrendsMap).map(([date, count]) => ({
      date,
      count,
    }));

    // ============================
    // 3. WEEKLY TRENDS (last 12 weeks)
    // ============================
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
    twelveWeeksAgo.setHours(0, 0, 0, 0);

    const weeklyVisitsRaw = await prisma.clinicalVisit.findMany({
      where: {
        ...schoolFilter,
        visitDate: { gte: twelveWeeksAgo, lte: todayEnd },
        ...(visitWhere.student ? { student: visitWhere.student } : {}),
      },
      select: { visitDate: true },
    });

    const weeklyMap: Record<string, number> = {};
    weeklyVisitsRaw.forEach((v) => {
      const date = v.visitDate;
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyMap[weekKey] = (weeklyMap[weekKey] || 0) + 1;
    });
    const weeklyTrends = Object.entries(weeklyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, count]) => ({ week, count }));

    // ============================
    // 4. VISIT TYPE DISTRIBUTION
    // ============================
    const visitTypeDistribution = await prisma.clinicalVisit.groupBy({
      by: ['visitType'],
      where: visitWhere,
      _count: true,
      orderBy: { _count: { visitType: 'desc' } },
    });

    const visitTypes = visitTypeDistribution.map((vt) => ({
      type: vt.visitType.replace(/_/g, ' '),
      count: vt._count,
    }));

    // ============================
    // 5. COMMON COMPLAINTS / REASONS
    // ============================
    const complaintsRaw = await prisma.clinicalVisit.findMany({
      where: { ...visitWhere, chiefComplaint: { not: null } },
      select: { chiefComplaint: true },
    });

    const complaintCounts: Record<string, number> = {};
    complaintsRaw.forEach((v) => {
      if (v.chiefComplaint) {
        const complaint = v.chiefComplaint.trim().toLowerCase();
        if (complaint) {
          complaintCounts[complaint] = (complaintCounts[complaint] || 0) + 1;
        }
      }
    });
    const commonComplaints = Object.entries(complaintCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([complaint, count]) => ({ complaint, count }));

    // ============================
    // 6. COMMON DIAGNOSES
    // ============================
    const diagnosesRaw = await prisma.clinicalVisit.findMany({
      where: { ...visitWhere, diagnosis: { not: null } },
      select: { diagnosis: true },
    });

    const diagnosisCounts: Record<string, number> = {};
    diagnosesRaw.forEach((v) => {
      if (v.diagnosis) {
        const diag = v.diagnosis.trim().toLowerCase();
        if (diag) {
          diagnosisCounts[diag] = (diagnosisCounts[diag] || 0) + 1;
        }
      }
    });
    const commonDiagnoses = Object.entries(diagnosisCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([diagnosis, count]) => ({ diagnosis, count }));

    // ============================
    // 7. BMI DISTRIBUTION BY GRADE
    // ============================
    const bmiByGradeRaw = await prisma.clinicalAssessment.findMany({
      where: {
        bmi: { not: null },
        student: { ...schoolFilter, ...studentFilter, isActive: true },
      },
      select: {
        bmi: true,
        student: { select: { grade: true, gender: true } },
      },
    });

    const bmiByGrade: Record<string, { total: number; count: number; underweight: number; normal: number; overweight: number; obese: number }> = {};
    bmiByGradeRaw.forEach((a) => {
      const gradeKey = a.student.grade || 'Unknown';
      if (!bmiByGrade[gradeKey]) {
        bmiByGrade[gradeKey] = { total: 0, count: 0, underweight: 0, normal: 0, overweight: 0, obese: 0 };
      }
      if (a.bmi !== null) {
        bmiByGrade[gradeKey].total += a.bmi;
        bmiByGrade[gradeKey].count++;
        if (a.bmi < 18.5) bmiByGrade[gradeKey].underweight++;
        else if (a.bmi < 25) bmiByGrade[gradeKey].normal++;
        else if (a.bmi < 30) bmiByGrade[gradeKey].overweight++;
        else bmiByGrade[gradeKey].obese++;
      }
    });

    const bmiDistribution = Object.entries(bmiByGrade)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([grade, data]) => ({
        grade,
        avgBmi: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
        underweight: data.underweight,
        normal: data.normal,
        overweight: data.overweight,
        obese: data.obese,
        total: data.count,
      }));

    // ============================
    // 8. BMI BY GENDER
    // ============================
    const bmiByGenderMap: Record<string, { total: number; count: number }> = {};
    bmiByGradeRaw.forEach((a) => {
      const genderKey = a.student.gender || 'Unknown';
      if (!bmiByGenderMap[genderKey]) {
        bmiByGenderMap[genderKey] = { total: 0, count: 0 };
      }
      if (a.bmi !== null) {
        bmiByGenderMap[genderKey].total += a.bmi;
        bmiByGenderMap[genderKey].count++;
      }
    });
    const bmiByGender = Object.entries(bmiByGenderMap).map(([gender, data]) => ({
      gender,
      avgBmi: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
      count: data.count,
    }));

    // ============================
    // 9. HEALTH RISK ALERTS
    // ============================
    const healthAlerts = await prisma.clinicalAssessment.findMany({
      where: {
        student: { ...schoolFilter, ...studentFilter, isActive: true },
        OR: [
          { temperature: { gte: 38.0 } },          // Fever
          { bloodPressureSystolic: { gte: 140 } },  // High BP systolic
          { bloodPressureDiastolic: { gte: 90 } },  // High BP diastolic
          { heartRate: { gte: 120 } },              // Tachycardia
          { heartRate: { lte: 50 } },               // Bradycardia
          { oxygenSaturation: { lte: 94 } },        // Low O2
          { bmi: { gte: 30 } },                     // Obese
          { bmi: { lte: 16 } },                     // Severely underweight
        ],
      },
      select: {
        id: true,
        temperature: true,
        bloodPressureSystolic: true,
        bloodPressureDiastolic: true,
        heartRate: true,
        oxygenSaturation: true,
        bmi: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            grade: true,
            gender: true,
          },
        },
        visit: {
          select: { visitDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const healthRiskAlerts = healthAlerts.map((a) => {
      const alerts: string[] = [];
      if (a.temperature && a.temperature >= 38.0) alerts.push(`High Temp: ${a.temperature}°C`);
      if (a.bloodPressureSystolic && a.bloodPressureSystolic >= 140) alerts.push(`High BP: ${a.bloodPressureSystolic}/${a.bloodPressureDiastolic}`);
      if (a.bloodPressureDiastolic && a.bloodPressureDiastolic >= 90) alerts.push(`High Diastolic: ${a.bloodPressureDiastolic}`);
      if (a.heartRate && a.heartRate >= 120) alerts.push(`Tachycardia: ${a.heartRate} bpm`);
      if (a.heartRate && a.heartRate <= 50) alerts.push(`Bradycardia: ${a.heartRate} bpm`);
      if (a.oxygenSaturation && a.oxygenSaturation <= 94) alerts.push(`Low O2: ${a.oxygenSaturation}%`);
      if (a.bmi && a.bmi >= 30) alerts.push(`Obese BMI: ${a.bmi}`);
      if (a.bmi && a.bmi <= 16) alerts.push(`Severely Underweight BMI: ${a.bmi}`);
      return {
        studentId: a.student.id,
        studentName: `${a.student.firstName} ${a.student.lastName}`,
        studentNumber: a.student.studentId,
        grade: a.student.grade,
        gender: a.student.gender,
        alerts,
        visitDate: a.visit.visitDate,
      };
    });

    // ============================
    // 10. FOLLOW-UP ANALYSIS
    // ============================
    const pendingFollowUps = followUpsRequired - followUpsCompleted;

    const followUpsByType = await prisma.clinicalVisit.groupBy({
      by: ['visitType'],
      where: { ...visitWhere, followUpRequired: true },
      _count: true,
    });

    const followUpAnalysis = {
      total: followUpsRequired,
      completed: followUpsCompleted,
      pending: pendingFollowUps > 0 ? pendingFollowUps : 0,
      byType: followUpsByType.map((f) => ({
        type: f.visitType.replace(/_/g, ' '),
        count: f._count,
      })),
    };

    // ============================
    // 11. RECURRING VISITORS (students with 3+ visits)
    // ============================
    const recurringStudents = activeStudentsWithVisits
      .filter((s) => s._count >= 3)
      .sort((a, b) => b._count - a._count)
      .slice(0, 20);

    const recurringStudentIds = recurringStudents.map((s) => s.studentId);
    const recurringStudentDetails = recurringStudentIds.length > 0
      ? await prisma.student.findMany({
          where: { id: { in: recurringStudentIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            grade: true,
            gender: true,
          },
        })
      : [];

    const recurringVisitors = recurringStudents.map((s) => {
      const student = recurringStudentDetails.find((sd) => sd.id === s.studentId);
      return {
        studentId: s.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
        studentNumber: student?.studentId || '',
        grade: student?.grade || '',
        gender: student?.gender || '',
        visitCount: s._count,
      };
    });

    // ============================
    // 12. GRADE DISTRIBUTION OF VISITS
    // ============================
    const visitsByGradeRaw = await prisma.clinicalVisit.findMany({
      where: visitWhere,
      select: {
        student: { select: { grade: true } },
      },
    });

    const gradeVisitCounts: Record<string, number> = {};
    visitsByGradeRaw.forEach((v) => {
      const gradeKey = v.student.grade || 'Unknown';
      gradeVisitCounts[gradeKey] = (gradeVisitCounts[gradeKey] || 0) + 1;
    });
    const visitsByGrade = Object.entries(gradeVisitCounts)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([grade, count]) => ({ grade, count }));

    // ============================
    // 13. GENDER DISTRIBUTION OF VISITS
    // ============================
    const visitsByGenderRaw = await prisma.clinicalVisit.findMany({
      where: visitWhere,
      select: {
        student: { select: { gender: true } },
      },
    });

    const genderVisitCounts: Record<string, number> = {};
    visitsByGenderRaw.forEach((v) => {
      const genderKey = v.student.gender || 'Unknown';
      genderVisitCounts[genderKey] = (genderVisitCounts[genderKey] || 0) + 1;
    });
    const visitsByGender = Object.entries(genderVisitCounts).map(([gender, count]) => ({
      gender,
      count,
    }));

    // ============================
    // 14. AVAILABLE FILTER OPTIONS
    // ============================
    const [gradesAvailable, homeroomsAvailable, schoolsAvailable] = await Promise.all([
      prisma.student.findMany({
        where: { ...schoolFilter, isActive: true, grade: { not: null } },
        select: { grade: true },
        distinct: ['grade'],
        orderBy: { grade: 'asc' },
      }),
      prisma.student.findMany({
        where: { ...schoolFilter, isActive: true, homeroom: { not: null } },
        select: { homeroom: true },
        distinct: ['homeroom'],
        orderBy: { homeroom: 'asc' },
      }),
      user.role === 'ADMIN'
        ? prisma.school.findMany({
            where: { isActive: true },
            select: { id: true, name: true, code: true },
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    // ============================
    // 15. RECENT VISITS (for table)
    // ============================
    const recentVisits = await prisma.clinicalVisit.findMany({
      where: visitWhere,
      select: {
        id: true,
        visitDate: true,
        visitType: true,
        chiefComplaint: true,
        diagnosis: true,
        treatment: true,
        followUpRequired: true,
        followUpDate: true,
        notes: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            grade: true,
            homeroom: true,
            gender: true,
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
            height: true,
            weight: true,
            bmi: true,
          },
        },
      },
      orderBy: { visitDate: 'desc' },
      take: 100,
    });

    // ============================
    // 16. USER CONTEXT (school info for header display)
    // ============================
    let userSchool: { name: string; code: string } | null = null;
    if (user.schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: user.schoolId },
        select: { name: true, code: true },
      });
      userSchool = school;
    }

    // ============================
    // RESPONSE
    // ============================
    return NextResponse.json({
      userContext: {
        role: user.role,
        schoolName: userSchool?.name || null,
        schoolCode: userSchool?.code || null,
        isAdmin: user.role === 'ADMIN',
      },
      overview: {
        totalVisits,
        visitsToday,
        visitsThisWeek,
        visitsThisMonth,
        totalStudents,
        activeStudentsWithVisits: activeStudentsWithVisits.length,
        followUpsRequired,
        followUpsCompleted,
        followUpsPending: pendingFollowUps > 0 ? pendingFollowUps : 0,
        followUpRate,
      },
      visitTrends,
      weeklyTrends,
      visitTypes,
      commonComplaints,
      commonDiagnoses,
      bmiDistribution,
      bmiByGender,
      healthRiskAlerts,
      followUpAnalysis,
      recurringVisitors,
      visitsByGrade,
      visitsByGender,
      recentVisits,
      filters: {
        grades: gradesAvailable.map((g) => g.grade).filter(Boolean),
        homerooms: homeroomsAvailable.map((h) => h.homeroom).filter(Boolean),
        schools: schoolsAvailable,
        visitTypes: ['ROUTINE_CHECKUP', 'ILLNESS', 'INJURY', 'VACCINATION', 'EMERGENCY', 'FOLLOW_UP'],
        genders: ['MALE', 'FEMALE'],
      },
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


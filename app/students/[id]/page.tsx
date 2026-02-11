'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Link from 'next/link';
import {
  LayoutDashboard,
  ClipboardCheck,
  ShieldPlus,
  BarChart3,
  Plus,
  Search,
  ChevronRight,
  Calendar,
  User,
  Phone,
  AlertTriangle,
  Thermometer,
  Heart,
  Activity,
  Scale,
  Ruler,
  Wind,
  Syringe,
  Pill,
  ShieldAlert,
  FileText,
  List,
  Clock,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';

/* ── Types ──────────────────────────────────────────────── */
interface StudentSummary {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    dateOfBirth: string;
    gender: string;
    nationality?: string;
    bloodType: string;
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    emergencyContact: string;
    emergencyPhone: string;
    address?: string;
    allergies?: string;
    chronicConditions?: string;
    medications?: string;
    academicYear: string;
    school: { id: string; name: string; code: string };
    visits: Visit[];
  };
  statistics: {
    totalVisits: number;
    visitsWithAssessment: number;
    age: number;
    ageInMonths: number;
    visitTypeCounts: Record<string, number>;
  };
  latestAssessment?: {
    temperature?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    height?: number;
    weight?: number;
    bmi?: number;
    createdAt: string;
  };
  recentDiagnoses: Array<{ diagnosis: string; date: string; visitType: string }>;
  healthSummary: { allergies: string; chronicConditions: string; medications: string };
}

interface Visit {
  id: string;
  visitDate: string;
  visitType: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  assessment?: {
    temperature?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    height?: number;
    weight?: number;
    bmi?: number;
  };
  creator: { firstName: string; lastName: string };
}

interface StudentAnalytics {
  summary: {
    totalVisits: number;
    visitsThisYear: number;
    visitsThisMonth: number;
    followUpCount: number;
    followUpPending: number;
    avgGapDays: number;
    firstVisit: string | null;
    lastVisit: string | null;
  };
  monthlyTrend: { month: string; visits: number }[];
  visitTypeDistribution: { name: string; value: number }[];
  dayOfWeekDistribution: { name: string; visits: number }[];
  topComplaints: { name: string; count: number }[];
  topDiagnoses: { name: string; count: number }[];
  healthMetricsTrend: {
    date: string;
    bmi?: number;
    weight?: number;
    temperature?: number;
    heartRate?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
  }[];
  recentVisits: {
    id: string;
    date: string;
    type: string;
    complaint: string;
    diagnosis: string;
    followUp: boolean;
  }[];
}

/* ── Constants ──────────────────────────────────────────── */
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const VISIT_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  FOLLOW_UP:       { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  ILLNESS:         { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500' },
  INJURY:          { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  ROUTINE_CHECKUP: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  VACCINATION:     { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-500' },
  EMERGENCY:       { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500' },
};

const TIMELINE_COLORS: Record<string, string> = {
  FOLLOW_UP:       'border-blue-400',
  ILLNESS:         'border-red-400',
  INJURY:          'border-amber-400',
  ROUTINE_CHECKUP: 'border-emerald-400',
  VACCINATION:     'border-indigo-400',
  EMERGENCY:       'border-rose-400',
};

const TIMELINE_DOT_BG: Record<string, string> = {
  FOLLOW_UP:       'bg-blue-500',
  ILLNESS:         'bg-red-500',
  INJURY:          'bg-amber-500',
  ROUTINE_CHECKUP: 'bg-emerald-500',
  VACCINATION:     'bg-indigo-500',
  EMERGENCY:       'bg-rose-500',
};

type TabKey = 'overview' | 'visits' | 'health-records' | 'analytics';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'overview',       label: 'Overview',             icon: LayoutDashboard },
  { key: 'visits',         label: 'Visits & Assessments', icon: ClipboardCheck },
  { key: 'health-records', label: 'Health Records',       icon: ShieldPlus },
  { key: 'analytics',      label: 'Analytics',            icon: BarChart3 },
];

/* ── Component ──────────────────────────────────────────── */
export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [visitSearch, setVisitSearch] = useState('');
  const [visitViewMode, setVisitViewMode] = useState<'table' | 'timeline'>('table');

  /* ── Data fetching ── */
  useEffect(() => {
    const id = params?.id as string;
    if (!id) { setLoading(false); return; }

    Promise.all([
      fetch(`/api/students/${id}/summary`).then(r => r.json()),
      fetch(`/api/students/${id}/analytics`).then(r => r.json()),
    ])
      .then(([sum, ana]) => {
        if (!sum.error) setSummary(sum);
        if (!ana.error) setAnalytics(ana);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params]);

  /* ── Helpers ── */
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const fmtShort = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const fmtType = (t: string) =>
    t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const badge = (type: string) => VISIT_BADGE[type] || VISIT_BADGE.ILLNESS;

  /* ── Loading / Not found ── */
  if (loading)
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      </Layout>
    );

  if (!summary)
    return (
      <Layout>
        <div className="text-center py-24">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">Student not found</p>
          <Link href="/students" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">← Back to Students</Link>
        </div>
      </Layout>
    );

  const { student, statistics, latestAssessment, healthSummary } = summary;
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();

  /* ── Filtered visits (unified for table + timeline views) ── */
  const filteredVisits = student.visits.filter(v => {
    if (!visitSearch) return true;
    const term = visitSearch.toLowerCase();
    return (
      (v.chiefComplaint?.toLowerCase().includes(term)) ||
      (v.diagnosis?.toLowerCase().includes(term)) ||
      fmtType(v.visitType).toLowerCase().includes(term) ||
      fmt(v.visitDate).toLowerCase().includes(term) ||
      (v.creator.firstName + ' ' + v.creator.lastName).toLowerCase().includes(term)
    );
  });

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto print:max-w-full">
        {/* ══════════ STICKY HEADER ══════════ */}
        <div className="sticky top-0 z-30 bg-gray-50 pb-0 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-200/50">
                {initials}
              </div>

              {/* Name / Meta */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {student.firstName} {student.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    ID: {student.studentId}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span>{student.school.name}</span>
                  <span className="text-gray-300">|</span>
                  <span>{student.gender}</span>
                  <span className="text-gray-300">|</span>
                  <span>{statistics.age}y {statistics.ageInMonths % 12}m</span>
                </div>
              </div>

              {/* New Assessment Button */}
              <div className="print:hidden">
                <Link
                  href={`/visits/new?studentId=${student.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                >
                  <Plus className="w-4 h-4" />
                  New Assessment
                </Link>
              </div>
            </div>
          </div>

          {/* ══════════ TAB NAVIGATION BAR ══════════ */}
          <div className="bg-white border-b border-gray-200 rounded-b-none -mt-px print:hidden">
            <nav className="flex space-x-1 overflow-x-auto px-4">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                      isActive
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* ══════════ TAB CONTENT ══════════ */}
        <div className="mt-6">
          {/* ────── OVERVIEW TAB ────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard label="Total Visits" value={statistics.totalVisits} color="indigo" />
                <KPICard label="This Year" value={analytics?.summary.visitsThisYear ?? 0} color="emerald" />
                <KPICard label="Follow-ups" value={analytics?.summary.followUpCount ?? 0} color="amber" />
                <KPICard label="Avg Gap" value={`${analytics?.summary.avgGapDays ?? '—'}d`} color="sky" />
              </div>

              {/* Bento Grid — 3 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Student Information */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">Student Information</h2>
                  </div>
                  <dl className="space-y-2.5 text-sm">
                    <InfoRow label="Date of Birth" value={fmt(student.dateOfBirth)} />
                    <InfoRow label="Gender" value={student.gender} />
                    {student.nationality && <InfoRow label="Nationality" value={student.nationality} />}
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Blood Type</dt>
                      <dd>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-semibold">
                          {student.bloodType.replace(/_/g, ' ')}
                        </span>
                      </dd>
                    </div>
                    <InfoRow label="Academic Year" value={student.academicYear} />
                    <InfoRow label="School" value={student.school.name} />
                  </dl>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-sky-50 rounded-lg">
                      <Phone className="w-4 h-4 text-sky-600" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">Contact Information</h2>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-[11px] text-gray-400 uppercase tracking-wider">Parent / Guardian</dt>
                      <dd className="text-gray-900 font-medium mt-0.5">{student.parentName}</dd>
                      <dd className="text-gray-500 mt-0.5">{student.parentPhone}</dd>
                      {student.parentEmail && <dd className="text-gray-500">{student.parentEmail}</dd>}
                    </div>
                    <div className="border-t border-gray-50 pt-3">
                      <dt className="text-[11px] text-gray-400 uppercase tracking-wider">Emergency Contact</dt>
                      <dd className="text-gray-900 font-medium mt-0.5">{student.emergencyContact}</dd>
                      <dd className="text-gray-500 mt-0.5">{student.emergencyPhone}</dd>
                    </div>
                    {student.address && (
                      <div className="border-t border-gray-50 pt-3">
                        <dt className="text-[11px] text-gray-400 uppercase tracking-wider">Address</dt>
                        <dd className="text-gray-700 mt-0.5">{student.address}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Latest Vital Signs */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-rose-50 rounded-lg">
                        <Activity className="w-4 h-4 text-rose-600" />
                      </div>
                      <h2 className="text-sm font-semibold text-gray-900">Latest Vital Signs</h2>
                    </div>
                    {latestAssessment && (
                      <span className="text-[11px] text-gray-400">{fmtShort(latestAssessment.createdAt)}</span>
                    )}
                  </div>
                  {latestAssessment ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {latestAssessment.temperature != null && (
                        <VitalChip label="Temp" value={`${latestAssessment.temperature}°C`} icon={<Thermometer className="w-4 h-4" />} alert={latestAssessment.temperature > 37.5} />
                      )}
                      {latestAssessment.heartRate != null && (
                        <VitalChip label="HR" value={`${latestAssessment.heartRate} bpm`} icon={<Heart className="w-4 h-4" />} alert={latestAssessment.heartRate > 100 || latestAssessment.heartRate < 60} />
                      )}
                      {latestAssessment.bloodPressureSystolic != null && (
                        <VitalChip label="BP" value={`${latestAssessment.bloodPressureSystolic}/${latestAssessment.bloodPressureDiastolic || '--'}`} icon={<Activity className="w-4 h-4" />} />
                      )}
                      {latestAssessment.oxygenSaturation != null && (
                        <VitalChip label="SpO₂" value={`${latestAssessment.oxygenSaturation}%`} icon={<Wind className="w-4 h-4" />} alert={latestAssessment.oxygenSaturation < 95} />
                      )}
                      {latestAssessment.height != null && (
                        <VitalChip label="Height" value={`${latestAssessment.height} cm`} icon={<Ruler className="w-4 h-4" />} />
                      )}
                      {latestAssessment.weight != null && (
                        <VitalChip label="Weight" value={`${latestAssessment.weight} kg`} icon={<Scale className="w-4 h-4" />} />
                      )}
                      {latestAssessment.bmi != null && (
                        <VitalChip label="BMI" value={latestAssessment.bmi.toFixed(1)} icon={<BarChart3 className="w-4 h-4" />} alert={latestAssessment.bmi > 30 || latestAssessment.bmi < 16} />
                      )}
                      {latestAssessment.respiratoryRate != null && (
                        <VitalChip label="RR" value={`${latestAssessment.respiratoryRate}/min`} icon={<Wind className="w-4 h-4" />} />
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No vitals recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ────── VISITS & ASSESSMENTS TAB (unified) ────── */}
          {activeTab === 'visits' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              {/* Header with search + view toggle */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-violet-50 rounded-lg">
                      <ClipboardCheck className="w-4 h-4 text-violet-600" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">Visits & Assessments</h2>
                    <span className="text-xs text-gray-400 ml-1">({filteredVisits.length})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* View toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                      <button
                        onClick={() => setVisitViewMode('table')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          visitViewMode === 'table'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        Table
                      </button>
                      <button
                        onClick={() => setVisitViewMode('timeline')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          visitViewMode === 'timeline'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Timeline
                      </button>
                    </div>
                    {/* Search */}
                    <div className="relative max-w-xs w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search visits..."
                        value={visitSearch}
                        onChange={(e) => setVisitSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* TABLE VIEW */}
              {visitViewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Complaint</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Diagnosis</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Temp</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">HR</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">BP</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Follow-up</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredVisits.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-12 text-gray-400">
                            <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>No visits found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredVisits.map((visit) => {
                          const b = badge(visit.visitType);
                          return (
                            <tr key={visit.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmt(visit.visitDate)}</td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${b.bg} ${b.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                                  {fmtType(visit.visitType)}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-gray-700 max-w-[200px] truncate">{visit.chiefComplaint || '—'}</td>
                              <td className="px-5 py-3 text-gray-700 max-w-[200px] truncate">{visit.diagnosis || '—'}</td>
                              <td className="px-5 py-3 text-gray-600">{visit.assessment?.temperature ? `${visit.assessment.temperature}°C` : '—'}</td>
                              <td className="px-5 py-3 text-gray-600">{visit.assessment?.heartRate ? `${visit.assessment.heartRate}` : '—'}</td>
                              <td className="px-5 py-3 text-gray-600">
                                {visit.assessment?.bloodPressureSystolic
                                  ? `${visit.assessment.bloodPressureSystolic}/${visit.assessment.bloodPressureDiastolic || '--'}`
                                  : '—'}
                              </td>
                              <td className="px-5 py-3">
                                {visit.followUpRequired ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                                    ⟳ {visit.followUpDate ? fmtShort(visit.followUpDate) : 'Yes'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <Link href={`/visits/${visit.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors inline-flex">
                                  <ChevronRight className="w-4 h-4" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TIMELINE VIEW */}
              {visitViewMode === 'timeline' && (
                <div className="p-6">
                  {filteredVisits.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-3">
                        <Clock className="w-7 h-7 text-gray-300" />
                      </div>
                      <p className="text-gray-400 text-sm">No visits found</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-200 via-gray-200 to-gray-100 rounded-full" />

                      <div className="space-y-1">
                        {filteredVisits.map((visit) => {
                          const b = badge(visit.visitType);
                          const dotBg = TIMELINE_DOT_BG[visit.visitType] || 'bg-gray-400';
                          return (
                            <div key={visit.id} className="relative flex gap-4 group">
                              {/* Timeline dot */}
                              <div className="relative z-10 flex-shrink-0 mt-5">
                                <div className={`w-[12px] h-[12px] rounded-full ${dotBg} ring-4 ring-white group-hover:scale-125 transition-transform shadow-sm`} />
                              </div>

                              {/* Card */}
                              <div className="flex-1 bg-gray-50/80 rounded-xl p-4 mb-2 hover:bg-white hover:shadow-md hover:border-gray-200 border border-transparent transition-all cursor-pointer group">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${b.bg} ${b.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                                        {fmtType(visit.visitType)}
                                      </span>
                                      <span className="text-xs text-gray-400">{fmt(visit.visitDate)}</span>
                                      {visit.followUpRequired && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                                          ⟳ Follow-up{visit.followUpDate ? ` · ${fmtShort(visit.followUpDate)}` : ''}
                                        </span>
                                      )}
                                    </div>
                                    {visit.chiefComplaint && (
                                      <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{visit.chiefComplaint}</p>
                                    )}
                                    {visit.diagnosis && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        <span className="font-medium text-gray-600">Dx:</span> {visit.diagnosis}
                                      </p>
                                    )}
                                    {visit.treatment && (
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        <span className="font-medium text-gray-600">Tx:</span> {visit.treatment}
                                      </p>
                                    )}
                                    {/* Inline vitals */}
                                    {visit.assessment && (
                                      <div className="flex flex-wrap gap-3 mt-2">
                                        {visit.assessment.temperature != null && (
                                          <span className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                                            <Thermometer className="w-3 h-3" /> {visit.assessment.temperature}°C
                                          </span>
                                        )}
                                        {visit.assessment.heartRate != null && (
                                          <span className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                                            <Heart className="w-3 h-3" /> {visit.assessment.heartRate} bpm
                                          </span>
                                        )}
                                        {visit.assessment.bloodPressureSystolic != null && (
                                          <span className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                                            <Activity className="w-3 h-3" /> {visit.assessment.bloodPressureSystolic}/{visit.assessment.bloodPressureDiastolic || '--'}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <Link
                                    href={`/visits/${visit.id}`}
                                    className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </Link>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">
                                  {visit.creator.firstName} {visit.creator.lastName}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ────── HEALTH RECORDS TAB ────── */}
          {activeTab === 'health-records' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left: Allergies & Conditions */}
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-red-50 rounded-lg">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">Allergies</h2>
                  </div>
                  <HealthRecord value={healthSummary.allergies} emptyLabel="No allergies recorded" color="red" />
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-amber-50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">Chronic Conditions</h2>
                  </div>
                  <HealthRecord value={healthSummary.chronicConditions} emptyLabel="No chronic conditions recorded" color="amber" />
                </div>

                {/* Recent Diagnoses */}
                {summary.recentDiagnoses.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-violet-50 rounded-lg">
                        <FileText className="w-4 h-4 text-violet-600" />
                      </div>
                      <h2 className="text-sm font-semibold text-gray-900">Recent Diagnoses</h2>
                    </div>
                    <div className="space-y-2">
                      {summary.recentDiagnoses.slice(0, 8).map((d, i) => {
                        const b = badge(d.visitType);
                        return (
                          <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <span className="text-xs text-gray-400 w-20 flex-shrink-0">{fmtShort(d.date)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${b.bg} ${b.text} flex-shrink-0`}>{fmtType(d.visitType)}</span>
                            <span className="text-gray-800 truncate">{d.diagnosis}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Immunization / Medication */}
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-purple-50 rounded-lg">
                      <Pill className="w-4 h-4 text-purple-600" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">Current Medications</h2>
                  </div>
                  <HealthRecord value={healthSummary.medications} emptyLabel="No medications recorded" color="purple" />
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                      <Syringe className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">Immunizations</h2>
                  </div>
                  {/* Show vaccination visits */}
                  {(() => {
                    const vaccinations = student.visits.filter(v => v.visitType === 'VACCINATION');
                    if (vaccinations.length === 0) {
                      return (
                        <div className="text-center py-6">
                          <Syringe className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">No immunization records</p>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-2">
                        {vaccinations.map((v, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm p-2.5 bg-indigo-50/50 rounded-lg">
                            <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800 font-medium truncate">{v.diagnosis || v.chiefComplaint || 'Vaccination'}</p>
                              <p className="text-xs text-gray-500">{fmt(v.visitDate)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Blood Type Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-rose-50 rounded-lg">
                      <Heart className="w-4 h-4 text-rose-600" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">Blood Type</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center">
                      <span className="text-xl font-bold text-red-700">{student.bloodType.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────── ANALYTICS TAB ────── */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {!analytics ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No analytics data available</p>
                </div>
              ) : (
                <>
                  {/* Summary KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                      <p className="text-2xl font-bold text-indigo-700">{analytics.summary.totalVisits}</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">Total Visits</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-700">{analytics.summary.visitsThisYear}</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">This Year</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                      <p className="text-2xl font-bold text-amber-700">{analytics.summary.followUpPending}</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">Pending Follow-ups</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                      <p className="text-2xl font-bold text-sky-700">{analytics.summary.avgGapDays || '—'}</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">Avg Gap (days)</p>
                    </div>
                  </div>

                  {analytics.summary.firstVisit && (
                    <p className="text-xs text-gray-400">
                      First visit: {fmt(analytics.summary.firstVisit)} · Last visit: {fmt(analytics.summary.lastVisit!)}
                    </p>
                  )}

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Visit Trend */}
                    {analytics.monthlyTrend.length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Visit Trend</h3>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.monthlyTrend}>
                              <defs>
                                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={24} />
                              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                              <Area type="monotone" dataKey="visits" stroke="#6366f1" strokeWidth={2.5} fill="url(#trendGrad)" dot={{ r: 3, fill: '#6366f1' }} name="Visits" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Visit Type Distribution */}
                    {analytics.visitTypeDistribution.length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Visit Type Distribution</h3>
                        <div className="flex items-center gap-6">
                          <div className="w-40 h-40 flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={analytics.visitTypeDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value" stroke="none">
                                  {analytics.visitTypeDistribution.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex-1 space-y-2">
                            {analytics.visitTypeDistribution.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="text-gray-600 flex-1 truncate">{item.name}</span>
                                <span className="font-semibold text-gray-900">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Patterns Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Day of Week */}
                    {analytics.dayOfWeekDistribution.some(d => d.visits > 0) && (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Day of Week</h3>
                        <div className="h-44">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.dayOfWeekDistribution} barSize={20}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={20} />
                              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                              <Bar dataKey="visits" fill="#a5b4fc" radius={[6, 6, 0, 0]} name="Visits" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Top Complaints */}
                    {analytics.topComplaints.length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Complaints</h3>
                        <div className="space-y-3">
                          {analytics.topComplaints.map((item, i) => {
                            const pct = (item.count / analytics.topComplaints[0].count) * 100;
                            return (
                              <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-700 truncate">{item.name}</span>
                                  <span className="font-semibold text-gray-900 ml-2">{item.count}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Health Metrics Trends */}
                  {analytics.healthMetricsTrend.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {analytics.healthMetricsTrend.some(d => d.bmi) && (
                        <SparkMetric label="BMI" color="#10b981" data={analytics.healthMetricsTrend.filter(d => d.bmi)} dataKey="bmi" />
                      )}
                      {analytics.healthMetricsTrend.some(d => d.weight) && (
                        <SparkMetric label="Weight (kg)" color="#6366f1" data={analytics.healthMetricsTrend.filter(d => d.weight)} dataKey="weight" />
                      )}
                      {analytics.healthMetricsTrend.some(d => d.temperature) && (
                        <SparkMetric label="Temperature (°C)" color="#ef4444" data={analytics.healthMetricsTrend.filter(d => d.temperature)} dataKey="temperature" />
                      )}
                      {analytics.healthMetricsTrend.some(d => d.heartRate) && (
                        <SparkMetric label="Heart Rate (bpm)" color="#ec4899" data={analytics.healthMetricsTrend.filter(d => d.heartRate)} dataKey="heartRate" />
                      )}
                    </div>
                  )}

                  {/* Top Diagnoses */}
                  {analytics.topDiagnoses.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Diagnoses</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                        {analytics.topDiagnoses.map((item, i) => {
                          const pct = (item.count / analytics.topDiagnoses[0].count) * 100;
                          return (
                            <div key={i}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700 truncate">{item.name}</span>
                                <span className="font-semibold text-gray-900 ml-2">{item.count}</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[(i + 3) % PIE_COLORS.length] }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

/* ══════════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════════ */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium">{value}</dd>
    </div>
  );
}

function KPICard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-50 to-indigo-100/50 border-indigo-100',
    emerald: 'from-emerald-50 to-emerald-100/50 border-emerald-100',
    amber: 'from-amber-50 to-amber-100/50 border-amber-100',
    sky: 'from-sky-50 to-sky-100/50 border-sky-100',
    rose: 'from-rose-50 to-rose-100/50 border-rose-100',
  };
  const textColors: Record<string, string> = {
    indigo: '#4338ca',
    emerald: '#047857',
    amber: '#b45309',
    sky: '#0369a1',
    rose: '#be123c',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-4 text-center shadow-sm`}>
      <p className="text-2xl font-bold tracking-tight" style={{ color: textColors[color] }}>
        {value}
      </p>
      <p className="text-[11px] text-gray-500 font-medium mt-0.5">{label}</p>
    </div>
  );
}

function VitalChip({ label, value, icon, alert }: { label: string; value: string; icon: React.ReactNode; alert?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 p-2.5 rounded-xl text-sm transition-colors ${alert ? 'bg-red-50 border border-red-100' : 'bg-gray-50 hover:bg-gray-100'}`}>
      <span className={`flex-shrink-0 ${alert ? 'text-red-500' : 'text-gray-400'}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider leading-none">{label}</p>
        <p className={`font-semibold leading-tight ${alert ? 'text-red-700' : 'text-gray-800'}`}>{value}</p>
      </div>
    </div>
  );
}

function HealthRecord({ value, emptyLabel, color }: { value: string; emptyLabel: string; color: string }) {
  const isNone = value === 'None recorded' || value === 'None' || !value;
  const bgMap: Record<string, string> = {
    red: 'bg-red-50 border-red-100',
    amber: 'bg-amber-50 border-amber-100',
    purple: 'bg-purple-50 border-purple-100',
  };

  if (isNone) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-400 italic">{emptyLabel}</p>
      </div>
    );
  }

  const items = value.split(',').map(s => s.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-medium ${bgMap[color] || 'bg-gray-50 border-gray-100'}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function SparkMetric({ label, color, data, dataKey }: { label: string; color: string; data: any[]; dataKey: string }) {
  const lastVal = data.length > 0 ? data[data.length - 1][dataKey] : null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
        {lastVal != null && <span className="text-sm font-bold" style={{ color }}>{lastVal}</span>}
      </div>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={28} domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} name={label} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

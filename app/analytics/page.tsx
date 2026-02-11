'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';

// ===== TYPES =====
interface OverviewStats {
  totalVisits: number;
  visitsToday: number;
  visitsThisWeek: number;
  visitsThisMonth: number;
  totalStudents: number;
  activeStudentsWithVisits: number;
  followUpsRequired: number;
  followUpsCompleted: number;
  followUpsPending: number;
  followUpRate: number;
}

interface UserContext {
  role: string;
  schoolName: string | null;
  schoolCode: string | null;
  isAdmin: boolean;
}

interface DashboardData {
  userContext: UserContext;
  overview: OverviewStats;
  visitTrends: { date: string; count: number }[];
  weeklyTrends: { week: string; count: number }[];
  visitTypes: { type: string; count: number }[];
  commonComplaints: { complaint: string; count: number }[];
  commonDiagnoses: { diagnosis: string; count: number }[];
  bmiDistribution: {
    grade: string; avgBmi: number;
    underweight: number; normal: number; overweight: number; obese: number; total: number;
  }[];
  bmiByGender: { gender: string; avgBmi: number; count: number }[];
  healthRiskAlerts: {
    studentId: string; studentName: string; studentNumber: string;
    grade: string; gender: string; alerts: string[]; visitDate: string;
  }[];
  followUpAnalysis: {
    total: number; completed: number; pending: number;
    byType: { type: string; count: number }[];
  };
  recurringVisitors: {
    studentId: string; studentName: string; studentNumber: string;
    grade: string; gender: string; visitCount: number;
  }[];
  visitsByGrade: { grade: string; count: number }[];
  visitsByGender: { gender: string; count: number }[];
  recentVisits: any[];
  filters: {
    grades: string[];
    homerooms: string[];
    schools: { id: string; name: string; code: string }[];
    visitTypes: string[];
    genders: string[];
  };
}

// Colors
const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const BMI_COLORS = { underweight: '#60a5fa', normal: '#34d399', overweight: '#fbbf24', obese: '#f87171' };

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [userRole, setUserRole] = useState('');
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'health' | 'alerts' | 'table'>('overview');
  const printRef = useRef<HTMLDivElement>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [grade, setGrade] = useState('');
  const [homeroom, setHomeroom] = useState('');
  const [gender, setGender] = useState('');
  const [visitType, setVisitType] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [trendView, setTrendView] = useState<'daily' | 'weekly'>('daily');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (schoolId) params.set('schoolId', schoolId);
      if (grade) params.set('grade', grade);
      if (homeroom) params.set('homeroom', homeroom);
      if (gender) params.set('gender', gender);
      if (visitType) params.set('visitType', visitType);
      if (diagnosis) params.set('diagnosis', diagnosis);

      const res = await fetch(`/api/analytics/dashboard?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, schoolId, grade, homeroom, gender, visitType, diagnosis]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUserRole(d.user.role);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleExport = async (format: 'xlsx' | 'csv') => {
    setExporting(true);
    try {
      const res = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, dateFrom, dateTo, schoolId, grade, homeroom, gender, visitType }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `health_analytics_report.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSchoolId('');
    setGrade('');
    setHomeroom('');
    setGender('');
    setVisitType('');
    setDiagnosis('');
    setSearchTerm('');
  };

  const filteredVisits = data?.recentVisits?.filter((v: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      v.student.firstName.toLowerCase().includes(term) ||
      v.student.lastName.toLowerCase().includes(term) ||
      v.student.studentId.toLowerCase().includes(term) ||
      (v.chiefComplaint && v.chiefComplaint.toLowerCase().includes(term)) ||
      (v.diagnosis && v.diagnosis.toLowerCase().includes(term))
    );
  }) || [];

  if (loading && !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading Health Analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="print:p-0" ref={printRef}>
        {/* Header */}
        <div className="mb-6 print:mb-4">
          {/* School Context Banner for non-admin users */}
          {data?.userContext && !data.userContext.isAdmin && data.userContext.schoolName && (
            <div className="mb-4 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900">
                  {data.userContext.schoolName}
                  <span className="ml-2 text-xs font-normal text-indigo-600">({data.userContext.schoolCode})</span>
                </p>
                <p className="text-xs text-indigo-700">
                  Showing health analytics for your assigned school
                </p>
              </div>
            </div>
          )}
          {data?.userContext?.isAdmin && (
            <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">All Schools — Admin View</p>
                <p className="text-xs text-emerald-700">
                  Viewing aggregated health analytics across all schools. Use the School filter to narrow down.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Clinic & Student Health Dashboard
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                {data?.userContext?.isAdmin
                  ? 'Comprehensive health analytics across all schools'
                  : data?.userContext?.schoolName
                    ? `Health analytics & reports for ${data.userContext.schoolName}`
                    : 'Comprehensive health analytics, trends, and insights'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <button
                onClick={() => handleExport('xlsx')}
                disabled={exporting}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 flex items-center gap-1"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 print:hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </h3>
            <button onClick={clearFilters} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {userRole === 'ADMIN' && data?.filters?.schools && data.filters.schools.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">School</label>
                <select
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Schools</option>
                  {data.filters.schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Grade</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Grades</option>
                {data?.filters?.grades?.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Homeroom</label>
              <select
                value={homeroom}
                onChange={(e) => setHomeroom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All</option>
                {data?.filters?.homerooms?.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Visit Type</label>
              <select
                value={visitType}
                onChange={(e) => setVisitType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Types</option>
                {data?.filters?.visitTypes?.map((vt) => (
                  <option key={vt} value={vt}>{vt.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Diagnosis</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Search..."
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6 print:hidden">
          <nav className="flex space-x-1 overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'visits', label: 'Visit Analytics', icon: '📈' },
              { key: 'health', label: 'Health Metrics', icon: '🏥' },
              { key: 'alerts', label: 'Alerts & Follow-ups', icon: '⚠️' },
              { key: 'table', label: 'Visit Records', icon: '📋' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ========== OVERVIEW TAB ========== */}
        {(activeTab === 'overview' || typeof window !== 'undefined' && window.matchMedia('print').matches) && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <KpiCard title="Total Visits" value={data?.overview.totalVisits || 0} icon="📋" color="indigo" />
              <KpiCard title="Today" value={data?.overview.visitsToday || 0} icon="📅" color="blue" />
              <KpiCard title="This Week" value={data?.overview.visitsThisWeek || 0} icon="📆" color="cyan" />
              <KpiCard title="This Month" value={data?.overview.visitsThisMonth || 0} icon="🗓️" color="teal" />
              <KpiCard title="Students Visited" value={data?.overview.activeStudentsWithVisits || 0} icon="👨‍🎓" color="green" />
              <KpiCard title="Follow-up Rate" value={`${data?.overview.followUpRate || 0}%`} icon="🔄" color="amber" />
            </div>

            {/* Visit Trends + Visit Types */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Visit Trends</h3>
                  <div className="flex gap-1 print:hidden">
                    <button
                      onClick={() => setTrendView('daily')}
                      className={`px-3 py-1 text-xs rounded-lg font-medium ${trendView === 'daily' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      Daily
                    </button>
                    <button
                      onClick={() => setTrendView('weekly')}
                      className={`px-3 py-1 text-xs rounded-lg font-medium ${trendView === 'weekly' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      Weekly
                    </button>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    {trendView === 'daily' ? (
                      <AreaChart data={data?.visitTrends || []}>
                        <defs>
                          <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                        <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorVisits)" name="Visits" />
                      </AreaChart>
                    ) : (
                      <BarChart data={data?.weeklyTrends || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} tickFormatter={(v) => { const d = new Date(v); return `W${Math.ceil(d.getDate() / 7)}/${d.getMonth() + 1}`; }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip labelFormatter={(v) => `Week of ${new Date(v).toLocaleDateString()}`} />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Visits" />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Visit Type Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Visit Types</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.visitTypes || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="type"
                        label={({ type, percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {data?.visitTypes?.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Complaints + Diagnoses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Top Reasons for Visits</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.commonComplaints || []} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="complaint"
                        tick={{ fontSize: 11 }}
                        width={120}
                        tickFormatter={(v) => v.length > 18 ? v.substring(0, 18) + '…' : v}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Top Diagnoses</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.commonDiagnoses || []} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="diagnosis"
                        tick={{ fontSize: 11 }}
                        width={120}
                        tickFormatter={(v) => v.length > 18 ? v.substring(0, 18) + '…' : v}
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== VISIT ANALYTICS TAB ========== */}
        {activeTab === 'visits' && (
          <div className="space-y-6">
            {/* Visits by Grade + Gender */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Visits by Grade</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.visitsByGrade || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Visits" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Visits by Gender</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.visitsByGender || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="gender"
                        label={({ gender, count }) => `${gender}: ${count}`}
                      >
                        <Cell fill="#6366f1" />
                        <Cell fill="#ec4899" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recurring Visitors */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Recurring Visitors (3+ visits)
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {data?.recurringVisitors?.length || 0} students
                </span>
              </h3>
              {data?.recurringVisitors && data.recurringVisitors.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Visits</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.recurringVisitors.map((rv, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{rv.studentName}</td>
                          <td className="px-4 py-2 text-gray-600">{rv.studentNumber}</td>
                          <td className="px-4 py-2 text-gray-600">{rv.grade}</td>
                          <td className="px-4 py-2 text-gray-600">{rv.gender}</td>
                          <td className="px-4 py-2">
                            <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                              {rv.visitCount}
                            </span>
                          </td>
                          <td className="px-4 py-2 print:hidden">
                            <Link href={`/students/${rv.studentId}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                              View Details →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No recurring visitors found</p>
              )}
            </div>
          </div>
        )}

        {/* ========== HEALTH METRICS TAB ========== */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            {/* BMI Distribution by Grade */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">BMI Distribution by Grade</h3>
              {data?.bmiDistribution && data.bmiDistribution.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.bmiDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="underweight" stackId="a" fill={BMI_COLORS.underweight} name="Underweight" />
                      <Bar dataKey="normal" stackId="a" fill={BMI_COLORS.normal} name="Normal" />
                      <Bar dataKey="overweight" stackId="a" fill={BMI_COLORS.overweight} name="Overweight" />
                      <Bar dataKey="obese" stackId="a" fill={BMI_COLORS.obese} name="Obese" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-12">No BMI data available</p>
              )}
            </div>

            {/* Average BMI by Grade (table) + BMI by Gender */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Average BMI per Grade</h3>
                {data?.bmiDistribution && data.bmiDistribution.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg BMI</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.bmiDistribution.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-900">{row.grade}</td>
                            <td className="px-4 py-2 text-gray-700">{row.avgBmi}</td>
                            <td className="px-4 py-2 text-gray-600">{row.total}</td>
                            <td className="px-4 py-2">
                              <BmiStatusBadge bmi={row.avgBmi} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No data available</p>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">BMI by Gender</h3>
                {data?.bmiByGender && data.bmiByGender.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.bmiByGender}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="gender" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                        <Tooltip />
                        <Bar dataKey="avgBmi" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Avg BMI">
                          <Cell fill="#6366f1" />
                          <Cell fill="#ec4899" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-12">No data available</p>
                )}
                {data?.bmiByGender && data.bmiByGender.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {data.bmiByGender.map((g, i) => (
                      <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">{g.gender}</p>
                        <p className="text-xl font-bold text-gray-900">{g.avgBmi}</p>
                        <p className="text-xs text-gray-400">{g.count} assessments</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========== ALERTS & FOLLOW-UPS TAB ========== */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* Follow-up Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg">🔄</div>
                  <div>
                    <p className="text-xs text-gray-500">Total Follow-ups</p>
                    <p className="text-2xl font-bold text-gray-900">{data?.followUpAnalysis.total || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-lg">✅</div>
                  <div>
                    <p className="text-xs text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-green-700">{data?.followUpAnalysis.completed || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-lg">⏳</div>
                  <div>
                    <p className="text-xs text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-red-700">{data?.followUpAnalysis.pending || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Follow-up by Visit Type */}
            {data?.followUpAnalysis?.byType && data.followUpAnalysis.byType.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Follow-ups by Visit Type</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.followUpAnalysis.byType}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Follow-ups" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Health Risk Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Health Risk Alerts</h3>
              <p className="text-xs text-gray-500 mb-4">Students with abnormal vital signs or BMI values</p>
              {data?.healthRiskAlerts && data.healthRiskAlerts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-red-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Student</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Grade</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Alerts</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.healthRiskAlerts.map((alert, i) => (
                        <tr key={i} className="hover:bg-red-50/50">
                          <td className="px-4 py-2 font-medium text-gray-900">{alert.studentName}</td>
                          <td className="px-4 py-2 text-gray-600">{alert.studentNumber}</td>
                          <td className="px-4 py-2 text-gray-600">{alert.grade}</td>
                          <td className="px-4 py-2">
                            <div className="flex flex-wrap gap-1">
                              {alert.alerts.map((a, j) => (
                                <span key={j} className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                                  {a}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-gray-600 text-xs">
                            {new Date(alert.visitDate).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 print:hidden">
                            <Link href={`/students/${alert.studentId}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                              View →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-3xl mb-2">✅</div>
                  <p>No health risk alerts at this time</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== VISIT RECORDS TABLE TAB ========== */}
        {activeTab === 'table' && (
          <div className="space-y-4">
            {/* Table Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, ID, complaint, diagnosis..."
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                Showing {filteredVisits.length} of {data?.recentVisits?.length || 0} records
              </p>
            </div>

            {/* Visits Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaint</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Treatment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vitals</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Follow-up</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredVisits.length > 0 ? (
                      filteredVisits.map((v: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 whitespace-nowrap text-xs">
                            {new Date(v.visitDate).toLocaleDateString()}
                            <br />
                            <span className="text-gray-400">
                              {new Date(v.visitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">
                            {v.student.firstName} {v.student.lastName}
                          </td>
                          <td className="px-4 py-2 text-gray-600 text-xs">{v.student.studentId}</td>
                          <td className="px-4 py-2 text-gray-600">{v.student.grade || '-'}</td>
                          <td className="px-4 py-2">
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                              {v.visitType.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-600 text-xs max-w-[150px] truncate" title={v.chiefComplaint}>
                            {v.chiefComplaint || '-'}
                          </td>
                          <td className="px-4 py-2 text-gray-600 text-xs max-w-[150px] truncate" title={v.diagnosis}>
                            {v.diagnosis || '-'}
                          </td>
                          <td className="px-4 py-2 text-gray-600 text-xs max-w-[120px] truncate" title={v.treatment}>
                            {v.treatment || '-'}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {v.assessment ? (
                              <div className="space-y-0.5">
                                {v.assessment.temperature && <div>🌡️ {v.assessment.temperature}°C</div>}
                                {v.assessment.bloodPressureSystolic && (
                                  <div>💓 {v.assessment.bloodPressureSystolic}/{v.assessment.bloodPressureDiastolic}</div>
                                )}
                                {v.assessment.bmi && <div>📏 BMI {v.assessment.bmi}</div>}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-2">
                            {v.followUpRequired ? (
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                                Yes
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">No</span>
                            )}
                          </td>
                          <td className="px-4 py-2 print:hidden">
                            <div className="flex gap-2">
                              <Link href={`/visits/${v.id}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                                Visit
                              </Link>
                              <Link href={`/students/${v.student.id}`} className="text-green-600 hover:text-green-800 text-xs font-medium">
                                Student
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="px-4 py-8 text-center text-gray-400">
                          {searchTerm ? 'No matching records found' : 'No visit records available'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Print Footer */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>
            Taaleem Clinic Health Analytics Report
            {data?.userContext?.schoolName && ` — ${data.userContext.schoolName} (${data.userContext.schoolCode})`}
            {data?.userContext?.isAdmin && ' — All Schools'}
          </p>
          <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
          <p>Confidential — For authorized personnel only</p>
        </div>
      </div>
    </Layout>
  );
}

// ===== SUB-COMPONENTS =====

function KpiCard({ title, value, icon, color }: { title: string; value: number | string; icon: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700',
    blue: 'bg-blue-50 text-blue-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    teal: 'bg-teal-50 text-teal-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  };
  const cls = colorMap[color] || colorMap.indigo;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${cls}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function BmiStatusBadge({ bmi }: { bmi: number }) {
  if (bmi < 18.5) return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Underweight</span>;
  if (bmi < 25) return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Normal</span>;
  if (bmi < 30) return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Overweight</span>;
  return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">Obese</span>;
}


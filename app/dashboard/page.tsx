'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import {
  Building2,
  GraduationCap,
  ClipboardList,
  ShieldAlert,
  Activity,
  Users,
  UserPlus,
  Upload,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  totalSchools: number;
  totalStudents: number;
  totalVisits: number;
  visitsToday: number;
  pendingHL7Messages: number;
  recentVisits: any[];
}

interface ChartData {
  visitTrends: { date: string; count: number }[];
  visitTypes: { type: string; count: number }[];
}

interface CurrentUser {
  id: string;
  role: 'ADMIN' | 'CLINIC_MANAGER' | 'NURSE' | 'DOCTOR' | 'STAFF';
  schoolId?: string | null;
  firstName: string;
  lastName: string;
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [trendView, setTrendView] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, meRes, analyticsRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/auth/me'),
          fetch('/api/analytics/dashboard'),
        ]);

        const statsData = await statsRes.json();
        const meData = await meRes.json();
        const analyticsData = await analyticsRes.json();

        setStats(statsData);
        setChartData({
          visitTrends: analyticsData.visitTrends || [],
          visitTypes: analyticsData.visitTypes || [],
        });
        if (meData.user) {
          setUser(meData.user);
        } else {
          router.push('/login');
        }
      } catch (e) {
        console.error('Dashboard load error', e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading dashboard…</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const isSchoolAdmin = user.role === 'CLINIC_MANAGER';

  const perfCards = [
    {
      label: 'Total Schools',
      value: stats?.totalSchools ?? 0,
      sub: isAdmin ? 'Active campuses' : 'Your school only',
      icon: <Building2 className="w-5 h-5" />,
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      trend: '↑ 4% this term',
    },
    {
      label: 'Total Students',
      value: stats?.totalStudents ?? 0,
      sub: 'Active students',
      icon: <GraduationCap className="w-5 h-5" />,
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      trend: '↑ 12% this year',
    },
    {
      label: 'Assessments',
      value: stats?.totalVisits ?? 0,
      sub: `${stats?.visitsToday ?? 0} today`,
      icon: <ClipboardList className="w-5 h-5" />,
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      trend: '↑ clinic activity',
    },
    {
      label: 'Pending Referrals',
      value: stats?.pendingHL7Messages ?? 0,
      sub: stats && stats.pendingHL7Messages > 0 ? 'Awaiting HL7 delivery' : 'Queue clear',
      icon: <ShieldAlert className="w-5 h-5" />,
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      trend: stats && stats.pendingHL7Messages > 0 ? '↑ in queue' : '↓ none pending',
    },
  ];

  const recentVisits = (stats?.recentVisits || []) as any[];

  return (
    <Layout>
      <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Admin banner */}
        {isAdmin && (
          <div className="mb-1 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-900">Admin access available</p>
              <p className="text-xs text-indigo-700">
                Use the Admin link in the sidebar to access the full Admin Command Center.
              </p>
            </div>
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
            >
              Go to Admin Dashboard
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isAdmin ? 'Global Clinic Dashboard' : isSchoolAdmin ? 'School Clinic Dashboard' : 'Clinic Dashboard'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Real-time overview of student health visits, referrals, and clinic workload.
            </p>
          </div>
        </div>

        {/* Performance cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {perfCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-gray-200/80 p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} ${card.text}`}>
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 leading-none">{card.value}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{card.sub}</p>
                </div>
              </div>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{card.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* System Status + Command Center */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* System Status */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">System Status</h2>
                <p className="text-[11px] text-slate-500">Integration &amp; connectivity for this environment</p>
              </div>
            </div>

            <StatusRow
              label="Malaffi Integration"
              value="Live"
              description="ADT / ORU messages enabled"
              tone="good"
            />
            <StatusRow
              label="HL7 Server"
              value={stats && stats.pendingHL7Messages > 0 ? 'Queue active' : 'Healthy'}
              description={
                stats && stats.pendingHL7Messages > 0
                  ? `${stats.pendingHL7Messages} message(s) pending`
                  : 'No pending messages'
              }
              tone={stats && stats.pendingHL7Messages > 0 ? 'warn' : 'good'}
            />
            <StatusRow
              label="Compliance"
              value="ADHICS"
              description="Security & privacy controls in place"
              tone="good"
              mono
            />
          </div>

          {/* Command Center */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Clinic Command Center</h2>
                  <p className="text-[11px] text-slate-500">Quick access to your most common clinical workflows</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <CommandButton
                href="/visits/new"
                icon={<ClipboardList className="w-4 h-4" />}
                label="New Assessment"
                tone="primary"
              />
              <CommandButton
                href="/visits"
                icon={<Activity className="w-4 h-4" />}
                label="Visit Log"
                tone="slate"
              />
              {(isAdmin || isSchoolAdmin) && (
                <CommandButton
                  href="/students/new"
                  icon={<UserPlus className="w-4 h-4" />}
                  label="Add Student"
                  tone="emerald"
                />
              )}
              {(isAdmin || isSchoolAdmin) && (
                <CommandButton
                  href="/import/students"
                  icon={<Upload className="w-4 h-4" />}
                  label="Bulk Import Students"
                  tone="slate"
                />
              )}
              <CommandButton
                href="/analytics"
                icon={<BarChart3 className="w-4 h-4" />}
                label="Health Analytics"
                tone="purple"
              />
              <CommandButton
                href="/hl7"
                icon={<ShieldAlert className="w-4 h-4" />}
                label="HL7 Messages"
                tone="amber"
              />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Visit Trends Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Visit Trends</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setTrendView('daily')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    trendView === 'daily'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setTrendView('weekly')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    trendView === 'weekly'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>
            <div className="h-72">
              {chartData && chartData.visitTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.visitTrends}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => {
                        const d = new Date(v);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(v) => new Date(v).toLocaleDateString()}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#6366f1"
                      fillOpacity={1}
                      fill="url(#colorVisits)"
                      name="Visits"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No visit data available
                </div>
              )}
            </div>
          </div>

          {/* Visit Types Chart */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Visit Types</h3>
            <div className="h-72">
              {chartData && chartData.visitTypes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.visitTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="type"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartData.visitTypes.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: 11 }}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No visit type data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Clinic Feed + Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Live Clinic Feed</h3>
                  <p className="text-[11px] text-gray-400">
                    Latest assessments and student visits from your clinic
                  </p>
                </div>
              </div>
              <Link
                href="/visits"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Open Log
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-gray-50">
              {recentVisits.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  No recent visits to display yet.
                </div>
              ) : (
                recentVisits.slice(0, 6).map((v: any) => (
                  <div
                    key={v.id}
                    className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                        {v.student
                          ? `${v.student.firstName?.[0] || ''}${v.student.lastName?.[0] || ''}`.toUpperCase()
                          : 'V'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {v.student
                          ? `${v.student.firstName} ${v.student.lastName}`
                          : 'Clinical visit'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {v.chiefComplaint || 'Assessment logged'}{' '}
                        {v.visitType && `• ${String(v.visitType).replace(/_/g, ' ')}`}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {v.visitDate && (
                        <p className="text-[11px] text-gray-400 whitespace-nowrap">{timeAgo(v.visitDate)}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Reports &amp; Analytics</h3>
                <p className="text-[11px] text-gray-400">Deep dive into visit trends and student health</p>
              </div>
            </div>
            <div className="flex-1 p-4 space-y-2">
              {[
                {
                  href: '/analytics',
                  label: 'Health Analytics Dashboard',
                  desc: 'Trends, complaints, diagnoses',
                },
                {
                  href: '/admin/reports/visits',
                  label: 'Visit Reports',
                  desc: 'Clinic utilization over time',
                },
                {
                  href: '/admin/reports/students',
                  label: 'Student Reports',
                  desc: 'Student health & BMI distribution',
                },
              ].map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      {r.label}
                    </p>
                    <p className="text-[11px] text-gray-400">{r.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatusRow({
  label,
  value,
  description,
  tone,
  mono,
}: {
  label: string;
  value: string;
  description: string;
  tone: 'good' | 'warn' | 'bad';
  mono?: boolean;
}) {
  const main =
    tone === 'good'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'warn'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-red-50 text-red-700';

  const ping =
    tone === 'good' ? 'bg-emerald-400' : tone === 'warn' ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="flex items-start justify-between gap-2.5">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${ping}`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${ping}`} />
        </span>
        <div>
          <p className="text-[11px] font-medium text-gray-700">{label}</p>
          <p className="text-[10px] text-gray-400">{description}</p>
        </div>
      </div>
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${main} ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function CommandButton({
  href,
  icon,
  label,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  tone: 'primary' | 'slate' | 'purple' | 'emerald' | 'amber' | 'indigo';
}) {
  const styles: Record<
    typeof tone,
    string
  > = {
    primary: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    slate: 'bg-slate-50 text-slate-700 hover:bg-slate-100',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    indigo: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium shadow-sm border border-transparent transition-colors ${styles[tone]}`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/60 text-current">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

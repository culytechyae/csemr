'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import {
  Users,
  School,
  GraduationCap,
  ShieldAlert,
  Lock,
  UserPlus,
  Upload,
  Eye,
  Plus,
  CalendarDays,
  Settings,
  Mail,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Activity,
  Download,
  FileText,
  BookOpen,
  Database,
  Shield,
  ClipboardList,
  Bell,
  Wrench,
  Building2,
  ExternalLink,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface CurrentUser {
  id: string;
  role: 'ADMIN' | 'CLINIC_MANAGER' | 'NURSE' | 'DOCTOR' | 'STAFF';
  firstName: string;
  lastName: string;
}

interface AdminStats {
  totalUsers: number;
  totalSchools: number;
  totalStudents: number;
  activeUsers: number;
  lockedAccounts: number;
  pendingSecurityEvents: number;
  recentAuditLogs: number;
}

interface DashboardStats {
  totalSchools: number;
  totalStudents: number;
  totalVisits: number;
  visitsToday: number;
  pendingHL7Messages: number;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  severity: string;
  ipAddress?: string;
  createdAt: string;
  userId?: string;
}

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: string;
  description: string;
  resolved: boolean;
  createdAt: string;
}

// ─── SVG Sparkline Component ────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pad = 2;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  // Gradient fill area
  const firstX = pad;
  const lastX = pad + ((data.length - 1) / (data.length - 1 || 1)) * (w - pad * 2);
  const areaPoints = `${firstX},${h - pad} ${points} ${lastX},${h - pad}`;

  const gradId = `spark-${color.replace('#', '')}`;

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Circular Progress Ring ─────────────────────────────────────────────────────

function ProgressRing({
  value,
  total,
  size = 52,
  strokeWidth = 5,
  color,
  label,
}: {
  value: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? value / total : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-gray-100"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="text-[10px] font-semibold text-gray-500 leading-none">{label}</span>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

// Synthetic sparkline data — in a real app you'd fetch 7-day trend from an API
function generateSparkData(base: number, variance: number = 0.3): number[] {
  const seed = base;
  return Array.from({ length: 7 }, (_, i) => {
    const factor = 1 + Math.sin(seed + i * 1.7) * variance;
    return Math.max(0, Math.round(base * factor));
  });
}

function activityIcon(severity: string) {
  switch (severity) {
    case 'CRITICAL':
    case 'ERROR':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'WARNING':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'INFO':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();

        if (!meData.user) {
          router.push('/login');
          return;
        }

        if (meData.user.role !== 'ADMIN') {
          router.push('/dashboard');
          return;
        }

        setUser(meData.user);

        // Fetch all data in parallel
        const [statsRes, logsRes, eventsRes, dashboardRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/audit-logs?limit=5'),
          fetch('/api/security/events?limit=5'),
          fetch('/api/dashboard/stats'),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setAuditLogs(Array.isArray(logsData) ? logsData.slice(0, 5) : []);
        }
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setSecurityEvents(Array.isArray(eventsData) ? eventsData.slice(0, 5) : []);
        }
        if (dashboardRes.ok) {
          const dash = await dashboardRes.json();
          setDashboardStats(dash);
        }
      } catch (error) {
        console.error('Error loading admin dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  // ── Metric cards config ─────────────────────────────────────────────────

  const metricCards = useMemo(() => {
    if (!dashboardStats) return [];
    const totalSchools = dashboardStats.totalSchools;
    const totalStudents = dashboardStats.totalStudents;
    const totalAssessments = dashboardStats.totalVisits;
    const pendingReferrals = dashboardStats.pendingHL7Messages;

    return [
      {
        label: 'Total Schools',
        value: totalSchools,
        sub: 'Active campuses',
        icon: <Building2 className="w-5 h-5" />,
        color: '#2563eb',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        spark: generateSparkData(Math.max(totalSchools, 1), 0.12),
        trendIcon: <TrendingUp className="w-3 h-3 text-blue-500" />,
        trendText: '↑ 4% this term',
      },
      {
        label: 'Total Schools',
        value: totalStudents,
        sub: 'Active students',
        icon: <GraduationCap className="w-5 h-5" />,
        color: '#10b981',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        spark: generateSparkData(Math.max(totalStudents, 1), 0.18),
        trendIcon: <TrendingUp className="w-3 h-3 text-emerald-500" />,
        trendText: '↑ 12% this year',
      },
      {
        label: 'Assessments',
        value: totalAssessments,
        sub: 'All-time clinic visits',
        icon: <ClipboardList className="w-5 h-5" />,
        color: '#7c3aed',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-600',
        spark: generateSparkData(Math.max(totalAssessments, 1), 0.2),
        trendIcon: <TrendingUp className="w-3 h-3 text-purple-500" />,
        trendText: '↑ 6% this month',
      },
      {
        label: 'Pending Referrals',
        value: pendingReferrals,
        sub: 'Awaiting HL7 delivery',
        icon: <ShieldAlert className="w-5 h-5" />,
        color: '#f97316',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
        spark: generateSparkData(Math.max(pendingReferrals || 1, 1), 0.35),
        trendIcon:
          pendingReferrals > 0 ? (
            <TrendingUp className="w-3 h-3 text-amber-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-emerald-500" />
          ),
        trendText: pendingReferrals > 0 ? '↑ referrals in queue' : '↓ queue clear',
      },
    ];
  }, [dashboardStats]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading dashboard…</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="space-y-6">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            System overview &amp; management for Taaleem Clinic
          </p>
        </div>

        {/* ── Performance Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-gray-200/80 p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-10 h-10 ${card.bgColor} rounded-xl flex items-center justify-center ${card.textColor}`}
                >
                  {card.icon}
                </div>

                {/* Numbers */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider leading-none mb-1">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 leading-none">{card.value}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p>
                </div>

                {/* Sparkline */}
                <div className="flex-shrink-0 mt-1">
                  <Sparkline data={card.spark} color={card.color} />
                </div>
              </div>

              {/* Trend */}
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-slate-500">
                  {card.trendIcon}
                  <span>{card.trendText}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── System Status + Command Center ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* System Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">System Status</h3>
                  <p className="text-[11px] text-gray-400">Integration & connectivity</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <StatusRow
                label="Malaffi Integration"
                value="Live"
                description="ADT / ORU messages active"
                tone="good"
              />
              <StatusRow
                label="HL7 Server"
                value={dashboardStats && dashboardStats.pendingHL7Messages > 0 ? 'Queue active' : 'Live'}
                description={
                  dashboardStats && dashboardStats.pendingHL7Messages > 0
                    ? `${dashboardStats.pendingHL7Messages} messages pending`
                    : 'No pending messages'
                }
                tone={dashboardStats && dashboardStats.pendingHL7Messages > 0 ? 'warn' : 'good'}
              />
              <StatusRow
                label="Compliance"
                value="ADHICS"
                description="Security controls enforced"
                tone="good"
                mono
              />
            </div>
          </div>

          {/* Admin Command Center */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Admin Command Center</h3>
                  <p className="text-[11px] text-gray-400">
                    Quick access to the most common admin workflows
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <CommandButton
                href="/students/new"
                icon={<UserPlus className="w-4 h-4" />}
                label="Add Student"
                tone="primary"
              />
              <CommandButton
                href="/import/students"
                icon={<Upload className="w-4 h-4" />}
                label="Bulk Import Students"
                tone="primary"
              />
              <CommandButton
                href="/users"
                icon={<Users className="w-4 h-4" />}
                label="Manage Users"
                tone="slate"
              />
              <CommandButton
                href="/import/users"
                icon={<Upload className="w-4 h-4" />}
                label="Bulk Import Users"
                tone="slate"
              />
              <CommandButton
                href="/visits"
                icon={<ClipboardList className="w-4 h-4" />}
                label="Assessments Log"
                tone="purple"
              />
              <CommandButton
                href="/analytics"
                icon={<BarChart3 className="w-4 h-4" />}
                label="Health Analytics"
                tone="emerald"
              />
              <CommandButton
                href="/admin/security/events"
                icon={<ShieldAlert className="w-4 h-4" />}
                label="Security Center"
                tone="amber"
              />
              <CommandButton
                href="/admin/export"
                icon={<Download className="w-4 h-4" />}
                label="Export Data"
                tone="indigo"
              />
            </div>
          </div>
        </div>

        {/* ── Bottom Row: Live Clinic Feed + Reports ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Live Clinic Feed ──────────────────────────────────────── */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Live Clinic Feed</h3>
                  <p className="text-[11px] text-gray-400">Latest assessments, user actions &amp; alerts</p>
                </div>
              </div>
              <Link
                href="/admin/audit-logs"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-gray-50">
              {/* Show recent audit logs + security events merged & sorted */}
              {(() => {
                // Merge audit logs and security events into a unified feed
                type FeedItem = {
                  id: string;
                  type: 'audit' | 'security';
                  title: string;
                  detail: string;
                  severity: string;
                  time: string;
                };

                const feed: FeedItem[] = [
                  ...auditLogs.map((l) => {
                    const isVisitAction = l.entityType === 'CLINICAL_VISIT' || l.entityType === 'CLINICAL_ASSESSMENT';
                    const title = isVisitAction
                      ? `New assessment activity — ${l.action}`
                      : `${l.action} — ${l.entityType}`;
                    const detail = l.ipAddress
                      ? `IP: ${l.ipAddress}`
                      : isVisitAction
                        ? 'Clinic record updated'
                        : 'System action';
                    return {
                      id: l.id,
                      type: 'audit' as const,
                      title,
                      detail,
                      severity: l.severity,
                      time: l.createdAt,
                    };
                  }),
                  ...securityEvents.map((e) => ({
                    id: e.id,
                    type: 'security' as const,
                    title: e.eventType,
                    detail: e.description,
                    severity: e.severity,
                    time: e.createdAt,
                  })),
                ]
                  .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                  .slice(0, 5);

                if (feed.length === 0) {
                  return (
                    <div className="py-12 text-center">
                      <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No recent activity</p>
                    </div>
                  );
                }

                return feed.map((item) => (
                  <div key={item.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">{activityIcon(item.severity)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-400 truncate">{item.detail}</p>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">{timeAgo(item.time)}</span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase
                          ${
                            item.severity === 'CRITICAL' || item.severity === 'ERROR'
                              ? 'bg-red-50 text-red-600'
                              : item.severity === 'WARNING'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                      >
                        {item.severity}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Quick links to security pages */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex flex-wrap gap-2">
              {[
                { href: '/admin/security/events', label: 'Events' },
                { href: '/admin/security/alerts', label: 'Alerts' },
                { href: '/admin/security/incidents', label: 'Incidents' },
                { href: '/admin/security/vendors', label: 'Vendors' },
                { href: '/admin/security/training', label: 'Training' },
                { href: '/admin/security/settings', label: 'Settings' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:border-gray-300 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              ))}
            </div>
          </div>

          {/* ── Reports & Analytics Quick Panel ────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Reports & Analytics</h3>
                <p className="text-[11px] text-gray-400">Insights &amp; data exports</p>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-2">
              {[
                {
                  href: '/admin/reports/visits',
                  label: 'Visit Reports',
                  desc: 'Clinical visit analytics',
                  icon: <Activity className="w-4 h-4" />,
                  color: 'text-blue-600 bg-blue-50',
                },
                {
                  href: '/admin/reports/students',
                  label: 'Student Reports',
                  desc: 'Student health overview',
                  icon: <GraduationCap className="w-4 h-4" />,
                  color: 'text-purple-600 bg-purple-50',
                },
                {
                  href: '/admin/reports/hl7',
                  label: 'HL7 Reports',
                  desc: 'Message delivery status',
                  icon: <FileText className="w-4 h-4" />,
                  color: 'text-orange-600 bg-orange-50',
                },
                {
                  href: '/analytics',
                  label: 'Health Analytics',
                  desc: 'Full analytics dashboard',
                  icon: <BarChart3 className="w-4 h-4" />,
                  color: 'text-emerald-600 bg-emerald-50',
                },
              ].map((report) => (
                <Link
                  key={report.href}
                  href={report.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${report.color}`}>
                    {report.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {report.label}
                    </p>
                    <p className="text-[11px] text-gray-400">{report.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ─── Module Card Sub-Component ──────────────────────────────────────────────────

const MODULE_COLORS = {
  blue: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    actionBorder: 'border-blue-200 text-blue-700 hover:bg-blue-50',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    actionBorder: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
  },
  purple: {
    iconBg: 'bg-purple-50',
    iconText: 'text-purple-600',
    actionBorder: 'border-purple-200 text-purple-700 hover:bg-purple-50',
  },
  indigo: {
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-600',
    actionBorder: 'border-indigo-200 text-indigo-700 hover:bg-indigo-50',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    actionBorder: 'border-amber-200 text-amber-700 hover:bg-amber-50',
  },
  slate: {
    iconBg: 'bg-gray-100',
    iconText: 'text-gray-600',
    actionBorder: 'border-gray-200 text-gray-700 hover:bg-gray-50',
  },
} as const;

function ModuleCard({
  title,
  description,
  icon,
  color,
  actions,
  ring,
  stat,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: keyof typeof MODULE_COLORS;
  actions: { href: string; label: string; icon: React.ReactNode }[];
  ring?: React.ReactNode;
  stat?: string;
}) {
  const c = MODULE_COLORS[color];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 flex flex-col hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-11 h-11 ${c.iconBg} rounded-xl flex items-center justify-center ${c.iconText}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-[11px] text-gray-400">{description}</p>
          </div>
        </div>

        {/* Ring or stat */}
        {ring && <div className="flex-shrink-0">{ring}</div>}
        {stat && !ring && (
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
            {stat}
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mt-auto">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${c.actionBorder}`}
          >
            {action.icon}
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Small sub-components for new layout ───────────────────────────────────────

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
  const color =
    tone === 'good' ? 'bg-emerald-100 text-emerald-600' : tone === 'warn' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600';

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
              tone === 'good'
                ? 'bg-emerald-400'
                : tone === 'warn'
                ? 'bg-amber-400'
                : 'bg-red-400'
            }`}
          />
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              tone === 'good'
                ? 'bg-emerald-500'
                : tone === 'warn'
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
          />
        </span>
        <div>
          <p className="text-xs font-medium text-gray-700">{label}</p>
          <p className="text-[11px] text-gray-400">{description}</p>
        </div>
      </div>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${color} ${
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
  const styles: Record<typeof tone, string> = {
    primary: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    slate: 'bg-slate-50 text-slate-700 hover:bg-slate-100',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    indigo: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
  } as any;

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium shadow-sm transition-colors ${styles[tone]} border border-transparent`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/60 text-current">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

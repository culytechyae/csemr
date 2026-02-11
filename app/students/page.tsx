'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronDown,
  X,
  GraduationCap,
  Activity,
  ClipboardCheck,
  AlertTriangle,
  ShieldCheck,
  Pill,
  Heart,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  Building2,
  BookOpen,
  Home,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  grade: string | null;
  homeroom: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  medications?: string | null;
  school: {
    id: string;
    name: string;
    code: string;
  };
}

interface School {
  id: string;
  name: string;
  code: string;
}

interface DashboardStats {
  totalStudents: number;
  visitsToday: number;
}

type SortField = 'name' | 'grade' | 'school' | 'status';
type SortDir = 'asc' | 'desc';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(first: string, last: string) {
  return `${(first?.[0] ?? '').toUpperCase()}${(last?.[0] ?? '').toUpperCase()}`;
}

function avatarGradient(name: string) {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600',
    'from-violet-400 to-violet-600',
    'from-amber-400 to-amber-600',
    'from-rose-400 to-rose-600',
    'from-cyan-400 to-cyan-600',
    'from-indigo-400 to-indigo-600',
    'from-teal-400 to-teal-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

type HealthStatus = 'cleared' | 'allergy' | 'chronic' | 'medication';

function getHealthStatuses(student: Student): { status: HealthStatus; label: string }[] {
  const statuses: { status: HealthStatus; label: string }[] = [];

  const hasAllergy = student.allergies && student.allergies.trim() !== '' && student.allergies.toLowerCase() !== 'none';
  const hasChronic = student.chronicConditions && student.chronicConditions.trim() !== '' && student.chronicConditions.toLowerCase() !== 'none';
  const hasMeds = student.medications && student.medications.trim() !== '' && student.medications.toLowerCase() !== 'none';

  if (hasAllergy) statuses.push({ status: 'allergy', label: 'Allergy' });
  if (hasChronic) statuses.push({ status: 'chronic', label: 'Chronic' });
  if (hasMeds) statuses.push({ status: 'medication', label: 'On Medication' });
  if (statuses.length === 0) statuses.push({ status: 'cleared', label: 'Cleared' });

  return statuses;
}

const STATUS_STYLES: Record<HealthStatus, { bg: string; text: string; dot: string; icon: React.ReactNode }> = {
  cleared: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
    icon: <ShieldCheck className="w-3 h-3" />,
  },
  allergy: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  chronic: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    icon: <Heart className="w-3 h-3" />,
  },
  medication: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
    icon: <Pill className="w-3 h-3" />,
  },
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const router = useRouter();

  // Data
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterHomeroom, setFilterHomeroom] = useState('');

  // Sorting
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'name', dir: 'asc' });

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchStudents = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filterGrade) params.append('grade', filterGrade);
    if (filterHomeroom) params.append('homeroom', filterHomeroom);
    if (filterSchool && userRole === 'ADMIN') params.append('schoolId', filterSchool);

    fetch(`/api/students?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, filterGrade, filterHomeroom, filterSchool, userRole]);

  useEffect(() => {
    // Auth
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUserRole(d.user.role);
          if (d.user.role === 'ADMIN') {
            fetch('/api/schools')
              .then((r) => r.json())
              .then((s) => setSchools(Array.isArray(s) ? s : []));
          }
        }
      });

    // Dashboard stats for Quick Stats
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((d) => setDashStats(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const grades = useMemo(
    () => [...new Set(students.map((s) => s.grade).filter(Boolean))].sort() as string[],
    [students]
  );

  const homerooms = useMemo(
    () => [...new Set(students.map((s) => s.homeroom).filter(Boolean))].sort() as string[],
    [students]
  );

  const pendingHealthCount = useMemo(
    () =>
      students.filter((s) => {
        const hasAllergy = s.allergies && s.allergies.trim() !== '' && s.allergies.toLowerCase() !== 'none';
        const hasChronic = s.chronicConditions && s.chronicConditions.trim() !== '' && s.chronicConditions.toLowerCase() !== 'none';
        return hasAllergy || hasChronic;
      }).length,
    [students]
  );

  const hasActiveFilters = filterGrade || filterHomeroom || filterSchool;

  // ── Sorted data ───────────────────────────────────────────────────────────

  const sortedStudents = useMemo(() => {
    const arr = [...students];
    const dir = sort.dir === 'asc' ? 1 : -1;

    switch (sort.field) {
      case 'name':
        arr.sort((a, b) => dir * `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
        break;
      case 'grade':
        arr.sort((a, b) => dir * (a.grade ?? '').localeCompare(b.grade ?? ''));
        break;
      case 'school':
        arr.sort((a, b) => dir * a.school.name.localeCompare(b.school.name));
        break;
      case 'status': {
        const pri = (s: Student) => {
          const statuses = getHealthStatuses(s);
          if (statuses.some((x) => x.status === 'allergy')) return 0;
          if (statuses.some((x) => x.status === 'chronic')) return 1;
          if (statuses.some((x) => x.status === 'medication')) return 2;
          return 3;
        };
        arr.sort((a, b) => dir * (pri(a) - pri(b)));
        break;
      }
    }
    return arr;
  }, [students, sort]);

  const handleColumnSort = (field: SortField) => {
    setSort((prev) => (prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }));
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sort.dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />;
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading students…</span>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="space-y-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Students</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage student records and medical information</p>
          </div>
        </div>

        {/* ── Quick Stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Students */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4 flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">
                {dashStats?.totalStudents ?? students.length}
              </p>
            </div>
          </div>

          {/* Clinic Visits Today */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4 flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Clinic Visits Today</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{dashStats?.visitsToday ?? 0}</p>
            </div>
          </div>

          {/* Pending Health Updates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4 flex items-center gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${pendingHealthCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Health Flags</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{pendingHealthCount}</p>
              <p className="text-[11px] text-gray-400">{pendingHealthCount > 0 ? 'Students with allergies / chronic conditions' : 'All clear'}</p>
            </div>
          </div>
        </div>

        {/* ── Filter Bar ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {/* School */}
          {userRole === 'ADMIN' && (
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
              >
                <option value="">All Schools</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Grade */}
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
            >
              <option value="">All Grades</option>
              {grades.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Homeroom */}
          <div className="relative">
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filterHomeroom}
              onChange={(e) => setFilterHomeroom(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
            >
              <option value="">All Homerooms</option>
              {homerooms.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setFilterSchool('');
                setFilterGrade('');
                setFilterHomeroom('');
              }}
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
        </div>

        {/* ── Data Grid ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th
                    onClick={() => handleColumnSort('name')}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1.5">Student <SortIcon field="name" /></span>
                  </th>
                  <th
                    onClick={() => handleColumnSort('grade')}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1.5">Details <SortIcon field="grade" /></span>
                  </th>
                  <th
                    onClick={() => handleColumnSort('school')}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1.5">School <SortIcon field="school" /></span>
                  </th>
                  <th
                    onClick={() => handleColumnSort('status')}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors"
                  >
                    <span className="inline-flex items-center gap-1.5">Health Status <SortIcon field="status" /></span>
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <GraduationCap className="w-10 h-10 text-gray-300" />
                        <p className="text-gray-500 font-medium">No students found</p>
                        <p className="text-gray-400 text-xs">Try adjusting your filters or search query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedStudents.map((student) => {
                    const statuses = getHealthStatuses(student);
                    const fullName = `${student.firstName} ${student.lastName}`;

                    return (
                      <tr
                        key={student.id}
                        onClick={() => router.push(`/students/${student.id}`)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* Student */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(fullName)} flex items-center justify-center text-xs font-bold text-white shadow-sm`}
                            >
                              {getInitials(student.firstName, student.lastName)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {fullName}
                              </p>
                              <p className="text-xs text-gray-400 truncate">ID: {student.studentId}</p>
                            </div>
                          </div>
                        </td>

                        {/* Details */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col">
                            {student.grade && (
                              <span className="text-sm text-gray-700">Grade {student.grade}</span>
                            )}
                            {student.homeroom && (
                              <span className="text-xs text-gray-400">{student.homeroom}</span>
                            )}
                            {!student.grade && !student.homeroom && (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                        </td>

                        {/* School */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm text-gray-600 truncate">
                            {student.school.name}
                          </span>
                        </td>

                        {/* Health Status */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1.5">
                            {statuses.map((s, i) => {
                              const style = STATUS_STYLES[s.status];
                              return (
                                <span
                                  key={i}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${style.bg} ${style.text}`}
                                >
                                  {style.icon}
                                  {s.label}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/visits/new?studentId=${student.id}&schoolId=${student.school.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              Assessment
                            </Link>
                            <Link
                              href={`/students/${student.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Profile
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {sortedStudents.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-700">{sortedStudents.length}</span> students
              </p>
              {search && (
                <p className="text-xs text-gray-400">
                  Filtered by &quot;{search}&quot;
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

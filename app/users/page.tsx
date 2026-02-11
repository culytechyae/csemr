'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Pencil,
  UserX,
  UserCheck,
  Users,
  ShieldCheck,
  Stethoscope,
  HeadsetIcon,
  Building2,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: string | null;
  isActive: boolean;
  createdAt?: string;
  school?: {
    name: string;
    code: string;
  };
}

interface School {
  id: string;
  name: string;
  code: string;
}

type TabKey = 'all' | 'admin' | 'medical' | 'support';
type SortField = 'name' | 'newest' | 'role';
type SortDir = 'asc' | 'desc';
type ColumnSortField = 'name' | 'role' | 'school' | 'status';

// ─── Constants ──────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ReactNode; roles: string[] }[] = [
  { key: 'all', label: 'All Users', icon: <Users className="w-4 h-4" />, roles: [] },
  { key: 'admin', label: 'Administrators', icon: <ShieldCheck className="w-4 h-4" />, roles: ['ADMIN', 'CLINIC_MANAGER'] },
  { key: 'medical', label: 'Medical Staff', icon: <Stethoscope className="w-4 h-4" />, roles: ['DOCTOR', 'NURSE'] },
  { key: 'support', label: 'Support', icon: <HeadsetIcon className="w-4 h-4" />, roles: ['STAFF'] },
];

const ROLE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  ADMIN: { bg: 'bg-red-50', text: 'text-red-700', label: 'Admin' },
  CLINIC_MANAGER: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Clinic Manager' },
  DOCTOR: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Doctor' },
  NURSE: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Nurse' },
  STAFF: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Staff' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(first: string, last: string) {
  return `${(first?.[0] ?? '').toUpperCase()}${(last?.[0] ?? '').toUpperCase()}`;
}

function avatarColor(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700',
    CLINIC_MANAGER: 'bg-blue-100 text-blue-700',
    DOCTOR: 'bg-emerald-100 text-emerald-700',
    NURSE: 'bg-purple-100 text-purple-700',
    STAFF: 'bg-amber-100 text-amber-700',
  };
  return map[role] ?? 'bg-gray-100 text-gray-700';
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function UsersPage() {
  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState('');

  // Filters
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [showDeactivated, setShowDeactivated] = useState(false);

  // Column sorting
  const [columnSort, setColumnSort] = useState<{ field: ColumnSortField; dir: SortDir }>({
    field: 'name',
    dir: 'asc',
  });

  // Action menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchUsers = useCallback(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUserRole(data.user.role);
      });

    fetch('/api/schools')
      .then((res) => res.json())
      .then((data) => {
        setSchools(Array.isArray(data) ? data : []);
      });

    fetchUsers();
  }, [fetchUsers]);

  // Close action menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      if (res.ok) fetchUsers();
      else {
        const err = await res.json();
        alert(err.error || 'Failed to deactivate user');
      }
    } catch {
      alert('An error occurred');
    }
    setOpenMenuId(null);
  };

  const handleActivate = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      if (res.ok) fetchUsers();
      else {
        const err = await res.json();
        alert(err.error || 'Failed to activate user');
      }
    } catch {
      alert('An error occurred');
    }
    setOpenMenuId(null);
  };

  // ── Column sort handler ───────────────────────────────────────────────────

  const handleColumnSort = (field: ColumnSortField) => {
    setColumnSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'asc' }
    );
  };

  // ── Filtered + sorted data ────────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Tab filter
    const tab = TABS.find((t) => t.key === activeTab);
    if (tab && tab.roles.length > 0) {
      result = result.filter((u) => tab.roles.includes(u.role));
    }

    // Show deactivated toggle
    if (!showDeactivated) {
      result = result.filter((u) => u.isActive);
    }

    // School filter
    if (schoolFilter) {
      result = result.filter((u) => u.schoolId === schoolFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.school?.name ?? '').toLowerCase().includes(q)
      );
    }

    // Sort by dropdown
    if (sortField === 'name') {
      result.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
    } else if (sortField === 'newest') {
      result.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    } else if (sortField === 'role') {
      result.sort((a, b) => a.role.localeCompare(b.role));
    }

    // Column sort override
    const dir = columnSort.dir === 'asc' ? 1 : -1;
    switch (columnSort.field) {
      case 'name':
        result.sort((a, b) => dir * `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
        break;
      case 'role':
        result.sort((a, b) => dir * a.role.localeCompare(b.role));
        break;
      case 'school':
        result.sort((a, b) => dir * (a.school?.name ?? '').localeCompare(b.school?.name ?? ''));
        break;
      case 'status':
        result.sort((a, b) => dir * (Number(b.isActive) - Number(a.isActive)));
        break;
    }

    return result;
  }, [users, activeTab, showDeactivated, schoolFilter, searchQuery, sortField, columnSort]);

  // ── Tab counts ────────────────────────────────────────────────────────────

  const tabCounts = useMemo(() => {
    const base = showDeactivated ? users : users.filter((u) => u.isActive);
    return {
      all: base.length,
      admin: base.filter((u) => ['ADMIN', 'CLINIC_MANAGER'].includes(u.role)).length,
      medical: base.filter((u) => ['DOCTOR', 'NURSE'].includes(u.role)).length,
      support: base.filter((u) => u.role === 'STAFF').length,
    };
  }, [users, showDeactivated]);

  // ── Sort icon helper ──────────────────────────────────────────────────────

  const SortIcon = ({ field }: { field: ColumnSortField }) => {
    if (columnSort.field !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return columnSort.dir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading users…</span>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="space-y-5">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Users</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage system users and access permissions
            </p>
          </div>
          {(currentUserRole === 'ADMIN' || currentUserRole === 'CLINIC_MANAGER') && (
            <Link
              href="/users/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span className="text-lg leading-none">+</span>
              Add User
            </Link>
          )}
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6" aria-label="User category tabs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    group inline-flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors
                    ${
                      isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                  <span
                    className={`
                      ml-1 rounded-full px-2 py-0.5 text-xs font-semibold
                      ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}
                    `}
                  >
                    {tabCounts[tab.key]}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Filter / Sort Bar ──────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search users…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {/* School filter */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
            >
              <option value="">All Schools</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort by */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="appearance-none pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
            >
              <option value="name">Name A–Z</option>
              <option value="newest">Newest Joined</option>
              <option value="role">Role</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Show Deactivated toggle */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600">
            <button
              role="switch"
              aria-checked={showDeactivated}
              onClick={() => setShowDeactivated(!showDeactivated)}
              className={`
                relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200
                ${showDeactivated ? 'bg-blue-600' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200
                  ${showDeactivated ? 'translate-x-[18px]' : 'translate-x-[3px]'}
                `}
              />
            </button>
            Show Deactivated
          </label>
        </div>

        {/* ── Data Table ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {([
                    { field: 'name' as ColumnSortField, label: 'User' },
                    { field: 'role' as ColumnSortField, label: 'Role' },
                    { field: 'school' as ColumnSortField, label: 'Assigned School' },
                    { field: 'status' as ColumnSortField, label: 'Status' },
                  ]).map((col) => (
                    <th
                      key={col.field}
                      onClick={() => handleColumnSort(col.field)}
                      className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {col.label}
                        <SortIcon field={col.field} />
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-10 h-10 text-gray-300" />
                        <p className="text-gray-500 font-medium">No users found</p>
                        <p className="text-gray-400 text-xs">Try adjusting your filters or search query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const badge = ROLE_BADGE[user.role] ?? {
                      bg: 'bg-gray-50',
                      text: 'text-gray-600',
                      label: user.role,
                    };
                    const isMenuOpen = openMenuId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        {/* User */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor(
                                user.role
                              )}`}
                            >
                              {getInitials(user.firstName, user.lastName)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* School */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">
                          {user.school ? (
                            <span className="truncate">
                              {user.school.name}{' '}
                              <span className="text-gray-400 text-xs">({user.school.code})</span>
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          {(currentUserRole === 'ADMIN' || currentUserRole === 'CLINIC_MANAGER') && (
                            <div className="relative inline-block" ref={isMenuOpen ? menuRef : undefined}>
                              <button
                                onClick={() => setOpenMenuId(isMenuOpen ? null : user.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="User actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {isMenuOpen && (
                                <div className="absolute right-0 z-20 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-in fade-in zoom-in-95 duration-100">
                                  <Link
                                    href={`/users/${user.id}/edit`}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit
                                  </Link>
                                  {user.isActive ? (
                                    <button
                                      onClick={() => handleDeactivate(user.id)}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <UserX className="w-3.5 h-3.5" />
                                      Deactivate
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleActivate(user.id)}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      Activate
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filteredUsers.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-700">{filteredUsers.length}</span> of{' '}
                <span className="font-semibold text-gray-700">{users.length}</span> users
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

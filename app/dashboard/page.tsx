'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';

interface DashboardStats {
  totalSchools: number;
  totalStudents: number;
  totalVisits: number;
  visitsToday: number;
  pendingHL7Messages: number;
  recentVisits: any[];
}

interface CurrentUser {
  id: string;
  role: 'ADMIN' | 'CLINIC_MANAGER' | 'NURSE' | 'DOCTOR' | 'STAFF';
  schoolId?: string | null;
  firstName: string;
  lastName: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, meRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/auth/me'),
        ]);

        const statsData = await statsRes.json();
        const meData = await meRes.json();

        setStats(statsData);
        if (meData.user) {
          setUser(meData.user);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  const isAdmin = user?.role === 'ADMIN';
  const isSchoolAdmin = user?.role === 'CLINIC_MANAGER';

  return (
    <Layout>
      <div>
        {isAdmin && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Admin Access Available</p>
                <p className="text-sm text-blue-700">Use the Admin link in the sidebar to access the admin dashboard</p>
              </div>
              <Link
                href="/admin"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Go to Admin Dashboard
              </Link>
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isAdmin ? 'Admin Dashboard' : isSchoolAdmin ? 'School Admin Dashboard' : 'Dashboard'}
        </h1>
        <p className="text-gray-600 mb-6">
          {isAdmin
            ? 'Manage all schools, users, and bulk data operations.'
            : isSchoolAdmin
              ? 'Manage your assigned school, users, and student records.'
              : 'Overview of school clinic operations.'}
        </p>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Schools */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Schools</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalSchools || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Students */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Assessments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Assessments</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalVisits || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Pending Referrals / HL7 Messages */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Referrals</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.pendingHL7Messages || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Admin / School Admin Actions */}
        {(isAdmin || isSchoolAdmin) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Students Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Students Management</h2>
              <p className="text-sm text-gray-600 mb-4">
                Add individual students or upload bulk CSV files for the current academic year.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/students/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  + Add Student
                </Link>
                <Link
                  href="/import/students"
                  className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm"
                >
                  📥 Bulk Import Students
                </Link>
              </div>
            </div>

            {/* Users Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Users & Access</h2>
              <p className="text-sm text-gray-600 mb-4">
                Manage school-based admin users and clinic staff with role-based access.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/users"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  👤 Manage Users
                </Link>
                <Link
                  href="/import/users"
                  className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm"
                >
                  📥 Bulk Import Users
                </Link>
              </div>
            </div>

            {/* School Context (for school admins) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">School Scope</h2>
              <p className="text-sm text-gray-600 mb-2">
                {isAdmin
                  ? 'You have access to all 12 schools.'
                  : 'All operations are automatically limited to your assigned school.'}
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Clinical managers can only see and modify their own school data.</li>
                <li>Bulk import APIs enforce school restrictions on the server.</li>
                <li>Visits, students, users, and HL7 messages are filtered by school.</li>
              </ul>
            </div>
          </div>
        )}

        {/* System Information and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Integration</span>
                <span className="text-sm font-medium text-gray-900">Malaffi (ADHDS)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">HL7 Version</span>
                <span className="text-sm font-medium text-gray-900">2.5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Compliance</span>
                <span className="text-sm font-medium text-green-600">ADHICS Compliant</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Message Types</span>
                <span className="text-sm font-medium text-gray-900">ADT, ORU, PPR</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">Activity logs will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

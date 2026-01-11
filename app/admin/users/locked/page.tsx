'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

interface LockedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  failedLoginAttempts: number;
  lockedUntil: string;
}

export default function LockedAccountsPage() {
  const [users, setUsers] = useState<LockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLockedUsers();
  }, []);

  const fetchLockedUsers = async () => {
    try {
      // Fetch all users and filter locked ones
      const res = await fetch('/api/users');
      const data = await res.json();
      const locked = data.filter((u: any) => u.lockedUntil && new Date(u.lockedUntil) > new Date());
      setUsers(locked);
    } catch (error) {
      console.error('Error fetching locked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockUser = async (userId: string) => {
    if (!confirm('Are you sure you want to unlock this account?')) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/unlock`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchLockedUsers();
        alert('Account unlocked successfully');
      } else {
        alert('Failed to unlock account');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Locked Accounts</h1>
            <p className="text-gray-600">Manage accounts that have been locked due to failed login attempts</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Admin
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Failed Attempts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locked Until</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {user.failedLoginAttempts}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.lockedUntil).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => unlockUser(user.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Unlock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">No locked accounts found</div>
          )}
        </div>
      </div>
    </Layout>
  );
}


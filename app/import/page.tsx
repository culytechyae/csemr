'use client';

import Layout from '@/components/Layout';
import Link from 'next/link';

export default function ImportPage() {
  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Import</h1>
        <p className="text-gray-600 mb-6">Import data from CSV files. Existing records will be updated.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import Students */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Import Students</h2>
                <p className="text-sm text-gray-500">Bulk import students with academic year</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Import students from CSV file. Supports upsert - existing students will be updated based on studentId and academicYear.
            </p>
            <Link
              href="/import/students"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Import Students
            </Link>
          </div>

          {/* Import Users */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Import Users</h2>
                <p className="text-sm text-gray-500">Bulk import system users</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Import users from CSV file. Supports upsert - existing users will be updated based on email.
            </p>
            <Link
              href="/import/users"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Import Users
            </Link>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Important Notes</h3>
          <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
            <li>CSV files must have headers in the first row</li>
            <li>Existing records will be updated (upsert functionality)</li>
            <li>Students are identified by studentId + academicYear combination</li>
            <li>Users are identified by email address</li>
            <li>Non-admin users can only import data for their assigned school</li>
            <li>Academic year must be specified for student imports (e.g., "2024-2025")</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}


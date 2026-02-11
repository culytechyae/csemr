'use client';

import Layout from '@/components/Layout';
import Link from 'next/link';

export default function ImportPage() {
  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Import</h1>
        <p className="text-gray-600 mb-6">Import data from CSV files. Existing records will be updated.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Import Visits */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🏥</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Import Visits</h2>
                <p className="text-sm text-gray-500">Bulk import backdated clinical visits</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Import backdated clinical visits from CSV or Excel file. Visits are linked to students by student number and will appear in their visit history.
            </p>
            <Link
              href="/import/visits"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Import Visits
            </Link>
          </div>

          {/* Import Assessments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Import Assessments</h2>
                <p className="text-sm text-gray-500">Bulk import backdated clinical assessments</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Import backdated clinical assessments from CSV or Excel file. Assessments are linked to visits by matching student number and date/time. Visits must be imported first.
            </p>
            <Link
              href="/import/assessments"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Import Assessments
            </Link>
          </div>

          {/* Import Health Records */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🩺</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Import Health Records</h2>
                <p className="text-sm text-gray-500">Bulk import physical measurements & vision data</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Import student health records including height, weight, BMI (auto-calculated), color blindness, vision testing, corrective lenses, and eye acuity from CSV or Excel files.
            </p>
            <Link
              href="/import/health-records"
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Import Health Records
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
            <li>Visits are linked to students by student number (ESIS No. / STUDENT No.)</li>
            <li>Assessments are linked to visits - import visits first, then assessments</li>
            <li>Non-admin users can only import data for their assigned school</li>
            <li>Academic year must be specified for student imports (e.g., "2024-2025")</li>
            <li>Visit dates should be in DD/MM/YYYY format (e.g., 01/05/2026)</li>
            <li>Assessment dates must match existing visit dates (within 1 hour window)</li>
            <li>Health records are matched by student number — existing records will be updated</li>
            <li>BMI is automatically calculated when height and weight are provided</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}


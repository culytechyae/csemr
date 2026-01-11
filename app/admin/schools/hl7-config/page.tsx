'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

interface School {
  id: string;
  name: string;
  code: string;
}

export default function SchoolsHL7ConfigPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/schools')
      .then((res) => res.json())
      .then((data) => {
        setSchools(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Admin', href: '/admin' },
            { label: 'HL7 Configuration' },
          ]}
        />
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">HL7 Configuration - All Schools</h1>
            <p className="text-gray-600">
              Configure HL7 message settings for each school. Each school can have independent HL7 settings.
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Admin
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Select a School to Configure</h2>
            <p className="text-sm text-gray-600 mt-1">
              Click on a school to configure its HL7 settings including facility codes, doctor IDs, and message types.
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {schools.map((school) => (
              <Link
                key={school.id}
                href={`/schools/${school.id}#hl7-config`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{school.name}</h3>
                      <p className="text-sm text-gray-500">Code: {school.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-blue-600">
                    <span className="text-sm font-medium mr-2">Configure HL7</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {schools.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No schools found. <Link href="/schools/new" className="text-blue-600 hover:underline">Create a school</Link> first.</p>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Quick Access Links</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Direct Link Format:</strong> <code className="bg-blue-100 px-2 py-1 rounded">http://localhost:5005/schools/[SCHOOL_ID]</code></p>
            <p className="mt-2">To find a school ID:</p>
            <ol className="list-decimal list-inside ml-2 space-y-1">
              <li>Go to <Link href="/schools" className="underline">Schools List</Link></li>
              <li>Click "Edit" on any school</li>
              <li>The URL will show the school ID: <code className="bg-blue-100 px-2 py-1 rounded">/schools/[ID]</code></li>
              <li>Scroll down to the "HL7 Configuration" section (Admin only)</li>
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
}


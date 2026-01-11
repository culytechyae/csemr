'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

interface Visit {
  id: string;
  visitDate: string;
  visitType: string;
  chiefComplaint?: string;
  diagnosis?: string;
  student: {
    firstName: string;
    lastName: string;
    studentId: string;
  };
  school: {
    name: string;
  };
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/visits')
      .then((res) => res.json())
      .then((data) => {
        setVisits(data);
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
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment</h1>
            <p className="text-gray-600">Record and manage clinical visit assessments</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {visits.map((visit) => (
              <li key={visit.id}>
                <Link href={`/visits/${visit.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {visit.student.firstName} {visit.student.lastName} ({visit.student.studentId})
                        </div>
                        <div className="text-sm text-gray-500">
                          {visit.school.name} • {new Date(visit.visitDate).toLocaleString()}
                        </div>
                        {visit.chiefComplaint && (
                          <div className="text-sm text-gray-600 mt-1">
                            Complaint: {visit.chiefComplaint}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {visit.visitType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {visits.length === 0 && (
            <div className="text-center py-12 text-gray-500">No visits found</div>
          )}
        </div>
      </div>
    </Layout>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Link from 'next/link';

interface HealthRecord {
  id: string;
  height?: number;
  weight?: number;
  bmi?: number;
  colorBlindness?: string;
  visionTestingPerformed?: boolean;
  visionTestingNotPerformedReason?: string;
  correctiveLenses?: string;
  correctiveLensesOtherReason?: string;
  rightEye?: string;
  leftEye?: string;
  rightEyeWithCorrection?: string;
  leftEyeWithCorrection?: string;
  visionScreeningResult?: string;
  recordedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
  };
  school: {
    name: string;
    code: string;
  };
  recorder: {
    firstName: string;
    lastName: string;
  };
}

export default function HealthRecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const recordId = params?.id as string;
    if (recordId) {
      fetch(`/api/health-records/${recordId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch health record: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.error) {
            console.error('API error:', data.error);
            setLoading(false);
            return;
          }
          setRecord(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Health record fetch error:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [params]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  if (!record) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Health record not found</p>
          <Link href="/health-records" className="text-blue-600 hover:text-blue-800">
            Back to Health Records
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Health Record Details</h1>
              <p className="text-gray-600 mt-1">{formatDate(record.recordedAt)}</p>
            </div>
            <Link
              href="/health-records"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Health Records
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Student Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Student</label>
                <p className="mt-1 text-sm text-gray-900">
                  {record.student.firstName} {record.student.lastName} ({record.student.studentId})
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">School</label>
                <p className="mt-1 text-sm text-gray-900">{record.school.name}</p>
              </div>
            </div>
          </div>

          {/* Physical Measurements */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Physical Measurements</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Height</label>
                <p className="mt-1 text-sm text-gray-900">{record.height ? `${record.height} cm` : 'Not recorded'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Weight</label>
                <p className="mt-1 text-sm text-gray-900">{record.weight ? `${record.weight} kg` : 'Not recorded'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">BMI</label>
                <p className="mt-1 text-sm text-gray-900">{record.bmi ? record.bmi.toFixed(1) : 'Not calculated'}</p>
              </div>
            </div>
          </div>

          {/* Vision Testing */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vision Testing</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Color Blindness</label>
                  <p className="mt-1 text-sm text-gray-900">{record.colorBlindness || 'Not recorded'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Vision Testing Performed</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {record.visionTestingPerformed === true ? 'Yes' : record.visionTestingPerformed === false ? 'No' : 'Not recorded'}
                  </p>
                </div>
              </div>

              {record.visionTestingPerformed === false && record.visionTestingNotPerformedReason && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Reason Not Performed</label>
                  <p className="mt-1 text-sm text-gray-900">{record.visionTestingNotPerformedReason}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Corrective Lenses</label>
                <p className="mt-1 text-sm text-gray-900">{record.correctiveLenses || 'Not recorded'}</p>
                {record.correctiveLenses === 'Other' && record.correctiveLensesOtherReason && (
                  <p className="mt-1 text-sm text-gray-600">Reason: {record.correctiveLensesOtherReason}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Right Eye</label>
                  <p className="mt-1 text-sm text-gray-900">{record.rightEye || 'Not recorded'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Left Eye</label>
                  <p className="mt-1 text-sm text-gray-900">{record.leftEye || 'Not recorded'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Right Eye (with Correction)</label>
                  <p className="mt-1 text-sm text-gray-900">{record.rightEyeWithCorrection || 'Not recorded'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Left Eye (with Correction)</label>
                  <p className="mt-1 text-sm text-gray-900">{record.leftEyeWithCorrection || 'Not recorded'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Vision Screening Result</label>
                <p className="mt-1">
                  {record.visionScreeningResult ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.visionScreeningResult === 'Normal' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.visionScreeningResult}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Not recorded</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Recorded By */}
          <div className="border-t border-gray-200 pt-6">
            <div className="text-sm text-gray-500">
              Recorded by: {record.recorder.firstName} {record.recorder.lastName} on {formatDate(record.recordedAt)}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


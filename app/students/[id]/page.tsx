'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';

interface StudentSummary {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    dateOfBirth: string;
    gender: string;
    nationality?: string;
    bloodType: string;
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    emergencyContact: string;
    emergencyPhone: string;
    address?: string;
    allergies?: string;
    chronicConditions?: string;
    medications?: string;
    academicYear: string;
    school: {
      id: string;
      name: string;
      code: string;
    };
    visits: Visit[];
  };
  statistics: {
    totalVisits: number;
    visitsWithAssessment: number;
    age: number;
    ageInMonths: number;
    visitTypeCounts: Record<string, number>;
  };
  latestAssessment?: {
    temperature?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    height?: number;
    weight?: number;
    bmi?: number;
    createdAt: string;
  };
  recentDiagnoses: Array<{
    diagnosis: string;
    date: string;
    visitType: string;
  }>;
  healthSummary: {
    allergies: string;
    chronicConditions: string;
    medications: string;
  };
}

interface Visit {
  id: string;
  visitDate: string;
  visitType: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  assessment?: {
    temperature?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    height?: number;
    weight?: number;
    bmi?: number;
  };
  creator: {
    firstName: string;
    lastName: string;
  };
}

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentId = params?.id as string;
    if (studentId) {
      fetch(`/api/students/${studentId}/summary`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch student: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.error) {
            console.error('API error:', data.error);
            setLoading(false);
            return;
          }
          setSummary(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Student fetch error:', err);
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
      day: 'numeric' 
    });
  };

  const formatVisitType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatBloodType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  if (!summary) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Student not found</p>
          <Link href="/students" className="text-blue-600 hover:text-blue-800">
            Back to Students
          </Link>
        </div>
      </Layout>
    );
  }

  const { student, statistics, latestAssessment, recentDiagnoses, healthSummary } = summary;

  return (
    <Layout>
      <div className="max-w-7xl">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Students', href: '/students' },
            { label: `${student.firstName} ${student.lastName}` },
          ]}
        />
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-gray-600 mt-1">
                Student ID: {student.studentId} | {student.school.name}
              </p>
            </div>
            <Link
              href={`/visits/new?studentId=${student.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              New Visit
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Student Info & Health Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Student Information Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Date of Birth:</span>
                  <span className="ml-2 text-gray-900">{formatDate(student.dateOfBirth)}</span>
                  <span className="ml-2 text-gray-500">({statistics.age} years, {statistics.ageInMonths} months)</span>
                </div>
                <div>
                  <span className="text-gray-600">Gender:</span>
                  <span className="ml-2 text-gray-900">{student.gender}</span>
                </div>
                {student.nationality && (
                  <div>
                    <span className="text-gray-600">Nationality:</span>
                    <span className="ml-2 text-gray-900">{student.nationality}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Blood Type:</span>
                  <span className="ml-2 text-gray-900">{formatBloodType(student.bloodType)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Academic Year:</span>
                  <span className="ml-2 text-gray-900">{student.academicYear}</span>
                </div>
                {student.address && (
                  <div>
                    <span className="text-gray-600">Address:</span>
                    <span className="ml-2 text-gray-900">{student.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Health Summary Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Summary</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600 font-medium">Allergies:</span>
                  <p className="mt-1 text-gray-900">{healthSummary.allergies}</p>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Chronic Conditions:</span>
                  <p className="mt-1 text-gray-900">{healthSummary.chronicConditions}</p>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Medications:</span>
                  <p className="mt-1 text-gray-900">{healthSummary.medications}</p>
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Parent:</span>
                  <span className="ml-2 text-gray-900">{student.parentName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Parent Phone:</span>
                  <span className="ml-2 text-gray-900">{student.parentPhone}</span>
                </div>
                {student.parentEmail && (
                  <div>
                    <span className="text-gray-600">Parent Email:</span>
                    <span className="ml-2 text-gray-900">{student.parentEmail}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Emergency Contact:</span>
                  <span className="ml-2 text-gray-900">{student.emergencyContact}</span>
                </div>
                <div>
                  <span className="text-gray-600">Emergency Phone:</span>
                  <span className="ml-2 text-gray-900">{student.emergencyPhone}</span>
                </div>
              </div>
            </div>

            {/* Statistics Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Visits:</span>
                  <span className="font-medium text-gray-900">{statistics.totalVisits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">With Assessment:</span>
                  <span className="font-medium text-gray-900">{statistics.visitsWithAssessment}</span>
                </div>
              </div>
              {Object.keys(statistics.visitTypeCounts).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-2">Visit Types:</p>
                  {Object.entries(statistics.visitTypeCounts).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-xs">
                      <span className="text-gray-600">{formatVisitType(type)}:</span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Latest Vital Signs */}
            {latestAssessment && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Vital Signs</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {latestAssessment.temperature && (
                    <div>
                      <span className="text-gray-600">Temperature:</span>
                      <span className="ml-2 font-medium">{latestAssessment.temperature}°C</span>
                    </div>
                  )}
                  {latestAssessment.bloodPressureSystolic && (
                    <div>
                      <span className="text-gray-600">Blood Pressure:</span>
                      <span className="ml-2 font-medium">
                        {latestAssessment.bloodPressureSystolic}/
                        {latestAssessment.bloodPressureDiastolic || '--'} mmHg
                      </span>
                    </div>
                  )}
                  {latestAssessment.heartRate && (
                    <div>
                      <span className="text-gray-600">Heart Rate:</span>
                      <span className="ml-2 font-medium">{latestAssessment.heartRate} bpm</span>
                    </div>
                  )}
                  {latestAssessment.respiratoryRate && (
                    <div>
                      <span className="text-gray-600">Respiratory Rate:</span>
                      <span className="ml-2 font-medium">{latestAssessment.respiratoryRate} /min</span>
                    </div>
                  )}
                  {latestAssessment.height && (
                    <div>
                      <span className="text-gray-600">Height:</span>
                      <span className="ml-2 font-medium">{latestAssessment.height} cm</span>
                    </div>
                  )}
                  {latestAssessment.weight && (
                    <div>
                      <span className="text-gray-600">Weight:</span>
                      <span className="ml-2 font-medium">{latestAssessment.weight} kg</span>
                    </div>
                  )}
                  {latestAssessment.bmi && (
                    <div>
                      <span className="text-gray-600">BMI:</span>
                      <span className="ml-2 font-medium">{latestAssessment.bmi.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Recorded: {formatDate(latestAssessment.createdAt)}
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Visits History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Visit History</h2>
              {summary.student.visits.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No visits recorded</p>
              ) : (
                <div className="space-y-4">
                  {summary.student.visits.map((visit: Visit) => (
                    <div
                      key={visit.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {formatVisitType(visit.visitType)}
                          </h3>
                          <p className="text-sm text-gray-500">{formatDate(visit.visitDate)}</p>
                        </div>
                        <Link
                          href={`/visits/${visit.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </Link>
                      </div>
                      {visit.chiefComplaint && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-600">Chief Complaint:</span>
                          <p className="text-sm text-gray-900 mt-1">{visit.chiefComplaint}</p>
                        </div>
                      )}
                      {visit.diagnosis && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-600">Diagnosis:</span>
                          <p className="text-sm text-gray-900 mt-1">{visit.diagnosis}</p>
                        </div>
                      )}
                      {visit.assessment && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {visit.assessment.temperature && (
                              <div>
                                <span className="text-gray-600">Temp:</span>
                                <span className="ml-1 font-medium">{visit.assessment.temperature}°C</span>
                              </div>
                            )}
                            {visit.assessment.heartRate && (
                              <div>
                                <span className="text-gray-600">HR:</span>
                                <span className="ml-1 font-medium">{visit.assessment.heartRate} bpm</span>
                              </div>
                            )}
                            {visit.assessment.bloodPressureSystolic && (
                              <div>
                                <span className="text-gray-600">BP:</span>
                                <span className="ml-1 font-medium">
                                  {visit.assessment.bloodPressureSystolic}/
                                  {visit.assessment.bloodPressureDiastolic || '--'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {visit.followUpRequired && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Follow-up Required
                            {visit.followUpDate && ` - ${formatDate(visit.followUpDate)}`}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        By: {visit.creator.firstName} {visit.creator.lastName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


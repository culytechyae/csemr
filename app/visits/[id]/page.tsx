'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

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
    painScale?: number;
    generalAppearance?: string;
    skinCondition?: string;
    eyes?: string;
    ears?: string;
    throat?: string;
    cardiovascular?: string;
    respiratory?: string;
    abdomen?: string;
    neurological?: string;
    otherFindings?: string;
  };
  creator: {
    firstName: string;
    lastName: string;
  };
}

export default function VisitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const visitId = params?.id as string;
    if (visitId) {
      fetch(`/api/visits/${visitId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch visit: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.error) {
            console.error('API error:', data.error);
            setLoading(false);
            return;
          }
          setVisit(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Visit fetch error:', err);
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

  const formatVisitType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  if (!visit) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Visit not found</p>
          <Link href="/visits" className="text-blue-600 hover:text-blue-800">
            Back to Visits
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Clinical Visits', href: '/visits' },
            { label: 'Visit Details' },
          ]}
        />
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Visit Details</h1>
              <p className="text-gray-600 mt-1">{formatDate(visit.visitDate)}</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/students/${visit.student.id}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View Student Profile
              </Link>
              <Link
                href="/visits"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to Visits
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Patient Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Student</label>
                <p className="mt-1 text-sm text-gray-900">
                  {visit.student.firstName} {visit.student.lastName} ({visit.student.studentId})
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">School</label>
                <p className="mt-1 text-sm text-gray-900">{visit.school.name}</p>
              </div>
            </div>
          </div>

          {/* Visit Information */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Visit Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Visit Type</label>
                <p className="mt-1 text-sm text-gray-900">{formatVisitType(visit.visitType)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Date & Time</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(visit.visitDate)}</p>
              </div>
              {visit.chiefComplaint && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Chief Complaint</label>
                  <p className="mt-1 text-sm text-gray-900">{visit.chiefComplaint}</p>
                </div>
              )}
              {visit.diagnosis && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Diagnosis</label>
                  <p className="mt-1 text-sm text-gray-900">{visit.diagnosis}</p>
                </div>
              )}
              {visit.treatment && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Treatment</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{visit.treatment}</p>
                </div>
              )}
              {visit.notes && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{visit.notes}</p>
                </div>
              )}
              {visit.followUpRequired && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Follow-up</label>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Follow-up Required
                      {visit.followUpDate && ` - ${formatDate(visit.followUpDate)}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vital Signs */}
          {visit.assessment && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vital Signs</h2>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                {visit.assessment.temperature && (
                  <div>
                    <label className="text-xs text-gray-600">Temperature</label>
                    <p className="text-sm font-medium text-gray-900">{visit.assessment.temperature}°C</p>
                  </div>
                )}
                {visit.assessment.bloodPressureSystolic && (
                  <div>
                    <label className="text-xs text-gray-600">Blood Pressure</label>
                    <p className="text-sm font-medium text-gray-900">
                      {visit.assessment.bloodPressureSystolic}/
                      {visit.assessment.bloodPressureDiastolic || '--'} mmHg
                    </p>
                  </div>
                )}
                {visit.assessment.heartRate && (
                  <div>
                    <label className="text-xs text-gray-600">Heart Rate</label>
                    <p className="text-sm font-medium text-gray-900">{visit.assessment.heartRate} bpm</p>
                  </div>
                )}
                {visit.assessment.respiratoryRate && (
                  <div>
                    <label className="text-xs text-gray-600">Respiratory Rate</label>
                    <p className="text-sm font-medium text-gray-900">{visit.assessment.respiratoryRate} /min</p>
                  </div>
                )}
                {visit.assessment.oxygenSaturation && (
                  <div>
                    <label className="text-xs text-gray-600">Oxygen Saturation</label>
                    <p className="text-sm font-medium text-gray-900">{visit.assessment.oxygenSaturation}%</p>
                  </div>
                )}
                {visit.assessment.height && (
                  <div>
                    <label className="text-xs text-gray-600">Height</label>
                    <p className="text-sm font-medium text-gray-900">{visit.assessment.height} cm</p>
                  </div>
                )}
                {visit.assessment.weight && (
                  <div>
                    <label className="text-xs text-gray-600">Weight</label>
                    <p className="text-sm font-medium text-gray-900">{visit.assessment.weight} kg</p>
                  </div>
                )}
                {visit.assessment.bmi && (
                  <div>
                    <label className="text-xs text-gray-600">BMI</label>
                    <p className="text-sm font-medium text-gray-900">{visit.assessment.bmi.toFixed(1)}</p>
                  </div>
                )}
                {visit.assessment.painScale !== undefined && (
                  <div>
                    <label className="text-xs text-gray-600">Pain Scale</label>
                    <p className="text-sm font-medium text-gray-900">{visit.assessment.painScale}/10</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Physical Examination */}
          {visit.assessment && (
            (visit.assessment.generalAppearance || visit.assessment.skinCondition || 
             visit.assessment.eyes || visit.assessment.ears || visit.assessment.throat ||
             visit.assessment.cardiovascular || visit.assessment.respiratory ||
             visit.assessment.abdomen || visit.assessment.neurological || 
             visit.assessment.otherFindings) && (
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Physical Examination</h2>
                <div className="space-y-3">
                  {visit.assessment.generalAppearance && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">General Appearance</label>
                      <p className="mt-1 text-sm text-gray-900">{visit.assessment.generalAppearance}</p>
                    </div>
                  )}
                  {visit.assessment.skinCondition && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Skin Condition</label>
                      <p className="mt-1 text-sm text-gray-900">{visit.assessment.skinCondition}</p>
                    </div>
                  )}
                  {visit.assessment.eyes && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Eyes</label>
                      <p className="mt-1 text-sm text-gray-900">{visit.assessment.eyes}</p>
                    </div>
                  )}
                  {visit.assessment.ears && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Ears</label>
                      <p className="mt-1 text-sm text-gray-900">{visit.assessment.ears}</p>
                    </div>
                  )}
                  {visit.assessment.throat && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Throat</label>
                      <p className="mt-1 text-sm text-gray-900">{visit.assessment.throat}</p>
                    </div>
                  )}
                  {visit.assessment.cardiovascular && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Cardiovascular</label>
                      <p className="mt-1 text-sm text-gray-900">{visit.assessment.cardiovascular}</p>
                    </div>
                  )}
                  {visit.assessment.respiratory && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Respiratory</label>
                      <p className="mt-1 text-sm text-gray-900">{visit.assessment.respiratory}</p>
                    </div>
                  )}
                  {visit.assessment.abdomen && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Abdomen</label>
                      <p className="mt-1 text-sm text-gray-900">{visit.assessment.abdomen}</p>
                    </div>
                  )}
                  {visit.assessment.neurological && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Neurological</label>
                      <p className="mt-1 text-sm text-gray-900">{visit.assessment.neurological}</p>
                    </div>
                  )}
                  {visit.assessment.otherFindings && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Other Findings</label>
                      <p className="mt-1 text-sm text-gray-900">{visit.assessment.otherFindings}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* Created By */}
          <div className="border-t border-gray-200 pt-6">
            <div className="text-sm text-gray-500">
              Created by: {visit.creator.firstName} {visit.creator.lastName}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


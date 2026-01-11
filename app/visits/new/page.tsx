'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import PainScaleSelector from '@/components/PainScaleSelector';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  schoolId: string;
}

interface School {
  id: string;
  name: string;
  code: string;
}

interface PreviousVisit {
  id: string;
  visitDate: string;
  visitType: string;
  chiefComplaint?: string;
  diagnosis?: string;
  assessment?: {
    temperature?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
  };
  creator: {
    firstName: string;
    lastName: string;
  };
}

export default function NewVisitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [userSchoolId, setUserSchoolId] = useState<string>('');
  const [previousVisits, setPreviousVisits] = useState<PreviousVisit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<PreviousVisit | null>(null);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    schoolId: '',
    visitType: 'ROUTINE_CHECKUP',
    chiefComplaint: '',
    notes: '',
    diagnosis: '',
    treatment: '',
    followUpRequired: false,
    followUpDate: '',
    notifyParent: false,
    assessment: {
      temperature: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      heartRate: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      height: '',
      weight: '',
      painScale: '',
      generalAppearance: '',
      skinCondition: '',
      eyes: '',
      ears: '',
      throat: '',
      cardiovascular: '',
      respiratory: '',
      abdomen: '',
      neurological: '',
      otherFindings: '',
      // Health Record fields
      colorBlindness: '',
      visionTestingPerformed: '',
      visionTestingNotPerformedReason: '',
      correctiveLenses: '',
      correctiveLensesOtherReason: '',
      rightEye: '',
      leftEye: '',
      rightEyeWithCorrection: '',
      leftEyeWithCorrection: '',
      visionScreeningResult: '',
    },
  });

  useEffect(() => {
    // Get current user info
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserRole(data.user.role);
          setUserSchoolId(data.user.schoolId || '');
          // Auto-set school for non-admin users
          if (data.user.role !== 'ADMIN' && data.user.schoolId) {
            const schoolId = data.user.schoolId;
            setSelectedSchoolId(schoolId);
            setFormData((prev) => ({ ...prev, schoolId }));
            // Load students for this school
            fetch(`/api/students?schoolId=${schoolId}`)
              .then((res) => res.json())
              .then((studentData) => setStudents(studentData));
          }
        }
      });

    // Fetch schools (will be filtered by API based on user role)
    fetch('/api/schools')
      .then((res) => res.json())
      .then((data) => setSchools(data));
  }, []);

  useEffect(() => {
    if (selectedSchoolId) {
      fetch(`/api/students?schoolId=${selectedSchoolId}`)
        .then((res) => res.json())
        .then((data) => setStudents(data));
    }
  }, [selectedSchoolId]);

  useEffect(() => {
    if (formData.studentId) {
      setLoadingVisits(true);
      fetch(`/api/students/${formData.studentId}/visits`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPreviousVisits(data);
          } else {
            setPreviousVisits([]);
          }
          setLoadingVisits(false);
        })
        .catch(() => {
          setPreviousVisits([]);
          setLoadingVisits(false);
        });
    } else {
      setPreviousVisits([]);
      setSelectedVisit(null);
    }
  }, [formData.studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        studentId: formData.studentId,
        schoolId: formData.schoolId || selectedSchoolId,
        visitType: formData.visitType,
        chiefComplaint: formData.chiefComplaint || undefined,
        notes: formData.notes || undefined,
        diagnosis: formData.diagnosis || undefined,
        treatment: formData.treatment || undefined,
        followUpRequired: formData.followUpRequired,
        followUpDate: formData.followUpDate || undefined,
        notifyParent: formData.notifyParent,
        assessment: Object.fromEntries(
          Object.entries(formData.assessment).map(([key, value]) => {
            // Handle boolean fields
            if (key === 'visionTestingPerformed') {
              return [key, value === 'true' ? true : value === 'false' ? false : undefined];
            }
            // Handle number fields
            if (['temperature', 'bloodPressureSystolic', 'bloodPressureDiastolic', 'heartRate', 
                 'respiratoryRate', 'oxygenSaturation', 'height', 'weight', 'painScale'].includes(key)) {
              return [key, value === '' ? undefined : Number(value) || undefined];
            }
            // Handle string fields
            return [key, value === '' ? undefined : value];
          })
        ),
      };

      // Remove empty assessment fields
      if (payload.assessment) {
        Object.keys(payload.assessment).forEach((key) => {
          if (payload.assessment[key] === '' || payload.assessment[key] === undefined) {
            delete payload.assessment[key];
          }
        });

        // Remove assessment if empty
        if (Object.keys(payload.assessment).length === 0) {
          delete payload.assessment;
        }
      }

      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/visits');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create visit');
        setLoading(false);
      }
    } catch (error) {
      alert('An error occurred');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatVisitType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Layout>
      <div className="max-w-7xl">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Clinical Visits', href: '/visits' },
            { label: 'New Assessment' },
          ]}
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-6">New Assessment</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">School</label>
              <select
                value={selectedSchoolId}
                onChange={(e) => {
                  setSelectedSchoolId(e.target.value);
                  setFormData({ ...formData, schoolId: e.target.value, studentId: '' });
                }}
                required
                disabled={userRole !== 'ADMIN' && userSchoolId !== ''}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select a school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              {userRole !== 'ADMIN' && userSchoolId && (
                <p className="mt-1 text-sm text-gray-500">You can only create visits for your assigned school</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Student</label>
              <select
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                required
                disabled={!selectedSchoolId}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} ({student.studentId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Visit Type</label>
              <select
                value={formData.visitType}
                onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ROUTINE_CHECKUP">Routine Checkup</option>
                <option value="ILLNESS">Illness</option>
                <option value="INJURY">Injury</option>
                <option value="VACCINATION">Vaccination</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="FOLLOW_UP">Follow Up</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Chief Complaint</label>
              <input
                type="text"
                value={formData.chiefComplaint}
                onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vital Signs</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.assessment.temperature}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, temperature: e.target.value },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Blood Pressure (Systolic/Diastolic)</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Systolic"
                    value={formData.assessment.bloodPressureSystolic}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assessment: {
                          ...formData.assessment,
                          bloodPressureSystolic: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Diastolic"
                    value={formData.assessment.bloodPressureDiastolic}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assessment: {
                          ...formData.assessment,
                          bloodPressureDiastolic: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={formData.assessment.heartRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, heartRate: e.target.value },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Respiratory Rate (/min)</label>
                <input
                  type="number"
                  value={formData.assessment.respiratoryRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, respiratoryRate: e.target.value },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Oxygen Saturation (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.assessment.oxygenSaturation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, oxygenSaturation: e.target.value },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Height (cm) / Weight (kg)</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Height"
                    value={formData.assessment.height}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assessment: { ...formData.assessment, height: e.target.value },
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Weight"
                    value={formData.assessment.weight}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assessment: { ...formData.assessment, weight: e.target.value },
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pain Scale Selector */}
          <div className="border-t border-gray-200 pt-6">
            <PainScaleSelector
              value={formData.assessment.painScale}
              onChange={(score) =>
                setFormData({
                  ...formData,
                  assessment: { ...formData.assessment, painScale: score.toString() },
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Treatment</label>
            <textarea
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Health Record Fields - Auto-populated from latest health record */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Vision & Health Record Data</h2>
            <p className="text-sm text-gray-500 mb-4">
              These fields are automatically populated from the latest health record. You can modify them if needed.
            </p>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Color Blindness</label>
                <select
                  value={formData.assessment.colorBlindness}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, colorBlindness: e.target.value },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="Normal">Normal</option>
                  <option value="Abnormal">Abnormal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Vision Testing Performed</label>
                <select
                  value={formData.assessment.visionTestingPerformed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, visionTestingPerformed: e.target.value },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              {formData.assessment.visionTestingPerformed === 'false' && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Reason Not Performed</label>
                  <input
                    type="text"
                    value={formData.assessment.visionTestingNotPerformedReason}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assessment: { ...formData.assessment, visionTestingNotPerformedReason: e.target.value },
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Corrective Lenses</label>
                <select
                  value={formData.assessment.correctiveLenses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, correctiveLenses: e.target.value },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="None">None</option>
                  <option value="Glasses">Glasses</option>
                  <option value="Contact lenses">Contact lenses</option>
                  <option value="Surgical correction">Surgical correction</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {formData.assessment.correctiveLenses === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Other Reason</label>
                  <input
                    type="text"
                    value={formData.assessment.correctiveLensesOtherReason}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assessment: { ...formData.assessment, correctiveLensesOtherReason: e.target.value },
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Right Eye</label>
                <select
                  value={formData.assessment.rightEye}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, rightEye: e.target.value },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="6/3">6/3</option>
                  <option value="6/3.8">6/3.8</option>
                  <option value="6/4.8">6/4.8</option>
                  <option value="6/6">6/6</option>
                  <option value="6/7.5">6/7.5</option>
                  <option value="6/9.5">6/9.5</option>
                  <option value="6/12">6/12</option>
                  <option value="6/15">6/15</option>
                  <option value="6/19">6/19</option>
                  <option value="6/24">6/24</option>
                  <option value="6/30">6/30</option>
                  <option value="6/38">6/38</option>
                  <option value="6/48">6/48</option>
                  <option value="6/60">6/60</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Left Eye</label>
                <select
                  value={formData.assessment.leftEye}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, leftEye: e.target.value },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="6/3">6/3</option>
                  <option value="6/3.8">6/3.8</option>
                  <option value="6/4.8">6/4.8</option>
                  <option value="6/6">6/6</option>
                  <option value="6/7.5">6/7.5</option>
                  <option value="6/9.5">6/9.5</option>
                  <option value="6/12">6/12</option>
                  <option value="6/15">6/15</option>
                  <option value="6/19">6/19</option>
                  <option value="6/24">6/24</option>
                  <option value="6/30">6/30</option>
                  <option value="6/38">6/38</option>
                  <option value="6/48">6/48</option>
                  <option value="6/60">6/60</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Right Eye (with Correction)</label>
                <select
                  value={formData.assessment.rightEyeWithCorrection}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, rightEyeWithCorrection: e.target.value },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="6/3">6/3</option>
                  <option value="6/3.8">6/3.8</option>
                  <option value="6/4.8">6/4.8</option>
                  <option value="6/6">6/6</option>
                  <option value="6/7.5">6/7.5</option>
                  <option value="6/9.5">6/9.5</option>
                  <option value="6/12">6/12</option>
                  <option value="6/15">6/15</option>
                  <option value="6/19">6/19</option>
                  <option value="6/24">6/24</option>
                  <option value="6/30">6/30</option>
                  <option value="6/38">6/38</option>
                  <option value="6/48">6/48</option>
                  <option value="6/60">6/60</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Left Eye (with Correction)</label>
                <select
                  value={formData.assessment.leftEyeWithCorrection}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, leftEyeWithCorrection: e.target.value },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="6/3">6/3</option>
                  <option value="6/3.8">6/3.8</option>
                  <option value="6/4.8">6/4.8</option>
                  <option value="6/6">6/6</option>
                  <option value="6/7.5">6/7.5</option>
                  <option value="6/9.5">6/9.5</option>
                  <option value="6/12">6/12</option>
                  <option value="6/15">6/15</option>
                  <option value="6/19">6/19</option>
                  <option value="6/24">6/24</option>
                  <option value="6/30">6/30</option>
                  <option value="6/38">6/38</option>
                  <option value="6/48">6/48</option>
                  <option value="6/60">6/60</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Vision Screening Result</label>
                <select
                  value={formData.assessment.visionScreeningResult}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, visionScreeningResult: e.target.value },
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="Normal">Normal</option>
                  <option value="Abnormal">Abnormal</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.followUpRequired}
              onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Follow-up required</label>
            {formData.followUpRequired && (
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className="ml-4 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
              />
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.notifyParent}
                onChange={(e) => setFormData({ ...formData, notifyParent: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Send notification email to parent
              </label>
            </div>
            {formData.notifyParent && (
              <p className="mt-2 text-sm text-gray-500">
                An email with visit details and summary report will be sent to the student's parent email address.
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Visit'}
            </button>
          </div>
        </form>
          </div>

          {/* Previous Visits Sidebar */}
          <div className="lg:col-span-1">
            {formData.studentId ? (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Previous Visits
                  {loadingVisits && <span className="text-sm text-gray-500 ml-2">Loading...</span>}
                </h2>
                {previousVisits.length === 0 && !loadingVisits ? (
                  <p className="text-sm text-gray-500">No previous visits found</p>
                ) : (
                  <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {previousVisits.map((visit) => (
                      <div
                        key={visit.id}
                        onClick={() => setSelectedVisit(visit)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedVisit?.id === visit.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatVisitType(visit.visitType)}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(visit.visitDate)}</p>
                          </div>
                        </div>
                        {visit.chiefComplaint && (
                          <p className="text-xs text-gray-600 mb-1 truncate">
                            <span className="font-medium">Complaint:</span> {visit.chiefComplaint}
                          </p>
                        )}
                        {visit.diagnosis && (
                          <p className="text-xs text-gray-600 mb-1 truncate">
                            <span className="font-medium">Diagnosis:</span> {visit.diagnosis}
                          </p>
                        )}
                        {visit.assessment && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                              {visit.assessment.temperature && (
                                <div>Temp: {visit.assessment.temperature}°C</div>
                              )}
                              {visit.assessment.heartRate && (
                                <div>HR: {visit.assessment.heartRate} bpm</div>
                              )}
                              {visit.assessment.bloodPressureSystolic && (
                                <div>
                                  BP: {visit.assessment.bloodPressureSystolic}/
                                  {visit.assessment.bloodPressureDiastolic || '--'}
                                </div>
                              )}
                            </div>
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
            ) : (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Visits</h2>
                <p className="text-sm text-gray-500">Select a student to view previous visits</p>
              </div>
            )}

            {/* Visit Preview Modal */}
            {selectedVisit && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Visit Details - {formatDate(selectedVisit.visitDate)}
                    </h3>
                    <button
                      onClick={() => setSelectedVisit(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Visit Type</label>
                        <p className="mt-1 text-sm text-gray-900">{formatVisitType(selectedVisit.visitType)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Date</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedVisit.visitDate)}</p>
                      </div>
                    </div>
                    {selectedVisit.chiefComplaint && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Chief Complaint</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedVisit.chiefComplaint}</p>
                      </div>
                    )}
                    {selectedVisit.diagnosis && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Diagnosis</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedVisit.diagnosis}</p>
                      </div>
                    )}
                    {selectedVisit.assessment && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Vital Signs</label>
                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                          {selectedVisit.assessment.temperature && (
                            <div>
                              <span className="text-xs text-gray-600">Temperature:</span>
                              <span className="ml-2 text-sm font-medium">{selectedVisit.assessment.temperature}°C</span>
                            </div>
                          )}
                          {selectedVisit.assessment.bloodPressureSystolic && (
                            <div>
                              <span className="text-xs text-gray-600">Blood Pressure:</span>
                              <span className="ml-2 text-sm font-medium">
                                {selectedVisit.assessment.bloodPressureSystolic}/
                                {selectedVisit.assessment.bloodPressureDiastolic || '--'} mmHg
                              </span>
                            </div>
                          )}
                          {selectedVisit.assessment.heartRate && (
                            <div>
                              <span className="text-xs text-gray-600">Heart Rate:</span>
                              <span className="ml-2 text-sm font-medium">{selectedVisit.assessment.heartRate} bpm</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Created By</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedVisit.creator.firstName} {selectedVisit.creator.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}


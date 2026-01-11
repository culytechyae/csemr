'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';

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

interface ExistingHealthRecord {
  id: string;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  colorBlindness: string | null;
  visionTestingPerformed: boolean | null;
  visionTestingNotPerformedReason: string | null;
  correctiveLenses: string | null;
  correctiveLensesOtherReason: string | null;
  rightEye: string | null;
  leftEye: string | null;
  rightEyeWithCorrection: string | null;
  leftEyeWithCorrection: string | null;
  visionScreeningResult: string | null;
  recordedAt: string;
  recorder: {
    firstName: string;
    lastName: string;
  };
}

export default function NewHealthRecordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [userSchoolId, setUserSchoolId] = useState<string>('');
  const [existingRecord, setExistingRecord] = useState<ExistingHealthRecord | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    schoolId: '',
    height: '',
    weight: '',
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
  });

  const visionAcuityOptions = [
    '6/3', '6/3.8', '6/4.8', '6/6', '6/7.5', '6/9.5', '6/12', '6/15',
    '6/19', '6/24', '6/30', '6/38', '6/48', '6/60'
  ];

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserRole(data.user.role);
          setUserSchoolId(data.user.schoolId || '');
          if (data.user.role !== 'ADMIN' && data.user.schoolId) {
            const schoolId = data.user.schoolId;
            setSelectedSchoolId(schoolId);
            setFormData((prev) => ({ ...prev, schoolId }));
            fetch(`/api/students?schoolId=${schoolId}`)
              .then((res) => res.json())
              .then((studentData) => setStudents(studentData));
          }
        }
      });

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

  // Fetch existing health record when student is selected
  useEffect(() => {
    if (formData.studentId) {
      setLoadingRecord(true);
      fetch(`/api/health-records/student/${formData.studentId}/latest`)
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else if (res.status === 404) {
            // No existing record - this is fine
            return null;
          } else {
            throw new Error('Failed to fetch health record');
          }
        })
        .then((data) => {
          if (data) {
            setExistingRecord(data);
            setIsUpdating(true);
            // Pre-fill form with existing data
            setFormData({
              ...formData,
              height: data.height?.toString() || '',
              weight: data.weight?.toString() || '',
              colorBlindness: data.colorBlindness || '',
              visionTestingPerformed: data.visionTestingPerformed === true ? 'true' : data.visionTestingPerformed === false ? 'false' : '',
              visionTestingNotPerformedReason: data.visionTestingNotPerformedReason || '',
              correctiveLenses: data.correctiveLenses || '',
              correctiveLensesOtherReason: data.correctiveLensesOtherReason || '',
              rightEye: data.rightEye || '',
              leftEye: data.leftEye || '',
              rightEyeWithCorrection: data.rightEyeWithCorrection || '',
              leftEyeWithCorrection: data.leftEyeWithCorrection || '',
              visionScreeningResult: data.visionScreeningResult || '',
            });
          } else {
            setExistingRecord(null);
            setIsUpdating(false);
            // Reset form for new record
            setFormData({
              ...formData,
              height: '',
              weight: '',
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
            });
          }
        })
        .catch((error) => {
          console.error('Error fetching health record:', error);
          setExistingRecord(null);
          setIsUpdating(false);
        })
        .finally(() => {
          setLoadingRecord(false);
        });
    } else {
      setExistingRecord(null);
      setIsUpdating(false);
    }
  }, [formData.studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        colorBlindness: formData.colorBlindness || undefined,
        visionTestingPerformed: formData.visionTestingPerformed === 'true' ? true : formData.visionTestingPerformed === 'false' ? false : undefined,
        visionTestingNotPerformedReason: formData.visionTestingNotPerformedReason || undefined,
        correctiveLenses: formData.correctiveLenses || undefined,
        correctiveLensesOtherReason: formData.correctiveLensesOtherReason || undefined,
        rightEye: formData.rightEye || undefined,
        leftEye: formData.leftEye || undefined,
        rightEyeWithCorrection: formData.rightEyeWithCorrection || undefined,
        leftEyeWithCorrection: formData.leftEyeWithCorrection || undefined,
        visionScreeningResult: formData.visionScreeningResult || undefined,
      };

      // Remove undefined values
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === '') {
          delete payload[key];
        }
      });

      let response;
      if (isUpdating && existingRecord) {
        // Update existing record
        response = await fetch(`/api/health-records/${existingRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new record
        payload.studentId = formData.studentId;
        payload.schoolId = formData.schoolId || selectedSchoolId;
        response = await fetch('/api/health-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        router.push('/health-records');
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${isUpdating ? 'update' : 'create'} health record`);
        setLoading(false);
      }
    } catch (error) {
      alert('An error occurred');
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsUpdating(false);
    setExistingRecord(null);
    // Reset form
    setFormData({
      ...formData,
      height: '',
      weight: '',
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
    });
  };

  return (
    <Layout>
      <div className="flex gap-6">
        <div className="flex-1 max-w-4xl">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Health Records', href: '/health-records' },
              { label: isUpdating ? 'Update Health Record' : 'New Health Record' },
            ]}
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {isUpdating ? 'Update Health Record' : 'New Health Record'}
          </h1>

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
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Physical Measurements</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vision Testing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Color Blindness</label>
                <select
                  value={formData.colorBlindness}
                  onChange={(e) => setFormData({ ...formData, colorBlindness: e.target.value })}
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
                  value={formData.visionTestingPerformed}
                  onChange={(e) => setFormData({ ...formData, visionTestingPerformed: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              {formData.visionTestingPerformed === 'false' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason Not Performed</label>
                  <input
                    type="text"
                    value={formData.visionTestingNotPerformedReason}
                    onChange={(e) => setFormData({ ...formData, visionTestingNotPerformedReason: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Corrective Lenses</label>
                <select
                  value={formData.correctiveLenses}
                  onChange={(e) => setFormData({ ...formData, correctiveLenses: e.target.value })}
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

              {formData.correctiveLenses === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Other Reason</label>
                  <input
                    type="text"
                    value={formData.correctiveLensesOtherReason}
                    onChange={(e) => setFormData({ ...formData, correctiveLensesOtherReason: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Right Eye</label>
                  <select
                    value={formData.rightEye}
                    onChange={(e) => setFormData({ ...formData, rightEye: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    {visionAcuityOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Left Eye</label>
                  <select
                    value={formData.leftEye}
                    onChange={(e) => setFormData({ ...formData, leftEye: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    {visionAcuityOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Right Eye (with Correction)</label>
                  <select
                    value={formData.rightEyeWithCorrection}
                    onChange={(e) => setFormData({ ...formData, rightEyeWithCorrection: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    {visionAcuityOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Left Eye (with Correction)</label>
                  <select
                    value={formData.leftEyeWithCorrection}
                    onChange={(e) => setFormData({ ...formData, leftEyeWithCorrection: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select</option>
                    {visionAcuityOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Vision Screening Result</label>
                <select
                  value={formData.visionScreeningResult}
                  onChange={(e) => setFormData({ ...formData, visionScreeningResult: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="Normal">Normal</option>
                  <option value="Abnormal">Abnormal</option>
                </select>
              </div>
            </div>
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
              disabled={loading || loadingRecord}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading
                ? isUpdating
                  ? 'Updating...'
                  : 'Creating...'
                : isUpdating
                  ? 'Update Health Record'
                  : 'Create Health Record'}
            </button>
          </div>
        </form>
        </div>

        {/* Right Sidebar - Existing Health Record */}
        {formData.studentId && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-white shadow rounded-lg p-4 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {loadingRecord ? 'Loading...' : existingRecord ? 'Existing Health Record' : 'No Previous Record'}
              </h2>

              {loadingRecord && (
                <div className="text-center py-8 text-gray-500">Loading health record...</div>
              )}

              {!loadingRecord && existingRecord && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Recorded:</span>{' '}
                      {new Date(existingRecord.recordedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">By:</span>{' '}
                      {existingRecord.recorder.firstName} {existingRecord.recorder.lastName}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {existingRecord.height && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">Height:</span>
                        <p className="text-sm text-gray-900">{existingRecord.height} cm</p>
                      </div>
                    )}
                    {existingRecord.weight && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">Weight:</span>
                        <p className="text-sm text-gray-900">{existingRecord.weight} kg</p>
                      </div>
                    )}
                    {existingRecord.bmi && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">BMI:</span>
                        <p className="text-sm text-gray-900">{existingRecord.bmi.toFixed(1)}</p>
                      </div>
                    )}
                    {existingRecord.colorBlindness && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">Color Blindness:</span>
                        <p className="text-sm text-gray-900">{existingRecord.colorBlindness}</p>
                      </div>
                    )}
                    {existingRecord.visionScreeningResult && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">Vision Result:</span>
                        <p className="text-sm text-gray-900">{existingRecord.visionScreeningResult}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCreateNew}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Create New Record Instead
                    </button>
                  </div>
                </div>
              )}

              {!loadingRecord && !existingRecord && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-4">
                    No previous health record found for this student.
                  </p>
                  <p className="text-xs text-gray-400">
                    This will be saved as a new health record.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}


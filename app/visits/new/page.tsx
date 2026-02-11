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

interface StudentSummary {
  healthSummary?: {
    allergies?: string;
    chronicConditions?: string;
    medications?: string;
  };
  statistics?: {
    totalVisits?: number;
  };
  student?: {
    grade?: string | null;
    homeroom?: string | null;
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
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [studentSummary, setStudentSummary] = useState<StudentSummary | null>(null);
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

    // Check for query parameters (when navigating from students page)
    const urlParams = new URLSearchParams(window.location.search);
    const studentIdParam = urlParams.get('studentId');
    const schoolIdParam = urlParams.get('schoolId');
    
    if (schoolIdParam) {
      setSelectedSchoolId(schoolIdParam);
      setFormData((prev) => ({ ...prev, schoolId: schoolIdParam }));
      // Load students for this school
      fetch(`/api/students?schoolId=${schoolIdParam}`)
        .then((res) => res.json())
        .then((studentData) => {
          setStudents(studentData);
          // If studentId is provided, select it
          if (studentIdParam && studentData.find((s: Student) => s.id === studentIdParam)) {
            setFormData((prev) => ({ ...prev, studentId: studentIdParam, schoolId: schoolIdParam }));
          }
        });
    }
  }, []);

  useEffect(() => {
    if (selectedSchoolId) {
      fetch(`/api/students?schoolId=${selectedSchoolId}`)
        .then((res) => res.json())
        .then((data) => setStudents(data));
      // Clear student selection when school changes
      setFormData((prev) => ({ ...prev, studentId: '', schoolId: selectedSchoolId }));
      setStudentSearchQuery('');
      setIsStudentDropdownOpen(false);
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

      // Fetch richer student snapshot (allergies, summary, etc.)
      fetch(`/api/students/${formData.studentId}/summary`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setStudentSummary(data);
          } else {
            setStudentSummary(null);
          }
        })
        .catch(() => setStudentSummary(null));
    } else {
      setPreviousVisits([]);
      setSelectedVisit(null);
      setStudentSummary(null);
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

  // Filter students based on search query (by ID or name)
  const filteredStudents = students.filter((student) => {
    if (!studentSearchQuery.trim()) return true;
    const query = studentSearchQuery.toLowerCase().trim();
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const studentId = student.studentId.toLowerCase();
    return fullName.includes(query) || studentId.includes(query);
  });

  const selectedStudent = students.find((s) => s.id === formData.studentId);

  const handleStudentSelect = (studentId: string) => {
    setFormData({ ...formData, studentId });
    setStudentSearchQuery('');
    setIsStudentDropdownOpen(false);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Clinical Visits', href: '/visits' },
            { label: 'New Assessment' },
          ]}
        />

        <div className="flex items-start justify-between mb-5 mt-2 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Assessment</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Structured clinical visit entry with vitals, complaint, and plan.
            </p>
          </div>
          {selectedStudent && (
            <div className="hidden sm:flex flex-col items-end text-right">
              <p className="text-sm font-semibold text-gray-900">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </p>
              <p className="text-xs text-slate-500">
                ID {selectedStudent.studentId}
                {studentSummary?.student?.grade && ` • Grade ${studentSummary.student.grade}`}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] gap-6 items-start">
          {/* Assessment Form */}
          <div>
            <form
              id="assessment-form"
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-8"
            >
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
              <div className="mt-1 relative">
                <div className="relative">
                  <input
                    type="text"
                    value={isStudentDropdownOpen || !selectedStudent ? studentSearchQuery : `${selectedStudent.firstName} ${selectedStudent.lastName} (${selectedStudent.studentId})`}
                    onChange={(e) => {
                      const value = e.target.value;
                      setStudentSearchQuery(value);
                      setIsStudentDropdownOpen(true);
                      if (!value) {
                        setFormData({ ...formData, studentId: '' });
                      }
                    }}
                    onFocus={() => {
                      setIsStudentDropdownOpen(true);
                      // If a student is selected, clear it to allow searching
                      if (selectedStudent) {
                        setStudentSearchQuery('');
                        setFormData({ ...formData, studentId: '' });
                      }
                    }}
                    onBlur={() => {
                      // Delay closing to allow click events
                      setTimeout(() => setIsStudentDropdownOpen(false), 200);
                    }}
                    placeholder={selectedStudent ? "Click to search..." : "Search by student ID or name..."}
                    required
                    disabled={!selectedSchoolId}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                {isStudentDropdownOpen && selectedSchoolId && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                    {filteredStudents.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">No students found</div>
                    ) : (
                      filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          onClick={() => handleStudentSelect(student.id)}
                          className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                            formData.studentId === student.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-900">
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="text-sm text-gray-500">({student.studentId})</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {!selectedSchoolId && (
                  <p className="mt-1 text-sm text-gray-500">Please select a school first</p>
                )}
              </div>
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

          {/* Vitals Grid */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Vital Signs</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/40">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  Temperature
                </label>
                <div className="mt-1 relative">
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
                  className="block w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400">
                    °C
                  </span>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/40">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  Blood Pressure
                </label>
                <div className="mt-1 flex gap-2">
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
                    className="block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">mmHg</p>
              </div>
              <div className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/40">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  Heart Rate
                </label>
                <div className="mt-1 relative">
                  <input
                  type="number"
                  value={formData.assessment.heartRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, heartRate: e.target.value },
                    })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400">
                    bpm
                  </span>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/40">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  Respiratory Rate
                </label>
                <div className="mt-1 relative">
                  <input
                  type="number"
                  value={formData.assessment.respiratoryRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, respiratoryRate: e.target.value },
                    })
                  }
                  className="block w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400">
                    / min
                  </span>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/40">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  Oxygen Saturation
                </label>
                <div className="mt-1 relative">
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
                  className="block w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400">
                    %
                  </span>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/40 sm:col-span-2 xl:col-span-1">
                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  Height / Weight
                </label>
                <div className="mt-1 flex gap-2">
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
                    className="block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">cm / kg</p>
              </div>
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Chief Complaint</label>
            <textarea
              rows={3}
              value={formData.chiefComplaint}
              onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
              placeholder="Describe the primary reason for today's visit..."
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {['Headache', 'Fever', 'Abdominal pain', 'Injury during sports', 'Respiratory symptoms'].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        chiefComplaint: prev.chiefComplaint
                          ? `${prev.chiefComplaint.trim()}${prev.chiefComplaint.trim().endsWith('.') ? '' : '.'} ${suggestion}`
                          : suggestion,
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:border-blue-200"
                  >
                    <span>＋</span>
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Pain Scale Selector */}
          <div className="border-t border-gray-200 pt-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Pain Scale</h2>
                <p className="text-[11px] text-slate-500">
                  Tap the face that best matches the patient&apos;s pain level.
                </p>
              </div>
            </div>
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

          {/* Diagnosis & Plan */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-900">Diagnosis</label>
                <select
                  className="ml-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) return;
                    setFormData((prev) => ({
                      ...prev,
                      diagnosis: prev.diagnosis ? `${prev.diagnosis}\n${value}` : value,
                    }));
                  }}
                >
                  <option value="">Common diagnoses…</option>
                  <option value="Upper respiratory tract infection">Upper respiratory tract infection</option>
                  <option value="Viral fever">Viral fever</option>
                  <option value="Tension-type headache">Tension-type headache</option>
                  <option value="Minor musculoskeletal injury">Minor musculoskeletal injury</option>
                  <option value="Allergic reaction">Allergic reaction</option>
                </select>
              </div>
              <textarea
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">Plan / Treatment</label>
              <textarea
                value={formData.treatment}
                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Vision &amp; Health Record Data</h2>
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

          <div className="flex flex-wrap items-center gap-3">
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
                className="border border-slate-200 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          <div className="flex justify-end space-x-3 pt-2">
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

          {/* Patient Snapshot Sidebar */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-20">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Patient Snapshot</h2>
                  <p className="text-[11px] text-slate-500">Allergies, conditions &amp; quick history</p>
                </div>
              </div>

              {/* Allergies card */}
              <div
                className={`rounded-xl border px-3.5 py-3 mb-3 ${
                  studentSummary?.healthSummary?.allergies &&
                  studentSummary.healthSummary.allergies !== 'None recorded'
                    ? 'border-rose-200 bg-rose-50/70'
                    : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <p className="text-xs font-semibold text-slate-700 mb-1">Allergies</p>
                <p className="text-xs text-slate-700">
                  {studentSummary?.healthSummary?.allergies || 'No allergies recorded'}
                </p>
              </div>

              {/* Recent history timeline */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Recent History</p>
                {formData.studentId ? (
                  previousVisits.length === 0 && !loadingVisits ? (
                    <p className="text-xs text-slate-400">No previous visits found</p>
                  ) : (
                    <ol className="relative border-l border-slate-200 space-y-3 max-h-[320px] overflow-y-auto">
                      {previousVisits.slice(0, 3).map((visit) => (
                        <li key={visit.id} className="ml-3 pl-3">
                          <div className="absolute -left-1.5 mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                          <button
                            type="button"
                            onClick={() => setSelectedVisit(visit)}
                            className="w-full text-left"
                          >
                            <p className="text-[11px] font-semibold text-slate-700">
                              {formatVisitType(visit.visitType)}
                            </p>
                            <p className="text-[10px] text-slate-400">{formatDate(visit.visitDate)}</p>
                            {visit.chiefComplaint && (
                              <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2">
                                {visit.chiefComplaint}
                              </p>
                            )}
                          </button>
                        </li>
                      ))}
                      {loadingVisits && (
                        <li className="ml-3 pl-3 text-[11px] text-slate-400">Loading history…</li>
                      )}
                    </ol>
                  )
                ) : (
                  <p className="text-xs text-slate-400">Select a student to view history</p>
                )}
              </div>
            </div>

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

      {/* Floating Save Assessment button */}
      <button
        type="submit"
        form="assessment-form"
        disabled={loading}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
      >
        {loading ? 'Saving…' : 'Save Assessment'}
      </button>
    </Layout>
  );
}


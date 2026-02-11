'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';

interface School {
  id: string;
  name: string;
  code: string;
}

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [userSchoolId, setUserSchoolId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState('');
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    schoolId: '',
    studentId: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    nationality: '',
    bloodType: 'UNKNOWN',
    grade: '',
    homeroom: '',
    studentEmiratesId: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: '',
    allergies: '',
    chronicConditions: '',
    medications: '',
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
            setFormData((prev) => ({ ...prev, schoolId: data.user.schoolId || '' }));
          }
        }
      });

    // Fetch schools (will be filtered by API based on user role)
    fetch('/api/schools')
      .then((res) => res.json())
      .then((data) => {
        setSchools(data);
        // Set academic year from selected school
        if (data.length > 0) {
          const school = data.find((s: any) => s.id === formData.schoolId) || data[0];
          if (school?.currentAcademicYear) {
            setAcademicYear(school.currentAcademicYear);
          }
        }
      });

    // Fetch available academic years from system settings
    fetch('/api/settings/academic-years')
      .then((res) => res.json())
      .then((data) => {
        if (data.academicYears && Array.isArray(data.academicYears)) {
          setAcademicYears(data.academicYears);
          // Set default academic year if not already set
          if (!academicYear && data.defaultAcademicYear) {
            setAcademicYear(data.defaultAcademicYear);
          }
        }
      })
      .catch((error) => {
        console.error('Error fetching academic years:', error);
        // Fallback: Generate academic years client-side
        const currentYear = new Date().getFullYear();
        const fallbackYears: string[] = [];
        for (let i = -5; i <= 5; i++) {
          const startYear = currentYear + i;
          const endYear = startYear + 1;
          fallbackYears.push(`${startYear}-${endYear}`);
        }
        setAcademicYears(fallbackYears.reverse());
        if (!academicYear) {
          setAcademicYear(fallbackYears[0]);
        }
      });
  }, []);

  useEffect(() => {
    if (formData.schoolId) {
      const school = schools.find((s) => s.id === formData.schoolId) as any;
      if (school?.currentAcademicYear) {
        setAcademicYear(school.currentAcademicYear);
      }
    }
  }, [formData.schoolId, schools]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          academicYear,
        }),
      });

      if (response.ok) {
        router.push('/students');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create student');
        setLoading(false);
      }
    } catch (error) {
      alert('An error occurred');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Students', href: '/students' },
            { label: 'New Student' },
          ]}
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Student</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">School *</label>
              <select
                value={formData.schoolId}
                onChange={(e) => {
                  setFormData({ ...formData, schoolId: e.target.value });
                  const school = schools.find((s) => s.id === e.target.value) as any;
                  if (school?.currentAcademicYear) {
                    setAcademicYear(school.currentAcademicYear);
                  }
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
                <p className="mt-1 text-sm text-gray-500">You can only create students for your assigned school</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Academic Year *</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {academicYears.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">Loading academic years...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Student ID *</label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nationality</label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Blood Type</label>
              <select
                value={formData.bloodType}
                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="UNKNOWN">Unknown</option>
                <option value="A_POSITIVE">A+</option>
                <option value="A_NEGATIVE">A-</option>
                <option value="B_POSITIVE">B+</option>
                <option value="B_NEGATIVE">B-</option>
                <option value="AB_POSITIVE">AB+</option>
                <option value="AB_NEGATIVE">AB-</option>
                <option value="O_POSITIVE">O+</option>
                <option value="O_NEGATIVE">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Grade</label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Homeroom</label>
              <input
                type="text"
                value={formData.homeroom}
                onChange={(e) => setFormData({ ...formData, homeroom: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Student Emirates ID</label>
              <input
                type="text"
                value={formData.studentEmiratesId}
                onChange={(e) => setFormData({ ...formData, studentEmiratesId: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Parent Name *</label>
              <input
                type="text"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Parent Phone *</label>
              <input
                type="tel"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Parent Email</label>
              <input
                type="email"
                value={formData.parentEmail}
                onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact *</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Phone *</label>
              <input
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Allergies</label>
              <textarea
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Chronic Conditions</label>
              <textarea
                value={formData.chronicConditions}
                onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Current Medications</label>
              <textarea
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
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
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}


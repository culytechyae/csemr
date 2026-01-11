'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';

interface School {
  id: string;
  name: string;
  code: string;
  currentAcademicYear?: string;
}

export default function ImportStudentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [userSchoolId, setUserSchoolId] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserRole(data.user.role);
          setUserSchoolId(data.user.schoolId || '');
          if (data.user.role !== 'ADMIN' && data.user.schoolId) {
            setSelectedSchoolId(data.user.schoolId);
          }
        }
      });

    fetch('/api/schools')
      .then((res) => res.json())
      .then((data) => {
        setSchools(data);
        // Set academic year from selected school
        if (data.length > 0 && selectedSchoolId) {
          const school = data.find((s: School) => s.id === selectedSchoolId);
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
    if (selectedSchoolId) {
      const school = schools.find((s) => s.id === selectedSchoolId);
      if (school?.currentAcademicYear) {
        setAcademicYear(school.currentAcademicYear);
      }
    }
  }, [selectedSchoolId, schools]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const students = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      if (values.length !== headers.length) continue;

      const student: any = {};
      headers.forEach((header, index) => {
        student[header.toLowerCase().replace(/\s+/g, '')] = values[index] || '';
      });
      students.push(student);
    }

    return students;
  };

  const mapCSVToStudent = (csvRow: any) => {
    return {
      studentId: csvRow.studentid || csvRow['student id'] || '',
      firstName: csvRow.firstname || csvRow['first name'] || '',
      lastName: csvRow.lastname || csvRow['last name'] || '',
      dateOfBirth: csvRow.dateofbirth || csvRow['date of birth'] || csvRow.dob || '',
      gender: (csvRow.gender || '').toUpperCase() === 'F' || (csvRow.gender || '').toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE',
      nationality: csvRow.nationality || '',
      bloodType: csvRow.bloodtype || csvRow['blood type'] || 'UNKNOWN',
      parentName: csvRow.parentname || csvRow['parent name'] || '',
      parentPhone: csvRow.parentphone || csvRow['parent phone'] || '',
      parentEmail: csvRow.parentemail || csvRow['parent email'] || '',
      emergencyContact: csvRow.emergencycontact || csvRow['emergency contact'] || '',
      emergencyPhone: csvRow.emergencyphone || csvRow['emergency phone'] || '',
      address: csvRow.address || '',
      allergies: csvRow.allergies || '',
      chronicConditions: csvRow.chronicconditions || csvRow['chronic conditions'] || '',
      medications: csvRow.medications || '',
    };
  };

  const handleImport = async () => {
    if (!file || !selectedSchoolId || !academicYear) {
      alert('Please select a file, school, and academic year');
      return;
    }

    setLoading(true);
    setImportResults(null);

    try {
      const text = await file.text();
      const csvData = parseCSV(text);
      const students = csvData.map(mapCSVToStudent).filter((s) => s.studentId);

      if (students.length === 0) {
        alert('No valid student data found in the file');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/import/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: selectedSchoolId,
          academicYear,
          students,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setImportResults(result);
      } else {
        alert(result.error || 'Import failed');
      }
    } catch (error: any) {
      alert(`Import error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Import Students</h1>
        <p className="text-gray-600 mb-6">Import students from CSV file. Existing records will be updated.</p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School *</label>
              <select
                value={selectedSchoolId}
                onChange={(e) => {
                  setSelectedSchoolId(e.target.value);
                  const school = schools.find((s) => s.id === e.target.value);
                  if (school?.currentAcademicYear) {
                    setAcademicYear(school.currentAcademicYear);
                  }
                }}
                required
                disabled={userRole !== 'ADMIN' && userSchoolId !== ''}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select a school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CSV File *</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-2 text-sm text-gray-500">
              CSV format: studentId, firstName, lastName, dateOfBirth, gender, nationality, bloodType, parentName, parentPhone, parentEmail, emergencyContact, emergencyPhone, address, allergies, chronicConditions, medications
            </p>
          </div>

          {importResults && (
            <div className={`p-4 rounded-lg ${
              importResults.results.errors.length > 0
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-green-50 border border-green-200'
            }`}>
              <h3 className="font-semibold mb-2">{importResults.message}</h3>
              <p className="text-sm">
                Created: {importResults.results.created} | Updated: {importResults.results.updated}
              </p>
              {importResults.results.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Errors:</p>
                  <ul className="text-sm list-disc list-inside mt-1">
                    {importResults.results.errors.slice(0, 10).map((error: string, idx: number) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                  {importResults.results.errors.length > 10 && (
                    <p className="text-sm mt-1">... and {importResults.results.errors.length - 10} more errors</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !file || !selectedSchoolId || !academicYear}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import Students'}
            </button>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">CSV Format Guide</h3>
          <p className="text-sm text-blue-800 mb-2">
            Your CSV file should have the following columns (first row should be headers):
          </p>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>studentId (required)</li>
            <li>firstName (required)</li>
            <li>lastName (required)</li>
            <li>dateOfBirth (required, format: YYYY-MM-DD)</li>
            <li>gender (required: MALE or FEMALE)</li>
            <li>nationality (optional)</li>
            <li>bloodType (optional)</li>
            <li>parentName (required)</li>
            <li>parentPhone (required)</li>
            <li>parentEmail (optional)</li>
            <li>emergencyContact (required)</li>
            <li>emergencyPhone (required)</li>
            <li>address (optional)</li>
            <li>allergies (optional)</li>
            <li>chronicConditions (optional)</li>
            <li>medications (optional)</li>
          </ul>
          <p className="text-sm text-blue-800 mt-2">
            <strong>Note:</strong> Existing students with the same studentId and academicYear will be updated.
          </p>
        </div>
      </div>
    </Layout>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import * as XLSX from 'xlsx';

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

  const parseExcel = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const detectDelimiter = (line: string): string => {
    // Count occurrences of common delimiters
    const delimiters = ['\t', ',', '|', ';'];
    let maxCount = 0;
    let detectedDelimiter = ',';
    
    for (const delimiter of delimiters) {
      const count = (line.match(new RegExp(delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        detectedDelimiter = delimiter;
      }
    }
    
    return detectedDelimiter;
  };

  const parseTextFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split(/\r?\n/).filter((line) => line.trim());
          
          if (lines.length < 2) {
            resolve([]);
            return;
          }

          // Detect delimiter from first line
          const headerLine = lines[0].replace(/^\uFEFF/, ''); // Remove BOM
          const delimiter = detectDelimiter(headerLine);
          
          const headers = headerLine.split(delimiter).map((h) => {
            return h.trim().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, '');
          });

          const students = [];

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Split by detected delimiter
            const values = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
            
            // Skip if not enough columns
            if (values.length < headers.length) {
              while (values.length < headers.length) {
                values.push('');
              }
            }

            const student: any = {};
            headers.forEach((header, index) => {
              const cleanHeader = header.toLowerCase();
              student[cleanHeader] = values[index] || '';
            });
            students.push(student);
          }

          resolve(students);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  };

  const parseCSV = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          // Try using XLSX to parse CSV (handles encoding better)
          try {
            const workbook = XLSX.read(text, { type: 'string', sheetStubs: false });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
            resolve(jsonData);
            return;
          } catch (xlsxError) {
            // Fallback to manual parsing if XLSX fails
            console.log('XLSX parsing failed, using manual parser');
          }

          // Manual CSV parsing fallback
          const lines = text.split(/\r?\n/).filter((line) => line.trim());
          if (lines.length < 2) {
            resolve([]);
            return;
          }

          // Parse header line - handle BOM and special characters
          const headerLine = lines[0].replace(/^\uFEFF/, ''); // Remove BOM
          const headers = headerLine.split(',').map((h) => {
            // Remove special characters and normalize
            return h.trim().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, '');
          });

          const students = [];

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parsing - split by comma
            const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            
            // Skip if not enough columns
            if (values.length < headers.length) {
              // Try to handle cases where some fields might be missing
              while (values.length < headers.length) {
                values.push('');
              }
            }

            const student: any = {};
            headers.forEach((header, index) => {
              const cleanHeader = header.toLowerCase();
              student[cleanHeader] = values[index] || '';
            });
            students.push(student);
          }

          resolve(students);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  };

  const mapCSVToStudent = (csvRow: any) => {
    // Handle Excel column names with whitespace characters (like \xa0) and other special chars
    const cleanKey = (key: string) => {
      if (!key) return '';
      return key
        .toLowerCase()
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces and BOM
        .replace(/\xa0/g, '') // Remove non-breaking space
        .replace(/\s+/g, '') // Remove all whitespace
        .trim();
    };
    
    // Helper function to convert value to string and handle empty values
    const toString = (value: any): string => {
      if (value === null || value === undefined) return '';
      return String(value).trim();
    };
    
    // Helper function to get optional string (returns undefined if empty)
    const getOptionalString = (value: any): string | undefined => {
      const str = toString(value);
      return str === '' ? undefined : str;
    };
    
    // Create a normalized object with cleaned keys
    const normalized: any = {};
    Object.keys(csvRow).forEach(key => {
      const cleaned = cleanKey(key);
      if (cleaned) {
        normalized[cleaned] = csvRow[key];
      }
    });

    // Get raw values
    const rawStudentId = normalized.studentid || csvRow.studentId || csvRow['student id'] || csvRow['studentId '] || '';
    const rawFirstName = normalized.firstname || csvRow.firstName || csvRow['first name'] || csvRow['firstName '] || '';
    const rawLastName = normalized.lastname || csvRow.lastName || csvRow['last name'] || '';
    const rawDateOfBirth = normalized.dateofbirth || csvRow.dateOfBirth || csvRow['date of birth'] || csvRow.dob || csvRow['dateOfBirth '] || '';
    const rawGender = normalized.gender || csvRow.gender || '';
    const rawNationality = normalized.nationality || csvRow.nationality || csvRow['nationality '] || '';
    const rawBloodType = normalized.bloodtype || csvRow.bloodType || csvRow['blood type'] || '';
    const rawGrade = normalized.grade || csvRow.grade || '';
    const rawHomeroom = normalized.homeroom || csvRow.homeroom || '';
    const rawStudentEmiratesId = normalized.studetnemiratesid || normalized.studentemiratesid || csvRow.studetnemiratesid || csvRow.studentEmiratesId || csvRow['studetnemiratesid'] || '';
    const rawParentName = normalized.parentname || csvRow.parentName || csvRow['parent name'] || csvRow['parentName '] || '';
    const rawParentPhone = normalized.parentphone || csvRow.parentPhone || csvRow['parent phone'] || csvRow['parentPhone '] || '';
    const rawParentEmail = normalized.parentemail || csvRow.parentEmail || csvRow['parent email'] || csvRow['parentEmail '] || '';
    const rawEmergencyContact = normalized.emergencycontact || csvRow.emergencyContact || csvRow['emergency contact'] || csvRow['emergencyContact '] || '';
    const rawEmergencyPhone = normalized.emergencyphone || csvRow.emergencyPhone || csvRow['emergency phone'] || csvRow['emergencyPhone '] || '';
    const rawAddress = normalized.address || csvRow.address || '';
    const rawAllergies = normalized.allergies || csvRow.allergies || '';
    const rawChronicConditions = normalized.chronicconditions || csvRow.chronicConditions || csvRow['chronic conditions'] || '';
    const rawMedications = normalized.medications || csvRow.medications || '';

    // Format date if it's a date object
    let formattedDateOfBirth = toString(rawDateOfBirth);
    if (rawDateOfBirth instanceof Date) {
      if (isNaN(rawDateOfBirth.getTime())) {
        formattedDateOfBirth = '';
      } else {
        formattedDateOfBirth = rawDateOfBirth.toISOString().split('T')[0];
      }
    } else if (formattedDateOfBirth) {
      // Try to parse and validate the date string
      const testDate = new Date(formattedDateOfBirth);
      if (isNaN(testDate.getTime())) {
        // Invalid date, try to fix common formats
        const dateMatch = formattedDateOfBirth.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateMatch) {
          const fixedDate = new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`);
          if (!isNaN(fixedDate.getTime())) {
            formattedDateOfBirth = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
          } else {
            formattedDateOfBirth = ''; // Invalid, will be skipped
          }
        } else {
          formattedDateOfBirth = ''; // Invalid format, will be skipped
        }
      } else {
        // Valid date, format it
        formattedDateOfBirth = testDate.toISOString().split('T')[0];
      }
    }

    return {
      studentId: toString(rawStudentId),
      firstName: toString(rawFirstName),
      lastName: toString(rawLastName),
      dateOfBirth: formattedDateOfBirth,
      gender: (toString(rawGender).toUpperCase() === 'F' || toString(rawGender).toUpperCase() === 'FEMALE') ? 'FEMALE' : 'MALE',
      nationality: getOptionalString(rawNationality),
      bloodType: rawBloodType ? toString(rawBloodType).toUpperCase().replace(/[^A-Z0-9_]/g, '_') : 'UNKNOWN',
      grade: getOptionalString(rawGrade),
      homeroom: getOptionalString(rawHomeroom),
      studentEmiratesId: getOptionalString(rawStudentEmiratesId),
      parentName: toString(rawParentName) || 'Not Provided',
      parentPhone: toString(rawParentPhone) || 'Not Provided',
      parentEmail: getOptionalString(rawParentEmail),
      emergencyContact: toString(rawEmergencyContact) || 'Not Provided',
      emergencyPhone: toString(rawEmergencyPhone) || 'Not Provided',
      address: getOptionalString(rawAddress),
      allergies: getOptionalString(rawAllergies),
      chronicConditions: getOptionalString(rawChronicConditions),
      medications: getOptionalString(rawMedications),
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
      let csvData: any[] = [];
      
      // Check file type and parse accordingly
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Excel files
        csvData = await parseExcel(file);
      } else if (fileExtension === 'txt') {
        // Text files (tab-delimited, comma-delimited, etc.)
        csvData = await parseTextFile(file);
      } else {
        // CSV files
        csvData = await parseCSV(file);
      }

      // Debug: Log first row to see what we're getting
      if (csvData.length > 0) {
        console.log('First CSV row:', csvData[0]);
        console.log('First mapped student:', mapCSVToStudent(csvData[0]));
      }

      const students = csvData.map(mapCSVToStudent).filter((s) => s.studentId && s.studentId.trim() !== '');

      if (students.length === 0) {
        alert('No valid student data found in the file. Please check that the file contains studentId, firstName, lastName, and other required fields.');
        setLoading(false);
        return;
      }

      // Debug: Log sample student before sending
      console.log('Sample student to import:', students[0]);

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
        // Show detailed error message
        let errorMessage = result.error || 'Import failed';
        if (result.message) {
          errorMessage = result.message;
        } else if (result.details && Array.isArray(result.details)) {
          const details = result.details.map((err: any) => {
            const path = err.path?.join('.') || 'unknown';
            return `${path}: ${err.message}`;
          }).join('\n');
          errorMessage = `Validation error:\n${details}`;
        }
        alert(errorMessage);
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Import File *</label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-2 text-sm text-gray-500">
              Supported formats: CSV, Excel (.xlsx, .xls), Text (.txt). Text files can be tab-delimited, comma-delimited, or pipe-delimited. Columns: studentId, firstName, lastName, dateOfBirth, gender, nationality, bloodType, grade, homeroom, studetnemiratesid (or studentEmiratesId), parentName, parentPhone, parentEmail, emergencyContact, emergencyPhone, address, allergies, chronicConditions, medications
            </p>
          </div>

          {importResults && (
            <div className={`p-4 rounded-lg ${
              (importResults.results.errors.length > 0 || importResults.results.skipped > 0)
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-green-50 border border-green-200'
            }`}>
              <h3 className="font-semibold mb-2">{importResults.message}</h3>
              <p className="text-sm">
                Created: {importResults.results.created} | Updated: {importResults.results.updated}
                {importResults.results.skipped > 0 && ` | Skipped: ${importResults.results.skipped}`}
              </p>
              {importResults.results.validationErrors && importResults.results.validationErrors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Validation Errors (Skipped Records):</p>
                  <ul className="text-sm list-disc list-inside mt-1 max-h-40 overflow-y-auto">
                    {importResults.results.validationErrors.slice(0, 20).map((error: string, idx: number) => (
                      <li key={idx} className="text-xs">{error}</li>
                    ))}
                  </ul>
                  {importResults.results.validationErrors.length > 20 && (
                    <p className="text-sm mt-1">... and {importResults.results.validationErrors.length - 20} more validation errors</p>
                  )}
                </div>
              )}
              {importResults.results.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Processing Errors:</p>
                  <ul className="text-sm list-disc list-inside mt-1 max-h-40 overflow-y-auto">
                    {importResults.results.errors.slice(0, 10).map((error: string, idx: number) => (
                      <li key={idx} className="text-xs">{error}</li>
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
          <h3 className="font-semibold text-blue-900 mb-2">File Format Guide</h3>
          <p className="text-sm text-blue-800 mb-2">
            Your file (CSV, Excel, or Text) should have the following columns (first row should be headers):
          </p>
          <p className="text-sm text-blue-700 mb-2">
            <strong>Text files (.txt):</strong> Can use tab, comma, pipe (|), or semicolon (;) as delimiters. The system will automatically detect the delimiter.
          </p>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>studentId (required)</li>
            <li>firstName (required)</li>
            <li>lastName (required)</li>
            <li>dateOfBirth (required, format: YYYY-MM-DD)</li>
            <li>gender (required: MALE or FEMALE)</li>
            <li>nationality (optional)</li>
            <li>bloodType (optional)</li>
            <li>grade (optional)</li>
            <li>homeroom (optional)</li>
            <li>studetnemiratesid or studentEmiratesId (optional)</li>
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


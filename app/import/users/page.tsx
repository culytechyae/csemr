'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';

interface School {
  id: string;
  name: string;
  code: string;
}

export default function ImportUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
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
        }
      });

    fetch('/api/schools')
      .then((res) => res.json())
      .then((data) => setSchools(data));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const users = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      if (values.length !== headers.length) continue;

      const user: any = {};
      headers.forEach((header, index) => {
        user[header.toLowerCase().replace(/\s+/g, '')] = values[index] || '';
      });
      users.push(user);
    }

    return users;
  };

  const mapCSVToUser = (csvRow: any, schoolMap: Map<string, string>) => {
    const schoolCode = csvRow.schoolcode || csvRow['school code'] || '';
    const schoolId = schoolMap.get(schoolCode) || null;

    return {
      email: csvRow.email || '',
      password: csvRow.password || '',
      firstName: csvRow.firstname || csvRow['first name'] || '',
      lastName: csvRow.lastname || csvRow['last name'] || '',
      role: (csvRow.role || 'STAFF').toUpperCase(),
      schoolId: schoolId,
      isActive: csvRow.isactive !== 'false' && csvRow['is active'] !== 'false',
    };
  };

  const handleImport = async () => {
    if (!file) {
      alert('Please select a CSV file');
      return;
    }

    setLoading(true);
    setImportResults(null);

    try {
      const text = await file.text();
      const csvData = parseCSV(text);

      // Create school code to ID map
      const schoolMap = new Map<string, string>();
      schools.forEach((school) => {
        schoolMap.set(school.code, school.id);
      });

      // For clinic managers, auto-assign their school
      if (userRole === 'CLINIC_MANAGER' && userSchoolId) {
        csvData.forEach((row) => {
          if (!row.schoolcode && !row['school code']) {
            row.schoolcode = schools.find((s) => s.id === userSchoolId)?.code || '';
          }
        });
      }

      const users = csvData
        .map((row) => mapCSVToUser(row, schoolMap))
        .filter((u) => u.email);

      if (users.length === 0) {
        alert('No valid user data found in the file');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/import/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users }),
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Import Users</h1>
        <p className="text-gray-600 mb-6">Import users from CSV file. Existing users will be updated.</p>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CSV File *</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-2 text-sm text-gray-500">
              CSV format: email, password, firstName, lastName, role, schoolCode, isActive
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
              disabled={loading || !file}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import Users'}
            </button>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">CSV Format Guide</h3>
          <p className="text-sm text-blue-800 mb-2">
            Your CSV file should have the following columns (first row should be headers):
          </p>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>email (required, unique)</li>
            <li>password (optional, default: password123)</li>
            <li>firstName (required)</li>
            <li>lastName (required)</li>
            <li>role (required: ADMIN, CLINIC_MANAGER, DOCTOR, NURSE, STAFF)</li>
            <li>schoolCode (required for non-admin users, use school code like SCH001)</li>
            <li>isActive (optional, default: true)</li>
          </ul>
          <p className="text-sm text-blue-800 mt-2">
            <strong>Note:</strong> Existing users with the same email will be updated. Non-admin users must have a schoolCode.
          </p>
        </div>
      </div>
    </Layout>
  );
}


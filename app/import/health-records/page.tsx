'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import * as XLSX from 'xlsx';

interface School {
  id: string;
  name: string;
  code: string;
}

// Header mapping for various column name formats
const HEADER_MAP: Record<string, string[]> = {
  studentNumber: [
    'student no', 'student no.', 'studentno', 'student id', 'studentid',
    'esis', 'esis no', 'esis no.', 'student number', 'id', 'student #',
  ],
  height: ['height', 'height (cm)', 'height cm', 'ht', 'ht (cm)'],
  weight: ['weight', 'weight (kg)', 'weight kg', 'wt', 'wt (kg)'],
  colorBlindness: ['color blindness', 'colour blindness', 'color blind', 'colour blind', 'colorblindness'],
  visionTestingPerformed: [
    'vision testing performed', 'vision testing', 'vision test', 'vision test performed',
  ],
  visionTestingNotPerformedReason: [
    'vision testing not performed reason', 'reason not performed', 'not performed reason',
  ],
  correctiveLenses: ['corrective lenses', 'corrective lens', 'lenses', 'glasses'],
  correctiveLensesOtherReason: [
    'corrective lenses other reason', 'other reason', 'lenses other',
  ],
  rightEye: ['right eye', 'right eye acuity', 'od', 're'],
  leftEye: ['left eye', 'left eye acuity', 'os', 'le'],
  rightEyeWithCorrection: [
    'right eye with correction', 'right eye (with correction)', 'right eye corrected',
    'od corrected', 'od with correction', 're corrected',
  ],
  leftEyeWithCorrection: [
    'left eye with correction', 'left eye (with correction)', 'left eye corrected',
    'os corrected', 'os with correction', 'le corrected',
  ],
  visionScreeningResult: [
    'vision screening result', 'vision result', 'screening result',
    'vision screening', 'overall result',
  ],
};

function matchHeader(header: string): string | null {
  const normalized = header
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\/\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[()]/g, '')
    .trim();

  for (const [field, patterns] of Object.entries(HEADER_MAP)) {
    for (const pattern of patterns) {
      if (normalized === pattern || normalized.includes(pattern)) {
        return field;
      }
    }
  }
  return null;
}

export default function ImportHealthRecordsPage() {
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [userRole, setUserRole] = useState('');
  const [userSchoolId, setUserSchoolId] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [totalRows, setTotalRows] = useState(0);

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
      .then((data) => setSchools(data));
  }, []);

  const detectDelimiter = (line: string): string => {
    const delimiters = ['\t', ',', '|', ';'];
    let maxCount = 0;
    let detectedDelimiter = ',';
    for (const delimiter of delimiters) {
      const count = (
        line.match(
          new RegExp(delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        ) || []
      ).length;
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

          const headerLine = lines[0].replace(/^\uFEFF/, '');
          const delimiter = detectDelimiter(headerLine);
          const headers = headerLine.split(delimiter).map((h) => h.trim());

          // Map headers to our field names
          const headerFieldMap: (string | null)[] = headers.map((h) =>
            matchHeader(h)
          );

          const records: any[] = [];

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Split with quote handling
            const values: string[] = [];
            let currentValue = '';
            let inQuotes = false;
            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === delimiter && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
              } else {
                currentValue += char;
              }
            }
            values.push(currentValue.trim());

            while (values.length < headers.length) {
              values.push('');
            }

            const record: any = {};
            headerFieldMap.forEach((field, index) => {
              if (field) {
                const value = (values[index] || '').trim().replace(/^"|"$/g, '');
                record[field] = value;
              }
            });

            if (record.studentNumber) {
              records.push(record);
            }
          }

          resolve(records);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
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

          const records = jsonData
            .map((row: any) => {
              const record: any = {};
              for (const key of Object.keys(row)) {
                const field = matchHeader(key);
                if (field) {
                  record[field] = String(row[key] || '').trim();
                }
              }
              return record;
            })
            .filter((r: any) => r.studentNumber);

          resolve(records);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImportResults(null);
      setShowPreview(false);
      setPreviewData([]);
      setTotalRows(0);

      try {
        let allData: any[] = [];
        const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

        if (fileExtension === 'csv' || fileExtension === 'txt') {
          allData = await parseTextFile(selectedFile);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          allData = await parseExcel(selectedFile);
        }

        if (allData.length > 0) {
          setTotalRows(allData.length);
          setPreviewData(allData.slice(0, 5));
          setShowPreview(true);
        }
      } catch (error) {
        console.error('Preview error:', error);
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }
    if (!selectedSchoolId) {
      alert('Please select a school');
      return;
    }

    setLoading(true);
    setImportResults(null);

    try {
      let records: any[] = [];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv' || fileExtension === 'txt') {
        records = await parseTextFile(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        records = await parseExcel(file);
      } else {
        alert('Unsupported file format. Please use CSV or Excel files.');
        setLoading(false);
        return;
      }

      if (records.length === 0) {
        alert('No valid health record data found in the file');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/import/health-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: selectedSchoolId,
          records,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setImportResults(result);
      } else {
        alert(result.error || 'Import failed');
        setImportResults(result);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      alert(`Import failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Bulk Import', href: '/import' },
          { label: 'Import Health Records' },
        ]}
      />

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Import Health Records
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Import student physical measurements and vision screening data from
              CSV or Excel files
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-teal-900 mb-2 flex items-center gap-2">
              <span>ℹ️</span> Import Information
            </h3>
            <ul className="text-sm text-teal-800 list-disc list-inside space-y-1">
              <li>
                Students must be imported <strong>before</strong> importing
                health records
              </li>
              <li>
                Student numbers (ESIS No. / Student ID) must match exactly
              </li>
              <li>
                If a health record already exists for a student, it will be{' '}
                <strong>updated</strong>
              </li>
              <li>BMI is auto-calculated when both height and weight are provided</li>
              <li>
                Height should be in <strong>centimeters (cm)</strong>, Weight in{' '}
                <strong>kilograms (kg)</strong>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            {/* School Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                disabled={userRole !== 'ADMIN' && userSchoolId !== ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
              >
                <option value="">Select a school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.code})
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Health Records File <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={handleFileChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
                {file && (
                  <span className="text-sm text-gray-600">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Expected Columns:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 font-bold">*</span>
                    <span>
                      <strong>Student No.</strong> / ESIS No. / Student ID
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">○</span>
                    <span>
                      <strong>Height (cm)</strong> — e.g. 145
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">○</span>
                    <span>
                      <strong>Weight (kg)</strong> — e.g. 42.5
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">○</span>
                    <span>
                      <strong>Color Blindness</strong> — Normal / Abnormal
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">○</span>
                    <span>
                      <strong>Vision Testing Performed</strong> — Yes / No
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">○</span>
                    <span>
                      <strong>Corrective Lenses</strong> — None / Glasses / Contact lenses / etc.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">○</span>
                    <span>
                      <strong>Right Eye</strong> — e.g. 6/6
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">○</span>
                    <span>
                      <strong>Left Eye</strong> — e.g. 6/6
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">○</span>
                    <span>
                      <strong>Right Eye (with Correction)</strong> — e.g. 6/6
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">○</span>
                    <span>
                      <strong>Left Eye (with Correction)</strong> — e.g. 6/6
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">○</span>
                    <span>
                      <strong>Vision Screening Result</strong> — Normal / Abnormal
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  <span className="text-red-500 font-bold">*</span> = Required.
                  All other columns are optional.
                </p>
              </div>
            </div>

            {/* File Preview */}
            {showPreview && previewData.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    File Preview (First {Math.min(5, totalRows)} of {totalRows} rows)
                  </h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Hide
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1 border border-gray-300 text-left">
                          Student No.
                        </th>
                        <th className="px-2 py-1 border border-gray-300 text-left">
                          Height
                        </th>
                        <th className="px-2 py-1 border border-gray-300 text-left">
                          Weight
                        </th>
                        <th className="px-2 py-1 border border-gray-300 text-left">
                          Color Blind
                        </th>
                        <th className="px-2 py-1 border border-gray-300 text-left">
                          Vision Test
                        </th>
                        <th className="px-2 py-1 border border-gray-300 text-left">
                          Corrective Lens
                        </th>
                        <th className="px-2 py-1 border border-gray-300 text-left">
                          R.Eye
                        </th>
                        <th className="px-2 py-1 border border-gray-300 text-left">
                          L.Eye
                        </th>
                        <th className="px-2 py-1 border border-gray-300 text-left">
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((record, index) => (
                        <tr key={index} className="bg-white">
                          <td className="px-2 py-1 border border-gray-300">
                            {record.studentNumber || '-'}
                          </td>
                          <td className="px-2 py-1 border border-gray-300">
                            {record.height || '-'}
                          </td>
                          <td className="px-2 py-1 border border-gray-300">
                            {record.weight || '-'}
                          </td>
                          <td className="px-2 py-1 border border-gray-300">
                            {record.colorBlindness || '-'}
                          </td>
                          <td className="px-2 py-1 border border-gray-300">
                            {record.visionTestingPerformed || '-'}
                          </td>
                          <td className="px-2 py-1 border border-gray-300">
                            {record.correctiveLenses || '-'}
                          </td>
                          <td className="px-2 py-1 border border-gray-300">
                            {record.rightEye || '-'}
                          </td>
                          <td className="px-2 py-1 border border-gray-300">
                            {record.leftEye || '-'}
                          </td>
                          <td className="px-2 py-1 border border-gray-300">
                            {record.visionScreeningResult || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Button */}
            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={loading || !file || !selectedSchoolId}
                className="flex-1 bg-teal-600 text-white py-3 px-6 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Importing Health Records...</span>
                  </>
                ) : (
                  <>
                    <span>📥</span>
                    <span>Import Health Records</span>
                  </>
                )}
              </button>
              {file && (
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewData([]);
                    setShowPreview(false);
                    setImportResults(null);
                    setTotalRows(0);
                  }}
                  disabled={loading}
                  className="px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Import Results */}
            {importResults && (
              <div
                className={`mt-6 p-5 rounded-lg border-2 ${
                  importResults.success
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">
                    {importResults.success ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <h3
                      className={`font-bold text-lg mb-1 ${
                        importResults.success ? 'text-green-900' : 'text-red-900'
                      }`}
                    >
                      {importResults.success
                        ? 'Import Successful!'
                        : 'Import Failed'}
                    </h3>
                    <p
                      className={`text-sm ${
                        importResults.success ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {importResults.message}
                    </p>
                  </div>
                </div>

                {importResults.results && (
                  <div className="bg-white rounded-md p-4 border border-gray-200">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {importResults.results.created || 0}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Created</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {importResults.results.updated || 0}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Updated</div>
                      </div>
                      {importResults.results.skipped > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {importResults.results.skipped || 0}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Skipped</div>
                        </div>
                      )}
                      {(importResults.results.errors?.length || 0) > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {importResults.results.errors?.length || 0}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Errors</div>
                        </div>
                      )}
                    </div>

                    {importResults.results.errors &&
                      importResults.results.errors.length > 0 && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <p className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                            <span>⚠️</span> Errors (
                            {importResults.results.errors.length})
                          </p>
                          <div className="bg-red-50 rounded p-3 max-h-60 overflow-y-auto">
                            <ul className="list-disc list-inside space-y-1 text-red-700 text-xs">
                              {importResults.results.errors
                                .slice(0, 30)
                                .map((error: string, index: number) => (
                                  <li key={index}>{error}</li>
                                ))}
                              {importResults.results.errors.length > 30 && (
                                <li className="italic text-red-600">
                                  ... and{' '}
                                  {importResults.results.errors.length - 30} more
                                  errors
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}

                    {importResults.results.validationErrors &&
                      importResults.results.validationErrors.length > 0 && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <p className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                            <span>ℹ️</span> Validation Warnings (
                            {importResults.results.validationErrors.length})
                          </p>
                          <div className="bg-yellow-50 rounded p-3 max-h-60 overflow-y-auto">
                            <ul className="list-disc list-inside space-y-1 text-yellow-700 text-xs">
                              {importResults.results.validationErrors
                                .slice(0, 30)
                                .map((error: string, index: number) => (
                                  <li key={index}>{error}</li>
                                ))}
                              {importResults.results.validationErrors.length >
                                30 && (
                                <li className="italic text-yellow-600">
                                  ... and{' '}
                                  {importResults.results.validationErrors.length -
                                    30}{' '}
                                  more warnings
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {importResults.success && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Next Steps:</strong> Imported health records are now
                      available in each student&apos;s Health Records section. You can
                      view or edit them from the student profile or the Health
                      Records page.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}


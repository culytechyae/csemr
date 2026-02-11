'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import * as XLSX from 'xlsx';

interface School {
  id: string;
  name: string;
  code: string;
}

export default function ImportAssessmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [userSchoolId, setUserSchoolId] = useState<string>('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

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
      });
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImportResults(null);
      setShowPreview(false);
      setPreviewData([]);

      // Preview file data
      try {
        let preview: any[] = [];
        const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'csv' || fileExtension === 'txt') {
          preview = await parseTextFile(selectedFile);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          preview = await parseExcel(selectedFile);
        }
        
        if (preview.length > 0) {
          setPreviewData(preview.slice(0, 5));
          setShowPreview(true);
        }
      } catch (error) {
        console.error('Preview error:', error);
      }
    }
  };

  const detectDelimiter = (line: string): string => {
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

          const headerLine = lines[0].replace(/^\uFEFF/, '');
          const delimiter = detectDelimiter(headerLine);
          
          const headers = headerLine.split(delimiter).map((h) => {
            return h.trim()
              .replace(/[\u200B-\u200D\uFEFF]/g, '')
              .toLowerCase()
              .replace(/\s+/g, ' ')
              .replace(/[\/]/g, ' ')
              .trim();
          });

          const assessments = [];

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

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
            
            if (values.length < headers.length) {
              while (values.length < headers.length) {
                values.push('');
              }
            }

            const assessment: any = {};
            headers.forEach((header, index) => {
              const value = (values[index] || '').trim().replace(/^"|"$/g, '');
              
              // Map various header formats
              // Match student number/ID columns but NOT student name columns
              if (header.includes('esis') || header.includes('studentno') || 
                  (header.includes('student') && (header.includes('no') || header.includes('id') || header.includes('#') || header.includes('number'))) ||
                  header === 'student no' || header === 'student no.') {
                assessment.studentNumber = value;
              } else if (header.includes('student') && header.includes('name')) {
                assessment.studentName = value; // Store name separately for fallback matching
              } else if (header.includes('date') && !header.includes('time')) {
                assessment.visitDate = value;
              } else if (header.includes('time-in') || (header.includes('time') && header.includes('in'))) {
                assessment.visitTime = value;
              } else if (header.includes('temperature') || header.includes('temp')) {
                assessment.temperature = value;
              } else if (header.includes('blood') && header.includes('pressure') && (header.includes('systolic') || header.includes('sys'))) {
                assessment.bloodPressureSystolic = value;
              } else if (header.includes('blood') && header.includes('pressure') && (header.includes('diastolic') || header.includes('dias'))) {
                assessment.bloodPressureDiastolic = value;
              } else if (header.includes('heart') && header.includes('rate')) {
                assessment.heartRate = value;
              } else if (header.includes('respiratory') && header.includes('rate')) {
                assessment.respiratoryRate = value;
              } else if (header.includes('oxygen') || header.includes('spo2') || header.includes('o2')) {
                assessment.oxygenSaturation = value;
              } else if (header.includes('height')) {
                assessment.height = value;
              } else if (header.includes('weight')) {
                assessment.weight = value;
              } else if (header.includes('pain') && header.includes('scale')) {
                assessment.painScale = value;
              } else if (header.includes('bmi')) {
                // BMI will be calculated automatically
              }
            });
            
            if (assessment.studentNumber && assessment.visitDate) {
              assessments.push(assessment);
            }
          }

          resolve(assessments);
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
          
          const assessments = jsonData.map((row: any) => {
            const assessment: any = {};
            
            Object.keys(row).forEach((key) => {
              const lowerKey = key.toLowerCase();
              const value = String(row[key] || '').trim();
              
              // Match student number/ID columns but NOT student name columns
              if (lowerKey.includes('esis') || 
                  (lowerKey.includes('student') && (lowerKey.includes('no') || lowerKey.includes('id') || lowerKey.includes('#') || lowerKey.includes('number')))) {
                assessment.studentNumber = value;
              } else if (lowerKey.includes('student') && lowerKey.includes('name')) {
                assessment.studentName = value; // Store name separately for fallback matching
              } else if (lowerKey.includes('date') && !lowerKey.includes('time')) {
                assessment.visitDate = value;
              } else if (lowerKey.includes('time-in') || (lowerKey.includes('time') && lowerKey.includes('in'))) {
                assessment.visitTime = value;
              } else if (lowerKey.includes('temperature') || lowerKey.includes('temp')) {
                assessment.temperature = value;
              } else if (lowerKey.includes('blood') && lowerKey.includes('pressure') && (lowerKey.includes('systolic') || lowerKey.includes('sys'))) {
                assessment.bloodPressureSystolic = value;
              } else if (lowerKey.includes('blood') && lowerKey.includes('pressure') && (lowerKey.includes('diastolic') || lowerKey.includes('dias'))) {
                assessment.bloodPressureDiastolic = value;
              } else if (lowerKey.includes('heart') && lowerKey.includes('rate')) {
                assessment.heartRate = value;
              } else if (lowerKey.includes('respiratory') && lowerKey.includes('rate')) {
                assessment.respiratoryRate = value;
              } else if (lowerKey.includes('oxygen') || lowerKey.includes('spo2') || lowerKey.includes('o2')) {
                assessment.oxygenSaturation = value;
              } else if (lowerKey.includes('height')) {
                assessment.height = value;
              } else if (lowerKey.includes('weight')) {
                assessment.weight = value;
              } else if (lowerKey.includes('pain') && lowerKey.includes('scale')) {
                assessment.painScale = value;
              }
            });
            
            return assessment;
          }).filter((a: any) => a.studentNumber && a.visitDate);
          
          resolve(assessments);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleImport = async () => {
    if (!file) {
      alert('Please select a CSV or Excel file');
      return;
    }

    if (!selectedSchoolId) {
      alert('Please select a school');
      return;
    }

    setLoading(true);
    setImportResults(null);

    try {
      let assessments: any[] = [];
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'csv' || fileExtension === 'txt') {
        assessments = await parseTextFile(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        assessments = await parseExcel(file);
      } else {
        alert('Unsupported file format. Please use CSV or Excel files.');
        setLoading(false);
        return;
      }

      if (assessments.length === 0) {
        alert('No valid assessment data found in the file');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/import/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          schoolId: selectedSchoolId,
          assessments: assessments 
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
      <Breadcrumb items={[
        { label: 'Home', href: '/dashboard' },
        { label: 'Import Assessments', href: '/import/assessments' },
      ]} />
      
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Import Backdated Assessments</h1>
              <p className="text-sm text-gray-600 mt-1">Import historical clinical assessment data from CSV or Excel files</p>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span>ℹ️</span> Important Information
            </h3>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li><strong>Visits must be imported first</strong> - Assessments are linked to visits</li>
              <li>Student numbers must match exactly (case-sensitive, no spaces)</li>
              <li>Date format: <strong>DD/MM/YYYY</strong> (e.g., 01/05/2026)</li>
              <li>Time format: <strong>HH:MM</strong> in 24-hour format (e.g., 08:54)</li>
              <li>Assessments will be linked to visits by matching student number and date/time</li>
              <li>If an assessment already exists for a visit, it will be updated</li>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
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
                Assessment Data File <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={handleFileChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {file && (
                  <span className="text-sm text-gray-600">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-500">
                  <strong>Supported formats:</strong> CSV, Excel (.xlsx, .xls), Text (.txt)
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Required columns:</strong> Date, ESIS No. / STUDENT No.
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Optional columns:</strong> TIME-IN, Temperature, Blood Pressure (Systolic/Diastolic), Heart Rate, Respiratory Rate, Oxygen Saturation, Height, Weight, Pain Scale, and other assessment fields
                </p>
              </div>
            </div>

            {/* File Preview */}
            {showPreview && previewData.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">File Preview (First 5 rows)</h3>
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
                        <th className="px-2 py-1 border border-gray-300 text-left">Student No.</th>
                        <th className="px-2 py-1 border border-gray-300 text-left">Date</th>
                        <th className="px-2 py-1 border border-gray-300 text-left">Time</th>
                        <th className="px-2 py-1 border border-gray-300 text-left">Temperature</th>
                        <th className="px-2 py-1 border border-gray-300 text-left">Heart Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((assessment, index) => (
                        <tr key={index} className="bg-white">
                          <td className="px-2 py-1 border border-gray-300">{assessment.studentNumber || '-'}</td>
                          <td className="px-2 py-1 border border-gray-300">{assessment.visitDate || '-'}</td>
                          <td className="px-2 py-1 border border-gray-300">{assessment.visitTime || '-'}</td>
                          <td className="px-2 py-1 border border-gray-300">{assessment.temperature || '-'}</td>
                          <td className="px-2 py-1 border border-gray-300">{assessment.heartRate || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Total rows detected: {previewData.length === 5 ? '5+ (showing first 5)' : previewData.length}
                </p>
              </div>
            )}

            {/* Import Button */}
            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={loading || !file || !selectedSchoolId}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Importing Assessments...</span>
                  </>
                ) : (
                  <>
                    <span>📥</span>
                    <span>Import Assessments</span>
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
                  }}
                  disabled={loading}
                  className="px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Import Results */}
            {importResults && (
              <div className={`mt-6 p-5 rounded-lg border-2 ${
                importResults.success 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">
                    {importResults.success ? '✅' : '❌'}
                  </span>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg mb-1 ${
                      importResults.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {importResults.success ? 'Import Successful!' : 'Import Failed'}
                    </h3>
                    <p className={`text-sm ${
                      importResults.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {importResults.message}
                    </p>
                  </div>
                </div>
                
                {importResults.results && (
                  <div className="bg-white rounded-md p-4 border border-gray-200">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold text-green-600`}>
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

                    {importResults.results.errors && importResults.results.errors.length > 0 && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <p className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                          <span>⚠️</span> Errors ({importResults.results.errors.length})
                        </p>
                        <div className="bg-red-50 rounded p-3 max-h-60 overflow-y-auto">
                          <ul className="list-disc list-inside space-y-1 text-red-700 text-xs">
                            {importResults.results.errors.slice(0, 30).map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importResults.results.errors.length > 30 && (
                              <li className="italic text-red-600">
                                ... and {importResults.results.errors.length - 30} more errors
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
                      <strong>Next Steps:</strong> Imported assessments are now linked to their visits. 
                      View any visit details to see the assessment data.
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


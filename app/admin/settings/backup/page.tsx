'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function BackupRestorePage() {
  const [backupStatus, setBackupStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBackup = async () => {
    try {
      setIsLoading(true);
      setBackupStatus('Creating backup... This may take a few moments.');
      
      const response = await fetch('/api/admin/backup');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create backup' }));
        throw new Error(errorData.error || 'Failed to create backup');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'backup.zip'
        : 'backup.zip';
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Get the default download folder path based on OS
      const getDownloadPath = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();
        const isWindows = userAgent.includes('win') || platform.includes('win');
        const isMac = userAgent.includes('mac') || platform.includes('mac');
        const isLinux = userAgent.includes('linux') || platform.includes('linux');
        
        if (isWindows) {
          // Windows default Downloads folder - show typical path
          return `C:\\Users\\[YourUsername]\\Downloads\\${filename}`;
        } else if (isMac) {
          // macOS default Downloads folder
          return `~/Downloads/${filename}`;
        } else if (isLinux) {
          // Linux default Downloads folder
          return `~/Downloads/${filename}`;
        }
        return `Downloads/${filename}`;
      };
      
      const downloadPath = getDownloadPath();
      
      setBackupStatus(`✅ Backup created successfully! The download should start automatically. The backup file "${filename}" will be saved to your Downloads folder. Full path: ${downloadPath}. The backup includes all tables exported to Excel (.xlsx) and SQL (.sql) formats.`);
    } catch (error) {
      console.error('Backup error:', error);
      setBackupStatus(`❌ Error creating backup: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Backup & Restore</h1>
            <p className="text-gray-600">Manage database backups and restore operations</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Admin
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Backup</h2>
            <p className="text-sm text-gray-600 mb-4">
              Create a full database backup. The backup will include all tables exported to both Excel (.xlsx) and SQL (.sql) formats, packaged in a ZIP file for easy download.
            </p>
            <button
              onClick={handleBackup}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Backup...' : 'Create Backup Now'}
            </button>
            {backupStatus && (
              <div className={`mt-4 p-4 rounded-lg ${backupStatus.startsWith('✅') ? 'bg-green-50 border border-green-200' : backupStatus.startsWith('❌') ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                <p className={`text-sm ${backupStatus.startsWith('✅') ? 'text-green-800' : backupStatus.startsWith('❌') ? 'text-red-800' : 'text-gray-800'}`}>
                  {backupStatus}
                </p>
                {backupStatus.startsWith('✅') && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-1">💡 Backup Location:</p>
                    <p className="text-xs text-green-600 font-mono bg-green-100 p-2 rounded">
                      {backupStatus.includes('Full path:') 
                        ? backupStatus.split('Full path:')[1]?.split('. The backup includes')[0]?.trim() || 'Downloads folder'
                        : 'Your browser\'s default Downloads folder'}
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      The backup file is automatically downloaded to your browser's default Downloads folder. 
                      Check your browser's download history or the Downloads folder on your computer.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Restore from Backup</h2>
            <p className="text-sm text-gray-600 mb-4">
              Restore the database from a previous backup. This will replace all current data.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Backup File</label>
                <input
                  type="file"
                  accept=".sql,.backup"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                onClick={() => {
                  if (confirm('WARNING: This will replace all current data. Are you sure?')) {
                    alert('Restore functionality will be implemented');
                  }
                }}
              >
                Restore from Backup
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Backup Schedule</h2>
            <p className="text-sm text-gray-600 mb-4">
              Automated backups are configured at the server level. Contact system administrator for schedule details.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}


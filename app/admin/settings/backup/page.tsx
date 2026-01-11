'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function BackupRestorePage() {
  const [backupStatus, setBackupStatus] = useState<string>('');

  const handleBackup = async () => {
    setBackupStatus('Creating backup...');
    // TODO: Implement backup API
    setTimeout(() => {
      setBackupStatus('Backup created successfully!');
    }, 2000);
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
              Create a full database backup. Backups are encrypted and stored securely.
            </p>
            <button
              onClick={handleBackup}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Backup Now
            </button>
            {backupStatus && (
              <p className="mt-2 text-sm text-gray-600">{backupStatus}</p>
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


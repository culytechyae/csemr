'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState({
    emailOnNewUser: true,
    emailOnFailedLogin: true,
    emailOnAccountLocked: true,
    emailOnPasswordExpiry: true,
    emailOnSecurityAlert: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API endpoint
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Layout>
      <div className="max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Settings</h1>
            <p className="text-gray-600">Configure email notification preferences</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Admin
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailOnNewUser}
                onChange={(e) => setSettings({ ...settings, emailOnNewUser: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 block text-sm text-gray-900">Email on new user creation</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailOnFailedLogin}
                onChange={(e) => setSettings({ ...settings, emailOnFailedLogin: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 block text-sm text-gray-900">Email on failed login attempts</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailOnAccountLocked}
                onChange={(e) => setSettings({ ...settings, emailOnAccountLocked: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 block text-sm text-gray-900">Email on account lockout</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailOnPasswordExpiry}
                onChange={(e) => setSettings({ ...settings, emailOnPasswordExpiry: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 block text-sm text-gray-900">Email on password expiration</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailOnSecurityAlert}
                onChange={(e) => setSettings({ ...settings, emailOnSecurityAlert: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 block text-sm text-gray-900">Email on security alerts</span>
            </label>
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
              Settings saved successfully!
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Link
              href="/admin"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}


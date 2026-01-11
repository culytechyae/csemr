'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

interface School {
  id: string;
  name: string;
  code: string;
}

interface HL7Config {
  schoolId: string;
  sendingApplication: string;
  sendingFacility: string;
  receivingApplication: string;
  receivingFacility: string;
  autoSend: boolean;
  retryAttempts: number;
  school?: School;
}

export default function HL7SettingsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [settings, setSettings] = useState({
    sendingApplication: 'SchoolClinicEMR',
    sendingFacility: '',
    receivingApplication: 'Rhapsody',
    receivingFacility: 'MALAFFI',
    autoSend: true,
    retryAttempts: 3,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/schools')
      .then((res) => res.json())
      .then((data: School[]) => {
        setSchools(data);
        if (data.length > 0) {
          setSelectedSchoolId(data[0].id);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching schools:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedSchoolId) {
      const selectedSchool = schools.find((s) => s.id === selectedSchoolId);
      fetch(`/api/schools/${selectedSchoolId}/hl7-config`)
        .then((res) => res.json())
        .then((data: HL7Config) => {
          setSettings({
            sendingApplication: data.sendingApplication || 'SchoolClinicEMR',
            sendingFacility: data.sendingFacility || selectedSchool?.code || '',
            receivingApplication: data.receivingApplication || 'Rhapsody',
            receivingFacility: data.receivingFacility || 'MALAFFI',
            autoSend: data.autoSend !== undefined ? data.autoSend : true,
            retryAttempts: data.retryAttempts || 3,
          });
        })
        .catch((error) => {
          console.error('Error fetching HL7 config:', error);
          // Set defaults if fetch fails
          if (selectedSchool) {
            setSettings({
              sendingApplication: 'SchoolClinicEMR',
              sendingFacility: selectedSchool.code,
              receivingApplication: 'Rhapsody',
              receivingFacility: 'MALAFFI',
              autoSend: true,
              retryAttempts: 3,
            });
          }
        });
    }
  }, [selectedSchoolId, schools]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) {
      alert('Please select a school');
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch(`/api/schools/${selectedSchoolId}/hl7-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save settings');
      }
    } catch (error) {
      alert('An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Admin', href: '/admin' },
            { label: 'HL7 Configuration' },
          ]}
        />
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">HL7 Configuration</h1>
            <p className="text-gray-600">Configure HL7 message settings and integration for each school</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Admin
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select School</label>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a school</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} ({school.code})
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Each school can have different HL7 configuration codes
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Sending Application</label>
              <input
                type="text"
                value={settings.sendingApplication}
                onChange={(e) => setSettings({ ...settings, sendingApplication: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Sending Facility</label>
              <input
                type="text"
                value={settings.sendingFacility}
                onChange={(e) => setSettings({ ...settings, sendingFacility: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Receiving Application</label>
              <input
                type="text"
                value={settings.receivingApplication}
                onChange={(e) => setSettings({ ...settings, receivingApplication: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Receiving Facility</label>
              <input
                type="text"
                value={settings.receivingFacility}
                onChange={(e) => setSettings({ ...settings, receivingFacility: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoSend}
                onChange={(e) => setSettings({ ...settings, autoSend: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 block text-sm text-gray-900">Automatically send HL7 messages</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Retry Attempts</label>
            <input
              type="number"
              min="0"
              max="10"
              value={settings.retryAttempts}
              onChange={(e) => setSettings({ ...settings, retryAttempts: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
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


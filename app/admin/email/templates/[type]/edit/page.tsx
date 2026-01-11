'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
}

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateType = params.type as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    type: '',
  });

  useEffect(() => {
    fetch(`/api/email/templates/${templateType}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
          router.push('/admin/email/templates');
          return;
        }
        setTemplate(data);
        setFormData({
          name: data.name,
          subject: data.subject,
          body: data.body,
          type: data.type,
        });
        setLoading(false);
      })
      .catch(() => {
        alert('Failed to load template');
        router.push('/admin/email/templates');
      });
  }, [templateType, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/email/templates');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update template');
        setSaving(false);
      }
    } catch (error) {
      alert('An error occurred');
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

  if (!template) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-4xl">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Admin', href: '/admin' },
            { label: 'Email Templates', href: '/admin/email/templates' },
            { label: template.name },
          ]}
        />
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Email Template</h1>
            <p className="text-gray-600">Update the email template for {template.name}</p>
          </div>
          <Link
            href="/admin/email/templates"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Templates
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Template Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Subject *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Use variables like {'{{'}studentName{'}}'}, {'{{'}visitDate{'}}'}, etc.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Body *</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              required
              rows={15}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">Available Variables:</p>
              <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>{'{{firstName}}'} - User first name</li>
                <li>{'{{lastName}}'} - User last name</li>
                <li>{'{{email}}'} - User email</li>
                <li>{'{{role}}'} - User role</li>
                <li>{'{{studentName}}'} - Student full name</li>
                <li>{'{{studentId}}'} - Student ID</li>
                <li>{'{{visitDate}}'} - Visit date</li>
                <li>{'{{visitType}}'} - Visit type</li>
                <li>{'{{chiefComplaint}}'} - Chief complaint</li>
                <li>{'{{diagnosis}}'} - Diagnosis</li>
                <li>{'{{treatment}}'} - Treatment</li>
                <li>{'{{resetLink}}'} - Password reset link</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/email/templates"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}


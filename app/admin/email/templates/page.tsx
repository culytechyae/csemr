'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/email/templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error('Failed to fetch templates:', data.error);
          setLoading(false);
          return;
        }
        setTemplates(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching templates:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Templates</h1>
            <p className="text-gray-600">Manage email templates for system notifications</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Admin
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Subject:</span> {template.subject}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">Type:</span> {template.type}
              </p>
              <Link
                href={`/admin/email/templates/${template.type}/edit`}
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm text-center"
              >
                Edit Template
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}


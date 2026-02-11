'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

interface Vendor {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  companyName: string;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  hasSystemAccess: boolean;
  hasDataAccess: boolean;
  hasNetworkAccess: boolean;
  contractStart?: string;
  contractEnd?: string;
  lastAssessment?: string;
  nextAssessment?: string;
  complianceStatus?: string;
  createdAt: string;
  createdByUser?: {
    firstName: string;
    lastName: string;
  };
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', riskLevel: '', hasSystemAccess: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, [filter]);

  const fetchVendors = () => {
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    if (filter.riskLevel) params.append('riskLevel', filter.riskLevel);
    if (filter.hasSystemAccess) params.append('hasSystemAccess', filter.hasSystemAccess);

    fetch(`/api/security/vendors?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setVendors(data.vendors || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800';
      case 'TERMINATED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Third-Party Vendors</h1>
            <p className="text-gray-600">Manage vendors with system, data, or network access</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Add Vendor
            </button>
            <Link
              href="/admin"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Admin
            </Link>
          </div>
        </div>

        <div className="mb-4 flex space-x-2">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TERMINATED">Terminated</option>
          </select>
          <select
            value={filter.riskLevel}
            onChange={(e) => setFilter({ ...filter, riskLevel: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Risk Levels</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <select
            value={filter.hasSystemAccess}
            onChange={(e) => setFilter({ ...filter, hasSystemAccess: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Access Types</option>
            <option value="true">With System Access</option>
            <option value="false">Without System Access</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor/Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Assessment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No vendors found
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                      <div className="text-xs text-gray-500">{vendor.companyName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{vendor.contactName}</div>
                      <div className="text-xs text-gray-500">{vendor.contactEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(vendor.status)}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getRiskColor(vendor.riskLevel)}`}>
                        {vendor.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {vendor.hasSystemAccess && <span className="block">System</span>}
                      {vendor.hasDataAccess && <span className="block">Data</span>}
                      {vendor.hasNetworkAccess && <span className="block">Network</span>}
                      {!vendor.hasSystemAccess && !vendor.hasDataAccess && !vendor.hasNetworkAccess && <span>None</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vendor.nextAssessment ? new Date(vendor.nextAssessment).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showCreateModal && (
          <CreateVendorModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchVendors();
            }}
          />
        )}
      </div>
    </Layout>
  );
}

function CreateVendorModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    companyName: '',
    address: '',
    riskLevel: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    hasSystemAccess: false,
    hasDataAccess: false,
    hasNetworkAccess: false,
    complianceStatus: '',
    securityCertifications: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/security/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert('Failed to create vendor');
      }
    } catch (error) {
      alert('Error creating vendor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add Vendor</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
              <input
                type="tel"
                required
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level *</label>
              <select
                required
                value={formData.riskLevel}
                onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Types</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasSystemAccess}
                    onChange={(e) => setFormData({ ...formData, hasSystemAccess: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">System Access</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasDataAccess}
                    onChange={(e) => setFormData({ ...formData, hasDataAccess: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Data Access</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasNetworkAccess}
                    onChange={(e) => setFormData({ ...formData, hasNetworkAccess: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Network Access</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compliance Status</label>
              <input
                type="text"
                placeholder="e.g., MALAFFI_COMPLIANT"
                value={formData.complianceStatus || ''}
                onChange={(e) => setFormData({ ...formData, complianceStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Certifications</label>
              <input
                type="text"
                placeholder="e.g., ISO 27001, SOC 2"
                value={formData.securityCertifications || ''}
                onChange={(e) => setFormData({ ...formData, securityCertifications: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


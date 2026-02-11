'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
  category: string;
  reportedByUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedToUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  detectedAt: string;
  containedAt?: string;
  resolvedAt?: string;
  breachConfirmed: boolean;
  createdAt: string;
}

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', severity: '', category: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, [filter]);

  const fetchIncidents = () => {
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    if (filter.severity) params.append('severity', filter.severity);
    if (filter.category) params.append('category', filter.category);

    fetch(`/api/security/incidents?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setIncidents(data.incidents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'INVESTIGATING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONTAINED':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (incident: SecurityIncident) => {
    setSelectedIncident(incident);
    setShowDetailModal(true);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Incidents</h1>
            <p className="text-gray-600">Manage and track security incidents</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Report Incident
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
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="CONTAINED">Contained</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            value={filter.severity}
            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <input
            type="text"
            placeholder="Category filter..."
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detected</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No incidents found
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{incident.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{incident.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded border ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incident.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incident.reportedByUser
                        ? `${incident.reportedByUser.firstName} ${incident.reportedByUser.lastName}`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(incident.detectedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(incident)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showCreateModal && (
          <CreateIncidentModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchIncidents();
            }}
          />
        )}

        {showDetailModal && selectedIncident && (
          <IncidentDetailModal
            incident={selectedIncident}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedIncident(null);
            }}
            onUpdate={fetchIncidents}
          />
        )}
      </div>
    </Layout>
  );
}

function CreateIncidentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM' as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
    category: '',
    affectedSystems: '',
    affectedData: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/security/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert('Failed to create incident');
      }
    } catch (error) {
      alert('Error creating incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Report Security Incident</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
                <select
                  required
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., UNAUTHORIZED_ACCESS"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Affected Systems</label>
              <input
                type="text"
                value={formData.affectedSystems}
                onChange={(e) => setFormData({ ...formData, affectedSystems: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Affected Data</label>
              <input
                type="text"
                value={formData.affectedData}
                onChange={(e) => setFormData({ ...formData, affectedData: e.target.value })}
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
              {submitting ? 'Creating...' : 'Report Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IncidentDetailModal({
  incident,
  onClose,
  onUpdate,
}: {
  incident: SecurityIncident;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [status, setStatus] = useState(incident.status);
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/security/incidents/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setStatus(newStatus as typeof incident.status);
        onUpdate();
      }
    } catch (error) {
      alert('Failed to update incident');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">{incident.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Severity</label>
              <div className="mt-1">
                <span className={`px-2 py-1 text-xs font-semibold rounded border ${
                  incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-300' :
                  incident.severity === 'HIGH' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                  incident.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                  'bg-blue-100 text-blue-800 border-blue-300'
                }`}>
                  {incident.severity}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                <select
                  value={status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  disabled={updating}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="OPEN">Open</option>
                  <option value="INVESTIGATING">Investigating</option>
                  <option value="CONTAINED">Contained</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{incident.description}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Category</label>
            <p className="mt-1 text-sm text-gray-900">{incident.category}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Reported By</label>
              <p className="mt-1 text-sm text-gray-900">
                {incident.reportedByUser
                  ? `${incident.reportedByUser.firstName} ${incident.reportedByUser.lastName} (${incident.reportedByUser.email})`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Detected At</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(incident.detectedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {incident.breachConfirmed && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm font-medium text-red-800">⚠️ Data Breach Confirmed</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


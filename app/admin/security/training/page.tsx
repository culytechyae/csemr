'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';

interface SecurityTraining {
  id: string;
  userId: string;
  trainingType: 'SECURITY_AWARENESS' | 'ANNUAL_REFRESHER' | 'ROLE_SPECIFIC' | 'INCIDENT_RESPONSE' | 'VENDOR_SECURITY' | 'COMPLIANCE';
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  completedAt?: string;
  expiresAt?: string;
  dueDate?: string;
  score?: number;
  maxScore?: number;
  duration?: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

export default function TrainingPage() {
  const [trainings, setTrainings] = useState<SecurityTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', trainingType: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkUserRole();
    fetchTrainings();
  }, [filter]);

  const checkUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setIsAdmin(data.user?.role === 'ADMIN');
      setCurrentUserId(data.user?.id || null);
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchTrainings = () => {
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    if (filter.trainingType) params.append('trainingType', filter.trainingType);

    fetch(`/api/security/training?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setTrainings(data.trainings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      SECURITY_AWARENESS: 'bg-blue-100 text-blue-800',
      ANNUAL_REFRESHER: 'bg-purple-100 text-purple-800',
      ROLE_SPECIFIC: 'bg-green-100 text-green-800',
      INCIDENT_RESPONSE: 'bg-red-100 text-red-800',
      VENDOR_SECURITY: 'bg-orange-100 text-orange-800',
      COMPLIANCE: 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleCompleteTraining = async (trainingId: string, score?: number) => {
    try {
      const response = await fetch(`/api/security/training/${trainingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED', score }),
      });

      if (response.ok) {
        fetchTrainings();
      }
    } catch (error) {
      alert('Failed to complete training');
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Training</h1>
            <p className="text-gray-600">Track security awareness and compliance training</p>
          </div>
          <div className="flex space-x-2">
            {isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Create Training
              </button>
            )}
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
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <select
            value={filter.trainingType}
            onChange={(e) => setFilter({ ...filter, trainingType: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Types</option>
            <option value="SECURITY_AWARENESS">Security Awareness</option>
            <option value="ANNUAL_REFRESHER">Annual Refresher</option>
            <option value="ROLE_SPECIFIC">Role Specific</option>
            <option value="INCIDENT_RESPONSE">Incident Response</option>
            <option value="VENDOR_SECURITY">Vendor Security</option>
            <option value="COMPLIANCE">Compliance</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Training</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trainings.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-4 text-center text-gray-500">
                    No training records found
                  </td>
                </tr>
              ) : (
                trainings.map((training) => (
                  <tr key={training.id} className="hover:bg-gray-50">
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {training.user.firstName} {training.user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{training.user.email}</div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{training.title}</div>
                      {training.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">{training.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getTypeColor(training.trainingType)}`}>
                        {training.trainingType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(training.status)}`}>
                        {training.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {training.dueDate ? new Date(training.dueDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {training.score !== null && training.maxScore
                        ? `${training.score}/${training.maxScore}`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {training.completedAt ? new Date(training.completedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {training.status !== 'COMPLETED' && training.userId === currentUserId && (
                        <button
                          onClick={() => handleCompleteTraining(training.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showCreateModal && isAdmin && (
          <CreateTrainingModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchTrainings();
            }}
          />
        )}
      </div>
    </Layout>
  );
}

function CreateTrainingModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    userId: '',
    trainingType: 'SECURITY_AWARENESS' as any,
    title: '',
    description: '',
    dueDate: '',
    expiresAt: '',
    duration: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch users for admin to assign training
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/security/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          duration: formData.duration ? parseInt(formData.duration) : null,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert('Failed to create training');
      }
    } catch (error) {
      alert('Error creating training');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create Training Record</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User *</label>
              <select
                required
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Training Type *</label>
              <select
                required
                value={formData.trainingType}
                onChange={(e) => setFormData({ ...formData, trainingType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="SECURITY_AWARENESS">Security Awareness</option>
                <option value="ANNUAL_REFRESHER">Annual Refresher</option>
                <option value="ROLE_SPECIFIC">Role Specific</option>
                <option value="INCIDENT_RESPONSE">Incident Response</option>
                <option value="VENDOR_SECURITY">Vendor Security</option>
                <option value="COMPLIANCE">Compliance</option>
              </select>
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
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
              {submitting ? 'Creating...' : 'Create Training'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


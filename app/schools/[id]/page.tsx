'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';

interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email?: string;
  principalName: string;
  currentAcademicYear?: string;
  isActive: boolean;
}

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingHL7, setSavingHL7] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    principalName: '',
    isActive: true,
  });
  const [hl7Config, setHl7Config] = useState({
    facilityCode: '',
    sendingApplication: 'SchoolClinicEMR',
    sendingFacility: '',
    receivingApplication: 'Rhapsody',
    receivingFacility: 'MALAFFI',
    processingId: 'ADHIE',
    hl7Version: '2.5.1',
    autoSend: true,
    retryAttempts: 3,
    validDoctorIds: '',
    defaultDoctorId: '',
    autoSendMessageTypes: '["ADT_A01","ADT_A04","ORU_R01"]',
    environment: 'test' as 'test' | 'production',
    enabled: true,
  });

  useEffect(() => {
    const fetchUserAndSchool = async () => {
      try {
        const schoolId = params.id as string;
        
        // Fetch user role
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        if (authData.user) {
          setUserRole(authData.user.role);
        }

        if (schoolId) {
          const schoolRes = await fetch(`/api/schools/${schoolId}`);
          if (!schoolRes.ok) {
            throw new Error(`Failed to fetch school: ${schoolRes.status}`);
          }
          const data = await schoolRes.json();
          
          if (data.error) {
            console.error('API error:', data.error);
            setLoading(false);
            return;
          }
          
          setSchool(data);
          setAcademicYear(data.currentAcademicYear || '');
          setFormData({
            name: data.name || '',
            code: data.code || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            principalName: data.principalName || '',
            isActive: data.isActive !== false,
          });
          
          // Fetch user role again to ensure it's set before fetching HL7 config
          const userRes = await fetch('/api/auth/me');
          const userData = await userRes.json();
          const currentUserRole = userData.user?.role || '';
          
          // Fetch HL7 config (only for ADMIN users)
          if (currentUserRole === 'ADMIN') {
            try {
              const hl7Res = await fetch(`/api/schools/${schoolId}/hl7-config`);
              if (hl7Res.ok) {
                const hl7Data = await hl7Res.json();
                setHl7Config({
                  facilityCode: hl7Data.facilityCode || data.code || '',
                  sendingApplication: hl7Data.sendingApplication || data.code || 'SchoolClinicEMR',
                  sendingFacility: hl7Data.sendingFacility || data.code || '',
                  receivingApplication: hl7Data.receivingApplication || 'Rhapsody',
                  receivingFacility: hl7Data.receivingFacility || 'MALAFFI',
                  processingId: hl7Data.processingId || 'ADHIE',
                  hl7Version: hl7Data.hl7Version || '2.5.1',
                  autoSend: hl7Data.autoSend !== undefined ? hl7Data.autoSend : true,
                  retryAttempts: hl7Data.retryAttempts || 3,
                  validDoctorIds: hl7Data.validDoctorIds || '',
                  defaultDoctorId: hl7Data.defaultDoctorId || '',
                  autoSendMessageTypes: hl7Data.autoSendMessageTypes || '["ADT_A01","ADT_A04","ORU_R01"]',
                  environment: hl7Data.environment || 'test',
                  enabled: hl7Data.enabled !== undefined ? hl7Data.enabled : true,
                });
              } else {
                // Set defaults if fetch fails
                setHl7Config({
                  facilityCode: data.code || '',
                  sendingApplication: data.code || 'SchoolClinicEMR',
                  sendingFacility: data.code || '',
                  receivingApplication: 'Rhapsody',
                  receivingFacility: 'MALAFFI',
                  processingId: 'ADHIE',
                  hl7Version: '2.5.1',
                  autoSend: true,
                  retryAttempts: 3,
                  validDoctorIds: '',
                  defaultDoctorId: '',
                  autoSendMessageTypes: '["ADT_A01","ADT_A04","ORU_R01"]',
                  environment: 'test',
                  enabled: true,
                });
              }
            } catch (hl7Err) {
              console.error('HL7 config fetch error:', hl7Err);
              // Set defaults
              setHl7Config({
                facilityCode: data.code || '',
                sendingApplication: data.code || 'SchoolClinicEMR',
                sendingFacility: data.code || '',
                receivingApplication: 'Rhapsody',
                receivingFacility: 'MALAFFI',
                processingId: 'ADHIE',
                hl7Version: '2.5.1',
                autoSend: true,
                retryAttempts: 3,
                validDoctorIds: '',
                defaultDoctorId: '',
                autoSendMessageTypes: '["ADT_A01","ADT_A04","ORU_R01"]',
                environment: 'test',
                enabled: true,
              });
            }
          } else {
            // Set defaults for non-admin users
            setHl7Config({
              facilityCode: data.code || '',
              sendingApplication: data.code || 'SchoolClinicEMR',
              sendingFacility: data.code || '',
              receivingApplication: 'Rhapsody',
              receivingFacility: 'MALAFFI',
              processingId: 'ADHIE',
              hl7Version: '2.5.1',
              autoSend: true,
              retryAttempts: 3,
              validDoctorIds: '',
              defaultDoctorId: '',
              autoSendMessageTypes: '["ADT_A01","ADT_A04","ORU_R01"]',
              environment: 'test',
              enabled: true,
            });
          }
          
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setLoading(false);
      }
    };

    fetchUserAndSchool();
  }, [params]);

  const handleSaveAcademicYear = async () => {
    if (!school || !academicYear) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/schools/${school.id}/academic-year`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYear }),
      });

      if (response.ok) {
        const updated = await response.json();
        setSchool(updated);
        alert('Academic year updated successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update academic year');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchool = async () => {
    if (!school) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/schools/${school.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updated = await response.json();
        setSchool(updated);
        setIsEditing(false);
        alert('School updated successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update school');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHL7Config = async () => {
    if (!school) return;

    setSavingHL7(true);
    try {
      const response = await fetch(`/api/schools/${school.id}/hl7-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hl7Config),
      });

      if (response.ok) {
        alert('HL7 configuration saved successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save HL7 configuration');
      }
    } catch (error) {
      alert('An error occurred while saving HL7 configuration');
    } finally {
      setSavingHL7(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  if (!school) {
    return (
      <Layout>
        <div className="text-center py-12">School not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Schools', href: '/schools' },
            { label: school.name },
          ]}
        />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{school.name}</h1>
            <p className="text-gray-600">School Details and Academic Year Management</p>
          </div>
          {userRole === 'ADMIN' && (
            <button
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                  // Reset form data
                  if (school) {
                    setFormData({
                      name: school.name || '',
                      code: school.code || '',
                      address: school.address || '',
                      phone: school.phone || '',
                      email: school.email || '',
                      principalName: school.principalName || '',
                      isActive: school.isActive !== false,
                    });
                  }
                } else {
                  setIsEditing(true);
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {isEditing ? 'Cancel' : 'Edit School'}
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {isEditing ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">School Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">School Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Principal Name *</label>
                <input
                  type="text"
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div className="sm:col-span-2 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSchool}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">School Code</label>
                <p className="mt-1 text-sm text-gray-900">{school.code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Principal Name</label>
                <p className="mt-1 text-sm text-gray-900">{school.principalName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900">{school.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{school.phone}</p>
              </div>
              {school.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{school.email}</p>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Academic Year *
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g., 2024-2025"
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {(userRole === 'ADMIN' || userRole === 'CLINIC_MANAGER') && (
                <button
                  onClick={handleSaveAcademicYear}
                  disabled={saving || !academicYear}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              This academic year will be used as default for new student imports and registrations.
            </p>
          </div>

          {userRole === 'ADMIN' && (
            <div id="hl7-config" className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">HL7 Configuration</h3>
              <p className="text-sm text-gray-600 mb-4">
                Configure HL7 message settings for this school. Each school can have different HL7 codes and settings based on Malaffi requirements.
              </p>
              
              {/* Enable/Disable HL7 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={hl7Config.enabled}
                    onChange={(e) => setHl7Config({ ...hl7Config, enabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Enable HL7 for this school</span>
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-6">When disabled, no HL7 messages will be generated for this school</p>
              </div>

              {/* MSH Segment Configuration */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">MSH Segment Configuration</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facility Code (DOH Code) *
                    </label>
                    <input
                      type="text"
                      value={hl7Config.facilityCode}
                      onChange={(e) => setHl7Config({ ...hl7Config, facilityCode: e.target.value })}
                      placeholder={school.code}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">DOH-assigned facility code (e.g., MF7163)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sending Application
                    </label>
                    <input
                      type="text"
                      value={hl7Config.sendingApplication}
                      onChange={(e) => setHl7Config({ ...hl7Config, sendingApplication: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Usually same as facility code</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sending Facility
                    </label>
                    <input
                      type="text"
                      value={hl7Config.sendingFacility}
                      onChange={(e) => setHl7Config({ ...hl7Config, sendingFacility: e.target.value })}
                      placeholder={school.code}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Usually facility code or school code</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Receiving Application
                    </label>
                    <input
                      type="text"
                      value={hl7Config.receivingApplication}
                      onChange={(e) => setHl7Config({ ...hl7Config, receivingApplication: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Default: Rhapsody</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Receiving Facility
                    </label>
                    <input
                      type="text"
                      value={hl7Config.receivingFacility}
                      onChange={(e) => setHl7Config({ ...hl7Config, receivingFacility: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Default: MALAFFI</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Processing ID (MSH-6: Receiving Facility)
                    </label>
                    <input
                      type="text"
                      value={hl7Config.processingId}
                      onChange={(e) => setHl7Config({ ...hl7Config, processingId: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Used in MSH-6 as Receiving Facility (Default: ADHIE). MSH-11 Processing ID is always 'P' for Production.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HL7 Version
                    </label>
                    <input
                      type="text"
                      value={hl7Config.hl7Version}
                      onChange={(e) => setHl7Config({ ...hl7Config, hl7Version: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Default: 2.5.1</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Environment
                    </label>
                    <select
                      value={hl7Config.environment}
                      onChange={(e) => setHl7Config({ ...hl7Config, environment: e.target.value as 'test' | 'production' })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="test">Test</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Doctor ID Configuration */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Doctor ID Configuration</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid Doctor IDs (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={hl7Config.validDoctorIds}
                      onChange={(e) => setHl7Config({ ...hl7Config, validDoctorIds: e.target.value })}
                      placeholder="GD18668,DOC001,DR001"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">List of doctor IDs registered in Modaqeq (comma-separated)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Doctor ID
                    </label>
                    <input
                      type="text"
                      value={hl7Config.defaultDoctorId}
                      onChange={(e) => setHl7Config({ ...hl7Config, defaultDoctorId: e.target.value })}
                      placeholder="GD18668"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Used when provided ID is not in valid list</p>
                  </div>
                </div>
              </div>

              {/* Transmission Settings */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Transmission Settings</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Retry Attempts
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={hl7Config.retryAttempts}
                      onChange={(e) => setHl7Config({ ...hl7Config, retryAttempts: parseInt(e.target.value) || 3 })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hl7Config.autoSend}
                        onChange={(e) => setHl7Config({ ...hl7Config, autoSend: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Automatically send HL7 messages</span>
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auto-Send Message Types (JSON array)
                    </label>
                    <input
                      type="text"
                      value={hl7Config.autoSendMessageTypes}
                      onChange={(e) => setHl7Config({ ...hl7Config, autoSendMessageTypes: e.target.value })}
                      placeholder='["ADT_A01","ADT_A04","ORU_R01"]'
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">JSON array of message types to auto-send: ADT_A01, ADT_A03, ADT_A04, ADT_A08, ORU_R01</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSaveHL7Config}
                  disabled={savingHL7}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingHL7 ? 'Saving...' : 'Save HL7 Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}


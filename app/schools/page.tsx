'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { Building2, MapPin, Phone, Mail, User, Settings, Shield } from 'lucide-react';

interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email?: string;
  principalName: string;
  isActive: boolean;
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUserRole(data.user.role);
        }
      });

    fetch('/api/schools')
      .then((res) => res.json())
      .then((data) => {
        setSchools(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Schools Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage school clinic locations and configurations
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by school name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Schools Grid */}
        {filteredSchools.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No schools found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm ? 'Try adjusting your search terms' : 'No schools registered yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSchools.map((school) => (
              <div
                key={school.id}
                className="bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{school.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Code: {school.code}</p>
                    </div>
                  </div>
                  {school.isActive ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-600">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {school.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{school.address}</span>
                    </div>
                  )}
                  {school.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{school.phone}</span>
                    </div>
                  )}
                  {school.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{school.email}</span>
                    </div>
                  )}
                  {school.principalName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{school.principalName}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <Link
                    href={`/schools/${school.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-medium transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Manage</span>
                  </Link>
                  {userRole === 'ADMIN' && (
                    <Link
                      href={`/schools/${school.id}#hl7-config`}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
                      title="Configure HL7 Settings"
                    >
                      <Shield className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

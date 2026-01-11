'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import NavItem from './NavItem';
import {
  DashboardIcon,
  SchoolsIcon,
  StudentsIcon,
  AssessmentsIcon,
  HL7Icon,
  UsersIcon,
  ImportIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
} from './SidebarIcons';

interface User {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  schoolId?: string | null;
}

interface NavItemConfig {
  href: string;
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  activeBgColor: string;
  activeTextColor: string;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  // Navigation items with color-coded themes
  const navItems: NavItemConfig[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      iconColor: '#6366f1', // Indigo
      activeBgColor: 'bg-indigo-50',
      activeTextColor: 'text-indigo-700',
    },
    {
      href: '/schools',
      label: 'Schools',
      icon: <SchoolsIcon />,
      iconColor: '#059669', // Emerald
      activeBgColor: 'bg-emerald-50',
      activeTextColor: 'text-emerald-700',
    },
    {
      href: '/students',
      label: 'Students',
      icon: <StudentsIcon />,
      iconColor: '#2563eb', // Blue
      activeBgColor: 'bg-blue-50',
      activeTextColor: 'text-blue-700',
    },
    {
      href: '/visits',
      label: 'Assessment',
      icon: <AssessmentsIcon />,
      iconColor: '#7c3aed', // Violet
      activeBgColor: 'bg-violet-50',
      activeTextColor: 'text-violet-700',
    },
    {
      href: '/health-records',
      label: 'Health Records',
      icon: <AssessmentsIcon />,
      iconColor: '#0891b2', // Cyan
      activeBgColor: 'bg-cyan-50',
      activeTextColor: 'text-cyan-700',
    },
    {
      href: '/hl7',
      label: 'HL7 Messages',
      icon: <HL7Icon />,
      iconColor: '#ea580c', // Orange
      activeBgColor: 'bg-orange-50',
      activeTextColor: 'text-orange-700',
    },
  ];

  if (user.role === 'ADMIN') {
    navItems.push({
      href: '/admin',
      label: 'Admin',
      icon: <UsersIcon />,
      iconColor: '#dc2626', // Red
      activeBgColor: 'bg-red-50',
      activeTextColor: 'text-red-700',
    });
  }

  if (user.role === 'ADMIN' || user.role === 'CLINIC_MANAGER') {
    navItems.push({
      href: '/users',
      label: 'Users',
      icon: <UsersIcon />,
      iconColor: '#dc2626', // Red
      activeBgColor: 'bg-red-50',
      activeTextColor: 'text-red-700',
    });
    navItems.push({
      href: '/import',
      label: 'Bulk Import',
      icon: <ImportIcon />,
      iconColor: '#0891b2', // Cyan
      activeBgColor: 'bg-cyan-50',
      activeTextColor: 'text-cyan-700',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Modern Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? 'w-72' : 'w-20'} 
          bg-white border-r border-gray-200/80
          shadow-sm
          transition-all duration-300 ease-in-out
          flex flex-col
          relative
        `}
      >
        {/* Sidebar Header */}
        <div className="px-6 py-5 border-b border-gray-200/60 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Taaleem Clinic Management
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActive}
                  iconColor={item.iconColor}
                  activeBgColor={item.activeBgColor}
                  activeTextColor={item.activeTextColor}
                  sidebarOpen={sidebarOpen}
                />
              );
            })}
          </ul>
        </nav>

          {/* User Info & Settings */}
          <div className="px-4 py-5 border-t border-gray-200/60 bg-gray-50/50">
            {sidebarOpen && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  Logged in as
                </p>
                <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            )}
            <div className="space-y-2">
              <Link
                href="/settings/mfa"
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5
                  rounded-xl transition-all duration-200
                  ${sidebarOpen ? 'justify-start' : 'justify-center'}
                  bg-white hover:bg-gray-50 border border-gray-200
                  text-gray-700 hover:text-gray-900
                  font-medium text-sm
                `}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {sidebarOpen && <span>MFA Settings</span>}
              </Link>
              <button
                onClick={handleLogout}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5
                  rounded-xl transition-all duration-200
                  ${sidebarOpen ? 'justify-start' : 'justify-center'}
                  bg-gray-100 hover:bg-gray-200 
                  text-gray-700 hover:text-gray-900
                  font-medium text-sm
                `}
              >
                <LogoutIcon />
                {sidebarOpen && <span>Sign Out</span>}
              </button>
            </div>
          </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-800">Taaleem Clinic Management</h2>
              {user.schoolId && (
                <span className="text-sm text-gray-500">
                  ({user.role !== 'ADMIN' ? 'Assigned School Only' : 'All Schools'})
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {pathname === '/schools' && user.role === 'ADMIN' && (
                <Link
                  href="/schools/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>Add School</span>
                </Link>
              )}
              {pathname === '/students' && (
                <Link
                  href="/students/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>Add Student</span>
                </Link>
              )}
              {pathname === '/visits' && (
                <Link
                  href="/visits/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>New Assessment</span>
                </Link>
              )}
              {pathname === '/users' && (user.role === 'ADMIN' || user.role === 'CLINIC_MANAGER') && (
                <Link
                  href="/users/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>Add User</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

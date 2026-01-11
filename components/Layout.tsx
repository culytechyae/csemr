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
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeoutCountdown, setTimeoutCountdown] = useState(0);

  // Detect mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-close sidebar on mobile
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
        setMobileMenuOpen(false);
      }
    };

    // Check on mount
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [pathname, isMobile]);

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
    setShowTimeoutWarning(false);
    setTimeoutCountdown(0);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleStayLoggedIn = async () => {
    setShowTimeoutWarning(false);
    setTimeoutCountdown(0);
    // Update activity to reset timer
    try {
      await fetch('/api/auth/activity', { method: 'POST' });
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  };

  // Auto-logout after 15 minutes of inactivity
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
    const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before logout
    const ACTIVITY_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds
    const ACTIVITY_UPDATE_INTERVAL = 60 * 1000; // Update activity every 60 seconds

    let activityCheckInterval: NodeJS.Timeout;
    let activityUpdateInterval: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;
    let lastActivityTime = Date.now();

    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const updateActivity = () => {
      lastActivityTime = Date.now();
      if (showTimeoutWarning) {
        setShowTimeoutWarning(false);
        setTimeoutCountdown(0);
        if (countdownInterval) clearInterval(countdownInterval);
      }
    };

    // Add event listeners for user activity
    activityEvents.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Update activity on server periodically
    const updateServerActivity = async () => {
      try {
        await fetch('/api/auth/activity', { method: 'POST' });
      } catch (error) {
        console.error('Failed to update activity:', error);
      }
    };

    // Start activity update interval
    activityUpdateInterval = setInterval(updateServerActivity, ACTIVITY_UPDATE_INTERVAL);

    // Check for inactivity
    const checkInactivity = () => {
      const timeSinceActivity = Date.now() - lastActivityTime;
      const timeUntilLogout = INACTIVITY_TIMEOUT - timeSinceActivity;

      if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
        // Timeout reached - logout
        handleLogout();
      } else if (timeUntilLogout <= WARNING_TIME && !showTimeoutWarning) {
        // Show warning
        setShowTimeoutWarning(true);
        let remainingSeconds = Math.floor(timeUntilLogout / 1000);
        setTimeoutCountdown(remainingSeconds);

        // Update countdown
        countdownInterval = setInterval(() => {
          remainingSeconds -= 1;
          setTimeoutCountdown(remainingSeconds);
          if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
            handleLogout();
          }
        }, 1000);
      }
    };

    // Check inactivity periodically
    activityCheckInterval = setInterval(checkInactivity, ACTIVITY_CHECK_INTERVAL);

    // Initial check
    checkInactivity();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
      if (activityCheckInterval) clearInterval(activityCheckInterval);
      if (activityUpdateInterval) clearInterval(activityUpdateInterval);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [user, router, showTimeoutWarning]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
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
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Overlay - Only visible when mobile menu is open */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, overlay when mobile menu is open */}
      <aside
        className={`
          ${isMobile ? 'fixed' : 'fixed'}
          ${isMobile ? (mobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : ''}
          ${!isMobile && sidebarOpen ? 'w-72' : !isMobile ? 'w-20' : 'w-72'}
          bg-white border-r border-gray-200/80
          shadow-sm
          transition-all duration-300 ease-in-out
          flex flex-col
          left-0 top-0 bottom-0
          z-50
          ${isMobile ? 'lg:translate-x-0' : ''}
        `}
      >
        {/* Sidebar Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200/60 flex items-center justify-between flex-shrink-0 gap-3">
          {(!isMobile && sidebarOpen) || (isMobile && mobileMenuOpen) ? (
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight flex-shrink-0">
              Taaleem Clinic
            </h1>
          ) : !isMobile ? (
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight flex-shrink-0">TC</h1>
          ) : null}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors duration-200 flex-shrink-0"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            )}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors duration-200 flex-shrink-0"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto overflow-x-hidden">
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
                  sidebarOpen={!isMobile ? sidebarOpen : true}
                />
              );
            })}
          </ul>
        </nav>

        {/* User Info & Settings */}
        <div className="px-4 py-5 border-t border-gray-200/60 bg-gray-50/50 flex-shrink-0">
          {((!isMobile && sidebarOpen) || (isMobile && mobileMenuOpen)) && (
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
                ${(!isMobile && sidebarOpen) || (isMobile && mobileMenuOpen) ? 'justify-start' : 'justify-center'}
                bg-white hover:bg-gray-50 border border-gray-200
                text-gray-700 hover:text-gray-900
                font-medium text-sm
              `}
              onClick={() => isMobile && setMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {((!isMobile && sidebarOpen) || (isMobile && mobileMenuOpen)) && <span>MFA Settings</span>}
            </Link>
            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5
                rounded-xl transition-all duration-200
                ${(!isMobile && sidebarOpen) || (isMobile && mobileMenuOpen) ? 'justify-start' : 'justify-center'}
                bg-gray-100 hover:bg-gray-200 
                text-gray-700 hover:text-gray-900
                font-medium text-sm
              `}
            >
              <LogoutIcon />
              {((!isMobile && sidebarOpen) || (isMobile && mobileMenuOpen)) && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content - Full width on mobile, with margin on desktop */}
      <div 
        className={`
          flex-1 flex flex-col min-h-screen overflow-hidden transition-all duration-300 ease-in-out
          ${isMobile ? 'ml-0' : sidebarOpen ? 'ml-72' : 'ml-20'}
        `}
      >
        {/* Top Header - Mobile hamburger menu */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              {/* Mobile Hamburger Menu Button */}
              {isMobile && (
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors duration-200 lg:hidden flex-shrink-0"
                  aria-label="Open menu"
                >
                  <MenuIcon />
                </button>
              )}
              <div className="flex flex-col min-w-0">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 truncate">
                  {isMobile ? 'Taaleem Clinic' : 'Taaleem Clinic Management'}
                </h2>
                {user.schoolId && !isMobile && (
                  <span className="text-xs sm:text-sm text-gray-500 truncate">
                    ({user.role !== 'ADMIN' ? 'Assigned School Only' : 'All Schools'})
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {pathname === '/schools' && user.role === 'ADMIN' && (
                <Link
                  href="/schools/new"
                  className="bg-blue-600 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base whitespace-nowrap"
                >
                  <span>+</span>
                  {!isMobile && <span>Add School</span>}
                </Link>
              )}
              {pathname === '/students' && (
                <Link
                  href="/students/new"
                  className="bg-blue-600 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base whitespace-nowrap"
                >
                  <span>+</span>
                  {!isMobile && <span>Add Student</span>}
                </Link>
              )}
              {pathname === '/visits' && (
                <Link
                  href="/visits/new"
                  className="bg-blue-600 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base whitespace-nowrap"
                >
                  <span>+</span>
                  {!isMobile && <span>New Assessment</span>}
                </Link>
              )}
              {pathname === '/users' && (user.role === 'ADMIN' || user.role === 'CLINIC_MANAGER') && (
                <Link
                  href="/users/new"
                  className="bg-blue-600 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base whitespace-nowrap"
                >
                  <span>+</span>
                  {!isMobile && <span>Add User</span>}
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page Content - Scrollable, responsive padding */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>

      {/* Timeout Warning Modal */}
      {showTimeoutWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Session Timeout Warning</h3>
                <p className="text-sm text-gray-600">Your session will expire due to inactivity</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-gray-700">
                You will be automatically logged out in{' '}
                <span className="font-semibold text-red-600">
                  {Math.floor(timeoutCountdown / 60)}:{(timeoutCountdown % 60).toString().padStart(2, '0')}
                </span>{' '}
                minutes for security reasons.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Logout Now
              </button>
              <button
                onClick={handleStayLoggedIn}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

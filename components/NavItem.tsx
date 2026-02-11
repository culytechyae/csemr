'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface NavItemProps {
  href: string;
  label: string;
  icon: ReactNode;
  isActive: boolean;
  iconColor: string;
  activeBgColor: string;
  activeTextColor: string;
  sidebarOpen: boolean;
}

export default function NavItem({
  href,
  label,
  icon,
  isActive,
  iconColor,
  activeBgColor,
  activeTextColor,
  sidebarOpen,
}: NavItemProps) {
  return (
    <li>
      <Link
        href={href}
        className={`
          group flex items-center gap-2.5 px-3 py-2.5 rounded-xl
          transition-all duration-200 ease-in-out
          ${sidebarOpen ? 'justify-start' : 'justify-center'}
          ${
            isActive
              ? `${activeBgColor} ${activeTextColor} shadow-sm`
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }
        `}
      >
        <span
          className={`
            flex-shrink-0 transition-all duration-200
            ${isActive ? 'opacity-100 scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}
          `}
          style={{ color: isActive ? activeTextColor : iconColor }}
        >
          {icon}
        </span>
        {sidebarOpen && (
          <span
            className={`
              font-medium text-sm transition-all duration-200
              ${isActive ? 'font-semibold' : 'font-medium'}
            `}
          >
            {label}
          </span>
        )}
      </Link>
    </li>
  );
}


import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Breadcrumb } from '../ui/Breadcrumb';
import { NotificationBell } from '../ui/NotificationBell';
import { Menu, X } from 'lucide-react';
import { getStudentNotifications, markStudentNotificationRead, markAllStudentNotificationsRead } from '../../services/api/student';
import { getCompanyNotifications, markCompanyNotificationRead, markAllCompanyNotificationsRead } from '../../services/api/company';
import { getAdminNotifications, markAdminNotificationRead, markAllAdminNotificationsRead } from '../../services/api/admin';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'student' | 'admin' | 'company';
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
}

function getNotifFetch(userRole: string) {
  if (userRole === 'company') return getCompanyNotifications;
  if (userRole === 'admin') return getAdminNotifications;
  return getStudentNotifications;
}

function getNotifMarkRead(userRole: string) {
  if (userRole === 'company') return markCompanyNotificationRead;
  if (userRole === 'admin') return markAdminNotificationRead;
  return markStudentNotificationRead;
}

function getNotifMarkAllRead(userRole: string) {
  if (userRole === 'company') return markAllCompanyNotificationsRead;
  if (userRole === 'admin') return markAllAdminNotificationsRead;
  return markAllStudentNotificationsRead;
}

export function DashboardLayout({
  children,
  userRole,
  currentPath,
  onNavigate,
  onLogout,
  user,
  breadcrumbs = []
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const computedBreadcrumbs =
    breadcrumbs.length > 0
      ? breadcrumbs
      : [
          {
            label: currentPath
              .split('/')
              .filter(Boolean)
              .map((segment) =>
                segment
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, (char) => char.toUpperCase())
              )
              .join(' / ')
          }
        ];

  const notifFetchFn = getNotifFetch(userRole);
  const notifMarkReadFn = getNotifMarkRead(userRole);
  const notifMarkAllReadFn = getNotifMarkAllRead(userRole);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block md:flex-shrink-0">
        <Sidebar
          userRole={userRole}
          currentPath={currentPath}
          onNavigate={onNavigate}
          onLogout={onLogout}
          user={user} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen &&
      <div className="fixed inset-0 z-40 flex md:hidden">
          <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)} />

          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-slate-900 pt-5 pb-4">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <Sidebar
            userRole={userRole}
            currentPath={currentPath}
            onNavigate={(path) => {
              onNavigate(path);
              setIsMobileMenuOpen(false);
            }}
            onLogout={onLogout}
            user={user} />
          </div>
        </div>
      }

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:hidden">
          <div className="font-bold text-lg text-slate-900">PlaceMate</div>
          <div className="flex items-center gap-2">
            <NotificationBell
              fetchNotifications={notifFetchFn}
              markRead={notifMarkReadFn}
              markAllRead={notifMarkAllReadFn}
              onNavigate={onNavigate}
            />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="-mr-2 inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Desktop Header / Breadcrumbs */}
        <header className="hidden md:flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
          <div className="flex items-center">
            <Breadcrumb items={computedBreadcrumbs} onNavigate={onNavigate} />
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell
              fetchNotifications={notifFetchFn}
              markRead={notifMarkReadFn}
              markAllRead={notifMarkAllReadFn}
              onNavigate={onNavigate}
            />
          </div>
        </header>

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

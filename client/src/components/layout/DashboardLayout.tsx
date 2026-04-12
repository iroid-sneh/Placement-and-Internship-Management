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
  const shellClassName =
    userRole === 'admin'
      ? 'dashboard-layout dashboard-layout--admin flex h-screen w-full overflow-hidden'
      : 'dashboard-layout flex h-screen w-full overflow-hidden';
  const mobilePanelClassName =
    userRole === 'admin'
      ? 'relative flex w-full max-w-xs flex-1 flex-col dashboard-layout__mobile-panel'
      : 'relative flex w-full max-w-xs flex-1 flex-col dashboard-layout__mobile-panel';
  const mobileHeaderClassName = 'dashboard-layout__mobile-header md:hidden';
  const desktopHeaderClassName = 'dashboard-layout__header hidden md:flex';
  const mainClassName = 'dashboard-layout__main';

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
  const currentSectionLabel =
    computedBreadcrumbs[computedBreadcrumbs.length - 1]?.label || 'Dashboard';

  return (
    <div className={shellClassName}>
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)} />

          <div className={mobilePanelClassName}>
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
        <div className={mobileHeaderClassName}>
          <div className="font-display font-bold text-lg text-theme-primary">
            {currentSectionLabel}
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell
              fetchNotifications={notifFetchFn}
              markRead={notifMarkReadFn}
              markAllRead={notifMarkAllReadFn}
              onNavigate={onNavigate}
            />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="dashboard-layout__menu-button">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Desktop Header / Breadcrumbs */}
        <header className={desktopHeaderClassName}>
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
        <main className={mainClassName}>
          <div style={{ width: '100%' }}>{children}</div>
        </main>
      </div>
    </div>
  );
}

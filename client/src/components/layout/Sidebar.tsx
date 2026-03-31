import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  PieChart,
  Building2,
  GraduationCap,
  Calendar,
  ClipboardList,
  FileBarChart,
  UserCircle,
  Upload } from
'lucide-react';
interface SidebarProps {
  userRole: 'student' | 'admin' | 'company';
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
}
export function Sidebar({
  userRole,
  currentPath,
  onNavigate,
  onLogout,
  user
}: SidebarProps) {
  const getNavItems = () => {
    switch (userRole) {
      case 'student':
        return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: <LayoutDashboard className="h-5 w-5" />
        },
        {
          id: 'profile',
          label: 'My Profile',
          icon: <UserCircle className="h-5 w-5" />
        },
        {
          id: 'resume',
          label: 'Resume',
          icon: <Upload className="h-5 w-5" />
        },
        {
          id: 'jobs',
          label: 'Browse Jobs',
          icon: <Briefcase className="h-5 w-5" />
        },
        {
          id: 'applications',
          label: 'My Applications',
          icon: <ClipboardList className="h-5 w-5" />
        }];

      case 'admin':
        return [
        {
          id: 'dashboard',
          label: 'Overview',
          icon: <PieChart className="h-5 w-5" />
        },
        {
          id: 'students',
          label: 'Students',
          icon: <GraduationCap className="h-5 w-5" />
        },
        {
          id: 'companies',
          label: 'Companies',
          icon: <Building2 className="h-5 w-5" />
        },
        {
          id: 'jobs',
          label: 'Job Postings',
          icon: <Briefcase className="h-5 w-5" />
        },
        {
          id: 'applications',
          label: 'Applications',
          icon: <ClipboardList className="h-5 w-5" />
        },
        {
          id: 'interviews',
          label: 'Interviews',
          icon: <Calendar className="h-5 w-5" />
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: <FileBarChart className="h-5 w-5" />
        }];

      case 'company':
        return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: <LayoutDashboard className="h-5 w-5" />
        },
        {
          id: 'company-jobs',
          label: 'My Job Postings',
          icon: <Briefcase className="h-5 w-5" />
        },
        {
          id: 'applicants',
          label: 'Applicants',
          icon: <Users className="h-5 w-5" />
        },
        {
          id: 'interviews',
          label: 'Upcoming Interviews',
          icon: <Calendar className="h-5 w-5" />
        },
        {
          id: 'profile',
          label: 'Company Profile',
          icon: <Building2 className="h-5 w-5" />
        }];

      default:
        return [];
    }
  };
  const navItems = getNavItems();
  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white shadow-xl">
      {/* Logo Area */}
      <div className="flex h-16 items-center px-6 bg-slate-950">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="h-8 w-8 rounded bg-teal-500 flex items-center justify-center text-white">
            P
          </div>
          <span>
            Place<span className="text-teal-400">Mate</span>
          </span>
        </div>
      </div>

      {/* User Profile Summary */}
      <div className="border-b border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold overflow-hidden">
            {user.avatar ?
            <img
              src={user.avatar}
              alt={user.name}
              className="h-full w-full object-cover" /> :


            user.name.charAt(0)
            }
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-sm font-medium text-white">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-400 capitalize">
              {userRole}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
          currentPath === item.id || currentPath.startsWith(item.id + '/');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-all
                ${isActive ? 'bg-slate-800 text-teal-400 border-l-4 border-teal-500' : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'}
              `}>

              <span
                className={`${isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-white'} mr-3`}>

                {item.icon}
              </span>
              {item.label}
            </button>);

        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-slate-800 p-4">
        <button
          onClick={() => onNavigate('settings')}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">

          <Settings className="mr-3 h-5 w-5 text-slate-400" />
          Settings
        </button>
        <button
          onClick={onLogout}
          className="mt-1 flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">

          <LogOut className="mr-3 h-5 w-5 text-slate-400" />
          Logout
        </button>
      </div>
    </div>);

}
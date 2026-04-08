import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  LogOut,
  PieChart,
  Building2,
  GraduationCap,
  Calendar,
  ClipboardList,
  FileBarChart,
  UserCircle,
  Upload,
  MessageSquare } from
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
        },
        {
          id: 'chat',
          label: 'Messages',
          icon: <MessageSquare className="h-5 w-5" />
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
        },
        {
          id: 'chat',
          label: 'Messages',
          icon: <MessageSquare className="h-5 w-5" />
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
        },
        {
          id: 'chat',
          label: 'Messages',
          icon: <MessageSquare className="h-5 w-5" />
        }];

      default:
        return [];
    }
  };
  const navItems = getNavItems();
  return (
    <div className="shared-sidebar">
      {/* Logo Area */}
      <div className="shared-sidebar__brand">
        <div className="shared-sidebar__brand-inner">
          <div className="shared-sidebar__brand-mark">
            P
          </div>
          <span>
            Place<span className="shared-sidebar__brand-accent">Mate</span>
          </span>
        </div>
      </div>

      {/* User Profile Summary */}
      <div className="shared-sidebar__profile">
        <div className="shared-sidebar__profile-row">
          <div className="shared-sidebar__avatar">
            {user.avatar ?
            <img
              src={user.avatar}
              alt={user.name}
              className="shared-sidebar__avatar-img" /> :


            user.name.charAt(0)
            }
          </div>
          <div>
            <p className="shared-sidebar__profile-name">
              {user.name}
            </p>
            <p className="shared-sidebar__profile-role">
              {userRole}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="shared-sidebar__nav">
        {navItems.map((item) => {
          const isActive =
          currentPath === item.id || currentPath.startsWith(item.id + '/');
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`shared-sidebar__nav-item ${isActive ? 'shared-sidebar__nav-item--active' : ''}`}>

              <span className="shared-sidebar__nav-icon">
                {item.icon}
              </span>
              {item.label}
            </button>);

        })}
      </nav>

      {/* Bottom Actions */}
      <div className="shared-sidebar__footer">
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="shared-sidebar__footer-button">

          <Settings className="shared-sidebar__footer-icon h-5 w-5" />
          Settings
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="shared-sidebar__footer-button">

          <LogOut className="shared-sidebar__footer-icon h-5 w-5" />
          Logout
        </button>
      </div>
    </div>);

}

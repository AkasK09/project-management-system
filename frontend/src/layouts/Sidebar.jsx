import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Profile', path: '/profile', icon: UserIcon },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 lg:relative flex flex-col bg-gray-900 text-white min-h-screen transition-all duration-300 ease-in-out
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} 
        ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Sidebar Header */}
      <div className="p-4 h-16 flex items-center justify-between border-b border-gray-800">
        {!isCollapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent transition-opacity duration-200">
            ProjectFlow
          </span>
        )}
        {/* Toggle Button for Desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors ml-auto text-gray-400 hover:text-white"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {/* Close Button for Mobile */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center p-3 rounded-lg transition-all duration-200 group relative ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-850 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
              {!isCollapsed && <span className="font-medium whitespace-nowrap transition-opacity duration-200">{link.name}</span>}
              
              {/* Tooltip on Collapsed Sidebar */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-950 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-xl border border-gray-800">
                  {link.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

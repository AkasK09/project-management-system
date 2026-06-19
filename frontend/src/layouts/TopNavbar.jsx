import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Menu } from 'lucide-react';

export default function TopNavbar({ setIsMobileOpen }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="bg-white shadow-xs border-b border-gray-150 h-16 flex items-center justify-between px-6 transition-colors duration-200">
      <div className="flex items-center">
        {/* Hamburger Menu on Mobile */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 focus:outline-none transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Overview</h2>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600 font-semibold">Hello, {user?.fullName}</span>
        <button
          onClick={logout}
          className="flex items-center text-gray-505 hover:text-red-600 font-medium transition-colors text-sm bg-gray-50 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-200"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          Logout
        </button>
      </div>
    </header>
  );
}

import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar, MobileSidebar } from './Sidebar';
import { Menu } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Mobile menu button (visible below md) */}
      <div className="md:hidden flex items-center px-4 py-2 bg-white border-b">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          <Menu size={20} />
        </button>
        <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
          {user?.role} Dashboard
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  );
};

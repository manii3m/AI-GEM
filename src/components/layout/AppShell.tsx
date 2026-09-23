import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { getCurrentUser } from '../../services/storage';

export const AppShell: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const user = getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <Sidebar
        user={user}
        isOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main viewport area offset by sidebar width on large screens */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar
          user={user}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Professional Government Portal Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              © 2026 GeM Bid Compliance Verification Platform | Problem Statement 26100 Prototype
            </p>
            <div className="flex items-center gap-4 text-slate-400 text-[11px]">
              <span>Government of India Standards Compliant</span>
              <span>•</span>
              <span>Encrypted Session</span>
              <span>•</span>
              <span>GIGW v3.0 Guidelines</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

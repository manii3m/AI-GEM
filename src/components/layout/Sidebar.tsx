import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FileText,
  FileCheck2,
  FolderLock,
  Bell,
  Layers,
  ClipboardList,
  ShieldCheck,
  BarChart3,
  History,
  LogOut,
  ChevronRight,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { User } from '../../types';
import { logoutUser } from '../../services/storage';
import { GovtEmblem } from '../common/GovtEmblem';

interface SidebarProps {
  user: User | null;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, onCloseMobile }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isBidder = user?.role === 'bidder';

  const bidderNavItems = [
    { label: 'Dashboard', path: '/bidder/dashboard', icon: LayoutDashboard },
    { label: 'Tenders', path: '/bidder/tenders', icon: FileText },
    { label: 'Applications', path: '/bidder/applications', icon: FileCheck2 },
    { label: 'Documents', path: '/bidder/documents', icon: FolderLock },
    { label: 'Notifications', path: '/bidder/notifications', icon: Bell },
    { label: 'Profile', path: '/bidder/profile', icon: Building2 },
  ];

  const officerNavItems = [
    { label: 'Dashboard', path: '/officer/dashboard', icon: LayoutDashboard },
    { label: 'Tenders', path: '/officer/tenders', icon: Layers },
    { label: 'Applications / Bids', path: '/officer/bids', icon: ClipboardList },
    { label: 'Verification', path: '/officer/verification', icon: ShieldAlert },
    { label: 'Documents / Reports', path: '/officer/reports', icon: BarChart3 },
    { label: 'Audit Trail', path: '/officer/audit', icon: History },
  ];

  const navItems = isBidder ? bidderNavItems : officerNavItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-2xs lg:hidden transition-opacity duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white text-slate-700 border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Header Branding */}
        <div className="p-3.5 border-b border-slate-200 bg-white">
          <GovtEmblem emblemSize="h-10 w-auto" />

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/80 pt-2">
            <span>Portal Mode</span>
            <span className="font-semibold text-slate-800 uppercase tracking-wide">
              {isBidder ? 'Bidder Portal' : 'Procurement Officer'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold border-l-3 border-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive ? 'text-blue-700' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <ChevronRight
                      className={`h-3 w-3 shrink-0 transition-transform ${
                        isActive ? 'text-blue-600 opacity-100' : 'opacity-30'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User Profile & Logout */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-2.5 p-2 rounded-md bg-white border border-slate-200 shadow-2xs mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white shrink-0 font-bold text-xs">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate">
                {isBidder ? user?.organization : 'Procurement Directorate'}
              </p>
            </div>
            <span title="Authenticated Government Session">
              <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors border border-slate-200 hover:border-rose-200 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

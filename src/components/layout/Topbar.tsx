import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  Shield,
  Search,
  RefreshCw,
  User,
  LogOut,
  Edit,
  FileText,
  FileCheck2,
  FolderLock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { User as UserType } from '../../types';
import { resetDemoData, logoutUser } from '../../services/storage';

interface TopbarProps {
  user: UserType | null;
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ user, onToggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const notifications = [
    {
      id: '1',
      title: 'Tender Closing Soon',
      desc: 'DEMO-GEM-2026-004 will close bids on 24 March 2026.',
      time: '1 hour ago',
      unread: true,
      link: '/bidder/tenders',
    },
    {
      id: '2',
      title: 'Compliance Assessment Updated',
      desc: 'Annual turnover verification matched with FY25 filings.',
      time: '3 hours ago',
      unread: false,
      link: user?.role === 'bidder' ? '/bidder/applications' : '/officer/bids',
    },
    {
      id: '3',
      title: 'GeM Central Server Synchronized',
      desc: 'Government 500-record verification dataset online.',
      time: '1 day ago',
      unread: false,
      link: user?.role === 'bidder' ? '/bidder/dashboard' : '/officer/dashboard',
    },
  ];

  const handleResetData = () => {
    if (window.confirm('Reset all demo data (tenders, profile, bids) back to factory initial values?')) {
      resetDemoData();
      setResetSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 600);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    if (user?.role === 'bidder') {
      navigate(`/bidder/tenders?q=${encodeURIComponent(globalSearch.trim())}`);
    } else {
      navigate(`/officer/bids?q=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  // Compute breadcrumb path & page context
  const path = location.pathname;
  let contextSection = 'GeM Platform';
  let contextPage = 'Dashboard';

  if (path.includes('/officer/tenders/create')) {
    contextSection = 'Tender Management';
    contextPage = 'Create Tender';
  } else if (path.includes('/officer/tenders')) {
    contextSection = 'Tender Management';
    contextPage = 'Active Tenders';
  } else if (path.includes('/officer/verification')) {
    contextSection = 'Compliance Verification';
    contextPage = 'Verification Console';
  } else if (path.includes('/officer/reports')) {
    contextSection = 'Compliance Reports';
    contextPage = 'Audit Dossier';
  } else if (path.includes('/officer/bids')) {
    contextSection = 'Bids Repository';
    contextPage = 'Submitted Bids';
  } else if (path.includes('/officer/audit')) {
    contextSection = 'Statutory Governance';
    contextPage = 'Audit Trail';
  } else if (path.includes('/officer/dashboard')) {
    contextSection = 'Officer Portal';
    contextPage = 'Overview';
  } else if (path.includes('/bidder/profile/edit')) {
    contextSection = 'Bidder Profile';
    contextPage = 'Edit Details';
  } else if (path.includes('/bidder/profile')) {
    contextSection = 'Bidder Profile';
    contextPage = 'Company Overview';
  } else if (path.includes('/bidder/tenders') && path.includes('/apply')) {
    contextSection = 'Tender Submission';
    contextPage = 'Bid Application Form';
  } else if (path.includes('/bidder/tenders')) {
    contextSection = 'Tenders';
    contextPage = 'Browse Tenders';
  } else if (path.includes('/bidder/applications')) {
    contextSection = 'Submissions';
    contextPage = 'My Applications';
  } else if (path.includes('/bidder/documents')) {
    contextSection = 'Repository';
    contextPage = 'Compliance Documents';
  } else if (path.includes('/bidder/notifications')) {
    contextSection = 'Communication';
    contextPage = 'Notifications';
  } else if (path.includes('/bidder/dashboard')) {
    contextSection = 'Bidder Portal';
    contextPage = 'Overview';
  }

  const homePath = user?.role === 'bidder' ? '/bidder/dashboard' : '/officer/dashboard';

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-xs flex items-center justify-between px-4 sm:px-6 shadow-2xs">
      {/* Left: Mobile Menu Toggle & Breadcrumb/Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Official Government of India & Breadcrumb context */}
        <div className="flex items-center gap-2 text-xs min-w-0">
          <Link
            to={homePath}
            className="flex items-center gap-1.5 font-bold text-slate-800 hover:text-blue-700 transition-colors shrink-0"
          >
            <Shield className="h-4 w-4 text-blue-700" />
            <span className="hidden sm:inline">GeM Compliance</span>
          </Link>

          <ChevronRight className="h-3 w-3 text-slate-300 shrink-0 hidden sm:inline" />

          <div className="flex items-center gap-1.5 text-slate-500 truncate">
            <span className="hidden md:inline font-medium text-slate-500">{contextSection}</span>
            <ChevronRight className="h-3 w-3 text-slate-300 shrink-0 hidden md:inline" />
            <span className="font-semibold text-slate-800 truncate">{contextPage}</span>
          </div>
        </div>
      </div>

      {/* Middle/Right: Search where useful */}
      <div className="hidden lg:flex items-center flex-1 max-w-xs mx-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search tenders, IDs, vendors..."
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
          />
        </form>
      </div>

      {/* Right: Actions, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Discreet prototype reset helper */}
        <button
          type="button"
          onClick={handleResetData}
          title="Reset Prototype Data to Factory Initial Seed"
          className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${resetSuccess ? 'animate-spin text-emerald-600' : ''}`} />
          <span className="text-[11px] font-medium">{resetSuccess ? 'Resetting...' : 'Reset Demo'}</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-slate-200 bg-white shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Notifications
                  </h4>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                    1 New
                  </span>
                </div>
                {user?.role === 'bidder' && (
                  <Link
                    to="/bidder/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] font-semibold text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <span>View All</span>
                  </Link>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    to={n.link}
                    onClick={() => setShowNotifications(false)}
                    className={`p-3.5 block hover:bg-slate-50 transition-colors ${
                      n.unread ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.desc}</p>
                  </Link>
                ))}
              </div>

              <div className="border-t border-slate-100 p-2 flex items-center justify-between bg-slate-50 px-4">
                {user?.role === 'bidder' ? (
                  <Link
                    to="/bidder/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-bold text-blue-700 hover:underline"
                  >
                    Open Notifications Center
                  </Link>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Menu */}
        <div className="relative pl-2 border-l border-slate-200">
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 text-left hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white font-bold text-xs shadow-2xs">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1">
                <span>{user?.name || 'User'}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </p>
              <p className="text-[10px] text-slate-500 capitalize">
                {user?.role === 'bidder' ? 'Verified Bidder' : 'Procurement Officer'}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-xl z-50 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50">
                <p className="font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.organization || 'GeM Portal User'}</p>
              </div>

              {user?.role === 'bidder' ? (
                <div className="py-1">
                  <Link
                    to="/bidder/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                  >
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span>View Profile</span>
                  </Link>
                  <Link
                    to="/bidder/profile/edit"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                  >
                    <Edit className="h-3.5 w-3.5 text-slate-500" />
                    <span>Edit Profile</span>
                  </Link>
                  <Link
                    to="/bidder/tenders"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span>Browse Tenders</span>
                  </Link>
                  <Link
                    to="/bidder/applications"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                  >
                    <FileCheck2 className="h-3.5 w-3.5 text-slate-500" />
                    <span>My Applications</span>
                  </Link>
                  <Link
                    to="/bidder/documents"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                  >
                    <FolderLock className="h-3.5 w-3.5 text-slate-500" />
                    <span>Compliance Documents</span>
                  </Link>
                </div>
              ) : (
                <div className="py-1">
                  <Link
                    to="/officer/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                  >
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span>Officer Dashboard</span>
                  </Link>
                  <Link
                    to="/officer/reports"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span>Compliance Reports</span>
                  </Link>
                  <Link
                    to="/officer/audit"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                  >
                    <Shield className="h-3.5 w-3.5 text-slate-500" />
                    <span>Statutory Audit Trail</span>
                  </Link>
                </div>
              )}

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-700 hover:bg-rose-50 transition-colors font-semibold cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Topbar;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  HelpCircle,
  Zap,
  ShieldCheck,
  Users,
  User,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { UserRole } from '../../types';
import { loginUser, getCurrentUser } from '../../services/storage';
import { GovtEmblem } from '../../components/common/GovtEmblem';

// GeM Star Logo SVG
const GeMLogo: React.FC<{ className?: string }> = ({ className = 'h-9 w-auto' }) => (
  <div className={`inline-flex items-center gap-2.5 ${className}`}>
    <svg viewBox="0 0 100 100" className="h-8 w-8 shrink-0" fill="none">
      {/* 5-faceted GeM polygon star */}
      <polygon points="50,5 61,38 95,38 68,59 79,92 50,71 21,92 32,59 5,38 39,38" fill="#f97316" />
      <polygon points="50,5 61,38 50,71" fill="#ea580c" />
      <polygon points="61,38 95,38 68,59 50,71" fill="#f59e0b" />
      <polygon points="68,59 79,92 50,71" fill="#10b981" />
      <polygon points="50,71 21,92 32,59" fill="#0284c7" />
      <polygon points="32,59 5,38 39,38 50,71" fill="#8b5cf6" />
      <circle cx="50" cy="50" r="14" fill="#ffffff" />
      <circle cx="50" cy="50" r="8" fill="#1e293b" />
    </svg>
    <div className="flex flex-col text-left">
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">GeM</span>
      </div>
      <span className="text-[10px] text-slate-600 font-medium tracking-tight leading-tight">
        Government e Marketplace
      </span>
    </div>
  </div>
);

// DigiLocker Logo SVG
const DigiLockerLogo: React.FC<{ className?: string }> = ({ className = 'h-5 w-auto' }) => (
  <div className={`inline-flex items-center gap-1.5 ${className}`}>
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2L12 2Z"
        stroke="#6b21a8"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="#faf5ff"
      />
      <circle cx="12" cy="11" r="2.5" fill="#6b21a8" />
      <path d="M12 13.5V17" stroke="#6b21a8" strokeWidth="2" strokeLinecap="round" />
    </svg>
    <span className="text-xs font-bold text-slate-800 tracking-tight">DigiLocker</span>
  </div>
);

// NIC Badge
const NicBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`inline-flex items-center gap-1.5 ${className}`}>
    <span className="font-extrabold text-blue-700 tracking-wider text-xs">NIC</span>
    <span className="text-xs font-semibold text-slate-700">NIC SSO</span>
  </div>
);

export const Login: React.FC = () => {
  const navigate = useNavigate();

  // If already logged in, redirect
  React.useEffect(() => {
    const existing = getCurrentUser();
    if (existing) {
      if (existing.role === 'bidder') {
        navigate('/bidder/dashboard');
      } else {
        navigate('/officer/dashboard');
      }
    }
  }, [navigate]);

  // Roles state: Only Officer and Bidder (as requested)
  const [role, setRole] = useState<UserRole>('officer');
  const [username, setUsername] = useState('officer@demo.com');
  const [password, setPassword] = useState('officer123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Switch role tabs and sync default prototype values matching the mock
  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setErrorMessage('');
    setSuccessMessage('');
    if (selectedRole === 'officer') {
      setUsername('officer@demo.com');
      setPassword('officer123');
    } else {
      setUsername('bidder@demo.com');
      setPassword('bidder123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim()) {
      setErrorMessage('Please enter your Email or User ID.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your Password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = loginUser(username, password, role);
      setIsLoading(false);

      if (result.success && result.user) {
        setSuccessMessage(`Authenticated as ${result.user.name}. Redirecting...`);
        setTimeout(() => {
          if (result.user?.role === 'bidder') {
            navigate('/bidder/dashboard');
          } else {
            navigate('/officer/dashboard');
          }
        }, 400);
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
      }
    }, 300);
  };

  // SSO Login handler
  const handleSsoLogin = (provider: 'NIC' | 'DigiLocker') => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage(`Connecting with ${provider}...`);

    setTimeout(() => {
      const demoUser = role === 'officer' ? 'officer001' : 'bidder001';
      const demoPass = role === 'officer' ? 'officer123' : 'bidder123';
      const result = loginUser(demoUser, demoPass, role);
      setIsLoading(false);

      if (result.success && result.user) {
        setSuccessMessage(`Verified via ${provider} Single Sign-On! Redirecting...`);
        setTimeout(() => {
          if (result.user?.role === 'bidder') {
            navigate('/bidder/dashboard');
          } else {
            navigate('/officer/dashboard');
          }
        }, 400);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col justify-between bg-slate-100 text-slate-900 font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* ------------------------------------------------------------- */}
      {/* TOP STATUTORY HEADER BAR */}
      {/* ------------------------------------------------------------- */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-2 flex items-center justify-between z-20 shadow-2xs shrink-0">
        {/* Left branding group */}
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          {/* Government of India Emblem & Text */}
          <GovtEmblem emblemSize="h-8 sm:h-9 w-auto" />

          {/* Divider */}
          <div className="hidden sm:block h-6 w-[1px] bg-slate-300" />

          {/* GeM Logo */}
          <div className="flex items-center">
            <GeMLogo className="h-8 w-auto" />
          </div>

          {/* Divider */}
          <div className="hidden md:block h-6 w-[1px] bg-slate-300" />

          {/* Platform Title */}
          <div className="hidden md:block">
            <span className="text-xs text-slate-600 font-medium leading-tight block">
              AI-Powered Bid Compliance
              <br />
              Verification Platform
            </span>
          </div>
        </div>

        {/* Right Help Button */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors py-1 px-2.5 rounded-full hover:bg-slate-100 cursor-pointer"
          >
            <span>Need Help?</span>
            <HelpCircle className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN HERO & LOGIN CONTAINER */}
      {/* ------------------------------------------------------------- */}
      <main className="relative flex-1 flex items-center justify-center py-4 sm:py-6 px-4 sm:px-6 lg:px-12 overflow-hidden">
        {/* Background Parliament Illustration Backdrop */}
        <div className="absolute inset-0 z-0">
          <img
            src="/parliament_bg.jpg"
            alt="Indian Parliament Sansad Bhavan backdrop"
            className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.02]"
          />
          {/* Subtle soft gradient overlay so text is crisp on left and right card floats smoothly */}
          <div className="absolute inset-0 bg-linear-to-r from-white/70 via-white/40 to-white/30 backdrop-blur-[0.5px]" />
        </div>

        {/* Inner Content Grid */}
        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* ----------------------------------------------------------- */}
          {/* LEFT COLUMN: HERO TEXT & STAT BADGES */}
          {/* ----------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-5 pt-1 lg:pt-0">
            {/* Bold Headline */}
            <div className="space-y-0.5">
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight text-slate-900 leading-[1.12]">
                Smarter Verification
              </h1>
              <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight text-slate-900 leading-[1.12]">
                Stronger Procurement
              </h2>
              <div className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-[1.12] flex flex-wrap items-baseline gap-2 pt-0.5">
                <span className="text-[#1d6bf3]">A More</span>
                <span className="text-[#f97316]">Transparent</span>
                <span className="text-[#16a34a]">India</span>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-700 font-medium max-w-lg leading-relaxed">
              AI-powered compliance verification for faster, transparent and more efficient GeM procurement.
            </p>

            {/* 3 Feature Pillows / Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-6 sm:gap-8">
              {/* Badge 1: Faster Verification */}
              <div className="flex flex-col items-center text-center space-y-1.5 group">
                <div className="h-12 w-12 rounded-full bg-blue-100/90 border border-blue-200 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105">
                  <Zap className="h-5 w-5 text-blue-600 fill-blue-600" />
                </div>
                <div className="text-[11px] font-bold text-slate-800 max-w-[85px] leading-tight">
                  Faster Verification
                </div>
              </div>

              {/* Badge 2: Improved Compliance */}
              <div className="flex flex-col items-center text-center space-y-1.5 group">
                <div className="h-12 w-12 rounded-full bg-emerald-100/90 border border-emerald-200 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-[11px] font-bold text-slate-800 max-w-[85px] leading-tight">
                  Improved Compliance
                </div>
              </div>

              {/* Badge 3: Transparent Procurement */}
              <div className="flex flex-col items-center text-center space-y-1.5 group">
                <div className="h-12 w-12 rounded-full bg-purple-100/90 border border-purple-200 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-[11px] font-bold text-slate-800 max-w-[85px] leading-tight">
                  Transparent Procurement
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* RIGHT COLUMN: MAIN FLOATING LOGIN CARD */}
          {/* ----------------------------------------------------------- */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] bg-white rounded-3xl sm:rounded-[28px] shadow-2xl border border-slate-100/80 p-6 sm:p-7 relative">
              {/* Card Header */}
              <div className="mb-4">
                <span className="text-xs text-slate-500 font-medium block mb-0.5">Welcome to</span>
                <h3 className="text-2xl sm:text-[25px] font-black text-slate-900 tracking-tight leading-tight">
                  GeM Compliance AI
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Login to your Procurement Dashboard</p>
              </div>

              {/* Role Selection Tabs (Only Procurement Officer & Bidder) */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {/* Tab: Procurement Officer */}
                <button
                  type="button"
                  onClick={() => handleRoleChange('officer')}
                  className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-center border transition-all cursor-pointer ${
                    role === 'officer'
                      ? 'bg-blue-50/90 border-blue-400 text-blue-700 shadow-xs ring-1 ring-blue-300'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <User
                    className={`h-4 w-4 mb-1 ${
                      role === 'officer' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-[11px] font-semibold leading-tight">Procurement Officer</span>
                </button>

                {/* Tab: Bidder */}
                <button
                  type="button"
                  onClick={() => handleRoleChange('bidder')}
                  className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-center border transition-all cursor-pointer ${
                    role === 'bidder'
                      ? 'bg-blue-50/90 border-blue-400 text-blue-700 shadow-xs ring-1 ring-blue-300'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Users
                    className={`h-4 w-4 mb-1 ${
                      role === 'bidder' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-[11px] font-semibold leading-tight">Bidder</span>
                </button>
              </div>

              {/* Alerts */}
              {errorMessage && (
                <div className="mb-3 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs text-rose-800">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-3 flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Email / User ID Input */}
                <div>
                  <label htmlFor="loginId" className="block text-xs font-medium text-slate-700 mb-1">
                    Email / User ID
                  </label>
                  <div className="relative rounded-xl border border-slate-200 bg-slate-50/70 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="loginId"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={role === 'officer' ? 'officer@demo.com' : 'bidder@demo.com'}
                      className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 bg-transparent focus:outline-hidden font-medium placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="loginPassword" className="block text-xs font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative rounded-xl border border-slate-200 bg-slate-50/70 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="loginPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 text-xs text-slate-800 bg-transparent focus:outline-hidden font-medium placeholder:text-slate-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#1d6bf3] hover:bg-[#1858c9] shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span>{isLoading ? 'Verifying...' : 'Login'}</span>
                  {!isLoading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              {/* Or login with Divider */}
              <div className="relative my-3.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-[11px] text-slate-400 font-medium">Or login with</span>
                </div>
              </div>

              {/* SSO Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* NIC SSO */}
                <button
                  type="button"
                  onClick={() => handleSsoLogin('NIC')}
                  className="flex items-center justify-center py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all cursor-pointer hover:border-slate-300"
                >
                  <NicBadge />
                </button>

                {/* DigiLocker SSO */}
                <button
                  type="button"
                  onClick={() => handleSsoLogin('DigiLocker')}
                  className="flex items-center justify-center py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all cursor-pointer hover:border-slate-300"
                >
                  <DigiLockerLogo />
                </button>
              </div>

              {/* Footer text inside card */}
              <p className="mt-4 text-center text-[11px] text-slate-500">
                New to the platform?{' '}
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-slate-700 font-semibold hover:underline cursor-pointer"
                >
                  Contact your administrator.
                </button>
              </p>

              {/* Quick Demo Pill Helper */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span>Demo credentials loaded</span>
                <span className="font-mono text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                  {role === 'officer' ? 'officer001' : 'bidder001'} / {role}123
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* STATUTORY BOTTOM FOOTER BAR */}
      {/* ------------------------------------------------------------- */}
      <footer className="bg-[#0b192c] text-white px-4 sm:px-8 py-2 text-[11px] sm:text-xs z-20 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
        {/* Left tagline */}
        <div className="text-slate-300 font-serif italic text-center sm:text-left">
          &ldquo;Efficient Governance. Stronger Nation.&rdquo;
        </div>

        {/* Right initiatives & Flag Capsule */}
        <div className="flex items-center gap-3 text-slate-300 flex-wrap justify-center">
          <span className="hover:text-white transition-colors cursor-default">Digital India</span>
          <span className="text-slate-600">|</span>
          <span className="hover:text-white transition-colors cursor-default">Atmanirbhar Bharat</span>
          <span className="text-slate-600">|</span>
          <span className="hover:text-white transition-colors cursor-default">Viksit Bharat</span>

          {/* Indian Tricolor Capsule Indicator */}
          <div className="inline-flex items-center h-4 rounded-full overflow-hidden border border-white/20 shadow-xs ml-1">
            <div className="w-2.5 h-full bg-[#ff9933]" title="Saffron" />
            <div className="w-2.5 h-full bg-[#ffffff] flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-[#000080]" />
            </div>
            <div className="w-2.5 h-full bg-[#138808]" title="Green" />
          </div>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: NEED HELP */}
      {/* ------------------------------------------------------------- */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">GeM Portal Support & Guidelines</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600">
              <p>
                Welcome to the <strong>GeM Compliance AI Verification Platform</strong>. You can sign in using:
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div>
                  <span className="font-bold text-slate-800">Procurement Officer:</span> officer@demo.com (or officer001) / officer123
                </div>
                <div>
                  <span className="font-bold text-slate-800">Bidder:</span> bidder@demo.com (or bidder001) / bidder123
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="font-semibold text-slate-800">National Support Desk:</div>
                <div className="text-slate-500">Toll Free: 1800-419-3436 / 1800-102-3436</div>
                <div className="text-slate-500">Email: helpdesk-gem@gov.in</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: FORGOT PASSWORD */}
      {/* ------------------------------------------------------------- */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">Reset Credentials</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600">
              <p>
                In compliance with Government of India Information Security Guidelines, password resets must be verified via Parichay NIC SSO or your registered GeM digital token.
              </p>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-800 text-[11px]">
                For this prototype session, default credentials are pre-configured:
                <div className="mt-1 font-mono font-semibold">
                  Officer: officer123 • Bidder: bidder123
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  FileCheck2,
  Clock,
  CheckCircle2,
  Building2,
  ArrowUpRight,
  Plus,
  ChevronRight,
  AlertTriangle,
  Edit,
  FolderLock,
  Bell,
  Eye,
  Calendar,
  Layers,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  getCurrentUser,
  getBidderProfile,
  getTenders,
  getBidsByBidder,
  getApplicationsByBidder,
  calculateEligibility,
  createOrGetDraftApplication,
} from '../../services/storage';
import { fetchTenders, fetchApplications, subscribeToTenders, subscribeToApplications } from '../../services/supabase';
import { BidderProfile, Tender, Bid, BidApplication } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';

export const BidderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [profile, setProfile] = useState<BidderProfile | null>(null);
  const [tenders, setTenders] = useState<Tender[]>(getTenders());
  const [bids, setBids] = useState<Bid[]>([]);
  const [applications, setApplications] = useState<BidApplication[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const loadLiveData = async (bidderId?: string) => {
    const liveTenders = await fetchTenders();
    setTenders(liveTenders);
    if (bidderId) {
      const liveApps = await fetchApplications(bidderId);
      setApplications(liveApps);
      setBids(getBidsByBidder(bidderId));
    }
  };

  useEffect(() => {
    const currentProfile = getBidderProfile(user?.bidderId);
    setProfile(currentProfile);
    loadLiveData(currentProfile?.id);

    const unsubTenders = subscribeToTenders(() => {
      loadLiveData(currentProfile?.id);
    });
    const unsubApps = subscribeToApplications(() => {
      loadLiveData(currentProfile?.id);
    });

    return () => {
      unsubTenders();
      unsubApps();
    };
  }, [user?.bidderId, user?.id]);

  // Actual dynamic calculations from stored data
  const availableTendersCount = tenders.filter(
    (t) => t.status === 'Active' || t.status === 'Closing Soon'
  ).length;

  const totalApplicationsCount = applications.length > 0 ? applications.length : bids.length;
  const submittedBidsCount = bids.length;
  const pendingVerificationCount = bids.filter(
    (b) => b.verificationStatus === 'Pending' || b.verificationStatus === 'In Verification'
  ).length;

  const clarificationBids = bids.filter((b) => b.bidStatus === 'Clarification Requested');

  const handleApplyClick = (tender: Tender) => {
    if (!profile) return;
    createOrGetDraftApplication(tender, profile);
    navigate(`/bidder/tenders/${tender.id}/apply`);
  };

  return (
    <div className="space-y-6">
      {/* Clean Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              Verified Bidder Portal
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-600 font-mono">
              GSTIN: {profile?.gstin || '07AABCA9812M1Z3'}
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-600 font-mono">
              PAN: {profile?.pan || 'AABCA9812M'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {profile?.companyName || user?.organization || 'Apex Industrial Solutions Ltd.'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Welcome, {user?.name || 'Representative'}. Review active procurement opportunities, track electronic bids, and resolve statutory compliance requirements.
          </p>
        </div>

        {/* Quick Profile Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/bidder/profile"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors shadow-2xs"
          >
            <Building2 className="h-3.5 w-3.5 text-slate-500" />
            <span>Company Profile</span>
          </Link>
          <Link
            to="/bidder/documents"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors shadow-2xs"
          >
            <FolderLock className="h-3.5 w-3.5 text-slate-500" />
            <span>Documents</span>
          </Link>
          <Link
            to="/bidder/tenders"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Browse Tenders</span>
          </Link>
        </div>
      </div>

      {/* Urgent Clarification Notice Banner */}
      {clarificationBids.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Action Required: Officer Clarification Notice Received
              </h4>
              <p className="text-xs text-amber-900 mt-0.5">
                The Procurement Officer has issued formal clarification requests on {clarificationBids.length} submitted bid(s).
                Submit responses before deadline to maintain technical eligibility.
              </p>
            </div>
          </div>
          <Link
            to="/bidder/applications"
            className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs rounded-md shadow-2xs transition-colors whitespace-nowrap text-center shrink-0"
          >
            Respond on Applications Page
          </Link>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Available Tenders"
          value={availableTendersCount}
          subtitle="Open for bidding"
          icon={FileText}
          badgeText="Active"
          badgeVariant="info"
          onClick={() => navigate('/bidder/tenders')}
        />
        <StatCard
          title="Active Applications"
          value={totalApplicationsCount}
          subtitle="Drafts & in-progress"
          icon={FileCheck2}
          badgeText="Packets"
          badgeVariant="neutral"
          onClick={() => navigate('/bidder/applications')}
        />
        <StatCard
          title="Submitted Bids"
          value={submittedBidsCount}
          subtitle="Under evaluation"
          icon={CheckCircle2}
          badgeText="Recorded"
          badgeVariant="success"
          onClick={() => navigate('/bidder/applications')}
        />
        <StatCard
          title="Pending Verification"
          value={pendingVerificationCount}
          subtitle="Awaiting cross-check"
          icon={Clock}
          badgeText="Queue"
          badgeVariant="warning"
          onClick={() => navigate('/bidder/applications')}
        />
      </div>

      {/* Available Tenders Section (Tender Cards as explicitly requested) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Available Procurement Tenders</h2>
            <p className="text-xs text-slate-500">
              Live tender opportunities with automatic profile eligibility evaluation
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center border border-slate-200 rounded-md bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1 rounded flex items-center gap-1 ${
                  viewMode === 'cards' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden md:inline text-[11px]">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1 rounded flex items-center gap-1 ${
                  viewMode === 'table' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden md:inline text-[11px]">Table</span>
              </button>
            </div>

            <Link
              to="/bidder/tenders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
            >
              <span>View All ({tenders.length})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Render Tender Cards (Default) */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenders.slice(0, 6).map((tender) => {
              const evalResult = calculateEligibility(tender, profile);
              const isEligible = evalResult.overallStatus === 'Eligible';
              const hasApplied = bids.some((b) => b.tenderId === tender.id);

              return (
                <div
                  key={tender.id}
                  className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Tender ID & Eligibility Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80">
                        {tender.id}
                      </span>
                      <StatusBadge
                        status={evalResult.overallStatus}
                        variant={
                          evalResult.overallStatus === 'Eligible'
                            ? 'eligible'
                            : evalResult.overallStatus === 'Conditional'
                            ? 'conditional'
                            : 'ineligible'
                        }
                        size="sm"
                      />
                    </div>

                    {/* Tender Title */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                        {tender.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {tender.description}
                      </p>
                    </div>

                    {/* Details: Department & Deadline */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">Department:</span>
                        <span className="font-medium text-slate-800 truncate max-w-[170px] text-right">
                          {tender.issuingOrg}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">Deadline:</span>
                        <span className="font-mono font-medium text-slate-800">
                          {tender.closingDate}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400">Estimated Value:</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹ {tender.estimatedValueCr.toFixed(2)} Cr
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions: Apply / View Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/bidder/tenders/${tender.id}`}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors shadow-2xs"
                    >
                      View Details
                    </Link>

                    {hasApplied ? (
                      <Link
                        to="/bidder/applications"
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md transition-colors"
                      >
                        Applied (View)
                      </Link>
                    ) : isEligible && tender.status === 'Active' ? (
                      <button
                        type="button"
                        onClick={() => handleApplyClick(tender)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors shadow-2xs cursor-pointer"
                      >
                        Apply Now
                      </button>
                    ) : (
                      <Link
                        to={`/bidder/tenders/${tender.id}`}
                        className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        Check Criteria
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View Alternative */
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tender ID</th>
                    <th className="py-3 px-4">Tender Title</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4">Eligibility</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenders.slice(0, 6).map((tender) => {
                    const evalResult = calculateEligibility(tender, profile);
                    const hasApplied = bids.some((b) => b.tenderId === tender.id);
                    return (
                      <tr key={tender.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-blue-700">
                          {tender.id}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                          {tender.title}
                        </td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]">
                          {tender.issuingOrg}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {tender.closingDate}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={evalResult.overallStatus} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/bidder/tenders/${tender.id}`}
                              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded"
                            >
                              View
                            </Link>
                            {!hasApplied && evalResult.overallStatus === 'Eligible' && (
                              <button
                                type="button"
                                onClick={() => handleApplyClick(tender)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded"
                              >
                                Apply
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Recent Applications & Submissions Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Applications & Bids</h2>
            <p className="text-xs text-slate-500">
              Submitted bids, compliance scores, and real-time verification progression
            </p>
          </div>
          <Link
            to="/bidder/applications"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
          >
            <span>View All Applications ({totalApplicationsCount})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {bids.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No bids submitted yet. Browse the available tenders above to apply for your first procurement opportunity.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Bid ID</th>
                  <th className="py-3 px-4">Tender Reference</th>
                  <th className="py-3 px-4">Submitted On</th>
                  <th className="py-3 px-4">Quoted Amount</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bids.slice(0, 5).map((bid) => {
                  const score = bid.complianceScore ?? 0;
                  return (
                    <tr key={bid.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {bid.id}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                        <span className="font-mono text-blue-700 mr-1.5 text-[11px]">{bid.tenderId}</span>
                        <span>{bid.tenderTitle}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {bid.submissionDate || (bid.submittedAt ? new Date(bid.submittedAt).toLocaleDateString('en-IN') : 'Recent')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap font-mono">
                        ₹ {(bid.quotedAmount || bid.offeredValueCr || 0).toFixed(2)} Cr
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {score > 0 ? (
                          <span
                            className={`font-mono font-bold text-xs ${
                              score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-700' : 'text-rose-700'
                            }`}
                          >
                            {score}/100
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={bid.verificationStatus || 'Pending'} size="sm" />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={bid.bidStatus || 'Submitted'} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          to="/bidder/applications"
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded transition-colors"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

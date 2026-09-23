import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  ClipboardList,
  Clock,
  AlertCircle,
  Plus,
  ChevronRight,
  Eye,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Search,
  Filter,
  ArrowUpDown,
  FileCheck2,
} from 'lucide-react';
import { getTenders, getBids } from '../../services/storage';
import { fetchTenders, fetchApplications, subscribeToTenders, subscribeToApplications } from '../../services/supabase';
import { getVerificationReport } from '../../services/verificationService';
import { Tender, Bid } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageHeader } from '../../components/common/PageHeader';

export const OfficerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState<Tender[]>(getTenders());
  const [bids, setBids] = useState<Bid[]>(getBids());

  // Search, Filter & Sort State for Applications Table
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'value'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadData = async () => {
    const liveTenders = await fetchTenders();
    setTenders(liveTenders);
    const liveBids = getBids();
    setBids(liveBids);
  };

  useEffect(() => {
    loadData();
    const unsubTenders = subscribeToTenders(() => loadData());
    const unsubApps = subscribeToApplications(() => loadData());
    return () => {
      unsubTenders();
      unsubApps();
    };
  }, []);

  // Compute live operational statistics requested:
  // 1. Total Tenders
  const totalTendersCount = tenders.length;

  // 2. Active Tenders
  const activeTendersCount = tenders.filter(
    (t) => t.status === 'Active' || t.status === 'Closing Soon'
  ).length;

  // 3. Total Applications
  const totalApplicationsCount = bids.length;

  // 4. Pending Verification
  const pendingVerificationCount = bids.filter(
    (b) =>
      b.verificationStatus === 'Pending' ||
      b.verificationStatus === 'In Verification' ||
      b.bidStatus === 'Submitted'
  ).length;

  // 5. Completed Verification
  const completedVerificationCount = bids.filter(
    (b) =>
      b.verificationStatus === 'Verified' ||
      b.bidStatus === 'Qualified' ||
      b.bidStatus === 'Disqualified'
  ).length;

  // 6. Clarifications
  const clarificationsCount = bids.filter(
    (b) =>
      b.bidStatus === 'Clarification Requested' ||
      b.verificationStatus === 'Review Required'
  ).length;

  // 7. Decision Pending
  const decisionPendingCount = bids.filter(
    (b) =>
      b.bidStatus === 'Submitted' ||
      b.bidStatus === 'Decision Pending' ||
      b.bidStatus === 'Clarification Requested' ||
      b.verificationStatus === 'Review Required'
  ).length;

  // Filtered & Sorted Applications
  const filteredBids = useMemo(() => {
    return bids
      .filter((bid) => {
        // Text search
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchId = bid.id.toLowerCase().includes(q);
          const matchBidder = bid.bidderName.toLowerCase().includes(q);
          const matchTender = (bid.tenderTitle || '').toLowerCase().includes(q) || bid.tenderId.toLowerCase().includes(q);
          if (!matchId && !matchBidder && !matchTender) return false;
        }

        // Status Filter
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'PENDING' && bid.bidStatus !== 'Submitted' && bid.verificationStatus !== 'Pending') return false;
          if (statusFilter === 'VERIFIED' && bid.verificationStatus !== 'Verified') return false;
          if (statusFilter === 'CLARIFICATION' && bid.bidStatus !== 'Clarification Requested') return false;
          if (statusFilter === 'QUALIFIED' && bid.bidStatus !== 'Qualified') return false;
          if (statusFilter === 'DISQUALIFIED' && bid.bidStatus !== 'Disqualified') return false;
        }

        // Risk Filter
        if (riskFilter !== 'ALL' && (bid.riskLevel || 'Low').toUpperCase() !== riskFilter.toUpperCase()) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          const scoreA = a.complianceScore ?? 0;
          const scoreB = b.complianceScore ?? 0;
          return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
        }
        if (sortBy === 'value') {
          const valA = a.quotedAmount || a.offeredValueCr || 0;
          const valB = b.quotedAmount || b.offeredValueCr || 0;
          return sortOrder === 'desc' ? valB - valA : valA - valB;
        }
        // Default: date
        const timeA = new Date(a.submittedAt || a.submissionDate || 0).getTime();
        const timeB = new Date(b.submittedAt || b.submissionDate || 0).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [bids, searchTerm, statusFilter, riskFilter, sortBy, sortOrder]);

  const toggleSort = (field: 'date' | 'score' | 'value') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Officer Header */}
      <PageHeader
        title="Procurement Officer Dashboard"
        subtitle="Operational oversight of public tenders, incoming electronic bids, and automated statutory verification queues."
        breadcrumbs={[{ label: 'Officer Portal' }, { label: 'Dashboard' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/officer/reports"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md shadow-2xs transition-colors"
            >
              <FileText className="h-4 w-4 text-slate-500" />
              <span>Compliance Reports</span>
            </Link>
            <Link
              to="/officer/tenders/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Tender</span>
            </Link>
          </div>
        }
      />

      {/* 7 Operational Usability KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          title="Total Tenders"
          value={totalTendersCount}
          subtitle="All notices"
          icon={Layers}
          badgeText="Total"
          badgeVariant="neutral"
          onClick={() => navigate('/officer/tenders')}
        />
        <StatCard
          title="Active Tenders"
          value={activeTendersCount}
          subtitle="Open for bids"
          icon={Layers}
          badgeText="Live"
          badgeVariant="info"
          onClick={() => navigate('/officer/tenders')}
        />
        <StatCard
          title="Total Applications"
          value={totalApplicationsCount}
          subtitle="Submitted packets"
          icon={ClipboardList}
          badgeText="Bids"
          badgeVariant="neutral"
          onClick={() => navigate('/officer/bids')}
        />
        <StatCard
          title="Pending Verif."
          value={pendingVerificationCount}
          subtitle="Queue backlog"
          icon={Clock}
          badgeText="Action"
          badgeVariant="warning"
          onClick={() => {
            setStatusFilter('PENDING');
          }}
        />
        <StatCard
          title="Completed Verif."
          value={completedVerificationCount}
          subtitle="Cross-checked"
          icon={CheckCircle2}
          badgeText="Verified"
          badgeVariant="success"
          onClick={() => {
            setStatusFilter('VERIFIED');
          }}
        />
        <StatCard
          title="Clarifications"
          value={clarificationsCount}
          subtitle="Queries pending"
          icon={AlertCircle}
          badgeText="Active"
          badgeVariant="warning"
          onClick={() => {
            setStatusFilter('CLARIFICATION');
          }}
        />
        <StatCard
          title="Decision Pending"
          value={decisionPendingCount}
          subtitle="Officer sign-off"
          icon={ShieldCheck}
          badgeText="Pending"
          badgeVariant="info"
          onClick={() => {
            setStatusFilter('ALL');
          }}
        />
      </div>

      {/* Applications Table (Operational Usability) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bidder Applications Directory</h2>
              <p className="text-xs text-slate-500">
                Evaluation console for submitted bids, compliance scores, and risk classifications
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredBids.length} of {bids.length} Bids
              </span>
            </div>
          </div>

          {/* Search, Filter & Sort Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-1 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by bidder, tender ID, title..."
                className="w-full bg-white border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            {/* Filter Pills / Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-0.5">
                <span className="px-2 text-slate-400 text-[10px] font-bold uppercase">Status:</span>
                {(['ALL', 'PENDING', 'VERIFIED', 'CLARIFICATION', 'QUALIFIED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      statusFilter === st
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'PENDING' ? 'Pending' : st === 'VERIFIED' ? 'Verified' : st === 'CLARIFICATION' ? 'Notice' : 'Qualified'}
                  </button>
                ))}
              </div>

              {/* Risk Filter Dropdown */}
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                aria-label="Filter by risk level"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="CRITICAL">Critical Risk</option>
              </select>

              {/* Sort By Toggle */}
              <button
                type="button"
                onClick={() => toggleSort('score')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                  sortBy === 'score'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowUpDown className="h-3 w-3" />
                <span>Score {sortBy === 'score' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Bidder</th>
                <th className="py-3 px-4">Tender</th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('date')}>
                  <div className="flex items-center gap-1">
                    <span>Submitted</span>
                    {sortBy === 'date' && <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('score')}>
                  <div className="flex items-center gap-1">
                    <span>Score</span>
                    {sortBy === 'score' && <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                  </div>
                </th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBids.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No applications match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBids.map((bid) => {
                  const score = bid.complianceScore ?? 0;
                  const risk = bid.riskLevel || 'Low';

                  return (
                    <tr key={bid.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Bidder */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="font-semibold text-slate-900 truncate">{bid.bidderName}</p>
                        <p className="font-mono text-[10px] text-slate-400">{bid.id}</p>
                      </td>

                      {/* Tender */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-700">
                        <span className="font-mono text-blue-700 font-semibold mr-1.5 text-[11px]">{bid.tenderId}</span>
                        <span className="text-slate-500 truncate">{bid.tenderTitle}</span>
                      </td>

                      {/* Submitted */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {bid.submissionDate || (bid.submittedAt ? new Date(bid.submittedAt).toLocaleDateString('en-IN') : 'Recent')}
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {score > 0 ? (
                          <div className="flex items-center gap-1.5 font-mono">
                            <span
                              className={`font-bold text-xs ${
                                score >= 80
                                  ? 'text-emerald-700'
                                  : score >= 60
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {score}
                            </span>
                            <span className="text-[10px] text-slate-400">/100</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Risk */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            risk === 'Critical'
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : risk === 'High'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : risk === 'Medium'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {risk}
                        </span>
                      </td>

                      {/* Verification */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={bid.verificationStatus || 'Pending'} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={bid.bidStatus || 'Submitted'} size="sm" />
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/officer/verification/${bid.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded transition-colors shadow-2xs"
                          >
                            <span>Verify & Decide</span>
                          </Link>
                          <Link
                            to={`/officer/reports/${bid.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors"
                            title="View Statutory Report"
                          >
                            <FileText className="h-3 w-3 text-slate-500" />
                            <span>Report</span>
                          </Link>
                          <Link
                            to={`/officer/bids/${bid.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors"
                            title="Inspect File"
                          >
                            <Eye className="h-3 w-3 text-slate-500" />
                            <span>File</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tender Management Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Procurement Tenders Directory</h2>
            <p className="text-xs text-slate-500">
              Active notices published under your department oversight
            </p>
          </div>
          <Link
            to="/officer/tenders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
          >
            <span>Manage All Tenders ({tenders.length})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Tender ID</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Applications</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenders.slice(0, 5).map((tender) => (
                <tr key={tender.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                    {tender.id}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs truncate">
                    {tender.title}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{tender.issuingOrg}</td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{tender.closingDate}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={tender.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {tender.bidsCount} Received
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Link
                      to={`/officer/tenders?edit=${tender.id}`}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors"
                    >
                      Inspect / Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

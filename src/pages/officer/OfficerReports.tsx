import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Download,
  ShieldCheck,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  Eye,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { getBids, getTenderById, getBidderProfile } from '../../services/storage';
import { getVerificationReport } from '../../services/verificationService';

export const OfficerReports: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'QUALIFIED' | 'DISQUALIFIED' | 'CLARIFICATION' | 'PENDING'>('ALL');

  const bids = getBids();

  // Augment bids with verification report data
  const reportRows = useMemo(() => {
    return bids.map((b) => {
      const tender = getTenderById(b.tenderId);
      const report = getVerificationReport(b.id);
      return {
        bid: b,
        tender,
        report,
        score: report?.overallScore ?? (b.verificationStatus === 'Verified' ? 85 : null),
        riskLevel: report?.riskLevel ?? (b.verificationStatus === 'Verified' ? 'Low' : 'Medium'),
      };
    });
  }, [bids]);

  const filteredRows = useMemo(() => {
    return reportRows.filter((row) => {
      const matchesSearch =
        row.bid.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.bid.bidderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.tender?.title || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'QUALIFIED') return row.bid.bidStatus === 'Qualified';
      if (statusFilter === 'DISQUALIFIED') return row.bid.bidStatus === 'Disqualified';
      if (statusFilter === 'CLARIFICATION') return row.bid.bidStatus === 'Clarification Requested';
      if (statusFilter === 'PENDING') return row.bid.bidStatus === 'Decision Pending' || row.bid.bidStatus === 'Submitted' || row.bid.bidStatus === 'Under Verification';

      return true;
    });
  }, [reportRows, searchTerm, statusFilter]);

  // Aggregate stats
  const totalBids = reportRows.length;
  const verifiedCount = reportRows.filter((r) => r.report || r.bid.verificationStatus === 'Verified').length;
  const qualifiedCount = reportRows.filter((r) => r.bid.bidStatus === 'Qualified').length;
  const disqualifiedCount = reportRows.filter((r) => r.bid.bidStatus === 'Disqualified').length;
  const clarificationCount = reportRows.filter((r) => r.bid.bidStatus === 'Clarification Requested').length;
  const highRiskCount = reportRows.filter((r) => r.riskLevel === 'High' || r.riskLevel === 'Critical').length;

  const validScores = reportRows.filter((r) => r.score !== null).map((r) => r.score as number);
  const avgScore = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;

  const handleExportCSV = () => {
    const headers = [
      'Bid ID',
      'Tender ID',
      'Tender Title',
      'Bidder Name',
      'GSTIN',
      'Compliance Score',
      'Risk Level',
      'Verification Status',
      'Bid Status',
      'Officer Decision',
      'Submission Date',
    ];

    const rows = reportRows.map((r) => [
      r.bid.id,
      r.tender?.id || r.bid.tenderId,
      `"${(r.tender?.title || '').replace(/"/g, '""')}"`,
      `"${r.bid.bidderName.replace(/"/g, '""')}"`,
      getBidderProfile(r.bid.bidderId)?.gstin || '07AABCA9812M1Z3',
      r.score ?? 'N/A',
      r.riskLevel,
      r.bid.verificationStatus,
      r.bid.bidStatus,
      r.bid.currentDecision?.decision || 'Pending',
      r.bid.submittedAt ? new Date(r.bid.submittedAt).toLocaleDateString('en-IN') : 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GeM_Compliance_Summary_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance & Statutory Reports"
        subtitle="Audited repository of multilateral verification records, executive compliance scorecards, and statutory due diligence artifacts."
        breadcrumbs={[{ label: 'Officer Portal', href: '/officer/dashboard' }, { label: 'Reports' }]}
        actions={
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Compliance CSV</span>
          </button>
        }
      />

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Bids</span>
          <p className="text-xl font-black text-slate-900">{totalBids}</p>
          <span className="text-[10px] text-slate-400">Received Across Tenders</span>
        </div>

        <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Verified Pipeline</span>
          <p className="text-xl font-black text-blue-700">{verifiedCount}</p>
          <span className="text-[10px] text-slate-400">3-Way Checks Run</span>
        </div>

        <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Avg Compliance</span>
          <p className="text-xl font-black text-slate-900">{avgScore}<span className="text-xs text-slate-400">/100</span></p>
          <span className="text-[10px] text-slate-400">Weighted Index</span>
        </div>

        <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Qualified</span>
          <p className="text-xl font-black text-emerald-700">{qualifiedCount}</p>
          <span className="text-[10px] text-emerald-600">Statutory Eligible</span>
        </div>

        <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Clarifications</span>
          <p className="text-xl font-black text-amber-700">{clarificationCount}</p>
          <span className="text-[10px] text-amber-600">Pending Response</span>
        </div>

        <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">High / Crit Risk</span>
          <p className="text-xl font-black text-red-700">{highRiskCount}</p>
          <span className="text-[10px] text-red-600">Anomalies Detected</span>
        </div>
      </div>

      {/* Main Reports Table Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-700" />
            <h2 className="text-sm font-bold text-slate-900">Bid Compliance Due Diligence Register</h2>
            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-bold text-[10px]">
              {filteredRows.length} Records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Bid, Tender, Bidder..."
                className="pl-8 pr-3 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-800 w-48 md:w-60"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Determinations</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="DISQUALIFIED">Disqualified</option>
              <option value="CLARIFICATION">Clarification</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3">Bid Reference</th>
                <th className="py-2.5 px-3">Tender & Department</th>
                <th className="py-2.5 px-3">Bidder Entity</th>
                <th className="py-2.5 px-3 text-center">Score</th>
                <th className="py-2.5 px-3 text-center">Risk Rating</th>
                <th className="py-2.5 px-3">Official Determination</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No compliance report records match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.bid.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {row.bid.id}
                      <span className="block text-[10px] font-normal text-slate-400 font-sans">
                        {row.bid.submittedAt ? new Date(row.bid.submittedAt).toLocaleDateString('en-IN') : '2026-03-15'}
                      </span>
                    </td>

                    <td className="py-3 px-3 max-w-[200px]">
                      <span className="font-semibold text-slate-900 block truncate">{row.tender?.title || row.bid.tenderId}</span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {row.tender?.issuingOrg || row.tender?.ministryDepartment || 'Central Procurement Directorate'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{row.bid.bidderName}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        GSTIN: {getBidderProfile(row.bid.bidderId)?.gstin || '07AABCA9812M1Z3'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {row.score !== null ? (
                        <span className="font-mono font-bold text-slate-900 text-xs">{row.score}/100</span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Pending</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.riskLevel === 'Low'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.riskLevel === 'Medium'
                            ? 'bg-amber-100 text-amber-900'
                            : row.riskLevel === 'High'
                            ? 'bg-orange-100 text-orange-900'
                            : 'bg-red-100 text-red-900'
                        }`}
                      >
                        {row.riskLevel}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.bid.bidStatus === 'Qualified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.bid.bidStatus === 'Disqualified'
                            ? 'bg-red-100 text-red-800'
                            : row.bid.bidStatus === 'Clarification Requested'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {row.bid.bidStatus}
                      </span>
                      {row.bid.currentDecision?.decisionTimestamp && (
                        <span className="block text-[9px] text-slate-400">
                          {new Date(row.bid.currentDecision.decisionTimestamp).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/officer/reports/${row.bid.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                          title="View Formal Statutory Verification Report"
                        >
                          <FileText className="h-3 w-3" />
                          <span>Report</span>
                        </Link>
                        <Link
                          to={`/officer/verification/${row.bid.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                          title="Open Verification Console"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Console</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default OfficerReports;

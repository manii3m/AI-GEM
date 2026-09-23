import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';
import { getBids } from '../../services/storage';
import { fetchBidsForOfficer, subscribeToApplications } from '../../services/supabase';
import { Bid } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';

export const OfficerBids: React.FC = () => {
  const [bids, setBids] = useState<Bid[]>(getBids());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');

  const loadLiveBids = async () => {
    const live = await fetchBidsForOfficer();
    setBids(live);
  };

  useEffect(() => {
    loadLiveBids();
    const unsubscribe = subscribeToApplications(() => {
      loadLiveBids();
    });
    return () => unsubscribe();
  }, []);

  const filteredBids = bids.filter((bid) => {
    const matchesSearch =
      searchQuery === '' ||
      bid.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.bidderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.tenderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.tenderTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || (bid.bidStatus || 'Submitted') === statusFilter;
    const matchesVerification =
      verificationFilter === 'all' || (bid.verificationStatus || 'Pending') === verificationFilter;

    return matchesSearch && matchesStatus && matchesVerification;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incoming Electronic Bids Directory"
        subtitle="Full repository of vendor bids submitted through GeM, linked to associated tenders and compliance verification queues."
        breadcrumbs={[{ label: 'Officer Portal', href: '/officer/dashboard' }, { label: 'Bids' }]}
      />

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Bid ID (e.g. BID-2026-0801), Bidder Name, or Tender Reference..."
              className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-hidden bg-slate-50/50"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-hidden bg-white"
            >
              <option value="all">All Bid Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Verification">Under Verification</option>
              <option value="Verified">Verified</option>
              <option value="Decision Pending">Decision Pending</option>
            </select>
          </div>

          <div>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-hidden bg-white"
            >
              <option value="all">All Verification Stages</option>
              <option value="Pending">Pending</option>
              <option value="In Verification">In Verification</option>
              <option value="Verified">Verified</option>
              <option value="Review Required">Review Required</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-900">{filteredBids.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{bids.length}</span> electronic bids
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Bid ID</th>
                <th className="py-3 px-4">Tender ID</th>
                <th className="py-3 px-4">Bidder</th>
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4">Bid Amount</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Risk</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBids.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No submitted bids match your selected search criteria.
                  </td>
                </tr>
              ) : (
                filteredBids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {bid.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                      {bid.tenderId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[180px] truncate">
                      {bid.bidderName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {bid.submissionDate || new Date(bid.submittedAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      ₹ {(bid.quotedAmount || bid.offeredValueCr).toFixed(2)} Cr
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {bid.complianceScore !== undefined ? (
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            bid.complianceScore >= 85
                              ? 'bg-emerald-100 text-emerald-800'
                              : bid.complianceScore >= 65
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {bid.complianceScore}/100
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {bid.riskLevel ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            bid.riskLevel === 'Low'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : bid.riskLevel === 'Medium'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {bid.riskLevel}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={bid.verificationStatus || 'Pending'} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/officer/verification/${bid.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded transition-colors"
                        >
                          <span>{bid.verificationReport ? 'Audit' : 'Verify'}</span>
                        </Link>
                        <Link
                          to={`/officer/bids/${bid.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-blue-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          <span>File</span>
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

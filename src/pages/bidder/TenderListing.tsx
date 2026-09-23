import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown } from 'lucide-react';
import {
  getTenders,
  getBidderProfile,
  getCurrentUser,
  calculateEligibility,
  getBidsByBidder,
  createOrGetDraftApplication,
} from '../../services/storage';
import { fetchTenders, subscribeToTenders, fetchApplications } from '../../services/supabase';
import { Tender } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';

export const TenderListing: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const profile = getBidderProfile(user?.bidderId);
  const [tenders, setTenders] = useState<Tender[]>(getTenders());
  const [bids, setBids] = useState(profile ? getBidsByBidder(profile.id) : []);

  useEffect(() => {
    const loadLiveTenders = async () => {
      const list = await fetchTenders();
      setTenders(list);
      if (profile) {
        const apps = await fetchApplications(profile.id);
        const submitted = apps.filter((a) => a.status === 'Submitted');
        if (submitted.length > 0) {
          setBids(getBidsByBidder(profile.id));
        }
      }
    };

    loadLiveTenders();
    const unsubscribe = subscribeToTenders(() => {
      loadLiveTenders();
    });
    return () => unsubscribe();
  }, [profile?.id]);

  const handleApplyClick = (tender: Tender) => {
    if (!profile) return;
    createOrGetDraftApplication(tender, profile);
    navigate(`/bidder/tenders/${tender.id}/apply`);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    tenders.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [tenders]);

  // Filter and sort tenders
  const filteredTenders = useMemo(() => {
    return tenders
      .filter((tender) => {
        const matchesQuery =
          searchQuery === '' ||
          tender.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tender.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tender.issuingOrg.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          selectedCategory === 'all' || tender.category === selectedCategory;

        const matchesStatus =
          selectedStatus === 'all' || tender.status === selectedStatus;

        return matchesQuery && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.closingDate).getTime();
        const dateB = new Date(b.closingDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [tenders, searchQuery, selectedCategory, selectedStatus, sortOrder]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central Tender Directory"
        subtitle="Browse active and upcoming government procurement tenders with instant AI-driven compliance matching against your registered organization profile."
        breadcrumbs={[
          { label: 'Portal', href: '/bidder/dashboard' },
          { label: 'Tenders' },
        ]}
      />

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative sm:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Tender ID (e.g. DEMO-GEM-2026-001), Title, or Issuing Authority..."
              className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-hidden bg-slate-50/50"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-hidden bg-white"
            >
              <option value="all">All Procurement Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 focus:outline-hidden bg-white"
            >
              <option value="all">All Tender Statuses</option>
              <option value="Active">Active</option>
              <option value="Closing Soon">Closing Soon</option>
              <option value="Under Evaluation">Under Evaluation</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-900">{filteredTenders.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{tenders.length}</span> procurement tenders
          </div>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
          >
            <ArrowUpDown className="h-3 w-3" />
            <span>Closing Date: {sortOrder === 'asc' ? 'Earliest First' : 'Latest First'}</span>
          </button>
        </div>
      </div>

      {/* Tender Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Tender ID</th>
                <th className="py-3 px-4">Tender Title & Scope</th>
                <th className="py-3 px-4">Issuing Organization</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Published</th>
                <th className="py-3 px-4">Closing Date</th>
                <th className="py-3 px-4">Est. Value</th>
                <th className="py-3 px-4">Your Eligibility</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No procurement tenders match your selected search criteria.
                  </td>
                </tr>
              ) : (
                filteredTenders.map((tender) => {
                  const evalResult = calculateEligibility(tender, profile);
                  const isEligible = evalResult.overallStatus === 'Eligible';
                  const hasApplied = bids.some((b) => b.tenderId === tender.id);

                  return (
                    <tr key={tender.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                        {tender.id}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <Link
                          to={`/bidder/tenders/${tender.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-700 transition-colors line-clamp-1"
                        >
                          {tender.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {tender.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-[180px] truncate">
                        {tender.issuingOrg}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-700">
                          {tender.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {tender.publishedDate}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                        {tender.closingDate}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        ₹ {tender.estimatedValueCr.toFixed(2)} Cr
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
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
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={tender.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/bidder/tenders/${tender.id}`}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors"
                          >
                            View Details
                          </Link>
                          {isEligible && tender.status === 'Active' && !hasApplied && (
                            <button
                              type="button"
                              onClick={() => handleApplyClick(tender)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-2xs cursor-pointer"
                            >
                              Apply Now
                            </button>
                          )}
                          {hasApplied && (
                            <Link
                              to="/bidder/applications"
                              className="px-2 py-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                            >
                              Applied
                            </Link>
                          )}
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
    </div>
  );
};

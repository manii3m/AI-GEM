import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Eye,
  AlertTriangle,
  Send,
  ShieldCheck,
  FileText,
  Edit,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import {
  getCurrentUser,
  getBidderProfile,
  getBidsByBidder,
  getApplicationsByBidder,
} from '../../services/storage';
import { fetchApplications, subscribeToApplications } from '../../services/supabase';
import { submitBidderClarification, getVerificationReport } from '../../services/verificationService';
import { Bid, BidApplication, VerificationReport } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';

export const MyApplications: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [bids, setBids] = useState<Bid[]>([]);
  const [applications, setApplications] = useState<BidApplication[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Clarification Modal State
  const [activeClarificationBid, setActiveClarificationBid] = useState<Bid | null>(null);
  const [clarificationResponseText, setClarificationResponseText] = useState('');
  const [isSubmittingClarification, setIsSubmittingClarification] = useState(false);

  // Timeline / Decision Details Modal State
  const [selectedBidForTimeline, setSelectedBidForTimeline] = useState<{
    bid: Bid;
    report?: VerificationReport | null;
  } | null>(null);

  const loadData = async () => {
    const currentProfile = getBidderProfile(user?.bidderId);
    if (currentProfile) {
      const liveApps = await fetchApplications(currentProfile.id);
      setApplications(liveApps);
      const bidderBids = getBidsByBidder(currentProfile.id);
      setBids(bidderBids);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToApplications(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [user?.bidderId, user?.id]);

  // Find bids needing clarification
  const clarificationBids = bids.filter((b) => b.bidStatus === 'Clarification Requested');

  const handleOpenClarificationModal = (bid: Bid) => {
    setActiveClarificationBid(bid);
    setClarificationResponseText('');
  };

  const handleSubmitClarification = () => {
    if (!activeClarificationBid) return;
    if (!clarificationResponseText.trim()) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Response Required',
        message: 'Please provide an explanatory response or documentary clarification.',
      });
      return;
    }

    setIsSubmittingClarification(true);
    setTimeout(() => {
      const success = submitBidderClarification(
        activeClarificationBid.id,
        clarificationResponseText
      );
      setIsSubmittingClarification(false);

      if (success) {
        setActiveClarificationBid(null);
        loadData();
        setToast({
          id: Date.now().toString(),
          type: 'success',
          title: 'Clarification Transmitted',
          message: 'Your formal clarification response has been recorded and submitted to the Procurement Officer.',
        });
      } else {
        setToast({
          id: Date.now().toString(),
          type: 'error',
          title: 'Transmission Failed',
          message: 'Unable to record clarification response.',
        });
      }
    }, 400);
  };

  const handleOpenTimeline = (bid: Bid) => {
    const report = getVerificationReport(bid.id);
    setSelectedBidForTimeline({ bid, report });
  };

  const inProgressDrafts = applications.filter((a) => a.status === 'Draft');

  return (
    <div className="space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="My Applications & Bid Submissions"
        subtitle="Manage in-progress application drafts, monitor statutory cross-verification statuses, and respond to official procurement notices."
        breadcrumbs={[{ label: 'Bidder Portal', href: '/bidder/dashboard' }, { label: 'Applications' }]}
        actions={
          <Link
            to="/bidder/tenders"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors"
          >
            <span>Browse Active Tenders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {/* Urgent Clarification Notice Banner */}
      {clarificationBids.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Official Clarification Required on {clarificationBids.length} Bid(s)
              </h4>
              <p className="text-xs text-amber-900 mt-0.5">
                The Procurement Officer has issued formal queries. Submit your written response or documentary attachments promptly.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenClarificationModal(clarificationBids[0])}
            className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs rounded-md shadow-2xs transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            Respond to Notice
          </button>
        </div>
      )}

      {/* In-Progress Draft Applications Section */}
      {inProgressDrafts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">In-Progress Draft Applications</h3>
              <p className="text-xs text-slate-500">
                Application packets initiated but not yet submitted
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              {inProgressDrafts.length} Active Draft(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tender Reference</th>
                  <th className="py-3 px-4">Last Modified</th>
                  <th className="py-3 px-4">Quoted Base</th>
                  <th className="py-3 px-4">Documents</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inProgressDrafts.map((draft) => (
                  <tr key={draft.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <Link
                        to={`/bidder/tenders/${draft.tenderId}`}
                        className="font-mono font-semibold text-blue-700 hover:underline block"
                      >
                        {draft.tenderId}
                      </Link>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{draft.tenderTitle}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(draft.updatedAt).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap font-mono">
                      ₹ {draft.financialBid.quotedAmountCr.toFixed(2)} Cr
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-slate-600 text-[11px]">
                        {draft.documents.filter((d) => d.status === 'Uploaded').length} of {draft.documents.length} Attached
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                        Draft
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/bidder/tenders/${draft.tenderId}/apply`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Continue Form</span>
                        </Link>
                        <Link
                          to={`/bidder/applications/${draft.id}/review`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Review & Submit</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submitted Bids Section */}
      {bids.length === 0 && inProgressDrafts.length === 0 ? (
        <EmptyState
          title="No Applications or Bids Found"
          description="Your organization has not yet initiated or submitted any bids. Explore the central tender directory to evaluate eligibility and submit applications."
          action={{
            label: 'Explore Active Tenders',
            onClick: () => navigate('/bidder/tenders'),
          }}
        />
      ) : bids.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Submitted Electronic Bids</h3>
              <p className="text-xs text-slate-500">
                Official bids recorded in the verification and officer determination register
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              {bids.length} Submitted Bid(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Bid Reference</th>
                  <th className="py-3 px-4">Tender Reference</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Quoted Value</th>
                  <th className="py-3 px-4">Compliance Score</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Bid Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bids.map((bid) => {
                  const matchingApp = applications.find(
                    (a) => a.id === bid.applicationId || a.tenderId === bid.tenderId
                  );
                  const score = bid.complianceScore ?? 0;

                  return (
                    <tr key={bid.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {bid.id}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <Link
                          to={`/bidder/tenders/${bid.tenderId}`}
                          className="font-mono font-semibold text-blue-700 hover:underline block truncate"
                        >
                          {bid.tenderId}
                        </Link>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{bid.tenderTitle}</p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {bid.submissionDate || (bid.submittedAt ? new Date(bid.submittedAt).toLocaleDateString('en-IN') : 'Recent')}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap font-mono">
                        ₹ {(bid.quotedAmount || bid.offeredValueCr || 0).toFixed(2)} Cr
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {score > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {score}/100
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                                bid.riskLevel === 'Critical'
                                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                                  : bid.riskLevel === 'High'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : bid.riskLevel === 'Medium'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {bid.riskLevel || 'Low'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={bid.verificationStatus || 'Pending'} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={bid.bidStatus || 'Submitted'} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {bid.bidStatus === 'Clarification Requested' && (
                            <button
                              onClick={() => handleOpenClarificationModal(bid)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-300 hover:bg-amber-100 rounded transition-colors cursor-pointer"
                            >
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              <span>Respond</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenTimeline(bid)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors shadow-2xs cursor-pointer"
                            title="Inspect Timeline"
                          >
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span>Timeline</span>
                          </button>

                          <Link
                            to={`/bidder/applications/${matchingApp?.id || bid.applicationId || bid.id}/review`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded transition-colors"
                            title="View submitted application packet"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Packet</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Clarification Response Modal */}
      {activeClarificationBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Officer Clarification Query • {activeClarificationBid.id}
                </h4>
              </div>
              <button
                onClick={() => setActiveClarificationBid(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md space-y-1">
              <span className="font-bold text-amber-900 text-[11px]">Procurement Officer Notice:</span>
              <p className="text-xs text-amber-950 leading-relaxed font-normal">
                {activeClarificationBid.clarificationRequest?.message ||
                  activeClarificationBid.currentDecision?.clarificationMessage ||
                  'Please furnish documentary clarification regarding financial turnover and statutory certifications.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Bidder Clarification Statement & Evidence <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={4}
                value={clarificationResponseText}
                onChange={(e) => setClarificationResponseText(e.target.value)}
                placeholder="Detail your statutory explanation, UDIN reference numbers, or supporting certificate clarifications..."
                className="w-full border border-slate-200 rounded-md p-2.5 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveClarificationBid(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingClarification}
                onClick={handleSubmitClarification}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors disabled:opacity-50"
              >
                <Send className="h-3 w-3" />
                <span>{isSubmittingClarification ? 'Transmitting...' : 'Submit Clarification'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {selectedBidForTimeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden text-xs space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Bid Lifecycle & Verification Timeline</h4>
                <p className="text-slate-500 text-[11px] font-mono mt-0.5">{selectedBidForTimeline.bid.id}</p>
              </div>
              <button
                onClick={() => setSelectedBidForTimeline(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-slate-900">Bid Submitted Electronically</p>
                  <p className="text-slate-500 text-[11px]">
                    {selectedBidForTimeline.bid.submissionDate || new Date(selectedBidForTimeline.bid.submittedAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-slate-900">Automated Statutory Cross-Verification</p>
                  <p className="text-slate-500 text-[11px]">
                    Status: {selectedBidForTimeline.bid.verificationStatus || 'Pending'} • Score:{' '}
                    {selectedBidForTimeline.report?.overallScore ?? selectedBidForTimeline.bid.complianceScore ?? 'Pending'}/100
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0 font-bold text-xs">
                  3
                </div>
                <div>
                  <p className="font-bold text-slate-900">Officer Technical Determination</p>
                  <p className="text-slate-500 text-[11px]">
                    Status: {selectedBidForTimeline.bid.bidStatus || 'Under Review'}
                  </p>
                  {Boolean((selectedBidForTimeline.bid.currentDecision as any)?.decisionReason || (selectedBidForTimeline.bid.currentDecision as any)?.officerNotes) && (
                    <p className="text-slate-700 bg-slate-50 p-2 rounded mt-1 border border-slate-200 text-[11px]">
                      Remarks: {(selectedBidForTimeline.bid.currentDecision as any)?.decisionReason || (selectedBidForTimeline.bid.currentDecision as any)?.officerNotes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedBidForTimeline(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

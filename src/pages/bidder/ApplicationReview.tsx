import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Building2,
  CheckCircle2,
  XCircle,
  IndianRupee,
  FileCheck2,
  Edit,
  Send,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Check,
} from 'lucide-react';
import {
  getApplicationById,
  getTenderById,
  getBidderProfile,
  calculateEligibility,
  submitApplicationAndCreateBid,
  saveApplication,
} from '../../services/storage';
import { submitApplicationToCloud, checkDuplicateApplication } from '../../services/supabase';
import { BidApplication, Tender, BidderProfile } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Toast, ToastMessage } from '../../components/common/Toast';

export const ApplicationReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<BidApplication | null>(null);
  const [tender, setTender] = useState<Tender | null>(null);
  const [profile, setProfile] = useState<BidderProfile | null>(null);

  const [declarationsAccepted, setDeclarationsAccepted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (!id) return;
    const app = getApplicationById(id);
    if (!app) return;

    setApplication(app);
    setDeclarationsAccepted(app.declarationsAccepted || false);

    const t = getTenderById(app.tenderId);
    if (t) setTender(t);

    const p = getBidderProfile(app.bidderId);
    if (p) setProfile(p);
  }, [id]);

  if (!application || !tender || !profile) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-xs text-slate-500">
        <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="font-bold text-slate-800 text-sm">Application Packet Not Found</p>
        <p className="mt-1">The requested application draft could not be retrieved.</p>
        <Link
          to="/bidder/tenders"
          className="mt-4 inline-block px-3 py-1.5 bg-blue-700 text-white rounded font-medium"
        >
          Return to Tenders
        </Link>
      </div>
    );
  }

  const eligibility = calculateEligibility(tender, profile);

  // Validate submission criteria
  const runSubmissionValidation = (): string[] => {
    const errors: string[] = [];

    if (!application.bidderInfo.companyName || !application.bidderInfo.pan || !application.bidderInfo.gstin) {
      errors.push('Mandatory bidder registration attributes (Company, PAN, GSTIN) are incomplete.');
    }

    if (eligibility.overallStatus === 'Ineligible') {
      errors.push(
        `Mandatory tender eligibility requirements not satisfied (${eligibility.failedCount} failed criteria).`
      );
    }

    const missingDocs = application.documents.filter(
      (doc) => doc.isRequired && doc.status !== 'Uploaded'
    );
    if (missingDocs.length > 0) {
      missingDocs.forEach((d) => {
        errors.push(`Mandatory document missing: ${d.documentName}`);
      });
    }

    if (!application.financialBid.quotedAmountCr || application.financialBid.quotedAmountCr <= 0) {
      errors.push('Commercial quotation is invalid or ₹ 0.');
    }

    if (!declarationsAccepted) {
      errors.push('You must accept the statutory declaration regarding authenticity before submission.');
    }

    return errors;
  };

  const handleOpenConfirm = () => {
    const errs = runSubmissionValidation();
    setValidationErrors(errs);
    if (errs.length > 0) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Validation Errors Detected',
        message: `Please resolve the ${errs.length} highlighted validation check(s) before final bid submission.`,
      });
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    const isDuplicate = await checkDuplicateApplication(application.tenderId, application.bidderId);
    if (isDuplicate) {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Duplicate Application Detected',
        message: `An active bid has already been submitted for tender ${application.tenderId}. Multiple bids are prohibited.`,
      });
      return;
    }

    const updatedApp: BidApplication = {
      ...application,
      declarationsAccepted: true,
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveApplication(updatedApp);

    const submissionResult = submitApplicationAndCreateBid(updatedApp.id);
    const createdBid = submissionResult.bid;

    try {
      await submitApplicationToCloud(updatedApp);
    } catch (err) {
      console.warn('Cloud sync error (fallback to local state):', err);
    }

    setIsSubmitting(false);
    setIsConfirmModalOpen(false);

    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: 'Bid Successfully Submitted',
      message: `Your bid packet ${createdBid?.id || updatedApp.id} has been recorded in the central procurement register.`,
    });

    setTimeout(() => {
      navigate('/bidder/applications');
    }, 800);
  };

  // 6 Steps stepper
  const steps = [
    { num: 1, label: 'Tender Information' },
    { num: 2, label: 'Eligibility' },
    { num: 3, label: 'Bid Details' },
    { num: 4, label: 'Documents' },
    { num: 5, label: 'Review' },
    { num: 6, label: 'Submission' },
  ];

  return (
    <div className="space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title={`Review Bid Application — ${tender.id}`}
        subtitle="Review technical parameters, commercial quote, and statutory attachments before electronic submission."
        breadcrumbs={[
          { label: 'Bidder Portal', href: '/bidder/dashboard' },
          { label: 'Tenders', href: '/bidder/tenders' },
          { label: tender.id, href: `/bidder/tenders/${tender.id}` },
          { label: 'Application Form', href: `/bidder/tenders/${tender.id}/apply` },
          { label: 'Review & Submit' },
        ]}
        actions={
          <Link
            to={`/bidder/tenders/${tender.id}/apply`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors shadow-2xs"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit Form Details</span>
          </Link>
        }
      />

      {/* Stepper with Step 5: Review active */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {steps.map((st) => {
            const isCurrent = st.num === 5;
            const isCompleted = st.num < 5;

            return (
              <div
                key={st.num}
                className={`flex items-center gap-2 p-2 rounded-md transition-all text-left ${
                  isCurrent
                    ? 'bg-blue-50 border border-blue-200 font-bold text-blue-900 shadow-2xs'
                    : isCompleted
                    ? 'bg-emerald-50/40 border border-emerald-200/70 text-emerald-900 font-medium'
                    : 'bg-slate-50 border border-slate-100 text-slate-500'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isCurrent
                      ? 'bg-blue-700 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : st.num}
                </span>
                <span className="truncate text-[11px] font-semibold">{st.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation Checklist Banner */}
      {validationErrors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-xs text-rose-900 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-rose-950">
            <XCircle className="h-4 w-4 text-rose-700 shrink-0" />
            <span>Pre-Submission Statutory Validation Failed</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Section Summaries */}
      <div className="space-y-4 text-xs">
        {/* 1. Tender Specifications */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-700" />
              <h3 className="font-bold text-sm text-slate-900">1. Tender Specifications</h3>
            </div>
            <StatusBadge status={tender.status} size="sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Tender Title</span>
              <p className="font-semibold text-slate-900 mt-0.5">{tender.title}</p>
              <p className="font-mono text-blue-700 text-[11px]">{tender.id}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Department</span>
              <p className="font-semibold text-slate-900 mt-0.5">{tender.issuingOrg}</p>
              <p className="text-slate-500 text-[11px]">{tender.category}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Est. Value & Deadline</span>
              <p className="font-bold text-slate-900 mt-0.5 font-mono">₹ {tender.estimatedValueCr.toFixed(2)} Cr</p>
              <p className="text-slate-500 text-[11px]">Closing: {tender.closingDate}</p>
            </div>
          </div>
        </div>

        {/* 2. Commercial / Financial Bid */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-blue-700" />
              <h3 className="font-bold text-sm text-slate-900">2. Commercial Financial Bid</h3>
            </div>
            <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded text-xs">
              Quotation: ₹ {application.financialBid.totalBidAmountCr.toFixed(2)} Cr
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-md border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Quoted Base Value</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5 text-sm">
                ₹ {application.financialBid.quotedAmountCr.toFixed(2)} Cr
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Calculated GST</span>
              <p className="font-mono font-semibold text-slate-800 mt-0.5">
                ₹ {application.financialBid.taxAmountCr.toFixed(2)} Cr
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total All-Inclusive (L1)</span>
              <p className="font-mono font-bold text-blue-700 mt-0.5 text-sm">
                ₹ {application.financialBid.totalBidAmountCr.toFixed(2)} Cr
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Price Validity</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {application.financialBid.priceValidityDays} Days
              </p>
            </div>
          </div>
        </div>

        {/* 3. Document Attachments */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-blue-700" />
              <h3 className="font-bold text-sm text-slate-900">3. Document Attachments Verification</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {application.documents.filter((d) => d.status === 'Uploaded').length} of {application.documents.length} Uploaded
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {application.documents.map((doc, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{doc.documentName}</p>
                  <p className="text-[11px] text-slate-500">
                    {doc.fileName ? `${doc.fileName} (${doc.fileSize})` : 'No file uploaded'}
                  </p>
                </div>
                <StatusBadge status={doc.status === 'Uploaded' ? 'Verified' : 'Pending'} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statutory Acceptance Declaration Checkbox */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={declarationsAccepted}
            onChange={(e) => setDeclarationsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
          />
          <div className="text-xs text-slate-700 space-y-1">
            <p className="font-bold text-slate-900">
              Statutory Declaration under Rule 144 of General Financial Rules (GFR 2017)
            </p>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              I hereby certify that all information, declarations, and uploaded documentary proofs submitted in this electronic bid are genuine, accurate, and valid under the laws of the Government of India. I acknowledge that any misrepresentation will result in immediate disqualification and debarment.
            </p>
          </div>
        </label>
      </div>

      {/* Action Strip: Step 6 Submission */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <Link
          to={`/bidder/tenders/${tender.id}/apply`}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          ← Return to Edit
        </Link>

        <button
          type="button"
          onClick={handleOpenConfirm}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors cursor-pointer"
        >
          <Send className="h-4 w-4" />
          <span>Confirm & Submit Bid Application</span>
        </button>
      </div>

      {/* Final Submission Confirmation Modal */}
      {isConfirmModalOpen && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => !isSubmitting && setIsConfirmModalOpen(false)}
          title="Confirm Electronic Bid Submission"
          subtitle="Final verification before recording bid in the central procurement register"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors"
              >
                {isSubmitting ? 'Recording Submission...' : 'Confirm Submission'}
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-slate-700">
            <p>
              You are submitting an official electronic bid for:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
              <p><strong>Tender:</strong> {tender.id}</p>
              <p><strong>Quoted Value:</strong> ₹ {application.financialBid.totalBidAmountCr.toFixed(2)} Crores</p>
              <p><strong>Documents:</strong> {application.documents.filter((d) => d.status === 'Uploaded').length} Attached</p>
            </div>
            <p className="text-[11px] text-slate-500">
              Upon confirmation, this bid packet will be locked and queued for automated statutory cross-verification.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Briefcase,
  ShieldCheck,
  IndianRupee,
  FileCheck2,
  Upload,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Save,
  ExternalLink,
  FileText,
  Clock,
  Layers,
  Check,
} from 'lucide-react';
import {
  getTenderById,
  getBidderProfile,
  getCurrentUser,
  createOrGetDraftApplication,
  saveApplication,
} from '../../services/storage';
import { Tender, BidderProfile, BidApplication, BidApplicationDocument } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';

export const BidApplicationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [tender, setTender] = useState<Tender | null>(null);
  const [profile, setProfile] = useState<BidderProfile | null>(null);
  const [application, setApplication] = useState<BidApplication | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Clean 4-step internal tabs: 1. Tender Info, 2. Eligibility, 3. Bid Details, 4. Documents
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  // Section 2: Eligibility / Qualifications
  const [relevantExp, setRelevantExp] = useState('');

  // Section 3: Bid Details (Financials)
  const [quotedAmount, setQuotedAmount] = useState<string>('0');
  const [taxRatePct, setTaxRatePct] = useState<number>(18);
  const [taxAmount, setTaxAmount] = useState<string>('0');
  const [totalBidAmount, setTotalBidAmount] = useState<string>('0');
  const [priceValidityDays, setPriceValidityDays] = useState<number>(90);

  // Section 4: Documents
  const [documents, setDocuments] = useState<BidApplicationDocument[]>([]);
  const [selectedUploadTarget, setSelectedUploadTarget] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    const currentTender = getTenderById(id);
    const currentProfile = getBidderProfile(user?.bidderId);

    if (!currentTender || !currentProfile) return;

    setTender(currentTender);
    setProfile(currentProfile);

    // Initialize or load draft application
    const app = createOrGetDraftApplication(currentTender, currentProfile);
    setApplication(app);

    // Populate form state from loaded application
    setRelevantExp(app.businessQualification.relevantProjectExperience || '');
    setQuotedAmount(app.financialBid.quotedAmountCr.toString());
    setTaxAmount(app.financialBid.taxAmountCr.toString());
    setTotalBidAmount(app.financialBid.totalBidAmountCr.toString());
    setPriceValidityDays(app.financialBid.priceValidityDays || 90);
    setDocuments(app.documents || []);
  }, [id, user?.bidderId, user?.id]);

  // Recalculate financial total whenever quoted amount or tax rate changes
  const handleQuotedAmountChange = (val: string) => {
    setQuotedAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const calculatedTax = +(num * (taxRatePct / 100)).toFixed(2);
      const calculatedTotal = +(num + calculatedTax).toFixed(2);
      setTaxAmount(calculatedTax.toString());
      setTotalBidAmount(calculatedTotal.toString());
    } else {
      setTaxAmount('0');
      setTotalBidAmount('0');
    }
  };

  const handleTaxRateChange = (rate: number) => {
    setTaxRatePct(rate);
    const num = parseFloat(quotedAmount);
    if (!isNaN(num) && num > 0) {
      const calculatedTax = +(num * (rate / 100)).toFixed(2);
      const calculatedTotal = +(num + calculatedTax).toFixed(2);
      setTaxAmount(calculatedTax.toString());
      setTotalBidAmount(calculatedTotal.toString());
    }
  };

  // Handle local document file upload
  const handleFileUpload = (docIndex: number, file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Unsupported File Format',
        message: 'Only PDF, JPG, JPEG, and PNG files are accepted under GeM guidelines.',
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'File Exceeds Limit',
        message: 'Maximum allowed document size is 10 MB.',
      });
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      setDocuments((prev) => {
        const next = [...prev];
        next[docIndex] = {
          ...next[docIndex],
          fileName: file.name,
          fileSize: sizeFormatted,
          fileType: file.type,
          fileDataUrl: reader.result as string,
          uploadedAt: new Date().toISOString(),
          status: 'Uploaded',
        };
        return next;
      });

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Document Uploaded',
        message: `${file.name} (${sizeFormatted}) successfully attached to application.`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(selectedUploadTarget, e.dataTransfer.files[0]);
    }
  };

  const handleRemoveDocument = (docIndex: number) => {
    setDocuments((prev) => {
      const next = [...prev];
      next[docIndex] = {
        ...next[docIndex],
        fileName: undefined,
        fileSize: undefined,
        fileType: undefined,
        fileDataUrl: undefined,
        uploadedAt: undefined,
        status: 'Missing',
      };
      return next;
    });

    setToast({
      id: Date.now().toString(),
      type: 'info',
      title: 'Document Removed',
      message: 'Document reference removed from the checklist.',
    });
  };

  const buildUpdatedApplication = (): BidApplication | null => {
    if (!application || !profile || !tender) return null;

    const quoted = parseFloat(quotedAmount) || 0;
    const tax = parseFloat(taxAmount) || 0;
    const total = parseFloat(totalBidAmount) || 0;

    return {
      ...application,
      businessQualification: {
        ...application.businessQualification,
        relevantProjectExperience: relevantExp,
      },
      financialBid: {
        quotedAmountCr: quoted,
        taxAmountCr: tax,
        totalBidAmountCr: total,
        priceValidityDays,
      },
      documents,
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSaveDraft = () => {
    const updated = buildUpdatedApplication();
    if (!updated) return;

    saveApplication(updated);
    setApplication(updated);
    setToast({
      id: Date.now().toString(),
      type: 'success',
      title: 'Draft Saved',
      message: `Your bid application draft for ${tender?.id} has been saved.`,
    });
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = buildUpdatedApplication();
    if (!updated) return;

    if (updated.financialBid.quotedAmountCr <= 0) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Quotation Required',
        message: 'Please enter a valid quoted amount greater than ₹ 0 in Bid Details.',
      });
      setActiveStep(3);
      return;
    }

    saveApplication(updated);
    navigate(`/bidder/applications/${updated.id}/review`);
  };

  if (!tender || !profile || !application) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading electronic application packet...
      </div>
    );
  }

  const uploadedDocsCount = documents.filter((d) => d.status === 'Uploaded').length;

  // 6-step workflow as specified:
  // 1. Tender Information, 2. Eligibility, 3. Bid Details, 4. Documents, 5. Review, 6. Submission
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
        title={`Electronic Bid Application — ${tender.id}`}
        subtitle={`Tender: ${tender.title} • Quoting Entity: ${profile.companyName}`}
        breadcrumbs={[
          { label: 'Bidder Portal', href: '/bidder/dashboard' },
          { label: 'Tenders', href: '/bidder/tenders' },
          { label: tender.id, href: `/bidder/tenders/${tender.id}` },
          { label: 'Application Form' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 text-slate-500" />
              <span>Save Draft</span>
            </button>
            <Link
              to={`/bidder/tenders/${tender.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </Link>
          </div>
        }
      />

      {/* Clean 6-Step Workflow Stepper */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {steps.map((st) => {
            const isCurrent = activeStep === st.num;
            const isCompleted = activeStep > st.num || (st.num === 5 && false);
            const isInteractive = st.num <= 4;

            return (
              <button
                key={st.num}
                type="button"
                disabled={!isInteractive}
                onClick={() => isInteractive && setActiveStep(st.num as any)}
                className={`flex items-center gap-2 p-2 rounded-md transition-all text-left ${
                  isCurrent
                    ? 'bg-blue-50 border border-blue-200 font-bold text-blue-900 shadow-2xs'
                    : isCompleted
                    ? 'bg-emerald-50/50 border border-emerald-200/80 text-emerald-900 font-medium'
                    : 'bg-slate-50 border border-slate-100 text-slate-500'
                } ${isInteractive ? 'cursor-pointer hover:border-slate-300' : 'cursor-default opacity-80'}`}
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleProceedToReview} className="space-y-6">
        {/* Step 1: Tender Information */}
        {activeStep === 1 && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="h-4 w-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900">1. Tender Specifications & Procurement Scope</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tender Title</span>
                <p className="font-semibold text-slate-900 mt-1">{tender.title}</p>
                <p className="text-[11px] font-mono text-blue-700 mt-0.5">{tender.id}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Issuing Department</span>
                <p className="font-semibold text-slate-900 mt-1">{tender.issuingOrg}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{tender.ministryDepartment || 'Central Govt'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contract Value & Category</span>
                <p className="font-bold text-slate-900 mt-1 font-mono">₹ {tender.estimatedValueCr.toFixed(2)} Crores</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{tender.category}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submission Deadlines</span>
                <p className="font-semibold text-slate-900 mt-1 font-mono">{tender.closingDate}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Published: {tender.publishedDate}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Delivery Location</span>
                <p className="font-semibold text-slate-900 mt-1">{tender.location}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Consignee Site Standards</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</span>
                <div className="mt-1">
                  <StatusBadge status={tender.status} size="sm" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{tender.bidsCount} Bidder(s) applied</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
              <span className="font-bold text-slate-800">Scope of Work & Obligations:</span>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                {tender.scopeOfWork || tender.description}
              </p>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                <span>Proceed to Eligibility Check</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Eligibility */}
        {activeStep === 2 && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Briefcase className="h-4 w-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900">2. Statutory Eligibility Parameters & Declarations</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Annual Turnover</span>
                <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
                  ₹ {profile.annualTurnoverCr.toFixed(2)} Cr
                </p>
                <span className="text-[11px] text-slate-500">
                  Required: ₹ {tender.eligibilityCriteria.minTurnoverCr.toFixed(2)} Cr
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Experience Years</span>
                <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
                  {profile.yearsOfExperience} Years
                </p>
                <span className="text-[11px] text-slate-500">
                  Required: {tender.eligibilityCriteria.minExperienceYears} Years
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Make in India Local Content</span>
                <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
                  {profile.localContentPercentage}% Declared
                </p>
                <span className="text-[11px] text-slate-500">
                  Required: {tender.eligibilityCriteria.minLocalContentPct}%
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-800">
                Project Experience Summary & Technical Execution Capability
              </label>
              <textarea
                rows={4}
                value={relevantExp}
                onChange={(e) => setRelevantExp(e.target.value)}
                placeholder="Highlight recent similar projects, technical execution capacity, test certifications, and warranty compliance..."
                className="w-full border border-slate-200 rounded-md p-3 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden leading-relaxed"
              />
            </div>

            <div className="pt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-md"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Previous Step</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                <span>Continue to Bid Details</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Bid Details (Commercial Financial Bid) */}
        {activeStep === 3 && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <IndianRupee className="h-4 w-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900">3. Commercial Quotation & Financial Bid Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quoted Base Amount (₹ Crores) <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={quotedAmount}
                    onChange={(e) => handleQuotedAmountChange(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                    required
                  />
                  <span className="font-medium text-slate-500">Cr</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Estimated Tender Value: ₹ {tender.estimatedValueCr.toFixed(2)} Cr
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Applicable GST Rate (%)
                </label>
                <select
                  value={taxRatePct}
                  onChange={(e) => handleTaxRateChange(parseInt(e.target.value) || 18)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 bg-white focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-medium"
                >
                  <option value={5}>5% GST (Concessional)</option>
                  <option value={12}>12% GST (Industrial Standard)</option>
                  <option value={18}>18% GST (Standard Services & Goods)</option>
                  <option value={28}>28% GST (High-rate)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Auto tax assessment</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tax Amount (₹ Crores)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500">₹</span>
                  <input
                    type="text"
                    readOnly
                    value={taxAmount}
                    className="w-full border border-slate-200 bg-slate-50 rounded-md px-3 py-2 font-mono font-semibold text-slate-700 cursor-not-allowed"
                  />
                  <span className="font-medium text-slate-500">Cr</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{taxRatePct}% of Quoted Base</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Price Validity Window
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={30}
                    max={180}
                    value={priceValidityDays}
                    onChange={(e) => setPriceValidityDays(parseInt(e.target.value) || 90)}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 focus:ring-1 focus:ring-blue-600 focus:outline-hidden font-mono"
                  />
                  <span className="font-medium text-slate-500">days</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Standard: 90 days validity</p>
              </div>
            </div>

            {/* Total Evaluated Price Card */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">
                  Total All-Inclusive Evaluated Bid Price (L1 Computation)
                </span>
                <p className="text-2xl font-bold text-blue-950 mt-0.5 font-mono">
                  ₹ {totalBidAmount} Crores
                </p>
                <span className="text-[11px] text-blue-700">
                  Formula: Quoted Base (₹ {quotedAmount} Cr) + Tax (₹ {taxAmount} Cr)
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-white border border-blue-200 font-semibold text-blue-900 text-xs shadow-2xs">
                Official Commercial Quotation
              </span>
            </div>

            <div className="pt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-md"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Previous Step</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                <span>Continue to Required Documents</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Documents (Professional Drag & Drop + Uploaded Rows) */}
        {activeStep === 4 && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-blue-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  4. Required Compliance Documents Upload
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                Uploaded: {uploadedDocsCount} of {documents.length} Required
              </span>
            </div>

            {/* Professional Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(selectedUploadTarget, e.target.files[0]);
                  }
                }}
              />

              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Drag and drop your compliance document here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-700 hover:underline font-bold cursor-pointer"
                    >
                      browse files
                    </button>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    File types supported: PDF, JPG, JPEG, PNG • Maximum size: 10 MB per document
                  </p>
                </div>

                {/* Target Selector */}
                <div className="pt-2 flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Attach file to requirement:</span>
                  <select
                    value={selectedUploadTarget}
                    onChange={(e) => setSelectedUploadTarget(parseInt(e.target.value) || 0)}
                    className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-600"
                  >
                    {documents.map((d, i) => (
                      <option key={i} value={i}>
                        {d.documentName} {d.status === 'Uploaded' ? '(Already Uploaded)' : '(Pending)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Uploaded Document Rows Table */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Statutory Document Checklist ({documents.length} Items)
              </h3>

              <div className="space-y-2">
                {documents.map((doc, idx) => {
                  const isUploaded = doc.status === 'Uploaded';

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-lg border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isUploaded
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 truncate">{doc.documentName}</p>
                          {doc.isRequired && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Mandatory
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-semibold border ${
                              isUploaded
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            Status: {isUploaded ? '✓ Uploaded' : 'Missing'}
                          </span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-800 border border-blue-200">
                            OCR: {isUploaded ? 'Ready for Extraction' : 'Awaiting File'}
                          </span>
                        </div>

                        {/* File Details & Upload Progress */}
                        {isUploaded ? (
                          <div className="space-y-1">
                            <p className="text-[11px] text-slate-600 flex items-center gap-2">
                              <span className="font-mono text-slate-800">{doc.fileName}</span>
                              <span>•</span>
                              <span>{doc.fileSize}</span>
                              <span>•</span>
                              <span className="text-slate-400">
                                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleTimeString('en-IN') : 'Recent'}
                              </span>
                            </p>
                            <div className="w-48 bg-emerald-200 h-1 rounded-full overflow-hidden">
                              <div className="bg-emerald-600 h-full w-full rounded-full" />
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400">
                            Upload required statutory proof before final packet submission.
                          </p>
                        )}
                      </div>

                      {/* Row Action Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1">
                          <Upload className="h-3 w-3 text-slate-500" />
                          <span>{isUploaded ? 'Replace' : 'Upload File'}</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(idx, e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        {isUploaded && (
                          <>
                            {doc.fileDataUrl && (
                              <a
                                href={doc.fileDataUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors"
                              >
                                Preview
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveDocument(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                              title="Remove Document"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions for Step 4 */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-md"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Previous Step</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                <span>Proceed to Step 5: Review Application</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

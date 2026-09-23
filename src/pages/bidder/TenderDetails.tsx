import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Send,
  Download,
  AlertTriangle,
  FileCheck2,
  Lock,
} from 'lucide-react';
import {
  getTenderById,
  getBidderProfile,
  getCurrentUser,
  calculateEligibility,
  getBidsByBidder,
  createOrGetDraftApplication,
  getApplicationByTenderAndBidder,
} from '../../services/storage';
import { fetchTenderById, checkDuplicateApplication } from '../../services/supabase';
import { Tender, BidderProfile } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EligibilityMatrix } from '../../components/common/EligibilityMatrix';

export const TenderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [tender, setTender] = useState<Tender | null>(null);
  const [profile, setProfile] = useState<BidderProfile | null>(null);
  const [hasAlreadyApplied, setHasAlreadyApplied] = useState(false);
  const [existingApplicationId, setExistingApplicationId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const currentProfile = getBidderProfile(user?.bidderId);
    setProfile(currentProfile);

    const loadTenderData = async () => {
      const currentTender = await fetchTenderById(id);
      setTender(currentTender);

      if (currentProfile && currentTender) {
        const isDuplicate = await checkDuplicateApplication(currentTender.id, currentProfile.id);
        const existingBids = getBidsByBidder(currentProfile.id);
        const applied = isDuplicate || existingBids.some((b) => b.tenderId === currentTender.id);
        setHasAlreadyApplied(applied);

        const existingApp = getApplicationByTenderAndBidder(currentTender.id, currentProfile.id);
        if (existingApp) {
          setExistingApplicationId(existingApp.id);
        }
      }
    };

    loadTenderData();
  }, [id, user?.bidderId, user?.id]);

  if (!tender) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">
        <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-800">Tender Not Found</p>
        <p className="text-xs text-slate-500 mt-1">
          The requested tender identifier does not exist or has been archived.
        </p>
        <Link
          to="/bidder/tenders"
          className="mt-4 inline-block px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded"
        >
          Return to Tender Directory
        </Link>
      </div>
    );
  }

  const evaluation = calculateEligibility(tender, profile);
  const isEligible = evaluation.overallStatus === 'Eligible';

  const handleDownloadTenderDoc = () => {
    const docContent = `================================================================================
GOVERNMENT E-MARKETPLACE (GeM) - STATUTORY TENDER SPECIFICATIONS
================================================================================
Tender ID            : ${tender.id}
Tender Title         : ${tender.title}
Issuing Organization : ${tender.issuingOrg}
Ministry/Department  : ${tender.ministryDepartment}
Category             : ${tender.category}
Location             : ${tender.location}
Estimated Value      : ₹ ${tender.estimatedValueCr.toFixed(2)} Crores
Published Date       : ${tender.publishedDate}
Closing Date         : ${tender.closingDate} 17:00 IST
Status               : ${tender.status}
================================================================================
DESCRIPTION:
${tender.description}

SCOPE OF WORK:
${tender.scopeOfWork}

MANDATORY STATUTORY ELIGIBILITY REQUIREMENTS:
- Minimum Annual Turnover: ₹ ${tender.eligibilityCriteria.minTurnoverCr} Cr
- Minimum Experience: ${tender.eligibilityCriteria.minExperienceYears} Years
- Make in India Local Content: ${tender.eligibilityCriteria.minLocalContentPct}%
- GST Registration: ${tender.eligibilityCriteria.gstRequired ? 'Mandatory' : 'Optional'}
- PAN Entity Verification: ${tender.eligibilityCriteria.panRequired ? 'Mandatory' : 'Optional'}
- MSME Udyam Registration: ${tender.eligibilityCriteria.udyamRequired ? 'Mandatory' : 'Optional'}
- OEM Authorization (MAF): ${tender.eligibilityCriteria.oemAuthRequired ? 'Mandatory' : 'Not Required'}

REQUIRED DOCUMENT SUBMISSIONS:
${tender.requiredDocuments?.map((d, i) => `${i + 1}. ${d}`).join('\n')}
================================================================================
Digitally authenticated via GeM Bid Compliance Verification Platform.
================================================================================`;

    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GeM_Tender_Specifications_${tender.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleApplyClick = () => {
    if (!profile || !isEligible) return;
    // Create draft application or fetch existing
    createOrGetDraftApplication(tender, profile);
    navigate(`/bidder/tenders/${tender.id}/apply`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tender.id}
        subtitle={tender.title}
        breadcrumbs={[
          { label: 'Portal', href: '/bidder/dashboard' },
          { label: 'Tenders', href: '/bidder/tenders' },
          { label: tender.id },
        ]}
        badge={<StatusBadge status={tender.status} size="sm" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTenderDoc}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Bid Documents</span>
            </button>

            {tender.status === 'Active' || tender.status === 'Closing Soon' ? (
              hasAlreadyApplied ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Bid Already Submitted</span>
                  </span>
                  {existingApplicationId && (
                    <Link
                      to={`/bidder/applications/${existingApplicationId}/review`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <FileCheck2 className="h-3.5 w-3.5" />
                      <span>View Application Packet</span>
                    </Link>
                  )}
                </div>
              ) : isEligible ? (
                <button
                  type="button"
                  onClick={handleApplyClick}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-md shadow-xs transition-colors bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Apply Now</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={true}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    title="You do not currently meet one or more mandatory eligibility requirements."
                  >
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Apply for Tender (Ineligible)</span>
                  </button>
                </div>
              )
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-md">
                Tender Inactive for New Bids
              </span>
            )}
          </div>
        }
      />

      {/* Tender Overview Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200">
          <FileText className="h-4 w-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">Tender Overview & Authority Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Issuing Organization
            </span>
            <p className="font-bold text-slate-900 mt-0.5">{tender.issuingOrg}</p>
            <p className="text-[11px] text-slate-500">{tender.ministryDepartment}</p>
          </div>

          <div>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Procurement Category
            </span>
            <p className="font-bold text-slate-900 mt-0.5">{tender.category}</p>
            <p className="text-[11px] text-slate-500">Location: {tender.location}</p>
          </div>

          <div>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Estimated Contract Value
            </span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              ₹ {tender.estimatedValueCr.toFixed(2)} Cr
            </p>
            <p className="text-[11px] text-slate-500">Inclusive of GST & charges</p>
          </div>

          <div>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Schedule & Critical Dates
            </span>
            <p className="font-semibold text-slate-800 mt-0.5">
              Published: <span className="font-normal">{tender.publishedDate}</span>
            </p>
            <p className="font-semibold text-rose-700">
              Bid Closing: <span className="font-bold">{tender.closingDate} 17:00 IST</span>
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3 text-xs">
          <div>
            <h3 className="font-semibold text-slate-800">Procurement Description</h3>
            <p className="mt-1 text-slate-600 leading-relaxed">{tender.description}</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Scope of Work & Technical SLA</h3>
            <p className="mt-1 text-slate-600 leading-relaxed">{tender.scopeOfWork}</p>
          </div>
        </div>

        {/* Required Documents Checklist Preview */}
        {tender.requiredDocuments && tender.requiredDocuments.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h3 className="font-semibold text-slate-800 text-xs mb-2">
              Mandatory Document Submissions Required for this Tender:
            </h3>
            <div className="flex flex-wrap gap-2">
              {tender.requiredDocuments.map((doc, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  {doc}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Ineligibility Warning if not eligible */}
      {!isEligible && (
        <div className="rounded-lg border border-rose-300 bg-rose-50/70 p-4 text-xs text-rose-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-950 text-sm">
              You do not currently meet one or more mandatory eligibility requirements.
            </p>
            <p className="leading-relaxed text-rose-800">
              The application button is disabled in accordance with procurement compliance rules. Review the granular criteria breakdown below to inspect deficient parameters (such as minimum turnover, experience threshold, or local content %).
            </p>
            <div className="pt-1">
              <Link
                to="/bidder/profile"
                className="inline-block text-rose-950 font-bold underline hover:text-black"
              >
                Update Bidder Profile to resolve criteria →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Eligibility Requirements Section (Core Section 2 & 9) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Automated Eligibility & Compliance Evaluation
            </h2>
            <p className="text-xs text-slate-500">
              Cross-checked against registered bidder profile parameters in real-time
            </p>
          </div>
        </div>

        <EligibilityMatrix
          evaluation={evaluation}
          onUpdateProfileClick={() => navigate('/bidder/profile')}
        />
      </div>
    </div>
  );
};

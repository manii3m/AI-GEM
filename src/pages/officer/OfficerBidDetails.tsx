import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Building2,
  ShieldCheck,
  FileCheck2,
  Download,
  Eye,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import {
  getBidById,
  getTenderById,
  getBidderProfile,
  calculateEligibility,
} from '../../services/storage';
import { fetchBidsForOfficer, fetchTenderById } from '../../services/supabase';
import { Bid, Tender, BidderProfile } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

export const OfficerBidDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [bid, setBid] = useState<Bid | null>(null);
  const [tender, setTender] = useState<Tender | null>(null);
  const [profile, setProfile] = useState<BidderProfile | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; fileName: string; type: string } | null>(
    null
  );

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      let b = getBidById(id);
      if (!b) {
        const liveBids = await fetchBidsForOfficer();
        b = liveBids.find((item) => item.id === id || item.applicationId === id) || null;
      }
      if (!b) return;

      setBid(b);

      let t = getTenderById(b.tenderId);
      if (!t) {
        t = await fetchTenderById(b.tenderId);
      }
      if (t) setTender(t);

      const p = getBidderProfile(b.bidderId);
      if (p) setProfile(p);
    };

    loadData();
  }, [id]);

  const handleDownloadDoc = (docName: string) => {
    const content = `GOVERNMENT E-MARKETPLACE (GeM) - STATUTORY DOCUMENT\nDocument: ${docName}\nBid ID: ${bid?.id}\nTender: ${tender?.id}\nVendor: ${profile?.companyName}\nDownloaded by Procurement Directorate on ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = docName.endsWith('.pdf') ? docName.replace('.pdf', '_certified.txt') : `${docName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!bid || !tender || !profile) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-xs text-slate-500">
        <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="font-bold text-slate-800 text-sm">Bid Record Not Found</p>
        <p className="mt-1">The requested electronic bid submission could not be located in records.</p>
        <Link
          to="/officer/bids"
          className="mt-4 inline-block px-3 py-1.5 bg-slate-900 text-white rounded font-medium"
        >
          Return to Bids List
        </Link>
      </div>
    );
  }

  const eligibility = calculateEligibility(tender, profile);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bid Submission Inspection — ${bid.id}`}
        subtitle={`${bid.bidderName} • Tender: ${tender.id} (${tender.title})`}
        breadcrumbs={[
          { label: 'Officer Portal', href: '/officer/dashboard' },
          { label: 'Bids', href: '/officer/bids' },
          { label: bid.id },
        ]}
        badge={<StatusBadge status={bid.bidStatus || 'Submitted'} size="sm" />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/officer/bids"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Bids</span>
            </Link>
            <Link
              to={`/officer/verification/${bid.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors shadow-xs"
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>{bid.verificationReport ? 'View Verification Report' : 'Start Verification'}</span>
            </Link>
          </div>
        }
      />

      {/* Automated Verification Status Banner */}
      <div
        className={`border rounded-lg p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
          bid.verificationReport
            ? bid.complianceScore && bid.complianceScore >= 85
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/70 border-amber-200 text-amber-950'
            : 'bg-blue-50/70 border-blue-200 text-blue-950'
        }`}
      >
        <div className="flex items-start gap-3">
          <Cpu className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">
                {bid.verificationReport
                  ? `Automated Verification: Completed (Score: ${bid.complianceScore}/100)`
                  : 'Automated Verification: Ready to Execute'}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                3-Way Cross Check
              </span>
            </div>
            <p className="mt-1 text-slate-600 leading-relaxed">
              {bid.verificationReport
                ? `Cross-verified against CBDT, GSTN, and MSME registries. Risk Level: ${bid.riskLevel || 'Low'} • Issues: ${bid.issueCount || 0}.`
                : 'Reconciles submitted documents via Gemini OCR against the 500-record government verification dataset.'}
            </p>
          </div>
        </div>

        <Link
          to={`/officer/verification/${bid.id}`}
          className="shrink-0 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors text-center"
        >
          {bid.verificationReport ? 'Inspect Full Audit Report' : 'Start Verification Now'}
        </Link>
      </div>

      {/* 1. Bid Overview */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200">
          <FileText className="h-4 w-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">1. Bid Submission Overview</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px]">Official Bid ID</span>
            <p className="font-mono font-bold text-slate-900 mt-0.5">{bid.id}</p>
          </div>
          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px]">Tender Reference</span>
            <p className="font-mono font-semibold text-blue-700 mt-0.5">{bid.tenderId}</p>
          </div>
          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px]">Submission Timestamp</span>
            <p className="font-medium text-slate-800 mt-0.5">
              {bid.submissionDate} {bid.submissionTime}
            </p>
          </div>
          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px]">Quoted Amount</span>
            <p className="font-bold text-slate-900 mt-0.5 text-sm">
              ₹ {(bid.quotedAmount || bid.offeredValueCr).toFixed(2)} Cr
            </p>
          </div>
          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px]">Bid Status</span>
            <div className="mt-1">
              <StatusBadge status={bid.bidStatus || 'Submitted'} size="sm" />
            </div>
          </div>
          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px]">Verification Stage</span>
            <div className="mt-1">
              <StatusBadge status={bid.verificationStatus || 'Pending'} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bidder Information Snapshot */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200">
          <Building2 className="h-4 w-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">2. Bidder Entity & Registration Profile</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Company Name</span>
            <p className="font-bold text-slate-900 mt-0.5">{profile.companyName}</p>
            <p className="text-slate-500 text-[11px]">{profile.companyType}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-400 uppercase font-bold text-[10px]">PAN (Statutory ID)</span>
            <p className="font-mono font-bold text-slate-900 mt-0.5">{profile.pan}</p>
            <span className="text-[10px] text-emerald-700 font-semibold">Active Corporate Entity</span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-400 uppercase font-bold text-[10px]">GSTIN</span>
            <p className="font-mono font-bold text-slate-900 mt-0.5">{profile.gstin}</p>
            <span className="text-[10px] text-emerald-700 font-semibold">Regular Taxpayer</span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-400 uppercase font-bold text-[10px]">MSME Udyam Number</span>
            <p className="font-mono font-bold text-slate-900 mt-0.5">
              {profile.udyamNumber || 'N/A'}
            </p>
            <span className="text-[10px] text-slate-500">Ministry of MSME</span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Business History</span>
            <p className="font-bold text-slate-900 mt-0.5">
              {profile.yearsOfExperience} Years Experience | ₹ {profile.annualTurnoverCr.toFixed(2)} Cr Turnover
            </p>
            <span className="text-[10px] text-slate-500">
              {profile.pastGovtProjectsCount} prior public sector contracts
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Contact & Address</span>
            <p className="font-medium text-slate-800 truncate mt-0.5">{profile.contactEmail}</p>
            <p className="text-slate-500 text-[11px] truncate">
              {profile.city}, {profile.state}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Tender Eligibility Requirements Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">
              3. Tender Eligibility Criteria Compliance Evaluation
            </h2>
          </div>
          <StatusBadge status={eligibility.overallStatus} size="sm" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Requirement</th>
                <th className="py-2.5 px-3">Required Threshold</th>
                <th className="py-2.5 px-3">Bidder Stored Value</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Verification Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eligibility.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{item.ruleName}</td>
                  <td className="py-2.5 px-3 text-slate-600 font-medium">{item.requirement}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{item.bidderValue}</td>
                  <td className="py-2.5 px-3">
                    {item.isEligible ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Eligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        Not Eligible
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Submitted Documents */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">4. Submitted Compliance Documents</h2>
          </div>
          <span className="text-xs text-slate-500">
            {bid.documentsSubmitted.length} files attached
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Document Requirement</th>
                <th className="py-2.5 px-3">Submitted File Name</th>
                <th className="py-2.5 px-3">Document Type</th>
                <th className="py-2.5 px-3">Upload Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bid.documentsSubmitted.map((doc, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{doc.name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{doc.fileName || `${doc.name}.pdf`}</td>
                  <td className="py-2.5 px-3 text-slate-500">{doc.type}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Uploaded
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDoc({
                            name: doc.name,
                            fileName: doc.fileName || `${doc.name}.pdf`,
                            type: doc.type,
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-2 py-0.5 rounded"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(doc.fileName || doc.name)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2 py-0.5 rounded cursor-pointer"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`Document Inspection Preview — ${previewDoc.name}`}
          subtitle={`File: ${previewDoc.fileName} • Classification: ${previewDoc.type}`}
          maxWidth="lg"
          footer={
            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Close
            </button>
          }
        >
          <div className="p-6 text-center text-xs space-y-3 bg-slate-50 rounded border border-slate-200">
            <FileText className="h-10 w-10 text-slate-400 mx-auto" />
            <div>
              <p className="font-bold text-slate-900">{previewDoc.fileName}</p>
              <p className="text-slate-500 text-[11px]">
                Authenticated electronic file metadata registered in GeM Bid Compliance Repository.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-block px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[11px]">
                Status: Pending Phase 3 OCR extraction
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

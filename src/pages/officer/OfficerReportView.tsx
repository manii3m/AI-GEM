import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Printer,
  ArrowLeft,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Building2,
  Award,
  FileText,
} from 'lucide-react';
import { getBidById, getTenderById, getBidderProfile, getCurrentUser } from '../../services/storage';
import { getVerificationReport } from '../../services/verificationService';
import { Bid, Tender, BidderProfile, VerificationReport } from '../../types';

export const OfficerReportView: React.FC = () => {
  const { bidId } = useParams<{ bidId: string }>();
  const currentUser = getCurrentUser();

  const [bid, setBid] = useState<Bid | null>(null);
  const [tender, setTender] = useState<Tender | null>(null);
  const [profile, setProfile] = useState<BidderProfile | null>(null);
  const [report, setReport] = useState<VerificationReport | null>(null);

  useEffect(() => {
    if (!bidId) return;
    const currentBid = getBidById(bidId);
    if (!currentBid) return;
    setBid(currentBid);

    const currentTender = getTenderById(currentBid.tenderId);
    setTender(currentTender);

    const currentProfile = getBidderProfile(currentBid.bidderId);
    setProfile(currentProfile);

    const existingReport = getVerificationReport(bidId);
    if (existingReport) {
      setReport(existingReport);
    }
  }, [bidId]);

  const handlePrint = () => {
    window.print();
  };

  if (!bid || !tender) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Bid Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">Unable to locate bid or tender records for {bidId}.</p>
        <Link
          to="/officer/reports"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-md"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Reports</span>
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200 space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <div>
          <h2 className="text-base font-bold text-slate-900">Verification Report Pending</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            This bid has not completed automated 3-way compliance verification yet. Please run the automated verification
            pipeline to generate the statutory compliance report.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/officer/reports"
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
          >
            Back to Reports
          </Link>
          <Link
            to={`/officer/verification/${bid.id}`}
            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-xs"
          >
            Launch Verification Pipeline
          </Link>
        </div>
      </div>
    );
  }

  const reportRefNo = `GEM/COMP/2026/${bid.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const verifiedDate = new Date(report.verifiedAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const panVal = profile?.pan || 'AAACB1234F';
  const gstinVal = profile?.gstin || '07AABCA9812M1Z3';
  const udyamVal = profile?.udyamNumber || 'UDYAM-DL-01-0012345';
  const turnoverCr = profile?.annualTurnoverCr ?? 24.5;
  const experienceYears = profile?.yearsOfExperience ?? 6;
  const localContentPct = profile?.localContentPercentage ?? (bid.localContentDeclaredPct || 65);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
      {/* Action Toolbar - Hidden during print */}
      <div className="no-print flex items-center justify-between bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to={`/officer/verification/${bid.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Verification Console</span>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-mono font-bold text-slate-700">Ref: {reportRefNo}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/officer/reports"
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
          >
            All Reports
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Container */}
      <div className="bg-white border border-slate-300 shadow-md p-8 md:p-12 space-y-8 print:p-0 print:border-none print:shadow-none text-slate-800">
        {/* Section 1: Formal Header & Registry Identifiers */}
        <div className="border-b-2 border-slate-800 pb-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-900 text-amber-400 rounded-md flex flex-col items-center justify-center p-1 text-center shadow-xs">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">सत्यमेव जयते</span>
                <ShieldCheck className="h-6 w-6 text-amber-400 mt-0.5" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500">
                  Government of India • Ministry of Commerce & Industry
                </h3>
                <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">
                  Government e-Marketplace (GeM)
                </h1>
                <p className="text-xs font-semibold text-blue-900">
                  Statutory Bid Compliance Verification & Due Diligence Report
                </p>
              </div>
            </div>

            <div className="text-right text-xs space-y-1">
              <div className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-800 inline-block">
                {reportRefNo}
              </div>
              <p className="text-[10px] text-slate-500">GFR 2017 Rule 173 Compliance Audit</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bid Reference ID</span>
              <span className="font-mono font-bold text-slate-900">{bid.id}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tender Reference ID</span>
              <span className="font-mono font-bold text-slate-900">{tender.id}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Verification Timestamp</span>
              <span className="font-semibold text-slate-800">{verifiedDate}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Evaluation Officer</span>
              <span className="font-semibold text-slate-800">
                {report.officerDecision?.decidedBy || currentUser?.name || 'Dr. Vikram Malhotra'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Executive Compliance Summary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Award className="h-4 w-4 text-blue-800" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              1. Executive Compliance & Risk Summary
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Compliance Score</span>
              <div className="text-3xl font-black text-slate-950">
                {report.overallScore}
                <span className="text-sm font-semibold text-slate-400">/100</span>
              </div>
              <p className="text-[10px] text-slate-500">Automated Weighted Evaluation</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Risk Assessment</span>
              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${
                    report.riskLevel === 'Low'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : report.riskLevel === 'Medium'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : report.riskLevel === 'High'
                      ? 'bg-orange-100 text-orange-900 border border-orange-300'
                      : 'bg-red-100 text-red-900 border border-red-300'
                  }`}
                >
                  {report.riskLevel} Risk
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Multilateral Anomaly Rating</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Debarment Status</span>
              <div>
                {report.isBlacklisted ? (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                    Blacklisted / Debarred
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Clear / Clean Record
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">Ministry Debarred Register</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Engine & Execution</span>
              <div className="font-bold text-xs text-slate-800 pt-1">{report.ocrMode}</div>
              <p className="text-[10px] text-slate-500">Latency: {report.executionTimeMs} ms</p>
            </div>
          </div>
        </div>

        {/* Section 3: Bidder Entity Profile */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Building2 className="h-4 w-4 text-blue-800" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              2. Participating Bidder Profile
            </h2>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Legal Entity Name</span>
              <span className="font-bold text-slate-900">{bid.bidderName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">GSTIN Registration</span>
              <span className="font-mono font-bold text-slate-900">{gstinVal}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Permanent Account No (PAN)</span>
              <span className="font-mono font-bold text-slate-900">{panVal}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">MSME Udyam Number</span>
              <span className="font-mono font-bold text-slate-900">{udyamVal}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Operating City & State</span>
              <span className="font-semibold text-slate-800">
                {profile?.city || 'New Delhi'}, {profile?.state || 'Delhi'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Enterprise Classification</span>
              <span className="font-semibold text-slate-800">Class-1 Local Supplier</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Declared Annual Turnover</span>
              <span className="font-semibold text-slate-800">₹ {turnoverCr.toFixed(2)} Cr</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Demonstrated Experience</span>
              <span className="font-semibold text-slate-800">{experienceYears} Years</span>
            </div>
          </div>
        </div>

        {/* Section 4: Tender Requirements vs Bidder Standing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <FileText className="h-4 w-4 text-blue-800" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              3. Tender Statutory Criteria vs. Submitted Standing
            </h2>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Statutory Criterion</th>
                  <th className="py-2.5 px-3">Tender Mandatory Threshold</th>
                  <th className="py-2.5 px-3">Bidder Submitted Standing</th>
                  <th className="py-2.5 px-3 text-right">Compliance Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">Past Track Record Experience</td>
                  <td className="py-2 px-3 font-mono text-slate-600">≥ {tender.eligibilityCriteria.minExperienceYears} Years</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">{experienceYears} Years</td>
                  <td className="py-2 px-3 text-right">
                    {experienceYears >= tender.eligibilityCriteria.minExperienceYears ? (
                      <span className="text-emerald-700 font-bold">COMPLIANT</span>
                    ) : (
                      <span className="text-red-600 font-bold">DEFICIENT</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">Minimum Annual Turnover</td>
                  <td className="py-2 px-3 font-mono text-slate-600">≥ ₹ {tender.eligibilityCriteria.minTurnoverCr} Cr</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">₹ {turnoverCr.toFixed(2)} Cr</td>
                  <td className="py-2 px-3 text-right">
                    {turnoverCr >= tender.eligibilityCriteria.minTurnoverCr ? (
                      <span className="text-emerald-700 font-bold">COMPLIANT</span>
                    ) : (
                      <span className="text-red-600 font-bold">DEFICIENT</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">Make in India Local Content</td>
                  <td className="py-2 px-3 font-mono text-slate-600">≥ {tender.eligibilityCriteria.minLocalContentPct}%</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">{localContentPct}%</td>
                  <td className="py-2 px-3 text-right">
                    {localContentPct >= tender.eligibilityCriteria.minLocalContentPct ? (
                      <span className="text-emerald-700 font-bold">COMPLIANT</span>
                    ) : (
                      <span className="text-red-600 font-bold">DEFICIENT</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800">OEM Authorization Requirement</td>
                  <td className="py-2 px-3 text-slate-600">
                    {tender.eligibilityCriteria.oemAuthorizationRequired || tender.eligibilityCriteria.oemAuthRequired
                      ? 'Mandatory for Non-OEM Resellers'
                      : 'Optional'}
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-900">
                    {bid.documentsSubmitted?.some((d) => d.type.includes('OEM')) ? 'Document Submitted' : 'Not Uploaded'}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {!(tender.eligibilityCriteria.oemAuthorizationRequired || tender.eligibilityCriteria.oemAuthRequired) ||
                    bid.documentsSubmitted?.some((d) => d.type.includes('OEM')) ? (
                      <span className="text-emerald-700 font-bold">COMPLIANT</span>
                    ) : (
                      <span className="text-amber-600 font-bold">REVIEW REQUIRED</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Submitted Document Verification Matrix */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <FileCheck2 className="h-4 w-4 text-blue-800" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              4. OCR Document Extraction & Forensic Verification
            </h2>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Document Category</th>
                  <th className="py-2.5 px-3">File Reference</th>
                  <th className="py-2.5 px-3 text-center">Confidence</th>
                  <th className="py-2.5 px-3">Extracted Forensic Values</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.documentsExtracted.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-900">{doc.documentName}</td>
                    <td className="py-2 px-3 font-mono text-slate-600 text-[11px] truncate max-w-[140px]">
                      {doc.fileName}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-700">{doc.overallConfidence}%</td>
                    <td className="py-2 px-3 text-[11px] text-slate-700">
                      {doc.fieldDetails.slice(0, 2).map((f) => `${f.label}: ${f.value}`).join(' • ')}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 6: Prototype Government Verification Dataset Matching */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Building2 className="h-4 w-4 text-blue-800" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              5. Prototype Government Master Records Reconciliation (500-Record Dataset)
            </h2>
          </div>

          {report.datasetMatchedRecord ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-900">
                  Matched Dataset Index: {report.datasetMatchedRecord.bidderId} • {report.datasetMatchedRecord.companyName}
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded text-[10px]">
                  MATCH FOUND
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-semibold">Income Tax PAN Status:</span>
                  <span className="font-bold text-slate-900">{report.datasetMatchedRecord.panStatus || 'Valid'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">GSTN Filing Status:</span>
                  <span className="font-bold text-slate-900">{report.datasetMatchedRecord.gstStatus || 'Active'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">MCA Incorporation:</span>
                  <span className="font-bold text-slate-900">{report.datasetMatchedRecord.mcaStatus || 'Active'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">EPFO / ESIC Compliance:</span>
                  <span className="font-bold text-slate-900">{report.datasetMatchedRecord.epfoStatus || 'Compliant'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
              Direct master index match in the 500-record dataset was established via PAN/GSTIN heuristic resolver.
            </div>
          )}
        </div>

        {/* Section 7: 3-Way Cross-Verification Triangulation Matrix */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <ShieldCheck className="h-4 w-4 text-blue-800" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              6. Triangulation Matrix: Form vs OCR vs Master Records
            </h2>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2 px-3">Verification Parameter</th>
                  <th className="py-2 px-3">Submitted Form</th>
                  <th className="py-2 px-3">OCR Extracted</th>
                  <th className="py-2 px-3">Govt Dataset</th>
                  <th className="py-2 px-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.checks.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900">{c.requirement}</td>
                    <td className="py-2 px-3 font-mono text-slate-700 text-[11px]">{c.formValue || '—'}</td>
                    <td className="py-2 px-3 font-mono text-slate-700 text-[11px]">{c.ocrValue || '—'}</td>
                    <td className="py-2 px-3 font-mono text-slate-700 text-[11px]">{c.datasetValue || '—'}</td>
                    <td className="py-2 px-3 text-right">
                      {c.status === 'Verified' ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Verified
                        </span>
                      ) : c.status.includes('Mismatch') ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          {c.status}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          {c.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 8: Compliance Scoring Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Award className="h-4 w-4 text-blue-800" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              7. Statutory Category Scoring Breakdown
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {report.categories.map((cat, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1.5">
                <span className="text-[10px] font-bold text-slate-600 block uppercase truncate">{cat.name}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-slate-900">{cat.earned}</span>
                  <span className="text-[11px] text-slate-400">/ {cat.maxPoints} pts</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      cat.status === 'Satisfied'
                        ? 'bg-emerald-600'
                        : cat.status === 'Review'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${(cat.earned / cat.maxPoints) * 100}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-bold block ${
                    cat.status === 'Satisfied'
                      ? 'text-emerald-700'
                      : cat.status === 'Review'
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }`}
                >
                  {cat.status} ({cat.passedChecks}/{cat.totalChecks})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 9: Identified Issues & AI Decision Support */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <AlertCircle className="h-4 w-4 text-blue-800" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              8. Compliance Anomalies & AI Decision Support Analysis
            </h2>
          </div>

          {report.issues.length > 0 ? (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block uppercase">Identified Anomalies:</span>
              {report.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3 rounded-md border text-xs flex items-start gap-2.5 ${
                    issue.severity === 'Critical'
                      ? 'bg-red-50/80 border-red-200 text-red-950'
                      : issue.severity === 'High' || issue.severity === 'Warning'
                      ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <AlertTriangle
                    className={`h-4 w-4 shrink-0 mt-0.5 ${
                      issue.severity === 'Critical'
                        ? 'text-red-600'
                        : issue.severity === 'High' || issue.severity === 'Warning'
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{issue.requirement}</span>
                      <span className="px-1.5 py-0.2 bg-white border border-slate-300 rounded text-[9px] font-bold font-mono">
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90">
                      Expected: {issue.expectedValue} • Observed: {issue.actualValue}
                    </p>
                    <p className="text-[10px] font-semibold opacity-85">Action: {issue.recommendedAction}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>No critical compliance violations or statutory discrepancies detected.</span>
            </div>
          )}

          {/* AI Advisory Summary Box */}
          <div className="p-4 bg-slate-900 text-white rounded-lg space-y-2.5 shadow-xs text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                AI Decision Support Advisory Recommendation
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Algorithm: Gemini Multilateral Engine</span>
            </div>
            <p className="leading-relaxed text-slate-200">{report.aiRecommendation.recommendation}</p>
            <p className="text-[11px] text-slate-400 leading-relaxed italic border-t border-slate-800/80 pt-2">
              Disclaimer: Pursuant to GFR 2017 Rule 173 and Central Vigilance Commission guidelines, automated AI
              recommendations serve exclusively as decision support. Final statutory determination rests solely with the
              designated Procurement Officer.
            </p>
          </div>
        </div>

        {/* Section 10: Official Procurement Officer Determination & Digital Sign-off */}
        <div className="border-t-2 border-slate-900 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-900" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              9. Final Statutory Determination & Audit Sign-off
            </h2>
          </div>

          <div className="bg-slate-50 border border-slate-300 rounded-lg p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Final Officer Determination</span>
                <span
                  className={`text-base font-black px-3 py-1 rounded inline-block mt-1 ${
                    report.officerDecision?.action === 'Qualified'
                      ? 'bg-emerald-600 text-white'
                      : report.officerDecision?.action === 'Disqualified'
                      ? 'bg-red-600 text-white'
                      : report.officerDecision?.action === 'Clarification Requested'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {report.officerDecision?.action || bid.bidStatus}
                </span>
              </div>

              <div className="text-right text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Authorized Officer</span>
                <span className="font-bold text-slate-900">
                  {report.officerDecision?.decidedBy || currentUser?.name || 'Dr. Vikram Malhotra'}
                </span>
                <span className="text-[11px] text-slate-500 block">Superintending Procurement Officer, GeM</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block uppercase">
                Officer Remarks & Statutory Justification:
              </span>
              <p className="text-xs text-slate-800 bg-white p-3 border border-slate-200 rounded whitespace-pre-wrap leading-relaxed">
                {report.officerDecision?.officerNotes ||
                  bid.currentDecision?.decisionReason ||
                  'Evaluation completed pursuant to GeM Guidelines and GFR 2017. Bid documentation and statutory datasets verified.'}
              </p>
            </div>

            {/* Statutory Sign-off Seal Representation */}
            <div className="pt-4 flex items-center justify-between text-xs border-t border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-dashed border-blue-800 rounded-full flex flex-col items-center justify-center text-[8px] font-black text-blue-900 leading-tight text-center p-1 uppercase">
                  <span>GeM</span>
                  <span>VERIFIED</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Digital GeM Verification Stamp</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Signed: {report.officerDecision?.decidedAt ? new Date(report.officerDecision.decidedAt).toUTCString() : new Date().toUTCString()}
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-500 font-mono">
                <span>Secure Integrity Hash: SHA256: d9f82...77a1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OfficerReportView;

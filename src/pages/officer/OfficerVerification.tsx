import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  AlertCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  Eye,
  Key,
  HelpCircle,
  FileCheck2,
  AlertTriangle,
  Award,
  Zap,
  Check,
  X,
  Minus,
  CheckCircle,
} from 'lucide-react';
import { getBidById, getTenderById, getBidderProfile, getCurrentUser } from '../../services/storage';
import {
  runVerificationPipeline,
  getVerificationReport,
  recordOfficerDecision,
} from '../../services/verificationService';
import { getGeminiApiKey, setGeminiApiKey, isGeminiLiveConfigured } from '../../services/geminiService';
import {
  Bid,
  Tender,
  BidderProfile,
  VerificationReport,
  ThreeWayCheckResult,
  ExtractedDocumentData,
  RiskLevel,
} from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Toast, ToastMessage } from '../../components/common/Toast';
import { StatusBadge } from '../../components/common/StatusBadge';

export const OfficerVerification: React.FC = () => {
  const { bidId } = useParams<{ bidId: string }>();
  const currentUser = getCurrentUser();

  const [bid, setBid] = useState<Bid | null>(null);
  const [tender, setTender] = useState<Tender | null>(null);
  const [profile, setProfile] = useState<BidderProfile | null>(null);
  const [report, setReport] = useState<VerificationReport | null>(null);

  // Pipeline State
  const [isRunning, setIsRunning] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // View state
  const [activeTab, setActiveTab] = useState<'statutory' | 'threeWay' | 'documents'>('statutory');
  const [tableFilter, setTableFilter] = useState<'ALL' | 'VERIFIED' | 'WARNING' | 'FAILED' | 'NA'>('ALL');
  const [selectedDocForOcr, setSelectedDocForOcr] = useState<ExtractedDocumentData | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<{ name: string; url?: string } | null>(null);

  // Officer Decision State
  const [decisionAction, setDecisionAction] = useState<
    'Qualified' | 'Clarification Requested' | 'Disqualified' | 'Keep Pending'
  >('Qualified');
  const [officerNotes, setOfficerNotes] = useState('');
  const [clarificationText, setClarificationText] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSavingDecision, setIsSavingDecision] = useState(false);

  // Gemini API Key Modal
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const loadData = () => {
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
      if (existingReport.officerDecision) {
        setDecisionAction(existingReport.officerDecision.action as any);
        setOfficerNotes(existingReport.officerDecision.officerNotes || '');
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [bidId]);

  const handleStartVerification = async (forcedScenario?: 'A' | 'B' | 'C') => {
    if (!bidId) return;
    setIsRunning(true);
    setProgressMsg('Initializing automated verification pipeline...');
    setProgressPercent(5);

    try {
      const generatedReport = await runVerificationPipeline(bidId, {
        forceScenario: forcedScenario,
        progressCallback: (msg, pct) => {
          setProgressMsg(msg);
          setProgressPercent(pct);
        },
      });

      setReport(generatedReport);
      const updatedBid = getBidById(bidId);
      if (updatedBid) setBid(updatedBid);

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Verification Completed',
        message: `Cross-verification generated compliance score ${generatedReport.overallScore}/100 with ${generatedReport.riskLevel} Risk.`,
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Verification Failed',
        message: err.message || 'Error occurred while executing verification.',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleOpenConfirmDecision = () => {
    if (!officerNotes.trim()) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Justification Required',
        message: 'Formal officer remarks & justification are mandatory before recording a final decision.',
      });
      return;
    }
    if (decisionAction === 'Clarification Requested' && !clarificationText.trim()) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Clarification Notice Required',
        message: 'Please specify the exact clarification required from the bidder.',
      });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmDecision = () => {
    if (!bidId) return;
    setIsSavingDecision(true);

    setTimeout(() => {
      const success = recordOfficerDecision(bidId, {
        action: decisionAction,
        notes: officerNotes,
        officerName: currentUser?.name || 'Dr. Vikram Malhotra',
        clarificationMessage: decisionAction === 'Clarification Requested' ? clarificationText : undefined,
      });
      setIsSavingDecision(false);
      setShowConfirmModal(false);

      if (success) {
        loadData();
        setToast({
          id: Date.now().toString(),
          type: 'success',
          title: 'Decision Recorded',
          message: `Official officer action '${decisionAction}' recorded in central procurement records and immutable audit trail.`,
        });
      }
    }, 400);
  };

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyInput.trim());
    setShowApiKeyModal(false);
    setToast({
      id: Date.now().toString(),
      type: 'info',
      title: 'API Configuration Updated',
      message: isGeminiLiveConfigured()
        ? 'Gemini Live multimodal extraction is now active.'
        : 'Reverted to built-in high-fidelity OCR engine.',
    });
  };

  if (!bid || !tender) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-8 w-8 text-slate-400 mx-auto" />
        <h3 className="mt-2 text-sm font-bold text-slate-900">Bid Package Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested bid verification could not be loaded.</p>
        <Link
          to="/officer/bids"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-md"
        >
          Return to Bids Queue
        </Link>
      </div>
    );
  }

  // Define the 14 Standard Statutory Checks required by GeM
  interface StatutoryCheckItem {
    id: string;
    name: string;
    source: string;
    result: 'verified' | 'warning' | 'failed' | 'na';
    details: string;
  }

  const getStatutoryChecks = (): StatutoryCheckItem[] => {
    if (!report) return [];

    const checksMap = new Map<string, ThreeWayCheckResult>();
    report.checks.forEach((c) => {
      checksMap.set(c.id, c);
      checksMap.set(c.requirement.toLowerCase(), c);
    });

    const getRes = (chk?: ThreeWayCheckResult): 'verified' | 'warning' | 'failed' | 'na' => {
      if (!chk) return 'na';
      if (chk.status === 'Verified') return 'verified';
      if (chk.status === 'Not Applicable') return 'na';
      if (chk.status.includes('Missing') || chk.status === 'Not Found')
        return 'warning';
      return 'failed';
    };

    const panChk = checksMap.get('CHK-001');
    const gstChk = checksMap.get('CHK-002');
    const udyamChk = checksMap.get('CHK-003');
    const turnoverChk = checksMap.get('CHK-004');
    const expChk = checksMap.get('CHK-005');
    const miiChk = checksMap.get('CHK-006');
    const blacklistChk = checksMap.get('CHK-007');
    const startupChk = checksMap.get('CHK-008');
    const nsicChk = checksMap.get('CHK-009');
    const oemChk = checksMap.get('CHK-010');
    const mcaChk = checksMap.get('CHK-011');
    const epfoChk = checksMap.get('CHK-012');
    const esicChk = checksMap.get('CHK-013');
    const itrChk = checksMap.get('CHK-014');

    return [
      {
        id: 'PAN',
        name: 'PAN',
        source: 'Income Tax Dept (CBDT) Registry',
        result: getRes(panChk),
        details: panChk ? `${panChk.formValue} • Status: ${panChk.status}` : 'PAN verified against CBDT',
      },
      {
        id: 'GST',
        name: 'GST',
        source: 'GSTN System Registry',
        result: getRes(gstChk),
        details: gstChk ? `${gstChk.formValue} • Active Status Match` : 'GSTIN active',
      },
      {
        id: 'GST_RETURN',
        name: 'GST Return Filing',
        source: 'GSTN Periodic Return Returns',
        result: gstChk?.datasetValue?.includes('Not Filed') ? 'failed' : getRes(gstChk),
        details: 'GSTR-3B monthly periodic return filing status verification',
      },
      {
        id: 'UDYAM',
        name: 'Udyam',
        source: 'Ministry of MSME Portal',
        result: getRes(udyamChk),
        details: udyamChk ? `${udyamChk.formValue} • Status: ${udyamChk.status}` : 'MSME registration check',
      },
      {
        id: 'INCOME_TAX',
        name: 'Income Tax',
        source: 'ITR Assessment Database (FY 2024-25)',
        result: getRes(itrChk),
        details: itrChk?.details || 'Filing compliance for preceding 3 assessment years verified',
      },
      {
        id: 'MCA',
        name: 'MCA',
        source: 'Ministry of Corporate Affairs (MCA21)',
        result: getRes(mcaChk),
        details: mcaChk?.details || 'Corporate entity status, CIN, and Director KYC in active good standing',
      },
      {
        id: 'EPFO',
        name: 'EPFO',
        source: 'Employees Provident Fund Org Registry',
        result: getRes(epfoChk),
        details: epfoChk?.details || 'Electronic Challan cum Return (ECR) monthly contribution compliance',
      },
      {
        id: 'ESIC',
        name: 'ESIC',
        source: 'Employees State Insurance Corp',
        result: getRes(esicChk),
        details: esicChk?.details || 'Employer code and monthly contribution verification',
      },
      {
        id: 'STARTUP_INDIA',
        name: 'Startup India',
        source: 'DPIIT Startup India Portal',
        result: tender.eligibilityCriteria.startupIndiaRequired ? getRes(startupChk) : 'na',
        details: startupChk?.details || 'Exemption evaluation under DPIIT notification standards',
      },
      {
        id: 'NSIC',
        name: 'NSIC',
        source: 'National Small Industries Corp',
        result: tender.eligibilityCriteria.nsicRequired ? getRes(nsicChk) : 'na',
        details: nsicChk?.details || 'Single point registration scheme for government purchases',
      },
      {
        id: 'OEM_AUTH',
        name: 'OEM Authorization',
        source: 'Manufacturer Authorization Form (MAF)',
        result: tender.eligibilityCriteria.oemAuthRequired ? getRes(oemChk) : 'na',
        details: oemChk?.details || 'Direct manufacturer warranty commitment and authorization letter',
      },
      {
        id: 'MAKE_IN_INDIA',
        name: 'Make in India',
        source: 'Public Procurement Preference (PPO-2017)',
        result: getRes(miiChk),
        details: miiChk ? `${miiChk.datasetValue || miiChk.formValue} Local Content verified` : 'Class-I / Class-II local supplier self-certification',
      },
      {
        id: 'BLACKLISTING',
        name: 'Blacklisting',
        source: 'Central Public Procurement Debarment List',
        result: report.isBlacklisted ? 'failed' : 'verified',
        details: report.isBlacklisted
          ? 'Active debarment record identified under GFR Rule 151'
          : 'Zero adverse debarment records found in central government registry',
      },
      {
        id: 'TENDER_ELIGIBILITY',
        name: 'Tender Eligibility',
        source: 'Cross-verification against Tender Thresholds',
        result: getRes(turnoverChk) === 'failed' || getRes(expChk) === 'failed' ? 'failed' : 'verified',
        details: `Turnover (₹${profile?.annualTurnoverCr || 0} Cr) & Experience (${profile?.yearsOfExperience || 0} Yrs) evaluated`,
      },
    ];
  };

  const statutoryChecks = getStatutoryChecks();

  const filteredStatutoryChecks = statutoryChecks.filter((chk) => {
    if (tableFilter === 'ALL') return true;
    if (tableFilter === 'VERIFIED') return chk.result === 'verified';
    if (tableFilter === 'WARNING') return chk.result === 'warning';
    if (tableFilter === 'FAILED') return chk.result === 'failed';
    if (tableFilter === 'NA') return chk.result === 'na';
    return true;
  });

  // Restrained indicator renderer
  const renderRestrainedResult = (res: 'verified' | 'warning' | 'failed' | 'na') => {
    switch (res) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/90 rounded">
            <span>✓</span>
            <span>Verified</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/90 rounded">
            <span>!</span>
            <span>Pending / Warning</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200/90 rounded">
            <span>×</span>
            <span>Failed</span>
          </span>
        );
      case 'na':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded">
            <span>—</span>
            <span>Not Applicable</span>
          </span>
        );
    }
  };

  // Compact Risk Badges: Low / Medium / High / Critical
  const renderCompactRiskBadge = (risk?: RiskLevel) => {
    switch (risk) {
      case 'Critical':
        return (
          <span className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300 rounded">
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 rounded">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 rounded">
            Medium
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
            Low
          </span>
        );
    }
  };

  // SVG circular ring calculations
  const score = report?.overallScore ?? 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Page Header */}
      <PageHeader
        title={`Compliance Verification — ${bid.id}`}
        subtitle={`${bid.bidderName} • Tender: ${tender.id}`}
        breadcrumbs={[
          { label: 'Officer Portal', href: '/officer/dashboard' },
          { label: 'Bids Directory', href: '/officer/bids' },
          { label: bid.id, href: `/officer/bids/${bid.id}` },
          { label: 'Verification Report' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors shadow-2xs"
            >
              <Key className="h-3.5 w-3.5 text-slate-500" />
              <span>
                {isGeminiLiveConfigured() ? 'Gemini OCR: Active' : 'OCR: Standard Engine'}
              </span>
            </button>
            <Link
              to={`/officer/bids/${bid.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>View Bid File</span>
            </Link>
          </div>
        }
      />

      {/* Test Benchmark Control Strip */}
      <div className="bg-slate-900 text-white rounded-lg p-3 px-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold text-slate-100">Verification Test Benchmarks:</span>
            <span className="text-slate-400 ml-1.5">Execute deterministic test scenarios against the 500-record dataset</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            disabled={isRunning}
            onClick={() => handleStartVerification('A')}
            className="px-2.5 py-1 font-semibold rounded bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-50 transition-colors shadow-2xs"
            title="Full compliance scenario"
          >
            Scenario A (Compliant)
          </button>
          <button
            disabled={isRunning}
            onClick={() => handleStartVerification('B')}
            className="px-2.5 py-1 font-semibold rounded bg-amber-700 hover:bg-amber-600 text-white disabled:opacity-50 transition-colors shadow-2xs"
            title="Simulates PAN & Turnover mismatch"
          >
            Scenario B (Mismatch)
          </button>
          <button
            disabled={isRunning}
            onClick={() => handleStartVerification('C')}
            className="px-2.5 py-1 font-semibold rounded bg-rose-800 hover:bg-rose-700 text-white disabled:opacity-50 transition-colors shadow-2xs"
            title="Simulates missing required certificate"
          >
            Scenario C (Missing Doc)
          </button>
          <button
            disabled={isRunning}
            onClick={() => handleStartVerification()}
            className="px-3 py-1 font-bold rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{report ? 'Re-Verify' : 'Run Verification'}</span>
          </button>
        </div>
      </div>

      {/* Verification In-Progress Progress Bar */}
      {isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-blue-900 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
              {progressMsg}
            </span>
            <span className="font-mono font-bold text-blue-800">{progressPercent}%</span>
          </div>
          <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-blue-700 flex items-center justify-between">
            <span>Pipeline: Documents → OCR Extraction → Dataset Match (500) → Cross-check Rules</span>
            <span>Deterministic Engine</span>
          </div>
        </div>
      )}

      {/* Professional Verification Report Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          {/* Bidder / Company */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bidder / Company</span>
            <p className="font-bold text-slate-900 text-sm truncate mt-0.5">{bid.bidderName}</p>
            <p className="text-[11px] text-slate-500 font-mono">PAN: {profile?.pan || 'N/A'}</p>
          </div>

          {/* Tender ID */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tender Reference</span>
            <p className="font-mono font-bold text-blue-700 text-sm mt-0.5">{tender.id}</p>
            <p className="text-[11px] text-slate-500 truncate">{tender.title}</p>
          </div>

          {/* Verification Status */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verification Status</span>
            <div className="mt-1">
              <StatusBadge status={bid.verificationStatus || 'Pending'} size="sm" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {report ? `Evaluated ${new Date(report.verifiedAt).toLocaleDateString('en-IN')}` : 'Awaiting Run'}
            </p>
          </div>

          {/* Compliance Score with subtle circular ring progress indicator */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center h-16 w-16">
              <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#E2E8F0"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626'}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={report ? strokeDashoffset : circumference}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="font-mono font-bold text-xs text-slate-900">
                  {report ? score : '—'}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold">%</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Compliance Score</span>
              <p className="font-bold text-slate-900 text-sm font-mono">{report ? `${score} / 100` : 'Pending'}</p>
              <span className="text-[11px] text-slate-500">
                {score >= 80 ? 'Optimal' : score >= 60 ? 'Moderate' : 'High Risk'}
              </span>
            </div>
          </div>

          {/* Risk Level */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk Level</span>
            <div className="mt-1">
              {renderCompactRiskBadge(report?.riskLevel)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {report?.issues.length ?? 0} Issue(s) detected
            </p>
          </div>
        </div>
      </div>

      {/* Main Verification Sections (Visible once report is ready) */}
      {report ? (
        <>
          {/* AI Recommendation: Normal advisory section (No chatbot, no futuristic AI panel) */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-700" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  AI Compliance Recommendation & Assessment Advisory
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Advisory Note for Procurement Officer
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-700 leading-relaxed font-normal">
                {report.aiRecommendation.summary}
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-slate-800 font-medium">
                <span className="font-bold text-slate-900">Recommended Next Step: </span>
                <span>{report.aiRecommendation.recommendation}</span>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Statutory Notice: The above evaluation is algorithmic advisory based on statutory rules. The Procurement Officer retains sole administrative authority over the final bid determination.
              </p>
            </div>
          </div>

          {/* Verification Table Navigation & Filter */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Statutory Verification Table</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  14 Statutory compliance verifications against government registries and tender prerequisites
                </p>
              </div>

              {/* Restrained Filter Tabs */}
              <div className="flex items-center gap-1 bg-white p-0.5 border border-slate-200 rounded-md text-xs">
                {(['ALL', 'VERIFIED', 'WARNING', 'FAILED', 'NA'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTableFilter(filter)}
                    className={`px-2.5 py-1 font-medium rounded transition-colors text-xs ${
                      tableFilter === filter
                        ? 'bg-slate-800 text-white font-semibold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {filter === 'ALL'
                      ? `All (${statutoryChecks.length})`
                      : filter === 'VERIFIED'
                      ? 'Verified'
                      : filter === 'WARNING'
                      ? 'Warnings'
                      : filter === 'FAILED'
                      ? 'Failed'
                      : 'N/A'}
                  </button>
                ))}
              </div>
            </div>

            {/* Verification Table: Check | Source | Result | Details */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-1/5">Check</th>
                    <th className="py-3 px-4 w-1/4">Source</th>
                    <th className="py-3 px-4 w-1/6">Result</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStatutoryChecks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No verification checks match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStatutoryChecks.map((chk) => (
                      <tr key={chk.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Check */}
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {chk.name}
                        </td>

                        {/* Source */}
                        <td className="py-3 px-4 text-slate-600">
                          {chk.source}
                        </td>

                        {/* Result: Restrained indicators: ✓ Verified, ! Pending / Warning, × Failed, — Not Applicable */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderRestrainedResult(chk.result)}
                        </td>

                        {/* Details */}
                        <td className="py-3 px-4 text-slate-600 text-[11px] leading-relaxed">
                          {chk.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Uploaded Documents & OCR Extractions List */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Submitted Compliance Documents & OCR Extractions</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extracted statutory fields from uploaded technical packet documents
                </p>
              </div>
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200">
                Engine: {report.ocrMode}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {report.documentsExtracted.map((doc, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-slate-900 truncate" title={doc.documentName}>
                        {doc.documentName}
                      </p>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded shrink-0">
                        {doc.overallConfidence}% Match
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{doc.documentType}</p>

                    <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1 text-[11px]">
                      {doc.fieldDetails.slice(0, 3).map((f, fIdx) => (
                        <div key={fIdx} className="flex justify-between gap-2">
                          <span className="text-slate-500 truncate">{f.label}:</span>
                          <span className="font-mono font-medium text-slate-800 truncate">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedDocForOcr(doc)}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="h-3 w-3" /> Inspect Fields
                    </button>
                    <button
                      onClick={() => setPreviewDocUrl({ name: doc.documentName })}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="h-3 w-3" /> Preview Doc
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Officer Final Decision Panel */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Procurement Officer Final Determination</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record official statutory action. This determination updates the public tender register and notifies the bidder.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Decision Options */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">Select Official Determination:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDecisionAction('Qualified')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      decisionAction === 'Qualified'
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-500 font-bold ring-1 ring-emerald-500'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm block">✓ Technically Qualified</span>
                    <span className="text-[11px] text-slate-500 font-normal mt-0.5 block">
                      Clear for commercial bid opening
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionAction('Clarification Requested')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      decisionAction === 'Clarification Requested'
                        ? 'bg-amber-50 text-amber-950 border-amber-500 font-bold ring-1 ring-amber-500'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm block">! Request Clarification</span>
                    <span className="text-[11px] text-slate-500 font-normal mt-0.5 block">
                      Issue formal statutory query
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionAction('Disqualified')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      decisionAction === 'Disqualified'
                        ? 'bg-rose-50 text-rose-950 border-rose-500 font-bold ring-1 ring-rose-500'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm block">× Disqualified</span>
                    <span className="text-[11px] text-slate-500 font-normal mt-0.5 block">
                      Ineligible under tender rules
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionAction('Keep Pending')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      decisionAction === 'Keep Pending'
                        ? 'bg-slate-100 text-slate-900 border-slate-500 font-bold ring-1 ring-slate-500'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm block">— Keep Pending</span>
                    <span className="text-[11px] text-slate-500 font-normal mt-0.5 block">
                      Awaiting committee consensus
                    </span>
                  </button>
                </div>
              </div>

              {/* Clarification Notice Input (if selected) */}
              {decisionAction === 'Clarification Requested' && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-md p-3 space-y-1.5">
                  <label className="font-bold text-amber-950">
                    Formal Clarification Notice to Bidder <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={clarificationText}
                    onChange={(e) => setClarificationText(e.target.value)}
                    placeholder="Specify the exact certificate or turnover clarification required..."
                    className="w-full border border-amber-300 rounded px-2.5 py-1.5 bg-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Justification Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">
                  Officer Remarks & Statutory Audit Justification <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Record formal assessment notes, committee findings, and rationale under GFR 2017 rules..."
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  Recorded Officer: <strong className="text-slate-800">{currentUser?.name || 'Dr. Vikram Malhotra'}</strong>
                </span>

                <button
                  type="button"
                  onClick={handleOpenConfirmDecision}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
                >
                  Record Official Determination
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty State before verification run */
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center shadow-xs">
          <ShieldCheck className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-slate-900">Verification Engine Ready</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Execute the cross-verification pipeline to cross-check bidder profile, OCR documents, and the government prototype dataset.
          </p>
          <div className="mt-4">
            <button
              onClick={() => handleStartVerification()}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-md shadow-2xs transition-colors cursor-pointer"
            >
              Start Automated Verification
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white border border-slate-200 rounded-lg p-5 max-w-md w-full shadow-xl space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Confirm Official Decision</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                You are about to record the determination: <strong className="text-slate-800">{decisionAction}</strong>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-700 space-y-1">
              <p><strong>Bid Reference:</strong> {bid.id}</p>
              <p><strong>Bidder:</strong> {bid.bidderName}</p>
              <p><strong>Compliance Score:</strong> {report?.overallScore ?? 0} / 100</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingDecision}
                onClick={handleConfirmDecision}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors"
              >
                {isSavingDecision ? 'Recording...' : 'Confirm & Sign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OCR Inspector Modal */}
      {selectedDocForOcr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white border border-slate-200 rounded-lg p-5 max-w-lg w-full shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 text-sm">
                OCR Extractions: {selectedDocForOcr.documentName}
              </h4>
              <button
                onClick={() => setSelectedDocForOcr(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedDocForOcr.fieldDetails.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-700">{f.label}</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">{f.value}</span>
                    <span className="text-[10px] text-slate-400">Confidence: {f.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDocForOcr(null)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-md"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white border border-slate-200 rounded-lg p-5 max-w-md w-full shadow-xl space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Gemini API Key Configuration</h4>
              <p className="text-xs text-slate-500 mt-1">
                Optional: Configure your Gemini API key to enable live OCR extraction on uploaded attachments.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Gemini API Key</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md font-mono text-xs focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

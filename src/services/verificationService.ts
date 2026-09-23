import {
  Bid,
  Tender,
  BidderProfile,
  VerificationReport,
  ExtractedDocumentData,
  OfficerFinalAction,
  DecisionRecord,
} from '../types';
import { getBidById, getTenderById, getBidderProfile, saveBid } from './storage';
import { findBidderRecord } from './verificationDatasetService';
import { extractDocumentInformation, isGeminiLiveConfigured } from './geminiService';
import { executeThreeWayCrossVerification } from './crossVerificationEngine';
import { calculateComplianceScore } from './scoreCalculator';
import { classifyComplianceRisk } from './riskClassifier';
import { logAuditEvent } from './auditService';
import { addNotification } from './notificationService';
import { updateApplicationStatus } from './supabase';

const STORAGE_REPORTS_KEY = 'gem_procure_reports';

/**
 * Retrieves all stored verification reports from localStorage.
 */
function getAllReports(): Record<string, VerificationReport> {
  try {
    const raw = localStorage.getItem(STORAGE_REPORTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Saves a verification report into localStorage.
 */
function persistReport(report: VerificationReport): void {
  try {
    const all = getAllReports();
    all[report.bidId] = report;
    localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to persist verification report:', e);
  }
}

/**
 * Retrieves a verification report for a specific bid.
 */
export function getVerificationReport(bidId: string): VerificationReport | null {
  const all = getAllReports();
  return all[bidId] || null;
}

/**
 * Generates an objective, audit-ready AI recommendation text that respects
 * the Procurement Officer's ultimate decision-making authority.
 */
function generateAIRecommendation(
  score: number,
  riskLevel: string,
  isBlacklisted: boolean,
  issueCount: number,
  flaggedIssues: string[]
): {
  summary: string;
  riskObservation: string;
  recommendation: string;
  flaggedItemsCount: number;
} {
  if (isBlacklisted) {
    return {
      summary:
        'CRITICAL ALERT: The automated verification engine identified an active debarment/blacklist record in the Central Public Procurement registry.',
      riskObservation:
        'Vendor integrity failure under GFR Rule 151. Proceeding with technical clearance is not permitted under standard procurement guidelines.',
      recommendation:
        'Procurement Officer Action: Immediately refer to Vigilance / Tender Committee for statutory disqualification proceedings.',
      flaggedItemsCount: issueCount,
    };
  }

  if (score >= 85 && riskLevel === 'Low') {
    return {
      summary: `The bidder demonstrates robust statutory compliance with a composite compliance score of ${score}/100. All mandatory legal, financial, and technical eligibility parameters are verified against central datasets.`,
      riskObservation:
        'Low risk profile. Zero critical identity or financial discrepancies detected across CBDT, GSTN, and MSME registries.',
      recommendation:
        'Procurement Officer Action: Recommended for Technical Qualification and Commercial Bid Opening clearance.',
      flaggedItemsCount: issueCount,
    };
  }

  if (score >= 65) {
    const issuesText = flaggedIssues.length > 0 ? flaggedIssues.slice(0, 2).join('; ') : 'Minor document ambiguities';
    return {
      summary: `The bidder satisfies basic statutory prerequisites (Score: ${score}/100), but discrepancies or documentary omissions were identified: ${issuesText}.`,
      riskObservation:
        'Moderate compliance risk. The discrepancies do not constitute fraud, but require formal verification before contract award.',
      recommendation:
        'Procurement Officer Action: Detailed Officer Review Required. Recommend issuing a formal GeM Clarification Notice to the bidder with a 48-hour response window.',
      flaggedItemsCount: issueCount,
    };
  }

  return {
    summary: `Multiple critical non-compliances or documentary deficiencies were detected during cross-verification (Score: ${score}/100, Issues: ${issueCount}).`,
    riskObservation:
      'High risk profile. Significant variance identified between declared bid values, uploaded proofs, and government registry records.',
    recommendation:
      'Procurement Officer Action: Comprehensive Scrutiny Required. May warrant disqualification under General Financial Rules (GFR) if clarifications fail.',
    flaggedItemsCount: issueCount,
  };
}

/**
 * Main verification execution pipeline.
 * Runs document extraction, dataset reconciliation, three-way checks, scoring, and report creation.
 */
export async function runVerificationPipeline(
  bidId: string,
  options?: {
    forceScenario?: 'A' | 'B' | 'C';
    progressCallback?: (step: string, percent: number) => void;
  }
): Promise<VerificationReport> {
  const startTime = Date.now();
  const notify = options?.progressCallback || (() => {});

  notify('Loading submitted bid and tender data...', 10);
  const bid = getBidById(bidId);
  if (!bid) {
    throw new Error(`Bid not found with ID: ${bidId}`);
  }

  const tender = getTenderById(bid.tenderId);
  if (!tender) {
    throw new Error(`Tender not found with ID: ${bid.tenderId}`);
  }

  const profile = getBidderProfile(bid.bidderId);

  // 1. Resolve Bidder in Government Verification Dataset
  notify('Matching bidder in Prototype Government Verification Dataset (500 records)...', 25);
  let datasetRecord = findBidderRecord({
    bidderId: bid.bidderId,
    pan: profile?.pan,
    gstin: profile?.gstin,
    udyam: profile?.udyamNumber,
  });

  // Apply scenario overrides if requested for testing
  const forceScenario = options?.forceScenario;
  let forceMismatch = false;

  if (forceScenario === 'B') {
    // Scenario B: Mismatch test
    forceMismatch = true;
    if (datasetRecord) {
      datasetRecord = {
        ...datasetRecord,
        panNumber: 'RQJNM9999P', // mismatch
        annualTurnoverLakh: 800, // below tender requirement
        localContentPercent: 42, // below requirement
        gstReturnFilingStatus: 'Not Filed',
      };
    }
  } else if (forceScenario === 'C') {
    // Scenario C: Missing document test
    // Simulate removing one document from submission
    if (bid.documentsSubmitted && bid.documentsSubmitted.length > 0) {
      bid.documentsSubmitted = bid.documentsSubmitted.slice(1);
    }
  }

  // 2. Process and Extract Documents via Gemini OCR
  notify('Running Gemini OCR extraction on submitted compliance documents...', 45);
  const ocrMode = isGeminiLiveConfigured() ? 'Gemini-Live' : 'High-Fidelity-OCR-Engine';
  const extractedDocs: ExtractedDocumentData[] = [];

  const docsToProcess = bid.documentsSubmitted || [];
  for (let i = 0; i < docsToProcess.length; i++) {
    const doc = docsToProcess[i];
    notify(`Extracting document ${i + 1} of ${docsToProcess.length}: ${doc.name}...`, 45 + Math.round((i / docsToProcess.length) * 20));

    const extracted = await extractDocumentInformation(doc.name, doc.type || 'Statutory Document', doc.fileDataUrl, {
      bidderName: profile?.companyName || bid.bidderName,
      pan: profile?.pan,
      gstin: profile?.gstin,
      udyamNumber: profile?.udyamNumber,
      experienceYears: profile?.yearsOfExperience,
      turnoverCr: profile?.annualTurnoverCr,
      localContentPct: profile?.localContentPercentage,
      hasOem: profile?.hasOemAuthorization,
      oemPartnerName: profile?.oemPartnerName,
      forceMismatch,
    });

    extractedDocs.push(extracted);
  }

  // 3. Three-Way Cross-Verification Engine
  notify('Executing three-way cross-verification (Form vs OCR vs Government Dataset)...', 70);
  const crossResult = executeThreeWayCrossVerification({
    bid,
    tender,
    profile,
    datasetRecord,
    extractedDocs,
  });

  // 4. Deterministic Compliance Score Calculation
  notify('Calculating deterministic weighted compliance score (25/25/25/15/10 model)...', 85);
  const scoreResult = calculateComplianceScore(crossResult.checks);

  // 5. Risk Classification
  notify('Classifying compliance risk level and screening debarment registries...', 90);
  const isBlacklisted = datasetRecord?.blacklistedDebarred || false;
  const riskResult = classifyComplianceRisk(scoreResult.overallScore, isBlacklisted, crossResult.issues);

  // 6. AI-Assisted Recommendation Generation
  notify('Compiling audit-ready verification report and AI recommendation...', 95);
  const flaggedIssueSummary = crossResult.issues.map((i) => i.requirement);
  const aiRecommendation = generateAIRecommendation(
    scoreResult.overallScore,
    riskResult.riskLevel,
    isBlacklisted,
    crossResult.issues.length,
    flaggedIssueSummary
  );

  const report: VerificationReport = {
    bidId: bid.id,
    tenderId: tender.id,
    tenderTitle: tender.title,
    bidderId: bid.bidderId,
    bidderName: bid.bidderName,
    verifiedAt: new Date().toISOString(),
    executionTimeMs: Date.now() - startTime,
    overallScore: scoreResult.overallScore,
    riskLevel: riskResult.riskLevel,
    isBlacklisted,
    ocrMode,
    categories: scoreResult.categories,
    checks: crossResult.checks,
    issues: crossResult.issues,
    documentsExtracted: extractedDocs,
    documentsVerifiedCount: crossResult.documentsVerifiedCount,
    totalDocumentsCount: crossResult.totalDocumentsCount,
    datasetMatchedRecord: datasetRecord || undefined,
    aiRecommendation,
  };

  // 7. Persist Report & Update Bid Record in localStorage
  persistReport(report);

  // Update Bid Status in Central Storage
  bid.verificationStatus = scoreResult.overallScore >= 85 && riskResult.riskLevel === 'Low' ? 'Verified' : 'Review Required';
  bid.complianceScore = scoreResult.overallScore;
  bid.riskLevel = riskResult.riskLevel;
  bid.issueCount = crossResult.issues.length;
  bid.verificationReport = report;

  // Mark verified documents
  if (bid.documentsSubmitted) {
    bid.documentsSubmitted = bid.documentsSubmitted.map((doc) => ({
      ...doc,
      verified: !crossResult.issues.some((iss) => iss.source === 'OCR Document' && iss.requirement.includes(doc.name)),
    }));
  }

  saveBid(bid);

  // 8. Log Audit Event & Trigger Notifications
  logAuditEvent(
    'VERIF_COMPLETE',
    bid.id,
    `Automated compliance verification completed for ${bid.id}. Score: ${scoreResult.overallScore}/100 (${riskResult.riskLevel} Risk).`,
    {
      score: scoreResult.overallScore,
      riskLevel: riskResult.riskLevel,
      issuesCount: crossResult.issues.length,
      passedChecksCount: crossResult.checks.filter((c) => c.status === 'Verified').length,
    }
  );

  addNotification({
    targetRole: 'bidder',
    targetUserId: bid.bidderId,
    title: `Compliance Verification Completed: ${bid.id}`,
    message: `Your bid packet for ${tender.id} achieved a compliance score of ${scoreResult.overallScore}/100 (${riskResult.riskLevel} Risk).`,
    category: 'Verification Audit',
    type: riskResult.riskLevel === 'Low' ? 'success' : 'warning',
    link: '/bidder/applications',
  });

  notify('Verification pipeline completed successfully!', 100);
  return report;
}

/**
 * Records an official decision by the Procurement Officer.
 * Preserves complete decision history and logs an immutable audit event.
 */
export function recordOfficerDecision(
  bidId: string,
  decision: {
    action: OfficerFinalAction;
    notes: string;
    officerId?: string;
    officerName?: string;
    clarificationMessage?: string;
  }
): boolean {
  const bid = getBidById(bidId);
  const report = getVerificationReport(bidId);
  if (!bid) return false;

  const now = new Date().toISOString();
  const officerName = decision.officerName || 'Dr. Vikram Malhotra';
  const officerId = decision.officerId || 'officer001';

  const newDecisionRecord: DecisionRecord = {
    id: `DEC-${Date.now()}`,
    decision: decision.action,
    decisionReason: decision.notes,
    officerId,
    officerName,
    decisionTimestamp: now,
    clarificationMessage: decision.clarificationMessage,
  };

  // 1. Maintain complete Decision History (never silently overwrite)
  if (!bid.decisionHistory) {
    bid.decisionHistory = [];
  }
  bid.decisionHistory.unshift(newDecisionRecord);
  bid.currentDecision = newDecisionRecord;

  // 2. Update Bid Status Flow
  if (decision.action === 'Qualified') {
    bid.bidStatus = 'Qualified';
    bid.verificationStatus = 'Verified';
  } else if (decision.action === 'Disqualified') {
    bid.bidStatus = 'Disqualified';
    bid.verificationStatus = 'Verified';
  } else if (decision.action === 'Clarification Requested') {
    bid.bidStatus = 'Clarification Requested';
    bid.verificationStatus = 'In Verification';
    bid.clarificationRequest = {
      message: decision.clarificationMessage || decision.notes,
      requestedAt: now,
      officerName,
      officerId,
    };
  } else if (decision.action === 'Keep Pending') {
    bid.bidStatus = 'Decision Pending';
  }

  // 3. Update Verification Report
  if (report) {
    report.officerDecision = {
      action: decision.action,
      officerNotes: decision.notes,
      decidedAt: now,
      decidedBy: officerName,
    };
    persistReport(report);
  }

  saveBid(bid);

  // Sync to Supabase cloud database
  const mappedStatus =
    decision.action === 'Qualified'
      ? 'Qualified'
      : decision.action === 'Disqualified'
      ? 'Disqualified'
      : decision.action === 'Clarification Requested'
      ? 'Clarification Requested'
      : 'Under Review';
  updateApplicationStatus(bid.applicationId || bid.id, mappedStatus, decision.notes);

  // 4. Log Immutable Audit Event
  const auditAction = decision.action === 'Clarification Requested' ? 'CLARIFICATION_REQUESTED' : 'DECISION_MADE';
  logAuditEvent(
    auditAction,
    bid.id,
    `Procurement Officer (${officerName}) recorded determination '${decision.action}' on bid ${bid.id}. Justification: "${decision.notes}"`,
    {
      decision: decision.action,
      reason: decision.notes,
      officerId,
      clarificationMessage: decision.clarificationMessage,
    }
  );

  // 5. Emit Notification to Bidder
  addNotification({
    targetRole: 'bidder',
    targetUserId: bid.bidderId,
    title:
      decision.action === 'Clarification Requested'
        ? `Action Required: Clarification Notice on ${bid.id}`
        : `Official Decision Recorded: ${decision.action}`,
    message:
      decision.action === 'Clarification Requested'
        ? `The Procurement Officer has requested statutory clarifications regarding your submission: "${decision.clarificationMessage || decision.notes}"`
        : `Your bid ${bid.id} has been marked as ${decision.action}. Remarks: ${decision.notes}`,
    category: 'Procurement Decision',
    type: decision.action === 'Qualified' ? 'success' : decision.action === 'Disqualified' ? 'critical' : 'warning',
    link: '/bidder/applications',
  });

  return true;
}

/**
 * Submits bidder response to a formal clarification request.
 */
export function submitBidderClarification(bidId: string, responseMessage: string): boolean {
  const bid = getBidById(bidId);
  if (!bid) return false;

  const now = new Date().toISOString();
  bid.clarificationResponse = {
    message: responseMessage,
    respondedAt: now,
  };
  bid.bidStatus = 'Under Verification';
  bid.verificationStatus = 'In Verification';

  if (bid.currentDecision) {
    bid.currentDecision.bidderClarificationResponse = responseMessage;
    bid.currentDecision.clarificationRespondedAt = now;
  }

  saveBid(bid);

  // Sync clarification state to Supabase
  updateApplicationStatus(bid.applicationId || bid.id, 'Under Review', responseMessage);

  // Log audit event
  logAuditEvent(
    'CLARIFICATION_RESPONDED',
    bid.id,
    `Vendor submitted clarification response on bid ${bid.id}: "${responseMessage.slice(0, 80)}..."`,
    {
      responseMessage,
      submittedAt: now,
    }
  );

  // Notify Officer
  addNotification({
    targetRole: 'officer',
    title: `Clarification Response Received: ${bid.id}`,
    message: `${bid.bidderName} has submitted response to your clarification request. Re-open bid for final review.`,
    category: 'Vendor Response',
    type: 'info',
    link: `/officer/verification/${bid.id}`,
  });

  return true;
}

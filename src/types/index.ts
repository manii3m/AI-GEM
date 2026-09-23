export type UserRole = 'bidder' | 'officer';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  organization: string;
  designation?: string;
  bidderId?: string; // Links to BidderProfile if role is bidder
}

export interface BidderProfile {
  id: string;
  userId: string;
  // Company Information
  companyName: string;
  companyType: 'Private Limited' | 'Public Limited' | 'Partnership' | 'Proprietorship' | 'LLP';
  state: string;
  city: string;
  address: string;
  pincode: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;

  // Registration Details
  pan: string;
  gstin: string;
  udyamNumber: string;
  isStartupIndia: boolean;
  isNsicRegistered: boolean;
  registrationDate: string;

  // Business Information
  yearsOfExperience: number;
  annualTurnoverCr: number; // in ₹ Crores
  employeeCount: number;
  pastGovtProjectsCount: number;

  // Compliance Information
  epfoStatus: 'Compliant' | 'Pending' | 'Non-Compliant' | 'Exempt';
  esicStatus: 'Compliant' | 'Pending' | 'Non-Compliant' | 'Exempt';
  isMakeInIndia: boolean;
  localContentPercentage: number; // 0 - 100%
  hasOemAuthorization: boolean;
  oemPartnerName?: string;

  updatedAt: string;
}

export interface EligibilityCriteria {
  minExperienceYears: number;
  minTurnoverCr: number;
  minLocalContentPct: number;
  gstRequired: boolean;
  panRequired: boolean;
  udyamRequired: boolean;
  startupIndiaRequired: boolean;
  nsicRequired: boolean;
  oemAuthRequired: boolean;
  oemAuthorizationRequired?: boolean;
  makeInIndiaPreference?: boolean;
}

export type TenderStatus = 'Active' | 'Closing Soon' | 'Under Evaluation' | 'Closed';

export interface Tender {
  id: string; // e.g. DEMO-GEM-2026-001
  title: string;
  issuingOrg: string;
  ministryDepartment: string;
  category: string;
  description: string;
  scopeOfWork: string;
  publishedDate: string;
  closingDate: string;
  estimatedValueCr: number;
  status: TenderStatus;
  bidsCount: number;
  location: string;
  eligibilityCriteria: EligibilityCriteria;
  requiredDocuments: string[]; // List of mandatory/applicable document titles
  createdBy: string;
  createdAt: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type VerificationStatus = 'Pending' | 'In Verification' | 'Verified' | 'Review Required';
export type OverallEligibility = 'Eligible' | 'Conditional' | 'Ineligible';
export type BidStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Verification'
  | 'Verification Complete'
  | 'Decision Pending'
  | 'Qualified'
  | 'Disqualified'
  | 'Clarification Requested'
  | 'Pending';

export interface BidApplicationDocument {
  documentName: string;
  isRequired: boolean;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  uploadedAt?: string;
  fileDataUrl?: string; // for local prototype preview / download
  status: 'Uploaded' | 'Missing';
}

export interface BidApplication {
  id: string; // e.g. APP-DEMO-0001
  tenderId: string;
  tenderTitle: string;
  bidderId: string;
  bidderName: string;
  status: 'Draft' | 'Submitted';

  // Section A: Bidder Information Snapshot
  bidderInfo: {
    companyName: string;
    pan: string;
    gstin: string;
    udyamNumber: string;
    address: string;
    contactEmail: string;
    contactPhone: string;
  };

  // Section B: Business Qualification
  businessQualification: {
    yearsOfExperience: number;
    annualTurnoverCr: number;
    employeeCount: number;
    pastGovtProjectsCount: number;
    relevantProjectExperience: string;
  };

  // Section C: Compliance Declaration
  complianceDeclaration: {
    gstStatus: string;
    panStatus: string;
    udyamStatus: string;
    startupIndiaStatus: string;
    nsicStatus: string;
    epfoStatus: string;
    esicStatus: string;
    makeInIndiaDeclared: boolean;
    localContentPercentage: number;
    oemAuthorizationDeclared: boolean;
  };

  // Section D: Financial Bid
  financialBid: {
    quotedAmountCr: number;
    taxAmountCr: number;
    totalBidAmountCr: number;
    priceValidityDays: number;
  };

  // Section E: Required Documents Checklist & Uploads
  documents: BidApplicationDocument[];

  declarationsAccepted: boolean;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  bidId?: string;
}

export interface Bid {
  id: string; // e.g. BID-2026-0801
  applicationId?: string;
  tenderId: string;
  tenderTitle: string;
  bidderId: string;
  bidderName: string;
  submissionDate?: string;
  submissionTime?: string;
  eligibilityStatus: OverallEligibility;
  bidStatus?: BidStatus;
  verificationStatus: VerificationStatus;
  documentStatus?: 'Submitted' | 'Missing' | 'Verified';
  quotedAmount?: number; // in ₹ Cr
  taxAmount?: number;
  totalAmount?: number;
  remarks?: string;
  localContentDeclaredPct?: number;

  // Documents list
  documentsSubmitted: {
    name: string;
    type: string;
    fileName?: string;
    fileSize?: string;
    fileDataUrl?: string;
    verified: boolean;
  }[];

  // Backwards compatibility with Phase 1 fields
  offeredValueCr: number;
  submittedAt: string;
  riskLevel?: RiskLevel;

  // Phase 3 & 4 Verification & Decision Results
  complianceScore?: number;
  issueCount?: number;
  verificationReport?: VerificationReport;
  currentDecision?: DecisionRecord;
  decisionHistory?: DecisionRecord[];
  clarificationRequest?: {
    message: string;
    requestedAt: string;
    officerName: string;
    officerId?: string;
  };
  clarificationResponse?: {
    message: string;
    respondedAt: string;
  };
  statusHistory?: {
    status: string;
    timestamp: string;
    note: string;
  }[];
}

export interface EligibilityItemResult {
  ruleName: string;
  requirement: string;
  bidderValue: string;
  isEligible: boolean;
  isMandatory: boolean;
  reason?: string;
}

export interface EligibilityEvaluation {
  overallStatus: OverallEligibility;
  passedCount: number;
  failedCount: number;
  totalCount: number;
  items: EligibilityItemResult[];
  summaryMessage: string;
}

// ---------------------------------------------------------------------------
// Phase 3 Verification Types
// ---------------------------------------------------------------------------

export interface GovernmentVerificationRecord {
  bidderId: string;
  companyName: string;
  companyType: string;
  state: string;
  city: string;
  panNumber: string;
  panStatus: string; // Valid, Invalid, Not Found
  panDocumentStatus: string;
  gstin: string;
  gstStatus: string; // Active, Suspended, Cancelled, Not Found
  gstReturnFilingStatus: string; // Filed, Partially Filed, Not Filed
  gstDocumentStatus: string;
  udyamNumber: string;
  udyamStatus: string; // Valid, Invalid, Expired
  udyamDocumentStatus: string;
  mcaStatus: string; // Active, Inactive, Defaulting
  incorporationDocumentStatus: string;
  incomeTaxStatus: string; // Compliant, Non-Compliant, Pending
  itrDocumentStatus: string;
  startupIndiaStatus: string; // Verified, Not Verified, N/A
  nsicStatus: string; // Valid, Expired, Not Found, N/A
  epfoStatus: string; // Compliant, Non-Compliant, N/A
  epfoDocumentStatus: string;
  esicStatus: string; // Compliant, Pending, Non-Compliant, N/A
  esicDocumentStatus: string;
  digiLockerStatus: string; // Verified, Partially Verified, Not Verified
  yearsOfExperience: number;
  experienceDocumentStatus: string;
  annualTurnoverLakh: number;
  turnoverDocumentStatus: string;
  employees: number;
  makeInIndiaStatus: string; // Compliant, Non-Compliant
  localContentPercent: number;
  makeInIndiaDocumentStatus: string;
  oemAuthorizationStatus: string; // Valid, Mismatch, Expired, Missing, N/A
  bankDocumentStatus: string;
  declarationDocumentStatus: string;
  tenderExperienceRequiredYears: number;
  tenderTurnoverRequiredLakh: number;
  tenderLocalContentRequiredPercent: number;
  gstRequired: boolean;
  udyamRequired: boolean;
  startupIndiaRequired: boolean;
  nsicRequired: boolean;
  oemAuthorizationRequired: boolean;
  quotedAmountLakh: number;
  bidSecurityStatus: string;
  technicalBidStatus: string;
  financialBidStatus: string;
  declarationStatus: string;
  profileDocumentCrossVerification: string;
  tenderEligibility: string;
  bidCompleteness: string;
  complianceScore: number;
  riskLevel: RiskLevel;
  issueCount: number;
  issues: string;
  blacklistedDebarred: boolean; // Yes = true, No = false
}

export type ThreeWayStatus =
  | 'Verified'
  | 'Government Data Mismatch'
  | 'Document Mismatch'
  | 'Document Information Missing'
  | 'Not Found'
  | 'Expired'
  | 'Pending'
  | 'Not Applicable';

export interface ThreeWayCheckResult {
  id: string;
  requirement: string;
  category: 'Identity' | 'Statutory' | 'Eligibility' | 'Documents' | 'Risk';
  isMandatory: boolean;
  formValue: string;
  ocrValue: string;
  datasetValue: string;
  status: ThreeWayStatus;
  confidence?: number;
  details?: string;
  documentRef?: string;
}

export interface ExtractedDocumentField {
  label: string;
  value: string;
  confidence: number;
}

export interface ExtractedDocumentData {
  documentName: string;
  documentType: string;
  fileName: string;
  fileSize?: string;
  fields: Record<string, string>;
  fieldDetails: ExtractedDocumentField[];
  overallConfidence: number;
  extractedAt: string;
  sourceMode: 'Gemini-Live' | 'High-Fidelity-OCR-Engine';
  rawTextPreview?: string;
}

export interface ComplianceIssue {
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Warning';
  source: 'Bidder Form' | 'OCR Document' | 'Government Dataset' | 'Tender Requirement';
  requirement: string;
  actualValue: string;
  expectedValue: string;
  recommendedAction: string;
}

export interface ScoreCategoryBreakdown {
  name: string;
  categoryKey: 'Identity' | 'Statutory' | 'Eligibility' | 'Documents' | 'Risk';
  weight: number;
  earned: number;
  maxPoints: number;
  passedChecks: number;
  totalChecks: number;
  status: 'Satisfied' | 'Review' | 'Deficient';
}

export interface VerificationReport {
  bidId: string;
  tenderId: string;
  tenderTitle: string;
  bidderId: string;
  bidderName: string;
  verifiedAt: string;
  executionTimeMs: number;
  overallScore: number;
  riskLevel: RiskLevel;
  isBlacklisted: boolean;
  ocrMode: 'Gemini-Live' | 'High-Fidelity-OCR-Engine';
  categories: ScoreCategoryBreakdown[];
  checks: ThreeWayCheckResult[];
  issues: ComplianceIssue[];
  documentsExtracted: ExtractedDocumentData[];
  documentsVerifiedCount: number;
  totalDocumentsCount: number;
  datasetMatchedRecord?: Partial<GovernmentVerificationRecord>;
  aiRecommendation: {
    summary: string;
    riskObservation: string;
    recommendation: string;
    flaggedItemsCount: number;
  };
  officerDecision?: {
    action: OfficerFinalAction | 'Pending';
    officerNotes?: string;
    decidedAt?: string;
    decidedBy?: string;
  };
}

// ---------------------------------------------------------------------------
// Phase 4 Final Decision & Audit Types
// ---------------------------------------------------------------------------

export type OfficerFinalAction =
  | 'Qualified'
  | 'Disqualified'
  | 'Clarification Requested'
  | 'Keep Pending';

export interface DecisionRecord {
  id: string;
  decision: OfficerFinalAction;
  decisionReason: string;
  officerId: string;
  officerName: string;
  decisionTimestamp: string;
  clarificationMessage?: string;
  bidderClarificationResponse?: string;
  clarificationRespondedAt?: string;
}

export type AuditEventType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'TENDER_CREATE'
  | 'TENDER_UPDATE'
  | 'TENDER_CLOSE'
  | 'BID_START'
  | 'BID_SUBMIT'
  | 'DOC_UPLOAD'
  | 'DOC_REMOVE'
  | 'VERIF_START'
  | 'VERIF_OCR'
  | 'VERIF_CROSSCHECK'
  | 'VERIF_COMPLETE'
  | 'VERIF_FAILED'
  | 'VERIF_RETRY'
  | 'DECISION_MADE'
  | 'DECISION_UPDATED'
  | 'CLARIFICATION_REQUESTED'
  | 'CLARIFICATION_RESPONDED';

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  userId: string;
  userName?: string;
  userRole: 'bidder' | 'officer' | 'system';
  entityId: string;
  description: string;
  ipAddress?: string;
  details?: Record<string, any>;
}

export interface NotificationItem {
  id: string;
  targetRole: 'bidder' | 'officer' | 'all';
  targetUserId?: string;
  title: string;
  message: string;
  category: string;
  type: 'info' | 'warning' | 'success' | 'critical';
  timestamp: string;
  isRead: boolean;
  link?: string;
  linkUrl?: string;
}

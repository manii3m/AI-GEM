import { INITIAL_USERS, StoredUser } from '../data/users';
import { INITIAL_BIDDERS } from '../data/bidders';
import { INITIAL_TENDERS } from '../data/tenders';
import { INITIAL_BIDS } from '../data/bids';
import {
  User,
  UserRole,
  BidderProfile,
  Tender,
  Bid,
  BidApplication,
  EligibilityEvaluation,
  EligibilityItemResult,
  OverallEligibility,
} from '../types';

export const STORAGE_KEYS = {
  USERS: 'gem_procure_users',
  BIDDERS: 'gem_procure_bidders',
  TENDERS: 'gem_procure_tenders',
  BIDS: 'gem_procure_bids',
  APPLICATIONS: 'gem_procure_applications',
  SESSION: 'gem_procure_auth_session',
};

export { INITIAL_TENDERS };

// Initial applications seed
const INITIAL_APPLICATIONS: BidApplication[] = [
  {
    id: 'APP-DEMO-0001',
    tenderId: 'DEMO-GEM-2026-001',
    tenderTitle: 'Enterprise Server & Cloud Infrastructure Refresh for Public Sector Undertakings',
    bidderId: 'bidder-001',
    bidderName: 'ABC Technologies Pvt. Ltd.',
    status: 'Submitted',
    bidderInfo: {
      companyName: 'ABC Technologies Pvt. Ltd.',
      pan: 'AABCA9812M',
      gstin: '07AABCA9812M1Z3',
      udyamNumber: 'UDYAM-DL-03-0045182',
      address: 'Plot 42, Okhla Industrial Area, Phase-III, New Delhi 110020',
      contactEmail: 'tenders@abctechnologies.in',
      contactPhone: '+91 11 4987 2300',
    },
    businessQualification: {
      yearsOfExperience: 8,
      annualTurnoverCr: 24.5,
      employeeCount: 140,
      pastGovtProjectsCount: 12,
      relevantProjectExperience: 'Executed turnkey cloud datacenter deployments for 3 central ministries.',
    },
    complianceDeclaration: {
      gstStatus: 'Active',
      panStatus: 'Valid',
      udyamStatus: 'Registered',
      startupIndiaStatus: 'Not Applicable',
      nsicStatus: 'Enlisted',
      epfoStatus: 'Compliant',
      esicStatus: 'Compliant',
      makeInIndiaDeclared: true,
      localContentPercentage: 62,
      oemAuthorizationDeclared: true,
    },
    financialBid: {
      quotedAmountCr: 17.85,
      taxAmountCr: 3.21,
      totalBidAmountCr: 21.06,
      priceValidityDays: 90,
    },
    documents: [
      {
        documentName: 'PAN Certificate',
        isRequired: true,
        fileName: 'PAN_Card_Copy.pdf',
        fileSize: '840 KB',
        fileType: 'application/pdf',
        uploadedAt: '2026-03-02T10:45:00Z',
        status: 'Uploaded',
      },
      {
        documentName: 'GST Certificate',
        isRequired: true,
        fileName: 'GST_Registration_Certificate_REG06.pdf',
        fileSize: '1.2 MB',
        fileType: 'application/pdf',
        uploadedAt: '2026-03-02T10:46:00Z',
        status: 'Uploaded',
      },
      {
        documentName: 'Udyam Certificate',
        isRequired: true,
        fileName: 'MSME_Udyam_Registration_Certificate.pdf',
        fileSize: '1.6 MB',
        fileType: 'application/pdf',
        uploadedAt: '2026-03-02T10:48:00Z',
        status: 'Uploaded',
      },
      {
        documentName: 'Audited Turnover Certificate',
        isRequired: true,
        fileName: 'Audited_Balance_Sheet_Profit_Loss_FY25.pdf',
        fileSize: '4.8 MB',
        fileType: 'application/pdf',
        uploadedAt: '2026-03-02T10:50:00Z',
        status: 'Uploaded',
      },
      {
        documentName: 'OEM Authorization Certificate',
        isRequired: true,
        fileName: 'Manufacturer_Authorization_Form_OEM_2026.pdf',
        fileSize: '2.1 MB',
        fileType: 'application/pdf',
        uploadedAt: '2026-03-02T10:52:00Z',
        status: 'Uploaded',
      },
      {
        documentName: 'Make in India / Local Content Declaration',
        isRequired: true,
        fileName: 'Local_Content_Self_Declaration_Affidavit.pdf',
        fileSize: '650 KB',
        fileType: 'application/pdf',
        uploadedAt: '2026-03-02T10:53:00Z',
        status: 'Uploaded',
      },
    ],
    declarationsAccepted: true,
    createdAt: '2026-03-02T10:30:00Z',
    updatedAt: '2026-03-02T11:24:00Z',
    submittedAt: '2026-03-02T11:24:00Z',
    bidId: 'BID-2026-0911',
  },
];

// Initialize Storage on module load if empty or if schema extended
export const initializeStorage = (): void => {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BIDDERS)) {
    localStorage.setItem(STORAGE_KEYS.BIDDERS, JSON.stringify(INITIAL_BIDDERS));
  }

  // Tenders: ensure requiredDocuments exists on all tenders in storage
  const storedTendersRaw = localStorage.getItem(STORAGE_KEYS.TENDERS);
  if (!storedTendersRaw) {
    localStorage.setItem(STORAGE_KEYS.TENDERS, JSON.stringify(INITIAL_TENDERS));
  } else {
    try {
      const parsed: Tender[] = JSON.parse(storedTendersRaw);
      let updated = false;
      parsed.forEach((t) => {
        if (!t.requiredDocuments || t.requiredDocuments.length === 0) {
          const matchingInit = INITIAL_TENDERS.find((it) => it.id === t.id);
          t.requiredDocuments = matchingInit?.requiredDocuments || [
            'PAN Certificate',
            'GST Certificate',
            'Audited Turnover Certificate',
            'Experience Certificate',
            'Make in India / Local Content Declaration',
          ];
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.TENDERS, JSON.stringify(parsed));
      }
    } catch {
      localStorage.setItem(STORAGE_KEYS.TENDERS, JSON.stringify(INITIAL_TENDERS));
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.BIDS)) {
    localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(INITIAL_BIDS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(INITIAL_APPLICATIONS));
  }
};

// Call initialization
initializeStorage();

// ----------------------------------------------------
// Authentication & Session
// ----------------------------------------------------
let cachedSessionUser: User | null = null;
let lastSessionRaw: string | null = null;

export const getCurrentUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (raw === lastSessionRaw) {
      return cachedSessionUser;
    }
    lastSessionRaw = raw;
    cachedSessionUser = raw ? JSON.parse(raw) : null;
    return cachedSessionUser;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: User): void => {
  const userJson = JSON.stringify(user);
  lastSessionRaw = userJson;
  cachedSessionUser = user;
  localStorage.setItem(STORAGE_KEYS.SESSION, userJson);
};

export const loginUser = (
  username: string,
  password: string,
  role: UserRole
): { success: boolean; user?: User; error?: string } => {
  initializeStorage();
  const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  const users: StoredUser[] = rawUsers ? JSON.parse(rawUsers) : INITIAL_USERS;

  const cleanId = username.trim().toLowerCase();
  const found = users.find((u) => {
    if (u.role !== role) return false;
    const isUsernameMatch = u.username.toLowerCase() === cleanId;
    const isEmailMatch = u.email.toLowerCase() === cleanId;
    const isDemoOfficerMatch = role === 'officer' && (cleanId === 'officer@demo.com' || cleanId === 'officer' || cleanId === 'officer001');
    const isDemoBidderMatch = role === 'bidder' && (cleanId === 'bidder@demo.com' || cleanId === 'bidder' || cleanId === 'bidder001');

    const identifierMatches = isUsernameMatch || isEmailMatch || isDemoOfficerMatch || isDemoBidderMatch;
    const passwordMatches = u.passwordHash === password || password === `${role}123` || password === 'demo123' || password === 'password';

    return identifierMatches && passwordMatches;
  });

  if (!found) {
    return {
      success: false,
      error: 'Invalid credentials or role mismatch. Please check your User ID and Password.',
    };
  }

  const user: User = {
    id: found.id,
    username: found.username,
    name: found.name,
    role: found.role,
    email: found.email,
    organization: found.organization,
    designation: found.designation,
    bidderId: found.bidderId,
  };

  const userJson = JSON.stringify(user);
  lastSessionRaw = userJson;
  cachedSessionUser = user;
  localStorage.setItem(STORAGE_KEYS.SESSION, userJson);
  return { success: true, user };
};

export const logoutUser = (): void => {
  cachedSessionUser = null;
  lastSessionRaw = null;
  localStorage.removeItem(STORAGE_KEYS.SESSION);
};

// ----------------------------------------------------
// Bidders & Profiles
// ----------------------------------------------------
export const getAllBidders = (): BidderProfile[] => {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BIDDERS);
    return raw ? JSON.parse(raw) : INITIAL_BIDDERS;
  } catch {
    return INITIAL_BIDDERS;
  }
};

export const getBidderProfile = (bidderId?: string): BidderProfile | null => {
  const bidders = getAllBidders();
  if (bidderId) {
    return bidders.find((b) => b.id === bidderId) || bidders[0] || null;
  }
  const currentUser = getCurrentUser();
  if (currentUser?.bidderId) {
    return bidders.find((b) => b.id === currentUser.bidderId) || bidders[0] || null;
  }
  return bidders[0] || null;
};

export const updateBidderProfile = (updated: BidderProfile): boolean => {
  try {
    const bidders = getAllBidders();
    const index = bidders.findIndex((b) => b.id === updated.id);
    if (index !== -1) {
      bidders[index] = {
        ...updated,
        updatedAt: new Date().toISOString(),
      };
    } else {
      bidders.push({
        ...updated,
        updatedAt: new Date().toISOString(),
      });
    }
    localStorage.setItem(STORAGE_KEYS.BIDDERS, JSON.stringify(bidders));
    return true;
  } catch (err) {
    console.error('Failed to update bidder profile:', err);
    return false;
  }
};

// ----------------------------------------------------
// Tenders
// ----------------------------------------------------
export const getTenders = (): Tender[] => {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TENDERS);
    return raw ? JSON.parse(raw) : INITIAL_TENDERS;
  } catch {
    return INITIAL_TENDERS;
  }
};

export const getTenderById = (tenderId: string): Tender | null => {
  const tenders = getTenders();
  return tenders.find((t) => t.id === tenderId) || null;
};

export const createTender = (tenderData: Omit<Tender, 'id' | 'createdAt' | 'bidsCount'>): Tender => {
  const tenders = getTenders();
  const nextNum = tenders.length + 1;
  const id = `DEMO-GEM-2026-${String(nextNum).padStart(3, '0')}`;

  const newTender: Tender = {
    ...tenderData,
    id,
    bidsCount: 0,
    createdAt: new Date().toISOString(),
    requiredDocuments: tenderData.requiredDocuments || [
      'PAN Certificate',
      'GST Certificate',
      'Audited Turnover Certificate',
      'Experience Certificate',
      'Make in India / Local Content Declaration',
    ],
  };

  tenders.unshift(newTender);
  localStorage.setItem(STORAGE_KEYS.TENDERS, JSON.stringify(tenders));
  return newTender;
};

export const updateTender = (updated: Tender): boolean => {
  try {
    const tenders = getTenders();
    const index = tenders.findIndex((t) => t.id === updated.id);
    if (index !== -1) {
      tenders[index] = updated;
      localStorage.setItem(STORAGE_KEYS.TENDERS, JSON.stringify(tenders));
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to update tender:', err);
    return false;
  }
};

export const closeTender = (tenderId: string): boolean => {
  const tender = getTenderById(tenderId);
  if (!tender) return false;
  tender.status = 'Closed';
  return updateTender(tender);
};

// ----------------------------------------------------
// Bid Applications (Phase 2 Workflow Engine)
// ----------------------------------------------------
export const getApplications = (): BidApplication[] => {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    return raw ? JSON.parse(raw) : INITIAL_APPLICATIONS;
  } catch {
    return INITIAL_APPLICATIONS;
  }
};

export const getApplicationById = (applicationId: string): BidApplication | null => {
  const apps = getApplications();
  const direct = apps.find((a) => a.id === applicationId || a.bidId === applicationId);
  if (direct) return direct;

  const bids = getBids();
  const matchedBid = bids.find((b) => b.id === applicationId || b.applicationId === applicationId);
  if (matchedBid && matchedBid.applicationId) {
    const fromBid = apps.find((a) => a.id === matchedBid.applicationId);
    if (fromBid) return fromBid;
  }
  if (matchedBid) {
    const fromTender = apps.find((a) => a.tenderId === matchedBid.tenderId && a.bidderId === matchedBid.bidderId);
    if (fromTender) return fromTender;
  }
  return null;
};

export const getApplicationsByBidder = (bidderId: string): BidApplication[] => {
  const apps = getApplications();
  return apps.filter((a) => a.bidderId === bidderId);
};

export const getApplicationByTenderAndBidder = (
  tenderId: string,
  bidderId: string
): BidApplication | null => {
  const apps = getApplications();
  return apps.find((a) => a.tenderId === tenderId && a.bidderId === bidderId) || null;
};

export const createOrGetDraftApplication = (
  tender: Tender,
  profile: BidderProfile
): BidApplication => {
  const existing = getApplicationByTenderAndBidder(tender.id, profile.id);
  if (existing) {
    return existing;
  }

  const apps = getApplications();
  const nextNum = apps.length + 1;
  const id = `APP-DEMO-${String(nextNum).padStart(4, '0')}`;

  // Build dynamic required documents list from tender.requiredDocuments
  const docNames = tender.requiredDocuments && tender.requiredDocuments.length > 0
    ? tender.requiredDocuments
    : [
        'PAN Certificate',
        'GST Certificate',
        'Audited Turnover Certificate',
        'Experience Certificate',
        'Make in India / Local Content Declaration',
      ];

  const estimated = tender.estimatedValueCr || 10.0;
  const taxEst = +(estimated * 0.18).toFixed(2);
  const totalEst = +(estimated + taxEst).toFixed(2);

  const newApp: BidApplication = {
    id,
    tenderId: tender.id,
    tenderTitle: tender.title,
    bidderId: profile.id,
    bidderName: profile.companyName,
    status: 'Draft',
    bidderInfo: {
      companyName: profile.companyName,
      pan: profile.pan,
      gstin: profile.gstin,
      udyamNumber: profile.udyamNumber || 'N/A',
      address: `${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`,
      contactEmail: profile.contactEmail,
      contactPhone: profile.contactPhone,
    },
    businessQualification: {
      yearsOfExperience: profile.yearsOfExperience,
      annualTurnoverCr: profile.annualTurnoverCr,
      employeeCount: profile.employeeCount,
      pastGovtProjectsCount: profile.pastGovtProjectsCount,
      relevantProjectExperience: 'Established commercial execution capability with required technical SLAs and warranty support.',
    },
    complianceDeclaration: {
      gstStatus: profile.gstin ? 'Active' : 'Not Available',
      panStatus: profile.pan ? 'Valid' : 'Not Available',
      udyamStatus: profile.udyamNumber ? 'Registered' : 'Not Applicable',
      startupIndiaStatus: profile.isStartupIndia ? 'Recognized' : 'Not Applicable',
      nsicStatus: profile.isNsicRegistered ? 'Enlisted' : 'Not Applicable',
      epfoStatus: profile.epfoStatus,
      esicStatus: profile.esicStatus,
      makeInIndiaDeclared: profile.isMakeInIndia,
      localContentPercentage: profile.localContentPercentage,
      oemAuthorizationDeclared: profile.hasOemAuthorization,
    },
    financialBid: {
      quotedAmountCr: estimated,
      taxAmountCr: taxEst,
      totalBidAmountCr: totalEst,
      priceValidityDays: 90,
    },
    documents: docNames.map((name) => ({
      documentName: name,
      isRequired: true,
      status: 'Missing',
    })),
    declarationsAccepted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  apps.unshift(newApp);
  localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
  return newApp;
};

export const saveApplication = (updated: BidApplication): boolean => {
  try {
    const apps = getApplications();
    const index = apps.findIndex((a) => a.id === updated.id);
    if (index !== -1) {
      apps[index] = {
        ...updated,
        updatedAt: new Date().toISOString(),
      };
    } else {
      apps.unshift({
        ...updated,
        updatedAt: new Date().toISOString(),
      });
    }
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    return true;
  } catch (err) {
    console.error('Failed to save application:', err);
    return false;
  }
};

// ----------------------------------------------------
// Bids (Phase 2 Submission & Officer Management)
// ----------------------------------------------------
export const getBids = (): Bid[] => {
  initializeStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BIDS);
    return raw ? JSON.parse(raw) : INITIAL_BIDS;
  } catch {
    return INITIAL_BIDS;
  }
};

export const getBidById = (bidId: string): Bid | null => {
  const bids = getBids();
  return bids.find((b) => b.id === bidId) || null;
};

export const saveBid = (updatedBid: Bid): boolean => {
  const bids = getBids();
  const idx = bids.findIndex((b) => b.id === updatedBid.id);
  if (idx >= 0) {
    bids[idx] = updatedBid;
  } else {
    bids.unshift(updatedBid);
  }
  try {
    localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(bids));
    return true;
  } catch (e) {
    console.error('Failed to save bid:', e);
    return false;
  }
};

export const getBidsByBidder = (bidderId: string): Bid[] => {
  const bids = getBids();
  return bids.filter((b) => b.bidderId === bidderId);
};

export const getBidsByTender = (tenderId: string): Bid[] => {
  const bids = getBids();
  return bids.filter((b) => b.tenderId === tenderId);
};

export const submitApplicationAndCreateBid = (
  applicationId: string
): { success: boolean; bid?: Bid; error?: string } => {
  const application = getApplicationById(applicationId);
  if (!application) {
    return { success: false, error: 'Application not found.' };
  }

  const tender = getTenderById(application.tenderId);
  if (!tender) {
    return { success: false, error: 'Associated tender not found or inactive.' };
  }

  const profile = getBidderProfile(application.bidderId);
  const evaluation = calculateEligibility(tender, profile);

  // Generate Bid ID
  const bids = getBids();
  const nextBidNumber = 800 + bids.length + 1;
  const bidId = `BID-2026-0${nextBidNumber}`;

  const now = new Date();
  const submissionDate = now.toISOString().split('T')[0];
  const submissionTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }) + ' IST';

  // Create Bid
  const newBid: Bid = {
    id: bidId,
    applicationId: application.id,
    tenderId: tender.id,
    tenderTitle: tender.title,
    bidderId: application.bidderId,
    bidderName: application.bidderName,
    submissionDate,
    submissionTime,
    eligibilityStatus: evaluation.overallStatus,
    bidStatus: 'Submitted',
    verificationStatus: 'Pending',
    documentStatus: 'Submitted',
    quotedAmount: application.financialBid.quotedAmountCr,
    taxAmount: application.financialBid.taxAmountCr,
    totalAmount: application.financialBid.totalBidAmountCr,
    localContentDeclaredPct: application.complianceDeclaration.localContentPercentage,
    remarks: `Electronic bid submission for ${tender.id}. Quoted ₹ ${application.financialBid.quotedAmountCr.toFixed(2)} Cr (+ ₹ ${application.financialBid.taxAmountCr.toFixed(2)} Cr GST).`,
    documentsSubmitted: application.documents.map((doc) => ({
      name: doc.documentName,
      type: doc.fileType || 'Statutory Document',
      fileName: doc.fileName || `${doc.documentName.replace(/\s+/g, '_')}.pdf`,
      fileSize: doc.fileSize || '1.2 MB',
      fileDataUrl: doc.fileDataUrl,
      verified: false,
    })),
    // Backwards compatibility fields
    offeredValueCr: application.financialBid.quotedAmountCr,
    submittedAt: now.toISOString(),
    riskLevel: evaluation.overallStatus === 'Eligible' ? 'Low' : 'Medium',
  };

  // Add bid
  bids.unshift(newBid);
  localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(bids));

  // Update application status
  application.status = 'Submitted';
  application.submittedAt = now.toISOString();
  application.bidId = bidId;
  saveApplication(application);

  // Increment tender bidsCount
  tender.bidsCount = (tender.bidsCount || 0) + 1;
  updateTender(tender);

  return { success: true, bid: newBid };
};

// Legacy submitBid helper for backwards compatibility
export const submitBid = (bidData: Omit<Bid, 'id' | 'submittedAt'>): Bid => {
  const bids = getBids();
  const nextNum = 800 + bids.length + 1;
  const now = new Date();
  const newBid: Bid = {
    ...bidData,
    id: `BID-2026-0${nextNum}`,
    applicationId: (bidData as any).applicationId || `APP-LEGACY-${nextNum}`,
    submissionDate: now.toISOString().split('T')[0],
    submissionTime: now.toLocaleTimeString('en-IN') + ' IST',
    bidStatus: (bidData as any).bidStatus || 'Submitted',
    documentStatus: (bidData as any).documentStatus || 'Submitted',
    quotedAmount: (bidData as any).quotedAmount || bidData.offeredValueCr,
    submittedAt: now.toISOString(),
  };

  bids.unshift(newBid);
  localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(bids));

  const tender = getTenderById(bidData.tenderId);
  if (tender) {
    tender.bidsCount = (tender.bidsCount || 0) + 1;
    updateTender(tender);
  }

  return newBid;
};

// ----------------------------------------------------
// Eligibility Evaluation Engine
// ----------------------------------------------------
export const calculateEligibility = (
  tender: Tender,
  profile: BidderProfile | null
): EligibilityEvaluation => {
  if (!profile) {
    return {
      overallStatus: 'Ineligible',
      passedCount: 0,
      failedCount: 1,
      totalCount: 1,
      items: [
        {
          ruleName: 'Profile Verification',
          requirement: 'Active Bidder Profile required',
          bidderValue: 'Profile Not Found',
          isEligible: false,
          isMandatory: true,
          reason: 'No registered bidder profile associated with session.',
        },
      ],
      summaryMessage: 'Please complete your bidder profile before evaluating tender eligibility.',
    };
  }

  const items: EligibilityItemResult[] = [];
  const c = tender.eligibilityCriteria;

  // 1. GST Registration
  if (c.gstRequired) {
    const hasValidGst = !!profile.gstin && profile.gstin.trim().length === 15;
    items.push({
      ruleName: 'GST Registration',
      requirement: 'Active 15-digit GSTIN registration required',
      bidderValue: profile.gstin || 'Not Provided',
      isEligible: hasValidGst,
      isMandatory: true,
      reason: hasValidGst ? 'Valid Active GSTIN verified.' : 'Missing or invalid 15-character GSTIN.',
    });
  }

  // 2. PAN Validation
  if (c.panRequired) {
    const hasValidPan = !!profile.pan && profile.pan.trim().length === 10;
    items.push({
      ruleName: 'Permanent Account Number (PAN)',
      requirement: 'Valid 10-character PAN entity card',
      bidderValue: profile.pan || 'Not Provided',
      isEligible: hasValidPan,
      isMandatory: true,
      reason: hasValidPan ? 'Valid PAN registration on file.' : 'Missing or invalid 10-character PAN.',
    });
  }

  // 3. Udyam / MSME Registration
  if (c.udyamRequired) {
    const hasUdyam = !!profile.udyamNumber && profile.udyamNumber.startsWith('UDYAM-');
    items.push({
      ruleName: 'Udyam / MSME Registration',
      requirement: 'Mandatory MSME Udyam Registration',
      bidderValue: profile.udyamNumber || 'Not Registered',
      isEligible: hasUdyam,
      isMandatory: true,
      reason: hasUdyam
        ? 'Verified Udyam MSME certificate recorded.'
        : 'Tender specifies mandatory MSME/Udyam enlistment.',
    });
  }

  // 4. Minimum Experience
  if (c.minExperienceYears > 0) {
    const meetsExp = profile.yearsOfExperience >= c.minExperienceYears;
    items.push({
      ruleName: 'Commercial & Technical Experience',
      requirement: `Minimum ${c.minExperienceYears} year(s) active business experience`,
      bidderValue: `${profile.yearsOfExperience} year(s)`,
      isEligible: meetsExp,
      isMandatory: true,
      reason: meetsExp
        ? `Bidder has ${profile.yearsOfExperience} years, meeting the ${c.minExperienceYears} years threshold.`
        : `Bidder has only ${profile.yearsOfExperience} years experience, deficit of ${c.minExperienceYears - profile.yearsOfExperience} year(s).`,
    });
  }

  // 5. Minimum Annual Turnover
  if (c.minTurnoverCr > 0) {
    const meetsTurnover = profile.annualTurnoverCr >= c.minTurnoverCr;
    items.push({
      ruleName: 'Average Annual Financial Turnover',
      requirement: `Minimum ₹ ${c.minTurnoverCr.toFixed(2)} Cr in audited statements`,
      bidderValue: `₹ ${profile.annualTurnoverCr.toFixed(2)} Cr`,
      isEligible: meetsTurnover,
      isMandatory: true,
      reason: meetsTurnover
        ? `Declared turnover of ₹ ${profile.annualTurnoverCr.toFixed(2)} Cr satisfies criterion.`
        : `Declared turnover ₹ ${profile.annualTurnoverCr.toFixed(2)} Cr is below the required ₹ ${c.minTurnoverCr.toFixed(2)} Cr.`,
    });
  }

  // 6. Local Content Percentage (Make in India)
  if (c.minLocalContentPct > 0) {
    const meetsLocalContent = profile.localContentPercentage >= c.minLocalContentPct;
    items.push({
      ruleName: 'Make in India Local Content',
      requirement: `Minimum ${c.minLocalContentPct}% local indigenous content`,
      bidderValue: `${profile.localContentPercentage}%`,
      isEligible: meetsLocalContent,
      isMandatory: true,
      reason: meetsLocalContent
        ? `Declared ${profile.localContentPercentage}% exceeds the required minimum ${c.minLocalContentPct}%.`
        : `Declared ${profile.localContentPercentage}% is below the mandatory minimum ${c.minLocalContentPct}%.`,
    });
  }

  // 7. OEM Authorization
  if (c.oemAuthRequired) {
    const meetsOem = profile.hasOemAuthorization;
    items.push({
      ruleName: 'OEM Authorization Certificate',
      requirement: 'Direct Manufacturer Authorization Form (MAF) required',
      bidderValue: meetsOem
        ? `Authorized (${profile.oemPartnerName || 'Primary OEM'})`
        : 'Not Authorized',
      isEligible: meetsOem,
      isMandatory: true,
      reason: meetsOem
        ? 'OEM partner authorization verified.'
        : 'Mandatory OEM Authorization missing from bidder records.',
    });
  }

  // 8. Startup India Status (if applicable)
  if (c.startupIndiaRequired) {
    items.push({
      ruleName: 'Startup India DPIIT Recognition',
      requirement: 'Recognized Startup under DPIIT required',
      bidderValue: profile.isStartupIndia ? 'Recognized Startup' : 'Not Registered',
      isEligible: profile.isStartupIndia,
      isMandatory: false,
      reason: profile.isStartupIndia
        ? 'DPIIT startup recognition certificate active.'
        : 'Bidder is not registered as a DPIIT startup.',
    });
  }

  // 9. NSIC Registration (if applicable)
  if (c.nsicRequired) {
    items.push({
      ruleName: 'NSIC Single Point Registration',
      requirement: 'NSIC Government Purchase Enlistment required',
      bidderValue: profile.isNsicRegistered ? 'Enlisted with NSIC' : 'Not Registered',
      isEligible: profile.isNsicRegistered,
      isMandatory: false,
      reason: profile.isNsicRegistered
        ? 'Active NSIC registration confirmed.'
        : 'Bidder does not hold active NSIC enlistment.',
    });
  }

  const passedCount = items.filter((i) => i.isEligible).length;
  const failedCount = items.filter((i) => !i.isEligible).length;
  const totalCount = items.length;

  const mandatoryFailed = items.some((i) => i.isMandatory && !i.isEligible);
  const nonMandatoryFailed = items.some((i) => !i.isMandatory && !i.isEligible);

  let overallStatus: OverallEligibility = 'Eligible';
  let summaryMessage = 'All mandatory procurement criteria are satisfied by your profile.';

  if (mandatoryFailed) {
    overallStatus = 'Ineligible';
    summaryMessage = `Eligibility Gaps Detected: ${failedCount} requirement(s) not currently met. Review details below before applying.`;
  } else if (nonMandatoryFailed) {
    overallStatus = 'Conditional';
    summaryMessage = 'Mandatory criteria met. Additional exemptions or supplementary filings required for full qualification.';
  }

  return {
    overallStatus,
    passedCount,
    failedCount,
    totalCount,
    items,
    summaryMessage,
  };
};

// Reset to factory defaults helper (for demo reset)
export const resetDemoData = (): void => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.BIDDERS, JSON.stringify(INITIAL_BIDDERS));
  localStorage.setItem(STORAGE_KEYS.TENDERS, JSON.stringify(INITIAL_TENDERS));
  localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(INITIAL_BIDS));
  localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(INITIAL_APPLICATIONS));
};

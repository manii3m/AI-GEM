import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Tender, BidApplication, Bid } from '../types';
import {
  getTenders as getLocalTenders,
  getApplications as getLocalApplications,
  getBids as getLocalBids,
  STORAGE_KEYS,
  INITIAL_TENDERS,
} from './storage';

// -----------------------------------------------------------------------------
// Supabase Client Initialization
// -----------------------------------------------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 10 &&
    !supabaseUrl.includes('your-project')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// Helper to map Supabase database row to frontend Tender interface
const mapRowToTender = (row: any): Tender => {
  return {
    id: row.id || row.tender_number,
    title: row.title,
    category: row.category || 'General Procurement',
    issuingOrg: row.department || row.issuing_org || 'Directorate of Public Procurement Automation',
    ministryDepartment: row.department || 'Ministry of Commerce and Industry',
    location: row.location || 'Pan India',
    estimatedValueCr: Number(row.estimated_value_cr) || 10.0,
    publishedDate: row.published_date || row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    closingDate: row.deadline || '2026-06-30',
    status: row.status || 'Active',
    createdBy: row.created_by || 'officer001',
    description: row.description || '',
    scopeOfWork: row.scope_of_work || row.description || '',
    eligibilityCriteria: row.eligibility_requirements || {
      minExperienceYears: 5,
      minTurnoverCr: 10.0,
      minLocalContentPct: 50,
      gstRequired: true,
      panRequired: true,
      udyamRequired: true,
      startupIndiaRequired: false,
      nsicRequired: false,
      oemAuthRequired: false,
    },
    requiredDocuments: Array.isArray(row.required_documents)
      ? row.required_documents
      : [
          'PAN Certificate',
          'GST Certificate',
          'Audited Turnover Certificate',
          'Experience Certificate',
          'Make in India / Local Content Declaration',
        ],
    bidsCount: row.bids_count || 0,
    createdAt: row.created_at || new Date().toISOString(),
  };
};

// Helper to map frontend Tender interface to Supabase row format
const mapTenderToRow = (tender: Tender) => {
  return {
    id: tender.id,
    tender_number: tender.id,
    title: tender.title,
    description: tender.description,
    department: tender.issuingOrg || tender.ministryDepartment || 'Ministry of Commerce and Industry',
    category: tender.category || 'General Procurement',
    location: tender.location || 'Pan India',
    estimated_value_cr: tender.estimatedValueCr,
    deadline: tender.closingDate,
    published_date: tender.publishedDate,
    scope_of_work: tender.scopeOfWork,
    eligibility_requirements: tender.eligibilityCriteria,
    required_documents: tender.requiredDocuments,
    status: tender.status || 'Active',
    created_by: tender.createdBy || 'officer-001',
    updated_at: new Date().toISOString(),
  };
};

// Helper to map Supabase database row to frontend BidApplication interface
const mapRowToApplication = (row: any): BidApplication => {
  const appData = row.application_data || {};
  return {
    id: row.id,
    tenderId: row.tender_id,
    tenderTitle: row.tender_title || appData.tenderTitle || 'Procurement Tender',
    bidderId: row.bidder_id,
    bidderName: row.bidder_name || appData.bidderName || 'Registered Vendor',
    status: row.status || 'Submitted',
    bidderInfo: appData.bidderInfo || {
      companyName: row.bidder_name || 'ABC Technologies Pvt. Ltd.',
      pan: 'AABCA9812M',
      gstin: '07AABCA9812M1Z3',
      udyamNumber: 'UDYAM-DL-01-0019284',
      address: 'Plot 42, Okhla Industrial Area Phase III, New Delhi - 110020',
      contactEmail: 'procurement@abctechnologies.com',
      contactPhone: '+91 11 4567 8900',
    },
    businessQualification: appData.businessQualification || {
      yearsOfExperience: 8,
      annualTurnoverCr: 45.5,
      employeeCount: 240,
      pastGovtProjectsCount: 14,
      relevantProjectExperience: 'Established commercial execution capability with required technical SLAs and warranty support.',
    },
    complianceDeclaration: appData.complianceDeclaration || {
      gstStatus: 'Active',
      panStatus: 'Valid',
      udyamStatus: 'Registered',
      startupIndiaStatus: 'Not Applicable',
      nsicStatus: 'Not Applicable',
      epfoStatus: 'Compliant',
      esicStatus: 'Compliant',
      makeInIndiaDeclared: true,
      localContentPercentage: 65,
      oemAuthorizationDeclared: true,
    },
    financialBid: appData.financialBid || {
      quotedAmountCr: Number(row.quoted_amount) || 10.0,
      taxAmountCr: Number(row.quoted_amount ? (Number(row.quoted_amount) * 0.18).toFixed(2) : 1.8),
      totalBidAmountCr: Number(row.quoted_amount ? (Number(row.quoted_amount) * 1.18).toFixed(2) : 11.8),
      priceValidityDays: 90,
    },
    documents: Array.isArray(appData.documents) ? appData.documents : [],
    declarationsAccepted: Boolean(appData.declarationsAccepted),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    submittedAt: row.submitted_at || row.created_at,
    bidId: appData.bidId || row.id,
  };
};

// Helper to map BidApplication into Bid for Officer View
export const mapApplicationToBid = (app: BidApplication, row?: any): Bid => {
  const quoted = app.financialBid?.quotedAmountCr || Number(row?.quoted_amount) || 10.0;
  const tax = app.financialBid?.taxAmountCr || +(quoted * 0.18).toFixed(2);
  const total = app.financialBid?.totalBidAmountCr || +(quoted + tax).toFixed(2);
  const submittedDate = app.submittedAt ? app.submittedAt.split('T')[0] : new Date().toISOString().split('T')[0];

  return {
    id: app.bidId || app.id,
    applicationId: app.id,
    tenderId: app.tenderId,
    tenderTitle: app.tenderTitle,
    bidderId: app.bidderId,
    bidderName: app.bidderName || app.bidderInfo?.companyName || 'Registered Vendor',
    submissionDate: submittedDate,
    submissionTime: '11:00 AM IST',
    eligibilityStatus: 'Eligible',
    bidStatus: (row?.status || app.status || 'Submitted') as any,
    verificationStatus: (row?.status === 'Qualified' || row?.status === 'Disqualified') ? 'Verified' : 'Pending',
    documentStatus: 'Submitted',
    quotedAmount: quoted,
    taxAmount: tax,
    totalAmount: total,
    localContentDeclaredPct: app.complianceDeclaration?.localContentPercentage || 65,
    remarks: `Electronic application packet for ${app.tenderId}. Quoted ₹ ${quoted.toFixed(2)} Cr.`,
    documentsSubmitted: (app.documents || []).map((doc) => ({
      name: doc.documentName,
      type: doc.fileType || 'Statutory Document',
      fileName: doc.fileName || `${doc.documentName.replace(/\s+/g, '_')}.pdf`,
      fileSize: doc.fileSize || '1.2 MB',
      fileDataUrl: doc.fileDataUrl,
      verified: doc.status === 'Uploaded',
    })),
    offeredValueCr: quoted,
    submittedAt: app.submittedAt || new Date().toISOString(),
    complianceScore: row?.compliance_score !== undefined ? Number(row.compliance_score) : 91,
    riskLevel: row?.risk_level || 'Low',
  };
};

// -----------------------------------------------------------------------------
// Tenders Service (Cloud + Cache)
// -----------------------------------------------------------------------------

/**
 * Fetch tenders from Supabase if configured; otherwise use cached/localStorage tenders.
 */
export const fetchTenders = async (): Promise<Tender[]> => {
  if (!supabase) {
    return getLocalTenders();
  }

  try {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch tenders failed, using local cache:', error.message);
      return getLocalTenders();
    }

    if (data && data.length > 0) {
      const mapped = data.map(mapRowToTender);
      // Synchronize local cache
      try {
        localStorage.setItem(STORAGE_KEYS.TENDERS, JSON.stringify(mapped));
      } catch {}
      return mapped;
    }

    // If cloud database is empty, seed initial tenders automatically
    await seedInitialTendersIfEmpty();
    return getLocalTenders();
  } catch (err) {
    console.warn('Supabase fetch error, fallback to local storage:', err);
    return getLocalTenders();
  }
};

/**
 * Fetch a single tender by ID from Supabase or local cache
 */
export const fetchTenderById = async (tenderId: string): Promise<Tender | null> => {
  if (!supabase) {
    const list = getLocalTenders();
    return list.find((t) => t.id === tenderId) || null;
  }

  try {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .or(`id.eq.${tenderId},tender_number.eq.${tenderId}`)
      .maybeSingle();

    if (error || !data) {
      const list = getLocalTenders();
      return list.find((t) => t.id === tenderId) || null;
    }

    return mapRowToTender(data);
  } catch {
    const list = getLocalTenders();
    return list.find((t) => t.id === tenderId) || null;
  }
};

/**
 * Publish a new tender directly to Supabase cloud database
 */
export const publishTender = async (tender: Tender): Promise<{ success: boolean; tender: Tender; error?: string }> => {
  // Always update local cache first
  const localList = getLocalTenders();
  const existingIdx = localList.findIndex((t) => t.id === tender.id);
  if (existingIdx >= 0) {
    localList[existingIdx] = tender;
  } else {
    localList.unshift(tender);
  }
  try {
    localStorage.setItem(STORAGE_KEYS.TENDERS, JSON.stringify(localList));
  } catch {}

  if (!supabase) {
    return { success: true, tender };
  }

  try {
    const row = mapTenderToRow(tender);
    const { error } = await supabase.from('tenders').upsert(row);

    if (error) {
      console.error('Failed to publish tender to Supabase:', error.message);
      return { success: false, tender, error: error.message };
    }

    return { success: true, tender };
  } catch (err: any) {
    console.error('Supabase tender publish exception:', err);
    return { success: false, tender, error: err.message || 'Database connection failure' };
  }
};

/**
 * Update an existing tender in Supabase
 */
export const updateTenderInCloud = async (tender: Tender): Promise<boolean> => {
  // Update local cache
  const localList = getLocalTenders();
  const idx = localList.findIndex((t) => t.id === tender.id);
  if (idx >= 0) {
    localList[idx] = tender;
    try {
      localStorage.setItem(STORAGE_KEYS.TENDERS, JSON.stringify(localList));
    } catch {}
  }

  if (!supabase) return true;

  try {
    const row = mapTenderToRow(tender);
    const { error } = await supabase.from('tenders').update(row).eq('id', tender.id);
    if (error) {
      console.error('Supabase update tender error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase update exception:', err);
    return false;
  }
};

// -----------------------------------------------------------------------------
// Applications & Bids Service (Cloud + Cache)
// -----------------------------------------------------------------------------

/**
 * Check if a bidder has already submitted an application for a specific tender
 */
export const checkDuplicateApplication = async (
  tenderId: string,
  bidderId: string
): Promise<boolean> => {
  // Check local storage first
  const localApps = getLocalApplications();
  const duplicateLocal = localApps.some(
    (a) => a.tenderId === tenderId && a.bidderId === bidderId && a.status === 'Submitted'
  );
  if (duplicateLocal) return true;

  if (!supabase) return false;

  try {
    const { data, error } = await supabase
      .from('applications')
      .select('id, status')
      .eq('tender_id', tenderId)
      .eq('bidder_id', bidderId)
      .eq('status', 'Submitted')
      .maybeSingle();

    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
};

/**
 * Fetch applications from Supabase (optionally filtered by bidderId)
 */
export const fetchApplications = async (bidderId?: string): Promise<BidApplication[]> => {
  if (!supabase) {
    const apps = getLocalApplications();
    return bidderId ? apps.filter((a) => a.bidderId === bidderId) : apps;
  }

  try {
    let query = supabase.from('applications').select('*').order('created_at', { ascending: false });
    if (bidderId) {
      query = query.eq('bidder_id', bidderId);
    }

    const { data, error } = await query;
    if (error || !data) {
      const apps = getLocalApplications();
      return bidderId ? apps.filter((a) => a.bidderId === bidderId) : apps;
    }

    const mapped = data.map(mapRowToApplication);

    // Sync to local cache
    try {
      const currentLocal = getLocalApplications();
      const mergedMap = new Map<string, BidApplication>();
      mapped.forEach((a) => mergedMap.set(a.id, a));
      currentLocal.forEach((a) => {
        if (!mergedMap.has(a.id)) mergedMap.set(a.id, a);
      });
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(Array.from(mergedMap.values())));
    } catch {}

    return mapped;
  } catch {
    const apps = getLocalApplications();
    return bidderId ? apps.filter((a) => a.bidderId === bidderId) : apps;
  }
};

/**
 * Fetch all bids from Supabase (for Officer Portal)
 */
export const fetchBidsForOfficer = async (): Promise<Bid[]> => {
  if (!supabase) {
    return getLocalBids();
  }

  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .neq('status', 'Draft')
      .order('submitted_at', { ascending: false });

    if (error || !data) {
      return getLocalBids();
    }

    const mappedBids: Bid[] = data.map((row) => {
      const app = mapRowToApplication(row);
      return mapApplicationToBid(app, row);
    });

    // Merge and sync local bids cache
    try {
      const localBids = getLocalBids();
      const bidMap = new Map<string, Bid>();
      mappedBids.forEach((b) => bidMap.set(b.id, b));
      localBids.forEach((b) => {
        if (!bidMap.has(b.id)) bidMap.set(b.id, b);
      });
      localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(Array.from(bidMap.values())));
    } catch {}

    return mappedBids;
  } catch {
    return getLocalBids();
  }
};

/**
 * Submit an application to Supabase cloud database
 */
export const submitApplicationToCloud = async (
  application: BidApplication
): Promise<{ success: boolean; bidId?: string; error?: string }> => {
  const isDuplicate = await checkDuplicateApplication(application.tenderId, application.bidderId);
  if (isDuplicate) {
    return {
      success: false,
      error: `An application has already been submitted by your organization for tender ${application.tenderId}. Duplicate submissions are strictly prevented.`,
    };
  }

  const now = new Date().toISOString();
  const bidId = application.bidId || `BID-2026-0${800 + Math.floor(Math.random() * 100) + 1}`;

  // 1. Prepare application row
  const row = {
    id: application.id,
    tender_id: application.tenderId,
    bidder_id: application.bidderId,
    bidder_name: application.bidderName || application.bidderInfo?.companyName,
    tender_title: application.tenderTitle,
    quoted_amount: application.financialBid.quotedAmountCr,
    application_data: {
      ...application,
      status: 'Submitted',
      submittedAt: now,
      bidId,
    },
    status: 'Submitted',
    compliance_score: 91,
    risk_level: 'Low',
    submitted_at: now,
    updated_at: now,
  };

  // 2. Prepare document rows
  const documentRows = (application.documents || []).map((doc) => ({
    application_id: application.id,
    document_type: doc.documentName,
    file_name: doc.fileName || `${doc.documentName.replace(/\s+/g, '_')}.pdf`,
    file_size: doc.fileSize || '1.2 MB',
    file_path: doc.fileDataUrl ? 'data-url-stored' : undefined,
    verification_status: doc.status === 'Uploaded' ? 'Verified' : 'Pending',
  }));

  // Update local cache
  const localApps = getLocalApplications();
  const existingAppIdx = localApps.findIndex((a) => a.id === application.id);
  const updatedApp: BidApplication = {
    ...application,
    status: 'Submitted',
    submittedAt: now,
    bidId,
  };
  if (existingAppIdx >= 0) {
    localApps[existingAppIdx] = updatedApp;
  } else {
    localApps.unshift(updatedApp);
  }
  try {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(localApps));
  } catch {}

  // Save corresponding bid locally for verification engine
  const generatedBid = mapApplicationToBid(updatedApp, row);
  const localBids = getLocalBids();
  localBids.unshift(generatedBid);
  try {
    localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(localBids));
  } catch {}

  if (!supabase) {
    return { success: true, bidId };
  }

  try {
    // Write application record
    const { error: appError } = await supabase.from('applications').upsert(row);
    if (appError) {
      console.error('Supabase application submission error:', appError.message);
      return { success: false, error: appError.message };
    }

    // Write documents if any
    if (documentRows.length > 0) {
      const { error: docError } = await supabase.from('application_documents').insert(documentRows);
      if (docError) {
        console.warn('Supabase documents insert warning:', docError.message);
      }
    }

    return { success: true, bidId };
  } catch (err: any) {
    console.error('Supabase application submission exception:', err);
    return { success: false, error: err.message || 'Database error' };
  }
};

/**
 * Update an application status in Supabase (e.g. Officer determines Qualified/Disqualified/Clarification)
 */
export const updateApplicationStatus = async (
  applicationIdOrBidId: string,
  newStatus: 'Qualified' | 'Disqualified' | 'Clarification Requested' | 'Under Review' | 'Submitted',
  remarks?: string
): Promise<boolean> => {
  // Update local cache first
  const localApps = getLocalApplications();
  const appIdx = localApps.findIndex(
    (a) => a.id === applicationIdOrBidId || a.bidId === applicationIdOrBidId
  );
  if (appIdx >= 0) {
    localApps[appIdx].status = newStatus as any;
    localApps[appIdx].updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(localApps));
    } catch {}
  }

  const localBids = getLocalBids();
  const bidIdx = localBids.findIndex(
    (b) => b.id === applicationIdOrBidId || b.applicationId === applicationIdOrBidId
  );
  if (bidIdx >= 0) {
    localBids[bidIdx].bidStatus = newStatus as any;
    if (remarks) {
      localBids[bidIdx].remarks = remarks;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(localBids));
    } catch {}
  }

  if (!supabase) return true;

  try {
    const targetId = appIdx >= 0 ? localApps[appIdx].id : applicationIdOrBidId;
    const { error } = await supabase
      .from('applications')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${targetId},id.eq.${applicationIdOrBidId}`);

    if (error) {
      console.error('Supabase update application status error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase update status exception:', err);
    return false;
  }
};

// -----------------------------------------------------------------------------
// Realtime Subscriptions
// -----------------------------------------------------------------------------

/**
 * Subscribe to realtime changes on tenders
 */
export const subscribeToTenders = (callback: () => void): (() => void) => {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('realtime_tenders_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tenders' },
      () => {
        callback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to realtime changes on applications
 */
export const subscribeToApplications = (callback: () => void): (() => void) => {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('realtime_applications_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'applications' },
      () => {
        callback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// -----------------------------------------------------------------------------
// Initial Cloud Seeding Helper
// -----------------------------------------------------------------------------
export const seedInitialTendersIfEmpty = async (): Promise<void> => {
  if (!supabase) return;

  try {
    const { count, error } = await supabase
      .from('tenders')
      .select('*', { count: 'exact', head: true });

    if (error || (count !== null && count > 0)) {
      return;
    }

    console.log('Seeding initial procurement tenders to Supabase...');
    const rows = INITIAL_TENDERS.map(mapTenderToRow);
    await supabase.from('tenders').insert(rows);
  } catch (err) {
    console.warn('Could not auto-seed tenders to Supabase:', err);
  }
};

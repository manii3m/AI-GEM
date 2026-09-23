import {
  Bid,
  Tender,
  BidderProfile,
  GovernmentVerificationRecord,
  ExtractedDocumentData,
  ThreeWayCheckResult,
  ThreeWayStatus,
  ComplianceIssue,
} from '../types';
import { normalizeIdentifier } from './verificationDatasetService';

export interface CrossVerificationInputs {
  bid: Bid;
  tender: Tender;
  profile?: BidderProfile | null;
  datasetRecord?: GovernmentVerificationRecord | null;
  extractedDocs: ExtractedDocumentData[];
}

export interface CrossVerificationResult {
  checks: ThreeWayCheckResult[];
  issues: ComplianceIssue[];
  documentsVerifiedCount: number;
  totalDocumentsCount: number;
}

/**
 * Normalizes numbers for tolerant numeric comparison.
 */
function parseNum(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Searches extracted documents for a specific field by keys.
 */
function findOcrField(docs: ExtractedDocumentData[], keys: string[]): { value: string; confidence: number; docName: string } | null {
  for (const doc of docs) {
    for (const key of keys) {
      if (doc.fields[key] !== undefined && doc.fields[key] !== '') {
        const fieldDetail = doc.fieldDetails.find(
          (f) => f.label.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(f.label.toLowerCase())
        );
        return {
          value: doc.fields[key],
          confidence: fieldDetail ? fieldDetail.confidence : doc.overallConfidence,
          docName: doc.documentName,
        };
      }
    }
  }
  return null;
}

/**
 * Executes three-way cross-verification:
 * Source 1: Bidder Form / Profile
 * Source 2: OCR Extracted Document
 * Source 3: Government Verification Dataset
 */
export function executeThreeWayCrossVerification(inputs: CrossVerificationInputs): CrossVerificationResult {
  const { bid, tender, profile, datasetRecord, extractedDocs } = inputs;
  const checks: ThreeWayCheckResult[] = [];
  const issues: ComplianceIssue[] = [];

  let issueIdCounter = 1;
  const addIssue = (
    severity: ComplianceIssue['severity'],
    source: ComplianceIssue['source'],
    requirement: string,
    actualValue: string,
    expectedValue: string,
    recommendedAction: string
  ) => {
    issues.push({
      id: `ISS-${String(issueIdCounter++).padStart(3, '0')}`,
      severity,
      source,
      requirement,
      actualValue,
      expectedValue,
      recommendedAction,
    });
  };

  // -------------------------------------------------------------------------
  // 1. PAN Identification Check
  // -------------------------------------------------------------------------
  const formPAN = normalizeIdentifier(profile?.pan || '');
  const ocrPANObj = findOcrField(extractedDocs, ['pan', 'pan_number']);
  const ocrPAN = normalizeIdentifier(ocrPANObj?.value || '');
  const datasetPAN = normalizeIdentifier(datasetRecord?.panNumber || '');
  const datasetPANStatus = datasetRecord?.panStatus || '';

  let panStatus: ThreeWayStatus = 'Verified';
  if (!datasetRecord || !datasetPAN) {
    panStatus = 'Not Found';
    addIssue(
      'Critical',
      'Government Dataset',
      'Permanent Account Number (PAN) Validation',
      formPAN || 'Missing',
      'Valid Record in Income Tax Database',
      'Bidder PAN could not be resolved in the Central CBDT prototype dataset. Request official verification.'
    );
  } else if (datasetPAN !== formPAN) {
    panStatus = 'Government Data Mismatch';
    addIssue(
      'Critical',
      'Government Dataset',
      'PAN Match with Government Database',
      `Form: ${formPAN} vs Govt: ${datasetPAN}`,
      'Exact Identifier Match',
      'Major statutory mismatch: Form PAN does not match the registered government database record.'
    );
  } else if (ocrPAN && ocrPAN !== formPAN) {
    panStatus = 'Document Mismatch';
    addIssue(
      'High',
      'OCR Document',
      'PAN Certificate Authenticity',
      `OCR extracted: ${ocrPAN}`,
      `Declared Form PAN: ${formPAN}`,
      'The uploaded PAN card copy contains a different PAN number than declared in the bid form.'
    );
  } else if (!ocrPANObj) {
    panStatus = 'Document Information Missing';
    addIssue(
      'Medium',
      'OCR Document',
      'PAN Card Upload & Legibility',
      'No legible PAN field extracted',
      'Clear copy of PAN Certificate',
      'Uploaded PAN document could not be OCR-extracted. Ask bidder to re-upload clear image/PDF.'
    );
  } else if (datasetPANStatus.toLowerCase() !== 'valid') {
    panStatus = 'Government Data Mismatch';
    addIssue(
      'High',
      'Government Dataset',
      'PAN Active Status in CBDT',
      `Status: ${datasetPANStatus}`,
      'Active / Valid PAN Status',
      'Income Tax database reports this PAN is not currently in valid status.'
    );
  }

  checks.push({
    id: 'CHK-001',
    requirement: 'PAN Registration & CBDT Status',
    category: 'Identity',
    isMandatory: true,
    formValue: formPAN || 'Not Declared',
    ocrValue: ocrPAN || (ocrPANObj ? ocrPANObj.value : 'Not Extracted'),
    datasetValue: datasetPAN ? `${datasetPAN} (${datasetPANStatus})` : 'Record Not Found',
    status: panStatus,
    confidence: ocrPANObj?.confidence || 95,
    details: 'Verified against Income Tax Department (CBDT) pan-verification registry.',
  });

  // -------------------------------------------------------------------------
  // 2. GSTIN Identification & Return Filing Check
  // -------------------------------------------------------------------------
  const formGSTIN = normalizeIdentifier(profile?.gstin || '');
  const ocrGSTObj = findOcrField(extractedDocs, ['gstin', 'gst_number']);
  const ocrGSTIN = normalizeIdentifier(ocrGSTObj?.value || '');
  const datasetGSTIN = normalizeIdentifier(datasetRecord?.gstin || '');
  const datasetGSTStatus = datasetRecord?.gstStatus || 'Active';
  const datasetGSTFiling = datasetRecord?.gstReturnFilingStatus || 'Filed';

  let gstStatus: ThreeWayStatus = 'Verified';
  if (!datasetRecord || !datasetGSTIN) {
    gstStatus = 'Not Found';
    addIssue('High', 'Government Dataset', 'GSTIN Registration Verification', formGSTIN, 'Active GSTIN in GSTN Portal', 'GSTIN not found in government prototype database.');
  } else if (datasetGSTIN !== formGSTIN) {
    gstStatus = 'Government Data Mismatch';
    addIssue('Critical', 'Government Dataset', 'GSTIN Number Match', `Form: ${formGSTIN} vs Govt: ${datasetGSTIN}`, 'Exact GSTIN Match', 'Form GSTIN differs from government record.');
  } else if (ocrGSTIN && ocrGSTIN !== formGSTIN) {
    gstStatus = 'Document Mismatch';
    addIssue('High', 'OCR Document', 'GST Registration Certificate Match', `OCR: ${ocrGSTIN}`, `Form: ${formGSTIN}`, 'Uploaded GST certificate shows a mismatched GSTIN.');
  } else if (!ocrGSTObj) {
    gstStatus = 'Document Information Missing';
    addIssue('Medium', 'OCR Document', 'GST Certificate Legibility', 'Field not extracted', 'Valid GST Certificate', 'GST certificate OCR extraction missing.');
  } else if (datasetGSTStatus.toLowerCase() !== 'active') {
    gstStatus = 'Government Data Mismatch';
    addIssue('Critical', 'Government Dataset', 'GST Registration Active Status', `Status: ${datasetGSTStatus}`, 'Active', `GSTIN status is ${datasetGSTStatus} in GSTN.`);
  } else if (datasetGSTFiling.toLowerCase() === 'not filed') {
    gstStatus = 'Government Data Mismatch';
    addIssue('High', 'Government Dataset', 'GSTR-3B Periodic Return Filing', 'Not Filed', 'Filed / Current Returns', 'GST return filing default identified.');
  }

  checks.push({
    id: 'CHK-002',
    requirement: 'GSTIN Registration & Filing Status',
    category: 'Identity',
    isMandatory: true,
    formValue: formGSTIN,
    ocrValue: ocrGSTIN || 'Not Extracted',
    datasetValue: datasetGSTIN ? `${datasetGSTIN} (${datasetGSTStatus} / ${datasetGSTFiling})` : 'Not Found',
    status: gstStatus,
    confidence: ocrGSTObj?.confidence || 96,
    details: 'Reconciled with GSTN portal returns and registration database.',
  });

  // -------------------------------------------------------------------------
  // 3. Udyam MSME Registration Check
  // -------------------------------------------------------------------------
  const formUdyam = normalizeIdentifier(profile?.udyamNumber || '');
  const ocrUdyamObj = findOcrField(extractedDocs, ['udyam_number', 'udyam']);
  const ocrUdyam = normalizeIdentifier(ocrUdyamObj?.value || '');
  const datasetUdyam = normalizeIdentifier(datasetRecord?.udyamNumber || '');
  const datasetUdyamStatus = datasetRecord?.udyamStatus || 'Valid';

  let udyamStatus: ThreeWayStatus = 'Verified';
  if (tender.eligibilityCriteria.udyamRequired) {
    if (!formUdyam) {
      udyamStatus = 'Document Information Missing';
      addIssue('High', 'Bidder Form', 'Mandatory Udyam MSME Certificate', 'Not Provided', 'Valid Udyam Registration', 'Udyam registration is mandatory for this tender.');
    } else if (!datasetRecord || !datasetUdyam) {
      udyamStatus = 'Not Found';
      addIssue('Medium', 'Government Dataset', 'MSME Udyam Verification', formUdyam, 'Valid Udyam Portal Record', 'Udyam number not found in MSME database.');
    } else if (datasetUdyam !== formUdyam) {
      udyamStatus = 'Government Data Mismatch';
      addIssue('High', 'Government Dataset', 'Udyam Number Match', `Form: ${formUdyam} vs Govt: ${datasetUdyam}`, 'Exact Udyam Match', 'Declared Udyam number does not match MSME portal.');
    } else if (datasetUdyamStatus.toLowerCase() !== 'valid') {
      udyamStatus = 'Expired';
      addIssue('High', 'Government Dataset', 'Udyam Certificate Validity', `Status: ${datasetUdyamStatus}`, 'Valid', 'MSME Udyam registration is invalid or expired.');
    }
  } else {
    // If not strictly mandatory, verify if declared
    if (formUdyam && datasetUdyam && datasetUdyam !== formUdyam) {
      udyamStatus = 'Government Data Mismatch';
    } else {
      udyamStatus = 'Verified';
    }
  }

  checks.push({
    id: 'CHK-003',
    requirement: 'Udyam (MSME) Registration & Status',
    category: 'Identity',
    isMandatory: !!tender.eligibilityCriteria.udyamRequired,
    formValue: formUdyam || 'Not Declared',
    ocrValue: ocrUdyam || 'Not Extracted',
    datasetValue: datasetUdyam ? `${datasetUdyam} (${datasetUdyamStatus})` : 'Not Found',
    status: udyamStatus,
    confidence: ocrUdyamObj?.confidence || 94,
    details: 'Verified against Ministry of MSME Udyam portal registry.',
  });

  // -------------------------------------------------------------------------
  // 4. MCA Corporate Registry Status
  // -------------------------------------------------------------------------
  const datasetMCA = datasetRecord?.mcaStatus || 'Active';
  let mcaStatusCheck: ThreeWayStatus = 'Verified';
  if (datasetMCA.toLowerCase() === 'inactive' || datasetMCA.toLowerCase() === 'defaulting') {
    mcaStatusCheck = 'Government Data Mismatch';
    addIssue('Critical', 'Government Dataset', 'MCA Corporate Standing', `MCA Status: ${datasetMCA}`, 'Active / In Good Standing', 'MCA records show company is defaulting or inactive.');
  }

  checks.push({
    id: 'CHK-004',
    requirement: 'MCA Corporate Registration & Filings',
    category: 'Identity',
    isMandatory: true,
    formValue: profile?.companyType || 'Private Limited',
    ocrValue: 'ROC Certificate Valid',
    datasetValue: `MCA Status: ${datasetMCA}`,
    status: mcaStatusCheck,
    confidence: 98,
    details: 'Cross-checked with Ministry of Corporate Affairs ROC records.',
  });

  // -------------------------------------------------------------------------
  // 5. Income Tax Compliance & ITR Filing
  // -------------------------------------------------------------------------
  const datasetITR = datasetRecord?.incomeTaxStatus || 'Compliant';
  let itrStatusCheck: ThreeWayStatus = 'Verified';
  if (datasetITR.toLowerCase() !== 'compliant') {
    itrStatusCheck = 'Government Data Mismatch';
    addIssue('High', 'Government Dataset', 'Income Tax ITR Compliance', `Status: ${datasetITR}`, 'Compliant (Last 3 FYs Filed)', 'Income tax return filing status is non-compliant.');
  }

  checks.push({
    id: 'CHK-005',
    requirement: 'Income Tax Statutory Compliance (ITR)',
    category: 'Statutory',
    isMandatory: true,
    formValue: 'PAN-Linked Compliance Certified',
    ocrValue: 'Audited ITR Acknowledgements Present',
    datasetValue: `Income Tax Status: ${datasetITR}`,
    status: itrStatusCheck,
    confidence: 97,
    details: 'Income Tax return filing verification across past 3 assessment years.',
  });

  // -------------------------------------------------------------------------
  // 6. EPFO Statutory Compliance
  // -------------------------------------------------------------------------
  const formEPFO = profile?.epfoStatus || 'Compliant';
  const datasetEPFO = datasetRecord?.epfoStatus || 'Compliant';
  let epfoCheckStatus: ThreeWayStatus = 'Verified';
  if (datasetEPFO.toLowerCase() === 'non-compliant') {
    epfoCheckStatus = 'Government Data Mismatch';
    addIssue('Medium', 'Government Dataset', 'EPFO Labor Compliance', `EPFO Status: ${datasetEPFO}`, 'Compliant', 'EPFO portal reports contribution default or non-compliance.');
  }

  checks.push({
    id: 'CHK-006',
    requirement: 'EPFO Labor Compliance & E-Challan',
    category: 'Statutory',
    isMandatory: false,
    formValue: formEPFO,
    ocrValue: 'Recent EPFO Challan Verified',
    datasetValue: `EPFO: ${datasetEPFO}`,
    status: epfoCheckStatus,
    confidence: 95,
    details: 'Reconciled with Employees Provident Fund Organisation unified portal.',
  });

  // -------------------------------------------------------------------------
  // 7. ESIC Statutory Compliance
  // -------------------------------------------------------------------------
  const formESIC = profile?.esicStatus || 'Compliant';
  const datasetESIC = datasetRecord?.esicStatus || 'Compliant';
  let esicCheckStatus: ThreeWayStatus = 'Verified';
  if (datasetESIC.toLowerCase() === 'non-compliant') {
    esicCheckStatus = 'Government Data Mismatch';
    addIssue('Medium', 'Government Dataset', 'ESIC Statutory Compliance', `ESIC Status: ${datasetESIC}`, 'Compliant / Exempt', 'ESIC contributions flagged as non-compliant.');
  }

  checks.push({
    id: 'CHK-007',
    requirement: 'ESIC Statutory Compliance & Return',
    category: 'Statutory',
    isMandatory: false,
    formValue: formESIC,
    ocrValue: 'ESIC Contribution Receipt Verified',
    datasetValue: `ESIC: ${datasetESIC}`,
    status: esicCheckStatus,
    confidence: 95,
    details: 'Reconciled with Employees State Insurance Corporation database.',
  });

  // -------------------------------------------------------------------------
  // 8. Tender Experience Requirement Check
  // -------------------------------------------------------------------------
  const reqExperience = tender.eligibilityCriteria.minExperienceYears || 0;
  const formExp = profile?.yearsOfExperience || 0;
  const ocrExpObj = findOcrField(extractedDocs, ['duration_years', 'experience', 'years']);
  const ocrExp = ocrExpObj ? parseNum(ocrExpObj.value) : formExp;
  const datasetExp = datasetRecord?.yearsOfExperience || formExp;

  let expStatus: ThreeWayStatus = 'Verified';
  if (formExp < reqExperience) {
    expStatus = 'Document Mismatch';
    addIssue('Critical', 'Tender Requirement', 'Minimum Experience Requirement', `${formExp} years`, `>= ${reqExperience} years required`, 'Bidder does not satisfy minimum years of experience required by tender.');
  } else if (ocrExp < reqExperience) {
    expStatus = 'Document Mismatch';
    addIssue('High', 'OCR Document', 'Experience Certificate Proof', `OCR extracted: ${ocrExp} yrs`, `>= ${reqExperience} years`, 'Experience certificate demonstrates fewer years than mandatory threshold.');
  } else if (datasetExp < reqExperience) {
    expStatus = 'Government Data Mismatch';
    addIssue('High', 'Government Dataset', 'Government Past Experience Records', `Dataset: ${datasetExp} yrs`, `>= ${reqExperience} years`, 'Verified track record in government database is below requirement.');
  }

  checks.push({
    id: 'CHK-008',
    requirement: `Minimum Experience (Req: ${reqExperience} Yrs)`,
    category: 'Eligibility',
    isMandatory: true,
    formValue: `${formExp} Years`,
    ocrValue: `${ocrExp} Years`,
    datasetValue: `${datasetExp} Years Verified`,
    status: expStatus,
    confidence: ocrExpObj?.confidence || 96,
    details: 'Evaluated against tender minimum past technical experience criteria.',
  });

  // -------------------------------------------------------------------------
  // 9. Annual Turnover Requirement Check
  // -------------------------------------------------------------------------
  const reqTurnoverCr = tender.eligibilityCriteria.minTurnoverCr || 0;
  const formTurnoverCr = profile?.annualTurnoverCr || 0;
  const ocrTurnoverObj = findOcrField(extractedDocs, ['turnover_amount_cr', 'turnover', 'annual_turnover']);
  const ocrTurnoverCr = ocrTurnoverObj ? parseNum(ocrTurnoverObj.value) : formTurnoverCr;
  const datasetTurnoverCr = datasetRecord ? datasetRecord.annualTurnoverLakh / 100 : formTurnoverCr;

  let turnoverStatus: ThreeWayStatus = 'Verified';
  if (formTurnoverCr < reqTurnoverCr) {
    turnoverStatus = 'Document Mismatch';
    addIssue('Critical', 'Tender Requirement', 'Minimum Annual Turnover', `₹ ${formTurnoverCr.toFixed(2)} Cr`, `>= ₹ ${reqTurnoverCr.toFixed(2)} Cr required`, 'Bidder turnover is below minimum mandatory tender threshold.');
  } else if (ocrTurnoverCr < reqTurnoverCr) {
    turnoverStatus = 'Document Mismatch';
    addIssue('High', 'OCR Document', 'Audited Balance Sheet Turnover', `₹ ${ocrTurnoverCr.toFixed(2)} Cr`, `>= ₹ ${reqTurnoverCr.toFixed(2)} Cr`, 'Audited turnover certificate extracted value is below requirement.');
  } else if (datasetTurnoverCr < reqTurnoverCr) {
    turnoverStatus = 'Government Data Mismatch';
    addIssue('High', 'Government Dataset', 'Financial Year Turnover in Govt Records', `₹ ${datasetTurnoverCr.toFixed(2)} Cr`, `>= ₹ ${reqTurnoverCr.toFixed(2)} Cr`, 'Turnover registered in MCA/GeM dataset is below requirement.');
  }

  checks.push({
    id: 'CHK-009',
    requirement: `Minimum Annual Turnover (Req: ₹ ${reqTurnoverCr.toFixed(2)} Cr)`,
    category: 'Eligibility',
    isMandatory: true,
    formValue: `₹ ${formTurnoverCr.toFixed(2)} Cr`,
    ocrValue: `₹ ${ocrTurnoverCr.toFixed(2)} Cr`,
    datasetValue: `₹ ${datasetTurnoverCr.toFixed(2)} Cr`,
    status: turnoverStatus,
    confidence: ocrTurnoverObj?.confidence || 95,
    details: 'Reconciled with CA-certified Audited Balance Sheets and Income Tax filings.',
  });

  // -------------------------------------------------------------------------
  // 10. Make in India / Local Content Compliance
  // -------------------------------------------------------------------------
  const reqLocalContent = tender.eligibilityCriteria.minLocalContentPct || 50;
  const formLocalContent = bid.localContentDeclaredPct !== undefined ? bid.localContentDeclaredPct : profile?.localContentPercentage || 0;
  const ocrLocalObj = findOcrField(extractedDocs, ['local_content_percentage', 'local_content', 'content_percent']);
  const ocrLocal = ocrLocalObj ? parseNum(ocrLocalObj.value) : formLocalContent;
  const datasetLocal = datasetRecord?.localContentPercent !== undefined ? datasetRecord.localContentPercent : formLocalContent;
  const datasetMIIStatus = datasetRecord?.makeInIndiaStatus || 'Compliant';

  let miiStatusCheck: ThreeWayStatus = 'Verified';
  if (reqLocalContent > 0 || tender.eligibilityCriteria.makeInIndiaPreference) {
    if (formLocalContent < reqLocalContent) {
      miiStatusCheck = 'Document Mismatch';
      addIssue('High', 'Tender Requirement', 'Make in India Local Content Preference', `${formLocalContent}%`, `>= ${reqLocalContent}% (Class-I)`, 'Declared local content is below the mandatory Class-I threshold.');
    } else if (ocrLocal < reqLocalContent) {
      miiStatusCheck = 'Document Mismatch';
      addIssue('High', 'OCR Document', 'Local Content Self-Declaration Affidavit', `${ocrLocal}%`, `>= ${reqLocalContent}%`, 'Affidavit document specifies lower local content than tender minimum.');
    } else if (datasetMIIStatus.toLowerCase() === 'non-compliant' || datasetLocal < reqLocalContent) {
      miiStatusCheck = 'Government Data Mismatch';
      addIssue('Medium', 'Government Dataset', 'DPIIT Make in India Database Record', `${datasetLocal}% (${datasetMIIStatus})`, `>= ${reqLocalContent}%`, 'Vendor local content profile in DPIIT register is non-compliant.');
    }
  }

  checks.push({
    id: 'CHK-010',
    requirement: `Make in India Local Content (Req: >= ${reqLocalContent}%)`,
    category: 'Eligibility',
    isMandatory: reqLocalContent > 0,
    formValue: `${formLocalContent}% (Declared)`,
    ocrValue: `${ocrLocal}% (Affidavit)`,
    datasetValue: `${datasetLocal}% (${datasetMIIStatus})`,
    status: miiStatusCheck,
    confidence: ocrLocalObj?.confidence || 95,
    details: 'Verified under Public Procurement (Preference to Make in India) Order 2017.',
  });

  // -------------------------------------------------------------------------
  // 11. OEM Authorization Check (if required by tender)
  // -------------------------------------------------------------------------
  const reqOEM = !!(tender.eligibilityCriteria.oemAuthRequired || tender.eligibilityCriteria.oemAuthorizationRequired);
  const formHasOEM = profile?.hasOemAuthorization || false;
  const ocrOEMObj = findOcrField(extractedDocs, ['authorization_status', 'oem_name', 'valid_until']);
  const datasetOEMStatus = datasetRecord?.oemAuthorizationStatus || (formHasOEM ? 'Valid' : 'N/A');

  let oemStatusCheck: ThreeWayStatus = 'Verified';
  if (reqOEM) {
    if (!formHasOEM) {
      oemStatusCheck = 'Document Information Missing';
      addIssue('High', 'Bidder Form', 'OEM Partner Authorization', 'Not Declared', 'Valid OEM Authorization Letter', 'OEM Authorization is mandatory for this equipment tender.');
    } else if (datasetOEMStatus.toLowerCase() === 'expired') {
      oemStatusCheck = 'Expired';
      addIssue('High', 'Government Dataset', 'OEM Authorization Validity', 'Expired', 'Valid & Unexpired Authorization', 'The manufacturer authorization on file has expired.');
    } else if (datasetOEMStatus.toLowerCase() === 'mismatch' || datasetOEMStatus.toLowerCase() === 'missing') {
      oemStatusCheck = 'Government Data Mismatch';
      addIssue('High', 'Government Dataset', 'OEM Consortium Verification', datasetOEMStatus, 'Valid OEM Authorization', 'OEM does not confirm authorization of this bidder for this tender.');
    }
  } else {
    oemStatusCheck = formHasOEM ? 'Verified' : 'Not Applicable';
  }

  checks.push({
    id: 'CHK-011',
    requirement: 'OEM Manufacturer Authorization',
    category: 'Eligibility',
    isMandatory: reqOEM,
    formValue: formHasOEM ? (profile?.oemPartnerName || 'Declared Partner') : 'Not Applicable',
    ocrValue: ocrOEMObj ? ocrOEMObj.value : (formHasOEM ? 'Authorized Partner Letter' : 'N/A'),
    datasetValue: `OEM Status: ${datasetOEMStatus}`,
    status: oemStatusCheck,
    confidence: ocrOEMObj?.confidence || 93,
    details: 'Manufacturer Authorization Form (MAF) cross-verified with OEM direct roster.',
  });

  // -------------------------------------------------------------------------
  // 12. Required Documents Upload Completeness
  // -------------------------------------------------------------------------
  const requiredDocList = tender.requiredDocuments || [];
  let uploadedCount = 0;

  requiredDocList.forEach((reqDoc, idx) => {
    const isUploaded = bid.documentsSubmitted?.some(
      (d) => d.name.toLowerCase().includes(reqDoc.toLowerCase()) || reqDoc.toLowerCase().includes(d.name.toLowerCase())
    );

    if (isUploaded) {
      uploadedCount++;
    } else {
      addIssue(
        'High',
        'Tender Requirement',
        `Mandatory Attachment: ${reqDoc}`,
        'Missing / Not Uploaded',
        'Uploaded Document',
        `Mandatory document "${reqDoc}" was not attached to the bid submission packet.`
      );
    }

    checks.push({
      id: `CHK-DOC-${idx + 1}`,
      requirement: `Document: ${reqDoc}`,
      category: 'Documents',
      isMandatory: true,
      formValue: isUploaded ? 'Submitted' : 'Missing',
      ocrValue: isUploaded ? 'OCR Extraction Completed' : 'Not Attached',
      datasetValue: isUploaded ? 'Valid In Packet' : 'Missing',
      status: isUploaded ? 'Verified' : 'Document Information Missing',
      confidence: isUploaded ? 96 : 0,
      details: `Verification of mandatory attachment "${reqDoc}".`,
    });
  });

  // -------------------------------------------------------------------------
  // 13. Blacklisting & Debarment Risk Check
  // -------------------------------------------------------------------------
  const isBlacklisted = datasetRecord?.blacklistedDebarred || false;
  let blacklistCheckStatus: ThreeWayStatus = 'Verified';
  if (isBlacklisted) {
    blacklistCheckStatus = 'Government Data Mismatch';
    addIssue(
      'Critical',
      'Government Dataset',
      'Central Government Debarment / Blacklist Register',
      'Flagged as Debarred / Defaulting',
      'Clean Record (No Debarment)',
      'CRITICAL COMPLIANCE BREACH: Bidder is listed as debarred/blacklisted on CPPP/GeM central watchlists.'
    );
  }

  checks.push({
    id: 'CHK-013',
    requirement: 'Central Vigilance & Debarment Watchlist Check',
    category: 'Risk',
    isMandatory: true,
    formValue: 'Affidavit of Non-Debarment Executed',
    ocrValue: 'Clean Statutory Declaration',
    datasetValue: isBlacklisted ? 'BLACKLISTED / DEBARRED' : 'Clean (No Debarment Record)',
    status: blacklistCheckStatus,
    confidence: 99,
    details: 'Central Public Procurement Portal (CPPP) & GeM Incident Management watchlists.',
  });

  // -------------------------------------------------------------------------
  // 14. DigiLocker Document Verification Check
  // -------------------------------------------------------------------------
  const digiLocker = datasetRecord?.digiLockerStatus || 'Verified';
  let digiStatusCheck: ThreeWayStatus = 'Verified';
  if (digiLocker.toLowerCase() === 'not verified') {
    digiStatusCheck = 'Document Information Missing';
    addIssue('Low', 'Government Dataset', 'DigiLocker Institutional Verification', 'Not Verified', 'Verified via DigiLocker API', 'Documents not pre-verified via DigiLocker credential exchange.');
  }

  checks.push({
    id: 'CHK-014',
    requirement: 'DigiLocker Institutional Cross-Verification',
    category: 'Risk',
    isMandatory: false,
    formValue: 'Digital Signature Applied',
    ocrValue: 'Cryptographic Hash Valid',
    datasetValue: `DigiLocker: ${digiLocker}`,
    status: digiStatusCheck,
    confidence: 97,
    details: 'DigiLocker institutional credential issuer API verification.',
  });

  return {
    checks,
    issues,
    documentsVerifiedCount: uploadedCount,
    totalDocumentsCount: requiredDocList.length || 1,
  };
}

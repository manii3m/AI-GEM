import { RiskLevel, ComplianceIssue } from '../types';

export interface RiskEvaluationResult {
  riskLevel: RiskLevel;
  riskSummary: string;
  hasCriticalFlags: boolean;
  hasIdentityMismatches: boolean;
}

/**
 * Classifies compliance risk based on deterministic score and critical risk checks.
 */
export function classifyComplianceRisk(
  score: number,
  isBlacklisted: boolean,
  issues: ComplianceIssue[]
): RiskEvaluationResult {
  const hasCritical = issues.some((i) => i.severity === 'Critical') || isBlacklisted;
  const hasIdentityMismatch = issues.some(
    (i) => i.source === 'Government Dataset' && (i.requirement.includes('PAN') || i.requirement.includes('GSTIN'))
  );

  // Blacklisting or debarment triggers automatic Critical Risk
  if (isBlacklisted) {
    return {
      riskLevel: 'Critical',
      riskSummary: 'CRITICAL RISK: Entity is listed in Central Government Debarment / Watchlist records. Proceed with extreme scrutiny.',
      hasCriticalFlags: true,
      hasIdentityMismatches: hasIdentityMismatch,
    };
  }

  // Major statutory identity fraud / mismatch triggers Critical Risk
  if (hasIdentityMismatch) {
    return {
      riskLevel: 'Critical',
      riskSummary: 'CRITICAL RISK: Primary statutory identity mismatch (PAN/GSTIN) detected against central government registry.',
      hasCriticalFlags: true,
      hasIdentityMismatches: true,
    };
  }

  if (hasCritical || score < 65) {
    return {
      riskLevel: 'High',
      riskSummary: 'HIGH RISK: Critical compliance deficiencies or major statutory discrepancies identified. Manual committee review required.',
      hasCriticalFlags: hasCritical,
      hasIdentityMismatches: hasIdentityMismatch,
    };
  }

  if (score < 85) {
    return {
      riskLevel: 'Medium',
      riskSummary: 'MEDIUM RISK: Minor discrepancies or missing documentary proofs observed. Clarification may be sought from vendor.',
      hasCriticalFlags: false,
      hasIdentityMismatches: false,
    };
  }

  return {
    riskLevel: 'Low',
    riskSummary: 'LOW RISK: Complete statutory alignment, authentic document proofs, and satisfied tender eligibility criteria.',
    hasCriticalFlags: false,
    hasIdentityMismatches: false,
  };
}

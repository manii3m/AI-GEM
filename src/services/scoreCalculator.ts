import {
  ThreeWayCheckResult,
  ScoreCategoryBreakdown,
  RiskLevel,
  ComplianceIssue,
} from '../types';

export interface ScoreComputationResult {
  overallScore: number;
  categories: ScoreCategoryBreakdown[];
}

/**
 * Calculates a transparent, deterministic weighted compliance score (0-100)
 * from actual three-way verification check results.
 */
export function calculateComplianceScore(checks: ThreeWayCheckResult[]): ScoreComputationResult {
  // Define standard category weights
  const categoryConfigs: {
    categoryKey: 'Identity' | 'Statutory' | 'Eligibility' | 'Documents' | 'Risk';
    name: string;
    defaultWeight: number;
  }[] = [
    { categoryKey: 'Identity', name: 'Identity & Statutory Registrations', defaultWeight: 25 },
    { categoryKey: 'Statutory', name: 'Statutory Tax & Labor Compliance', defaultWeight: 25 },
    { categoryKey: 'Eligibility', name: 'Tender Specific Technical Eligibility', defaultWeight: 25 },
    { categoryKey: 'Documents', name: 'Document Completeness & Authenticity', defaultWeight: 15 },
    { categoryKey: 'Risk', name: 'Integrity, Debarment & Risk Screening', defaultWeight: 10 },
  ];

  // Group checks by categoryKey
  const groupedChecks: Record<string, ThreeWayCheckResult[]> = {
    Identity: [],
    Statutory: [],
    Eligibility: [],
    Documents: [],
    Risk: [],
  };

  checks.forEach((chk) => {
    if (groupedChecks[chk.category]) {
      groupedChecks[chk.category].push(chk);
    }
  });

  // Calculate scores per category
  let activeWeightTotal = 0;
  const rawCategories: {
    name: string;
    categoryKey: 'Identity' | 'Statutory' | 'Eligibility' | 'Documents' | 'Risk';
    weight: number;
    passedRatio: number;
    passedChecks: number;
    totalChecks: number;
  }[] = [];

  categoryConfigs.forEach((cfg) => {
    const catChecks = groupedChecks[cfg.categoryKey] || [];
    // Filter out 'Not Applicable' checks
    const applicableChecks = catChecks.filter((c) => c.status !== 'Not Applicable');

    if (applicableChecks.length === 0) {
      // Category is not applicable for this tender; will redistribute weight proportionally
      return;
    }

    activeWeightTotal += cfg.defaultWeight;

    let pointsEarned = 0;
    let passedCount = 0;

    applicableChecks.forEach((c) => {
      if (c.status === 'Verified') {
        pointsEarned += 1.0;
        passedCount++;
      } else if (c.status === 'Document Information Missing') {
        pointsEarned += 0.4; // partial credit for attempt, but flagged
      } else if (c.status === 'Document Mismatch') {
        pointsEarned += 0.2;
      } else if (c.status === 'Government Data Mismatch') {
        pointsEarned += 0.0;
      } else if (c.status === 'Not Found' || c.status === 'Expired') {
        pointsEarned += 0.0;
      }
    });

    const passedRatio = pointsEarned / applicableChecks.length;
    rawCategories.push({
      name: cfg.name,
      categoryKey: cfg.categoryKey,
      weight: cfg.defaultWeight,
      passedRatio,
      passedChecks: passedCount,
      totalChecks: applicableChecks.length,
    });
  });

  // Normalize weights if any categories were skipped
  const weightMultiplier = activeWeightTotal > 0 ? 100 / activeWeightTotal : 1;

  let computedScore = 0;
  const categories: ScoreCategoryBreakdown[] = rawCategories.map((raw) => {
    const adjustedWeight = Math.round(raw.weight * weightMultiplier);
    const earned = Math.round(raw.passedRatio * adjustedWeight);
    computedScore += earned;

    let status: ScoreCategoryBreakdown['status'] = 'Satisfied';
    if (raw.passedRatio < 0.6) {
      status = 'Deficient';
    } else if (raw.passedRatio < 0.9) {
      status = 'Review';
    }

    return {
      name: raw.name,
      categoryKey: raw.categoryKey,
      weight: adjustedWeight,
      earned,
      maxPoints: adjustedWeight,
      passedChecks: raw.passedChecks,
      totalChecks: raw.totalChecks,
      status,
    };
  });

  const finalScore = Math.min(100, Math.max(0, computedScore));

  return {
    overallScore: finalScore,
    categories,
  };
}

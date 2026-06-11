/**
 * Gap Detection Authority — assessment types.
 */

export type GapSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type GapImpact =
  | 'USER_SUCCESS'
  | 'TRUST'
  | 'READINESS'
  | 'INTELLIGENCE'
  | 'PRODUCT'
  | 'LAUNCH';

export type GapCategory =
  | 'CAPABILITY_GAPS'
  | 'TRUST_GAPS'
  | 'INTELLIGENCE_GAPS'
  | 'READINESS_GAPS'
  | 'PRODUCT_GAPS'
  | 'DEPENDENCY_GAPS';

export type GapDetectionReadinessState = 'NO_CRITICAL_GAPS' | 'GAPS_PRESENT' | 'HIGH_RISK_GAPS' | 'BLOCKED';

export interface GapCategoryDefinition {
  id: string;
  category: GapCategory;
  question: string;
}

export interface GapDetectionFinding {
  id: string;
  category: GapCategory;
  title: string;
  description: string;
  severity: GapSeverity;
  impact: GapImpact;
  evidence: string[];
  recommendations: string[];
}

export interface GapDetectionAssessment {
  readOnly: true;
  gapDetectionScore: number;
  totalGaps: number;
  criticalGapCount: number;
  highGapCount: number;
  blocksLaunchReadiness: boolean;
  readinessState: GapDetectionReadinessState;
  detectedGaps: GapDetectionFinding[];
  recommendations: string[];
  cacheKey: string;
}

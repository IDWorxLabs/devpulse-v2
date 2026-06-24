/**
 * Large-Scale Multi-App Validation V1 — types.
 */

export type LargeScaleCategoryGroup =
  | 'Business Systems'
  | 'Marketplace Systems'
  | 'Education Systems'
  | 'Healthcare Systems'
  | 'Finance Systems'
  | 'Hospitality Systems'
  | 'Community Platforms'
  | 'Operations Platforms'
  | 'Extended Categories';

export type LargeScaleFailureClass =
  | 'Requirement Failure'
  | 'Planning Failure'
  | 'Generation Failure'
  | 'Blueprint Failure'
  | 'Feature Failure'
  | 'Engineering Failure'
  | 'Verification Failure'
  | 'Founder Failure'
  | 'None';

export interface LargeScaleCategoryDefinition {
  profile: string;
  domain: string;
  productName: string;
  prompt: string;
  categoryGroup: LargeScaleCategoryGroup;
}

export interface LargeScaleCategoryMetrics {
  readOnly: true;
  generationSuccess: boolean;
  buildSuccess: boolean;
  blueprintSuccess: boolean;
  featureRealitySuccess: boolean;
  engineeringSuccess: boolean;
  aflaSuccess: boolean;
  requirementConfidence: number;
  verificationCoverage: number;
  verificationConfidence: number;
  aflaOverallScore: number;
  productReadinessScore: number;
  workflowCoverage: number;
  architectureConsistency: boolean;
  pipelineCompleted: boolean;
}

export interface LargeScaleCategoryResult {
  readOnly: true;
  profile: string;
  domain: string;
  productName: string;
  categoryGroup: LargeScaleCategoryGroup;
  prompt: string;
  passed: boolean;
  metrics: LargeScaleCategoryMetrics;
  failureClass: LargeScaleFailureClass;
  failureDetail: string | null;
  aflaVerdict: string;
  cqiDomain: string;
}

export interface LargeScalePassRates {
  readOnly: true;
  generationSuccessRate: number;
  buildSuccessRate: number;
  blueprintSuccessRate: number;
  featureRealitySuccessRate: number;
  engineeringSuccessRate: number;
  aflaSuccessRate: number;
  overallPassRate: number;
}

export interface LargeScaleFailureDistributionEntry {
  readOnly: true;
  failureClass: LargeScaleFailureClass;
  count: number;
  percentage: number;
}

export interface LargeScaleCrossAppConsistency {
  readOnly: true;
  navigationConsistency: number;
  blueprintConsistency: number;
  verificationConsistency: number;
  launchDecisionConsistency: number;
  overallConsistency: number;
}

export interface LargeScaleCategoryLeaderboardEntry {
  readOnly: true;
  profile: string;
  productName: string;
  categoryGroup: LargeScaleCategoryGroup;
  score: number;
  passed: boolean;
}

export interface LargeScaleValidationHistoryEntry {
  readOnly: true;
  runId: string;
  categoriesTested: number;
  overallPassRate: number;
  generalizationScore: number;
  timestamp: string;
}

export interface LargeScaleMultiAppValidationAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'AiDevEngine Large-Scale Validation';
  categoriesTested: number;
  categoriesPassed: number;
  passRates: LargeScalePassRates;
  failureDistribution: readonly LargeScaleFailureDistributionEntry[];
  generalizationScore: number;
  crossAppConsistency: LargeScaleCrossAppConsistency;
  categoryResults: readonly LargeScaleCategoryResult[];
  categoryLeaderboard: readonly LargeScaleCategoryLeaderboardEntry[];
  weakestCategories: readonly string[];
  strongestCategories: readonly string[];
  untestedCategories: readonly string[];
  generatedAt: string;
}

export interface RunLargeScaleValidationInput {
  profiles?: readonly string[];
}

/**
 * Feature Reality Validation Authority V1 — types.
 */

export type FeatureRealityVerdict =
  | 'FEATURE_EXCELLENT'
  | 'FEATURE_GOOD'
  | 'FEATURE_ACCEPTABLE'
  | 'FEATURE_NEEDS_IMPROVEMENT'
  | 'FEATURE_FAIL';

export interface FeatureContractItem {
  id: string;
  label: string;
  category: 'discoverability' | 'execution' | 'persistence' | 'edit' | 'delete' | 'search' | 'recovery' | 'ux';
  required: boolean;
}

export interface FeatureContract {
  contractVersion: '1.0';
  contractId: string;
  productProfile: string;
  productName: string;
  generatedAt: string;
  features: FeatureContractItem[];
}

export interface FeatureRealityCheck {
  id: string;
  category: string;
  label: string;
  featureId: string | null;
  passed: boolean;
  detail: string;
  critical: boolean;
}

export interface FeatureRealityScores {
  featureCoverageScore: number;
  featureExecutionScore: number;
  persistenceScore: number;
  recoveryScore: number;
  featureUxScore: number;
  overallFeatureScore: number;
}

export interface FeatureRealityAssessment {
  readOnly: true;
  passed: boolean;
  verdict: FeatureRealityVerdict;
  passToken: string;
  scores: FeatureRealityScores;
  checks: FeatureRealityCheck[];
  failedChecks: FeatureRealityCheck[];
  blocksLaunchReadiness: boolean;
  blocksLaunchReadinessReason: string | null;
  previewUrl: string;
  contractId: string;
  generatedAt: string;
  reportMarkdown: string;
}

export interface RunFeatureRealityValidationInput {
  previewUrl: string;
  contract: FeatureContract;
}

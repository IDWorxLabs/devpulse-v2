/**
 * UVL Verification Execution V1 — types.
 */

export type VerificationFailureClass =
  | 'Blueprint Failure'
  | 'Feature Failure'
  | 'Engineering Failure'
  | 'Navigation Failure'
  | 'Runtime Failure'
  | 'Accessibility Failure'
  | 'Performance Failure'
  | 'Build Failure'
  | 'Preview Failure'
  | 'None';

export type VerificationVerdict = 'VERIFIED' | 'NOT_VERIFIED' | 'SKIPPED';

export interface VerificationProofEvidence {
  readOnly: true;
  previewUrl: string | null;
  runtimeValidation: boolean;
  featureValidation: boolean;
  blueprintValidation: boolean;
  engineeringValidation: boolean;
  navigationValidation: boolean;
  verificationVerdict: VerificationVerdict;
  verificationArtifactPath: string | null;
  missingEvidence: readonly string[];
  proofComplete: boolean;
}

export interface VerificationCategoryMetrics {
  readOnly: true;
  buildSuccess: boolean;
  previewSuccess: boolean;
  navigationSuccess: boolean;
  featureSuccess: boolean;
  blueprintSuccess: boolean;
  featureRealitySuccess: boolean;
  engineeringRealitySuccess: boolean;
  verificationSuccess: boolean;
  verificationConfidence: number;
}

export interface VerificationCategoryResult {
  readOnly: true;
  profile: string;
  productName: string;
  prompt: string;
  workspaceId: string;
  workspacePath: string | null;
  passed: boolean;
  verified: boolean;
  metrics: VerificationCategoryMetrics;
  failureClass: VerificationFailureClass;
  failureDetail: string;
  verificationProof: VerificationProofEvidence;
}

export interface VerificationProofRecord {
  readOnly: true;
  category: string;
  productName: string;
  profile: string;
  workspacePath: string | null;
  previewUrl: string | null;
  runtimeResult: 'PASS' | 'FAIL' | 'SKIPPED';
  featureResult: 'PASS' | 'FAIL' | 'SKIPPED';
  blueprintResult: 'PASS' | 'FAIL' | 'SKIPPED';
  engineeringResult: 'PASS' | 'FAIL' | 'SKIPPED';
  navigationResult: 'PASS' | 'FAIL' | 'SKIPPED';
  verificationVerdict: VerificationVerdict;
  proofComplete: boolean;
}

export interface VerificationCoverageReport {
  readOnly: true;
  categoriesRequired: number;
  verifiedCount: number;
  failedCount: number;
  skippedCount: number;
  verificationCoveragePercent: number;
  builtCount: number;
  previewedCount: number;
}

export interface VerificationMatrixEntry {
  readOnly: true;
  profile: string;
  productName: string;
  built: boolean;
  previewed: boolean;
  verified: boolean;
  verificationConfidence: number;
  failureClass: VerificationFailureClass;
}

export interface VerificationFailureIntelligenceEntry {
  readOnly: true;
  profile: string;
  productName: string;
  failureClass: VerificationFailureClass;
  rootCause: string;
  missingEvidence: readonly string[];
}

export interface VerificationConfidenceReport {
  readOnly: true;
  verificationConfidenceScore: number;
  coverageWeight: number;
  runtimeEvidenceWeight: number;
  failureDistributionPenalty: number;
  consistencyWeight: number;
  verificationProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
}

export interface UvlVerificationExecutionV1Assessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: string;
  passToken: string;
  version: 'V1';
  generatedAt: string;
  categoriesTested: number;
  categoriesVerified: number;
  verificationCoveragePercent: number;
  verificationProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  verificationConfidence: VerificationConfidenceReport;
  verificationCoverage: VerificationCoverageReport;
  verificationProof: readonly VerificationProofRecord[];
  verificationMatrix: readonly VerificationMatrixEntry[];
  failureIntelligence: readonly VerificationFailureIntelligenceEntry[];
  failureDistribution: readonly { failureClass: VerificationFailureClass; count: number; percentage: number }[];
  categoryResults: readonly VerificationCategoryResult[];
  recentVerificationRuns: readonly {
    profile: string;
    productName: string;
    verified: boolean;
    verificationConfidence: number;
    updatedAt: string;
  }[];
}

/**
 * Large-Scale Pipeline Integration V1 — types.
 */

export type CategoryProofFlag =
  | 'BROAD_VALIDATED'
  | 'BUILD_PROVEN'
  | 'VERIFICATION_PROVEN'
  | 'GP_PROVEN'
  | 'CLOUD_PROVEN'
  | 'PRODUCTION_PROVEN'
  | 'MOBILE_PROVEN'
  | 'CONCURRENT_PROVEN';

export type GapClassification =
  | 'BREADTH_ONLY'
  | 'BUILD_ONLY'
  | 'PRODUCTION_PROVEN'
  | 'CLOUD_SIMULATED_PROVEN'
  | 'FULLY_PROVEN'
  | 'UNVALIDATED';

export interface CategoryMappingEntry {
  readOnly: true;
  profile: string;
  productName: string;
  flags: readonly CategoryProofFlag[];
  gapClassification: GapClassification;
  suites: {
    broad: boolean;
    rbep: boolean;
    gp: boolean;
    cloud: boolean;
  };
}

export interface PipelineMetrics {
  readOnly: true;
  generatedAt: string;
  broadCategoriesTested: number;
  buildProvenCategories: number;
  verificationProvenCategories: number;
  productionProvenCategories: number;
  cloudProvenCategories: number;
  mobileProvenCategories: number;
  concurrentProvenCategories: number;
  gpProvenCategories: number;
  buildSuccessRate: number;
  previewSuccessRate: number;
  verificationSuccessRate: number;
  productReadinessRate: number;
  launchReadinessRate: number;
  productionReadinessRate: number;
  cloudSimulatedSuccessRate: number;
  generalPurposeGenerationSuccessRate: number;
  mobileRuntimeSuccessRate: number;
  concurrentExecutionSuccessRate: number;
  /** Legacy large-scale harness build rate (AFLA dry-run) for audit contrast. */
  legacyLargeScaleBuildSuccessRate: number;
}

export interface EvidenceSourceRecord {
  readOnly: true;
  system: string;
  artifactDir: string;
  artifacts: readonly string[];
  passToken: string | null;
  evidenceAvailable: boolean;
}

export interface PipelineScoreBreakdown {
  readOnly: true;
  breadth: number;
  buildProof: number;
  verificationProof: number;
  generalPurposeProof: number;
  productionProof: number;
  cloudProof: number;
  consistency: number;
}

export interface LargeScalePipelineScore {
  readOnly: true;
  score: number;
  status: 'PROVEN' | 'PARTIAL' | 'UNPROVEN';
  breakdown: PipelineScoreBreakdown;
}

export interface GapClassificationEntry {
  readOnly: true;
  profile: string;
  productName: string;
  classification: GapClassification;
  flags: readonly CategoryProofFlag[];
}

export interface AuditImpact {
  readOnly: true;
  generatedAt: string;
  largeScaleBuildSuccessRateCorrected: boolean;
  legacyBuildSuccessRate: number;
  authoritativeBuildSuccessRate: number;
  highestGapResolved: boolean;
  auditShouldReport: string;
  integrationComplete: boolean;
}

export interface LargeScalePipelineIntegrationAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Large-Scale Pipeline Integration V1';
  passToken: string;
  version: 'V1';
  generatedAt: string;
  metrics: PipelineMetrics;
  pipelineScore: LargeScalePipelineScore;
  categoryMapping: readonly CategoryMappingEntry[];
  gapClassification: readonly GapClassificationEntry[];
  evidenceSources: readonly EvidenceSourceRecord[];
  auditImpact: AuditImpact;
  remainingGaps: readonly string[];
}

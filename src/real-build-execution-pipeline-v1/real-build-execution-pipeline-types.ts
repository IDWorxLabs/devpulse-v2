/**
 * Real Build Execution Pipeline V1 — types.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';

export type ExecutionFailureClass =
  | 'Requirement Failure'
  | 'Planning Failure'
  | 'Generation Failure'
  | 'Compilation Failure'
  | 'Runtime Failure'
  | 'Preview Failure'
  | 'Verification Failure'
  | 'Founder Failure'
  | 'None';

export interface RealBuildSuiteEntry {
  profile: string;
  domain: string;
  productName: string;
  prompt: string;
  codegenProfile: GeneratedAppProfile;
}

export interface BuildExecutionProofEvidence {
  readOnly: true;
  idea: string;
  requirementsSummary: string;
  planSummary: string;
  generatedFiles: readonly string[];
  buildOutputPresent: boolean;
  buildOutputPath: string | null;
  livePreviewUrl: string | null;
  previewHtmlOk: boolean;
  previewShellOk: boolean;
  previewNavigationOk: boolean;
  previewFeatureOk: boolean;
  uvlResultSummary: string;
  productArchitectResultSummary: string;
  aflaVerdict: string;
  missingEvidence: readonly string[];
  proofComplete: boolean;
}

export interface RealBuildCategoryMetrics {
  readOnly: true;
  generationSuccess: boolean;
  materializationSuccess: boolean;
  buildSuccess: boolean;
  previewSuccess: boolean;
  verificationSuccess: boolean;
  launchSuccess: boolean;
  requirementConfidence: number;
  verificationConfidence: number;
  productReadinessScore: number;
  aflaOverallScore: number;
  executionProofComplete: boolean;
}

export interface RealBuildCategoryResult {
  readOnly: true;
  profile: string;
  productName: string;
  prompt: string;
  codegenProfile: GeneratedAppProfile;
  workspaceId: string;
  workspacePath: string | null;
  passed: boolean;
  metrics: RealBuildCategoryMetrics;
  failureClass: ExecutionFailureClass;
  failureDetail: string | null;
  executionProof: BuildExecutionProofEvidence;
  stageResults?: RealBuildStageResults;
}

export interface RealBuildStageResults {
  readOnly: true;
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  previewNavigationOk: boolean;
  uvlPassed: boolean;
  paiPassed: boolean;
  paiExecuted: boolean;
  aflaVerdictIssued: boolean;
}

export interface RealBuildExecutionMetrics {
  readOnly: true;
  generationSuccessRate: number;
  materializationSuccessRate: number;
  buildSuccessRate: number;
  previewSuccessRate: number;
  verificationSuccessRate: number;
  launchSuccessRate: number;
  executionProofCompleteRate: number;
}

export interface RunRealBuildExecutionPipelineInput {
  profiles?: readonly string[];
  projectRootDir?: string;
  leafMode?: boolean;
  skipNpmBuild?: boolean;
}

export interface RealBuildExecutionPipelineAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: string;
  passToken: string;
  generatedAt: string;
  categoriesTested: number;
  categoriesPassed: number;
  metrics: RealBuildExecutionMetrics;
  executionGeneralizationScore: number;
  failureDistribution: Array<{
    readOnly: true;
    failureClass: ExecutionFailureClass;
    count: number;
    percentage: number;
  }>;
  categoryResults: readonly RealBuildCategoryResult[];
  recentBuilds: readonly {
    profile: string;
    productName: string;
    passed: boolean;
    buildSuccess: boolean;
    previewSuccess: boolean;
    aflaVerdict: string;
    updatedAt: string;
  }[];
  executionProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
}
